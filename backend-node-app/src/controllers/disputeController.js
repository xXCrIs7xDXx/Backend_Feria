// controllers/disputeController.js
const axios = require("axios");
const FormData = require("form-data");

const PINATA_API_KEY = process.env.PINATA_API_KEY;
const PINATA_SECRET_API_KEY = process.env.PINATA_SECRET_API_KEY;
const PINATA_BASE_URL = "https://api.pinata.cloud/pinning";

// Función para subir un archivo a Pinata
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

// Función para subir un JSON a Pinata
async function uploadJsonToPinata(disputePayload) {
	const res = await axios.post(
		`${PINATA_BASE_URL}/pinJSONToIPFS`,
		{
			pinataMetadata: {
				name: `disputa-${(disputePayload.productId || "sin-producto")
					.toString()
					.trim()
					.replace(/\s+/g, "-")}`,
			},
			pinataContent: disputePayload,
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

const disputeController = {
	createDispute: async (req, res, next) => {
		try {
			const { productId, reason, description } = req.body;
			const files = req.files; // Array de imágenes subidas

			if (!productId || !reason || !description) {
				const error = new Error(
					"Se requieren 'productId', 'reason' y 'description'."
				);
				error.status = 400;
				throw error;
			}

			// Subir imágenes a Pinata
			let uploadedImages = [];
			if (files && files.length > 0) {
				for (const file of files) {
					const upload = await uploadFileToPinata(file);
					uploadedImages.push(upload.IpfsHash);
				}
			}

			// Crear payload de disputa
			const disputePayload = {
				productId,
				reason,
				description,
				images: uploadedImages,
				status: "pendiente",
				createdAt: new Date().toISOString(),
			};

			// Subir JSON de la disputa a Pinata
			const jsonUpload = await uploadJsonToPinata(disputePayload);

			res.status(201).json({
				message: "Disputa creada exitosamente",
				dispute: disputePayload,
				pinata: jsonUpload,
			});
		} catch (error) {
			console.error("[disputeController] Error:", error);
			next(error);
		}
	},
};

module.exports = disputeController;
