const logger = require('../services/logger.service');

class APIError extends Error {
  constructor(message, statusCode = 500, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    this.name = 'APIError';
  }
}

const errorHandler = (err, req, res, next) => {
  // Log error
  logger.error('API Error:', {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userId: req.userId
  });
  
  // Default error
  let statusCode = 500;
  let message = 'Internal server error';
  let details = null;
  
  // Handle specific error types
  if (err instanceof APIError) {
    statusCode = err.statusCode;
    message = err.message;
    details = err.details;
  } else if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation error';
    details = err.errors;
  } else if (err.name === 'UnauthorizedError') {
    statusCode = 401;
    message = 'Unauthorized';
  } else if (err.name === 'CorsError') {
    statusCode = 403;
    message = 'CORS error';
  }
  
  // Send error response
  res.status(statusCode).json({
    error: true,
    message,
    details,
    requestId: req.id,
    timestamp: new Date().toISOString()
  });
};

module.exports = {
  APIError,
  errorHandler
};