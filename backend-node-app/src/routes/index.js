const express = require("express");
const productController = require("../controllers/productController");
const disputeController = require("../controllers/disputeController"); // nuevo controlador
const upload = require("../middleware/upload");
const validateProductPayload = require("../middleware/validateProductPayload");

const createRouter = () => {
	const router = express.Router();

	// Endpoint existente para verificar producto
	router.post(
		"/products/verify",
		upload.single("image"),
		validateProductPayload,
		productController.verifyProduct
	);

	// Nuevo endpoint para crear una disputa
	// 'images' es un array de hasta 5 archivos
	router.post(
		"/disputes",
		upload.array("images", 5),
		disputeController.createDispute
	);

	return router;
};

module.exports = createRouter;
