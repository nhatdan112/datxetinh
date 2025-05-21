const express = require('express');
const router = express.Router();
const FeedbackController = require('../controllers/FeedbackController');
const AuthMiddleware = require('../middlewares/AuthMiddleware');

router.post('/', AuthMiddleware, FeedbackController.submitFeedback);
router.get('/', AuthMiddleware, FeedbackController.getAllFeedback);
router.get('/:id', AuthMiddleware, FeedbackController.getFeedbackById);
router.delete('/:id', AuthMiddleware, FeedbackController.deleteFeedback);

module.exports = router;