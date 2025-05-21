const winston = require('winston');

// Configure Winston logger
const logger = winston.createLogger({
  level: 'error',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'scraper.log' }), // Reuse scraper.log for consistency
    new winston.transports.Console(),
  ],
});

const ErrorMiddleware = (err, req, res, next) => {
  // Log the error
  logger.error({
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString(),
  });

  // Determine status code
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  // Send response
  res.status(statusCode).json({
    error: {
      message,
      status: statusCode,
      timestamp: new Date().toISOString(),
    },
  });
};

module.exports = ErrorMiddleware;