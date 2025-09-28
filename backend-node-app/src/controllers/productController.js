const geminiService = require("../services/geminiService");
const axios = require("axios");
const FormData = require("form-data");

const DEFAULT_AUTHENTIC_DECISION = "SI";
const DEFAULT_FAKE_DECISION = "NO";

const AUTHENTIC_DECISION =
	(
		process.env.GEMINI_DECISION_AUTHENTIC || DEFAULT_AUTHENTIC_DECISION
	).trim() || DEFAULT_AUTHENTIC_DECISION;
const FAKE_DECISION =
	(process.env.GEMINI_DECISION_FAKE || DEFAULT_FAKE_DECISION).trim() ||
	DEFAULT_FAKE_DECISION;
const NORMALIZED_FAKE = FAKE_DECISION.toUpperCase();

// === Servicio interno de Pinata para este controlador ===
const PINATA_API_KEY = process.env.PINATA_API_KEY;
const PINATA_SECRET_API_KEY = process.env.PINATA_SECRET_API_KEY;
const PINATA_BASE_URL = "https://api.pinata.cloud/pinning";

async function uploadFileToPinata(file) {
	try {
		const formData = new FormData();
		formData.append("file", file.buffer, {
			filename: file.originalname,
			contentType: file.mimetype,
		});

		const res = await axios.post(`${PINATA_BASE_URL}/pinFileToIPFS`, formData, {
			maxBodyLength: "Infinity",
			headers: {
				...formData.getHeaders(),
				pinata_api_key: PINATA_API_KEY,
				pinata_secret_api_key: PINATA_SECRET_API_KEY,
			},
		});

		return res.data;
	} catch (err) {
		let reason = "Error desconocido en Pinata";
		if (err.response) {
			reason = `Pinata respondió ${err.response.status}: ${JSON.stringify(
				err.response.data
			)}`;
		} else if (err.request) {
			reason = "No hubo respuesta de Pinata. Verifica tu conexión o API Key.";
		} else if (err.message) {
			reason = err.message;
		}
		throw new Error(`Error al subir la imagen a Pinata: ${reason}`);
	}
}

async function uploadJsonToPinata(productPayload) {
	try {
		const res = await axios.post(
			`${PINATA_BASE_URL}/pinJSONToIPFS`,
			{
				pinataMetadata: {
					name: `producto-${(productPayload.titulo || "sin-titulo")
						.trim()
						.replace(/\s+/g, "-")}`,
				},
				pinataContent: productPayload,
			},
			{
				headers: {
					"Content-Type": "application/json",
					pinata_api_key: PINATA_API_KEY,
					pinata_secret_api_key: PINATA_SECRET_API_KEY,
				},
			}
		);

		return res.data;
	} catch (err) {
		let reason = "Error desconocido en Pinata";
		if (err.response) {
			reason = `Pinata respondió ${err.response.status}: ${JSON.stringify(
				err.response.data
			)}`;
		} else if (err.request) {
			reason = "No hubo respuesta de Pinata. Verifica tu conexión o API Key.";
		} else if (err.message) {
			reason = err.message;
		}
		throw new Error(`Error al subir el JSON a Pinata: ${reason}`);
	}
}

// === Controlador ===
const productController = {
	verifyProduct: async (req, res, next) => {
		try {
			const { file } = req;
			const { product } = req.body;

			if (!file || !product) {
				const error = new Error(
					"Payload incompleto: se requiere 'product' (JSON) e 'image' (archivo)."
				);
				error.status = 400;
				throw error;
			}

			let parsedProduct;
			try {
				parsedProduct = JSON.parse(product);
			} catch (err) {
				const error = new Error(
					"El campo 'product' no es un JSON válido. Debe enviarse como string."
				);
				error.status = 400;
				throw error;
			}

			console.log("[productController] Verificación iniciada", {
				title: parsedProduct.title,
				price: parsedProduct.price,
				category: parsedProduct.category,
			});

			// === Paso 1: Verificar con Gemini ===
			const result = await geminiService.verifyProduct({
				product: parsedProduct,
				imageBuffer: file.buffer,
				imageMimeType: file.mimetype,
			});

			console.log("[productController] Resultado de Gemini:", result);

			const normalizedDecision = (result.decision || "").trim().toUpperCase();

			if (normalizedDecision === NORMALIZED_FAKE) {
				const error = new Error(
					result.reason || "Producto rechazado por verificación IA."
				);
				error.status = 403;
				throw error;
			}

			// === Paso 2: Subir imagen a Pinata ===
			const fileUpload = await uploadFileToPinata(file);

			// === Paso 3: Subir JSON del producto (con el CID de la imagen) ===
			const productPayload = {
				titulo: parsedProduct.title,
				descripcion: parsedProduct.description,
				precio: parsedProduct.price,
				moneda: parsedProduct.currency,
				categoria: parsedProduct.category,
				ubicacion: parsedProduct.location,
				cid_imagen: fileUpload.IpfsHash,
			};

			const jsonUpload = await uploadJsonToPinata(productPayload);

			res.status(200).json({
				decision: result.decision,
				reason: result.reason,
				imagen: fileUpload, // Devuelve IpfsHash, PinSize, Timestamp
				producto: jsonUpload, // Devuelve IpfsHash, PinSize, Timestamp
			});
		} catch (error) {
			console.error("[productController] Error en verificación:", error);
			next(error);
		}
	},
};

module.exports = productController;
