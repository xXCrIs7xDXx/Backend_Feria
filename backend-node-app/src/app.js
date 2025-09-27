const express = require('express');
const bodyParser = require('body-parser');
const routes = require('./routes/index');
const errorHandler = require('./middleware/errorHandler');
const config = require('./config/config');

const app = express();

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Routes
app.use('/api', routes());

// Error handling middleware
app.use(errorHandler);

module.exports = app;