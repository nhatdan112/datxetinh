const winston = require('winston');
const UserModel = require('../models/UserModel');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'scraper.log' }),
    new winston.transports.Console(),
  ],
});

const AdminMiddleware = async (req, res, next) => {
  try {
    const user = await UserModel.findById(req.user.userId);
    if (!user || user.role !== 'admin') {
      const error = new Error('Access denied. Admin role required.');
      error.statusCode = 403;
      logger.warn({
        message: error.message,
        userId: req.user.userId,
        path: req.path,
        method: req.method,
        timestamp: new Date().toISOString(),
      });
      return res.status(403).json({ error: error.message });
    }
    next();
  } catch (error) {
    error.statusCode = 500;
    logger.error({
      message: error.message,
      path: req.path,
      method: req.method,
      timestamp: new Date().toISOString(),
    });
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

module.exports = AdminMiddleware;