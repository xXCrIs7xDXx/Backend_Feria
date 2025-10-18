const geminiService = require("../services/geminiService");
const axios = require("axios");
const FormData = require("form-data");

const PINATA_API_KEY = process.env.PINATA_API_KEY;
const PINATA_SECRET_API_KEY = process.env.PINATA_SECRET_API_KEY;
const PINATA_BASE_URL = "https://api.pinata.cloud/pinning";

async function uploadFileToPinata(file) {
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
}

async function uploadJsonToPinata(productPayload) {
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
}

const productController = {
	verifyProduct: async (req, res, next) => {
		try {
			const { file, productData } = req;

			if (!file) {
				const error = new Error("Se requiere una imagen.");
				error.status = 400;
				throw error;
			}

			if (!productData) {
				const error = new Error("Faltan datos del producto.");
				error.status = 400;
				throw error;
			}

			// productData ya viene validado del middleware
			const parsedProduct = productData;

			// Paso 1: Verificación con Gemini
			const geminiResult = await geminiService.verifyProduct({
				product: parsedProduct,
				imageBuffer: file.buffer,
				imageMimeType: file.mimetype,
			});

			if ((geminiResult.decision || "").toUpperCase() === "NO") {
				const error = new Error(
					geminiResult.reason || "Producto rechazado por Gemini."
				);
				error.status = 403;
				throw error;
			}

			// Paso 2: Subir imagen a Pinata
			const imageUpload = await uploadFileToPinata(file);

			// Paso 3: Subir JSON a Pinata (incluyendo CID de imagen)
			const productPayload = {
				titulo: parsedProduct.title,
				descripcion: parsedProduct.description,
				precio: parsedProduct.price,
				moneda: parsedProduct.currency || 'USD',
				categoria: parsedProduct.category,
				ubicacion: parsedProduct.location,
				cid_imagen: imageUpload.IpfsHash,
			};

			const jsonUpload = await uploadJsonToPinata(productPayload);

			res.status(200).json({
				decision: geminiResult.decision,
				reason: geminiResult.reason,
				imagen: imageUpload,
				producto: jsonUpload,
			});
		} catch (error) {
			console.error("[productController] Error:", error);
			next(error);
		}
	},
};

module.exports = productController;
