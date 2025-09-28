const express = require("express");
const productController = require("../controllers/productController");
const upload = require("../middleware/upload");
const validateProductPayload = require("../middleware/validateProductPayload");

const createRouter = () => {
	const router = express.Router();

	router.post(
		"/products/verify",
		upload.single("image"),
		validateProductPayload,
		productController.verifyProduct
	);

	return router;
};

module.exports = createRouter;
