const AiService = require('../services/AiService');
const ErrorMiddleware = require('../middlewares/ErrorMiddleware');

class AiController {
  async trainModel(req, res, next) {
    try {
      const result = await AiService.trainModel(req.body);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async evaluateModel(req, res, next) {
    try {
      const result = await AiService.evaluateModel(req.body);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async predict(req, res, next) {
    try {
      const { data } = req.body;
      const prediction = await AiService.predict(data);
      res.json({ prediction });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AiController();