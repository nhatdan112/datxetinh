const Joi = require('joi');
const winston = require('winston');

const logger = winston.createLogger({
  level: 'error',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'scraper.log' }),
    new winston.transports.Console(),
  ],
});

const ValidationMiddleware = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body);
    if (error) {
      const err = new Error(error.details[0].message);
      err.statusCode = 400;
      logger.error({
        message: err.message,
        path: req.path,
        method: req.method,
        timestamp: new Date().toISOString(),
      });
      return res.status(400).json({ error: err.message });
    }
    next();
  };
};

module.exports = ValidationMiddleware;