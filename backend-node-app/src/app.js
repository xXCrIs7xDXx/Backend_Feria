const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors"); // ✅ Importar CORS
const routes = require("./routes/index");
const errorHandler = require("./middleware/errorHandler");
const config = require("./config/config");

const app = express();

// Middleware CORS: permitir frontend en localhost:3001
app.use(
	cors({
		origin: "http://localhost:3001",
		credentials: true,
		methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
		allowedHeaders: ['Content-Type', 'Authorization']
	})
);

// Middleware para parsear JSON y URL-encoded
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Routes
app.use("/api", routes());

// Error handling middleware
app.use(errorHandler);

module.exports = app;
