const express = require('express');
const router = express.Router();
const AiController = require('../controllers/AiController');
const AuthMiddleware = require('../middlewares/AuthMiddleware');

router.post('/train', AuthMiddleware, AiController.trainModel);
router.post('/evaluate', AuthMiddleware, AiController.evaluateModel);
router.post('/predict', AuthMiddleware, AiController.predict);

module.exports = router;