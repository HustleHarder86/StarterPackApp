/**
 * Input validation utilities for API endpoints
 */

/**
 * Validate and sanitize user ID
 */
export function validateUserId(userId) {
  if (!userId || typeof userId !== 'string') {
    throw new Error('Invalid user ID: must be a string');
  }
  
  // Firebase UIDs are typically 28 characters
  if (userId.length < 20 || userId.length > 128) {
    throw new Error('Invalid user ID: incorrect length');
  }
  
  // Only allow alphanumeric characters
  if (!/^[a-zA-Z0-9]+$/.test(userId)) {
    throw new Error('Invalid user ID: contains invalid characters');
  }
  
  return userId;
}

/**
 * Validate and sanitize property ID
 */
export function validatePropertyId(propertyId) {
  if (!propertyId || typeof propertyId !== 'string') {
    throw new Error('Invalid property ID: must be a string');
  }
  
  // Firestore document IDs
  if (propertyId.length < 1 || propertyId.length > 1500) {
    throw new Error('Invalid property ID: incorrect length');
  }
  
  // Allow alphanumeric, hyphens, and underscores
  if (!/^[a-zA-Z0-9_-]+$/.test(propertyId)) {
    throw new Error('Invalid property ID: contains invalid characters');
  }
  
  return propertyId;
}

/**
 * Validate and sanitize property address
 */
export function validateAddress(address) {
  if (!address || typeof address !== 'string') {
    throw new Error('Invalid address: must be a string');
  }
  
  // Reasonable address length
  if (address.length < 5 || address.length > 500) {
    throw new Error('Invalid address: must be between 5 and 500 characters');
  }
  
  // Allow letters, numbers, spaces, and common address characters
  if (!/^[a-zA-Z0-9\s,.\-#/()]+$/.test(address)) {
    throw new Error('Invalid address: contains invalid characters');
  }
  
  // Remove multiple spaces and trim
  return address.replace(/\s+/g, ' ').trim();
}

/**
 * Validate email address
 */
export function validateEmail(email) {
  if (!email || typeof email !== 'string') {
    throw new Error('Invalid email: must be a string');
  }
  
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(email)) {
    throw new Error('Invalid email format');
  }
  
  return email.toLowerCase().trim();
}

/**
 * Validate MLS number
 */
export function validateMlsNumber(mlsNumber) {
  if (!mlsNumber || typeof mlsNumber !== 'string') {
    throw new Error('Invalid MLS number: must be a string');
  }
  
  // MLS numbers are typically alphanumeric
  if (!/^[A-Z0-9]{5,20}$/.test(mlsNumber.toUpperCase())) {
    throw new Error('Invalid MLS number format');
  }
  
  return mlsNumber.toUpperCase();
}

/**
 * Validate numeric values
 */
export function validateNumber(value, options = {}) {
  const {
    min = 0,
    max = Number.MAX_SAFE_INTEGER,
    allowFloat = true,
    fieldName = 'value'
  } = options;
  
  const num = allowFloat ? parseFloat(value) : parseInt(value);
  
  if (isNaN(num)) {
    throw new Error(`Invalid ${fieldName}: must be a number`);
  }
  
  if (num < min || num > max) {
    throw new Error(`Invalid ${fieldName}: must be between ${min} and ${max}`);
  }
  
  return num;
}

/**
 * Validate property details object
 */
export function validatePropertyDetails(details) {
  if (!details || typeof details !== 'object') {
    throw new Error('Invalid property details: must be an object');
  }
  
  const validated = {};
  
  // Validate bedrooms
  if (details.bedrooms !== undefined) {
    validated.bedrooms = validateNumber(details.bedrooms, {
      min: 0,
      max: 20,
      allowFloat: false,
      fieldName: 'bedrooms'
    });
  }
  
  // Validate bathrooms
  if (details.bathrooms !== undefined) {
    validated.bathrooms = validateNumber(details.bathrooms, {
      min: 0,
      max: 20,
      allowFloat: true,
      fieldName: 'bathrooms'
    });
  }
  
  // Validate square feet
  if (details.sqft !== undefined) {
    validated.sqft = validateNumber(details.sqft, {
      min: 100,
      max: 100000,
      allowFloat: false,
      fieldName: 'square feet'
    });
  }
  
  // Validate price
  if (details.price !== undefined) {
    validated.price = validateNumber(details.price, {
      min: 1000,
      max: 100000000,
      allowFloat: false,
      fieldName: 'price'
    });
  }
  
  // Validate property type
  if (details.propertyType) {
    const allowedTypes = ['House', 'Condo', 'Townhouse', 'Multi-family', 'Land', 'Commercial'];
    if (!allowedTypes.includes(details.propertyType)) {
      throw new Error(`Invalid property type: must be one of ${allowedTypes.join(', ')}`);
    }
    validated.propertyType = details.propertyType;
  }
  
  return validated;
}

/**
 * Validate report type
 */
export function validateReportType(reportType) {
  const allowedTypes = ['summary', 'detailed', 'comparison'];
  
  if (!reportType || !allowedTypes.includes(reportType)) {
    throw new Error(`Invalid report type: must be one of ${allowedTypes.join(', ')}`);
  }
  
  return reportType;
}

/**
 * Validate pagination parameters
 */
export function validatePagination(params) {
  const validated = {};
  
  if (params.limit !== undefined) {
    validated.limit = validateNumber(params.limit, {
      min: 1,
      max: 100,
      allowFloat: false,
      fieldName: 'limit'
    });
  } else {
    validated.limit = 20; // Default
  }
  
  if (params.offset !== undefined) {
    validated.offset = validateNumber(params.offset, {
      min: 0,
      max: 10000,
      allowFloat: false,
      fieldName: 'offset'
    });
  } else {
    validated.offset = 0; // Default
  }
  
  return validated;
}

/**
 * Sanitize string to prevent XSS
 */
export function sanitizeString(str) {
  if (!str || typeof str !== 'string') {
    return '';
  }
  
  // Remove any HTML tags and script content
  return str
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/[<>\"']/g, '') // Remove potential HTML characters
    .trim();
}

/**
 * Validate API action parameter
 */
export function validateAction(action, allowedActions) {
  if (!action || !allowedActions.includes(action)) {
    throw new Error(`Invalid action: must be one of ${allowedActions.join(', ')}`);
  }
  
  return action;
}

/**
 * Create a validation middleware
 */
export function validateRequest(validationRules) {
  return (req, res, next) => {
    try {
      const validated = {};
      
      for (const [field, validator] of Object.entries(validationRules)) {
        const value = req.body[field] || req.query[field] || req.params[field];
        
        if (validator.required && value === undefined) {
          return res.status(400).json({
            error: 'Validation error',
            message: `Missing required field: ${field}`
          });
        }
        
        if (value !== undefined && validator.validate) {
          try {
            validated[field] = validator.validate(value);
          } catch (error) {
            return res.status(400).json({
              error: 'Validation error',
              message: `Invalid ${field}: ${error.message}`
            });
          }
        }
      }
      
      // Add validated data to request
      req.validated = validated;
      next();
    } catch (error) {
      return res.status(400).json({
        error: 'Validation error',
        message: error.message
      });
    }
  };
}

export default {
  validateUserId,
  validatePropertyId,
  validateAddress,
  validateEmail,
  validateMlsNumber,
  validateNumber,
  validatePropertyDetails,
  validateReportType,
  validatePagination,
  sanitizeString,
  validateAction,
  validateRequest
};