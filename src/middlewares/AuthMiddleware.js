const jwt = require('jsonwebtoken');
const winston = require('winston');
const AppConfig = require('../config/AppConfig');

// Configure Winston logger
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

const AuthMiddleware = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    const error = new Error('Access denied. No token provided.');
    error.statusCode = 401;
    logger.warn({
      message: error.message,
      path: req.path,
      method: req.method,
      timestamp: new Date().toISOString(),
    });
    return res.status(401).json({ error: error.message });
  }

  try {
    const decoded = jwt.verify(token, AppConfig.jwtSecret);
    req.user = decoded; // Attach user data (e.g., userId) to request
    logger.info({
      message: 'Token verified successfully',
      userId: decoded.userId,
      path: req.path,
      method: req.method,
      timestamp: new Date().toISOString(),
    });
    next();
  } catch (error) {
    const err = new Error('Invalid or expired token.');
    err.statusCode = 401;
    logger.error({
      message: err.message,
      path: req.path,
      method: req.method,
      timestamp: new Date().toISOString(),
    });
    res.status(401).json({ error: err.message });
  }
};

module.exports = AuthMiddleware;