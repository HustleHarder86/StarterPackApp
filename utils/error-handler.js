// utils/error-handler.js
export class AppError extends Error {
  constructor(message, code, statusCode = 500) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
    this.isOperational = true;
  }
}

export const errorHandler = (err, req, res) => {
  const { statusCode = 500, message, code } = err;
  
  // Log error
  console.error('API Error:', {
    error: err,
    request: {
      method: req.method,
      url: req.url,
      body: req.body
    }
  });
  
  // Send user-friendly error
  res.status(statusCode).json({
    success: false,
    error: {
      code: code || 'INTERNAL_ERROR',
      message: process.env.NODE_ENV === 'production' 
        ? 'An error occurred' 
        : message,
      ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
    }
  });
};
