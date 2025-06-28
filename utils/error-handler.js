/**
 * Centralized error handling utilities
 */

/**
 * Custom error classes
 */
export class ValidationError extends Error {
  constructor(message, field) {
    super(message);
    this.name = 'ValidationError';
    this.field = field;
    this.statusCode = 400;
  }
}

export class AuthenticationError extends Error {
  constructor(message = 'Authentication required') {
    super(message);
    this.name = 'AuthenticationError';
    this.statusCode = 401;
  }
}

export class AuthorizationError extends Error {
  constructor(message = 'Access denied') {
    super(message);
    this.name = 'AuthorizationError';
    this.statusCode = 403;
  }
}

export class NotFoundError extends Error {
  constructor(resource = 'Resource') {
    super(`${resource} not found`);
    this.name = 'NotFoundError';
    this.statusCode = 404;
  }
}

export class RateLimitError extends Error {
  constructor(message = 'Too many requests') {
    super(message);
    this.name = 'RateLimitError';
    this.statusCode = 429;
  }
}

export class ExternalAPIError extends Error {
  constructor(service, originalError) {
    super(`External API error: ${service}`);
    this.name = 'ExternalAPIError';
    this.service = service;
    this.originalError = originalError;
    this.statusCode = 502;
  }
}

/**
 * Error response formatter
 */
export function formatErrorResponse(error) {
  // Don't expose internal error details in production
  const isDevelopment = process.env.NODE_ENV !== 'production';
  
  // Default error response
  let response = {
    error: 'Internal server error',
    message: 'An unexpected error occurred'
  };
  
  // Known error types
  if (error instanceof ValidationError) {
    response = {
      error: 'Validation error',
      message: error.message,
      field: error.field
    };
  } else if (error instanceof AuthenticationError) {
    response = {
      error: 'Authentication error',
      message: error.message
    };
  } else if (error instanceof AuthorizationError) {
    response = {
      error: 'Authorization error',
      message: error.message
    };
  } else if (error instanceof NotFoundError) {
    response = {
      error: 'Not found',
      message: error.message
    };
  } else if (error instanceof RateLimitError) {
    response = {
      error: 'Rate limit exceeded',
      message: error.message
    };
  } else if (error instanceof ExternalAPIError) {
    response = {
      error: 'External service error',
      message: 'A required service is temporarily unavailable',
      service: error.service
    };
  } else if (error.name === 'FirebaseError') {
    // Handle Firebase errors
    response = {
      error: 'Database error',
      message: 'A database operation failed'
    };
  }
  
  // Add stack trace in development
  if (isDevelopment && error.stack) {
    response.stack = error.stack;
    response.originalError = error.message;
  }
  
  return response;
}

/**
 * Error handler middleware
 */
export function errorHandler(handler) {
  return async (req, res) => {
    try {
      await handler(req, res);
    } catch (error) {
      console.error('API Error:', {
        method: req.method,
        url: req.url,
        error: error.message,
        stack: error.stack
      });
      
      const statusCode = error.statusCode || 500;
      const response = formatErrorResponse(error);
      
      res.status(statusCode).json(response);
    }
  };
}

/**
 * Async error wrapper for Express-style middleware
 */
export function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Log error with context
 */
export function logError(error, context = {}) {
  const errorInfo = {
    timestamp: new Date().toISOString(),
    name: error.name,
    message: error.message,
    stack: error.stack,
    ...context
  };
  
  // In production, you might want to send this to a logging service
  if (process.env.NODE_ENV === 'production') {
    // TODO: Send to logging service (e.g., Sentry, LogRocket)
    console.error('Production Error:', errorInfo);
  } else {
    console.error('Development Error:', errorInfo);
  }
}

/**
 * Client-side error boundary helper
 */
export function createErrorBoundary(onError) {
  return {
    handleError(error, errorInfo) {
      logError(error, errorInfo);
      if (onError) {
        onError(error, errorInfo);
      }
    },
    
    resetError() {
      // Reset error state
    }
  };
}

/**
 * Validate required environment variables
 */
export function validateEnvironment(requiredVars) {
  const missing = requiredVars.filter(varName => !process.env[varName]);
  
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}`
    );
  }
}

export default {
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  RateLimitError,
  ExternalAPIError,
  formatErrorResponse,
  errorHandler,
  asyncHandler,
  logError,
  createErrorBoundary,
  validateEnvironment
};