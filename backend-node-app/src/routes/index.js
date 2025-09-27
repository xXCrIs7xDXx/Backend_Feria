const express = require('express');
const SampleController = require('../controllers/sampleController');

const createRouter = () => {
	const router = express.Router();

	router.get('/project-review', SampleController.getProjectReviewPayload);

	return router;
};

module.exports = createRouter;