const FeedbackModel = require('../models/FeedbackModel');
const ErrorMiddleware = require('../middlewares/ErrorMiddleware');

class FeedbackController {
  async submitFeedback(req, res, next) {
    try {
      const feedback = await FeedbackModel.create(req.body);
      res.status(201).json(feedback);
    } catch (error) {
      next(error);
    }
  }

  async getAllFeedback(req, res, next) {
    try {
      const feedback = await FeedbackModel.find();
      res.json(feedback);
    } catch (error) {
      next(error);
    }
  }

  async getFeedbackById(req, res, next) {
    try {
      const feedback = await FeedbackModel.findById(req.params.id);
      if (!feedback) throw new Error('Feedback not found');
      res.json(feedback);
    } catch (error) {
      next(error);
    }
  }

  async deleteFeedback(req, res, next) {
    try {
      const feedback = await FeedbackModel.findByIdAndDelete(req.params.id);
      if (!feedback) throw new Error('Feedback not found');
      res.json({ message: 'Feedback deleted successfully' });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new FeedbackController();