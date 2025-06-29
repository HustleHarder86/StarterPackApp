// utils/validators.js
// Input validation and sanitization utilities

/**
 * Validate property address
 * @param {string} address - Property address to validate
 * @throws {Error} If address is invalid
 */
export function validateAddress(address) {
  if (!address || typeof address !== 'string') {
    throw new Error('Address must be a non-empty string');
  }
  
  if (address.length < 10) {
    throw new Error('Address is too short');
  }
  
  // Basic check for address structure (should have commas for city, province)
  if (!address.includes(',')) {
    throw new Error('Address must include city and province');
  }
  
  return true;
}

/**
 * Validate property data
 * @param {Object} data - Property data to validate
 * @throws {Error} If data is invalid
 */
export function validatePropertyData(data) {
  if (!data || typeof data !== 'object') {
    throw new Error('Property data must be an object');
  }
  
  // Validate price
  if (data.price !== undefined) {
    if (typeof data.price !== 'number' || data.price <= 0) {
      throw new Error('Price must be a positive number');
    }
    if (data.price > 100000000) {
      throw new Error('Price seems unrealistically high');
    }
  }
  
  // Validate bedrooms
  if (data.bedrooms !== undefined) {
    if (typeof data.bedrooms !== 'number' || data.bedrooms < 0) {
      throw new Error('Bedrooms must be a non-negative number');
    }
    if (data.bedrooms > 50) {
      throw new Error('Bedrooms count seems unrealistic');
    }
  }
  
  // Validate bathrooms
  if (data.bathrooms !== undefined) {
    if (typeof data.bathrooms !== 'number' || data.bathrooms < 0) {
      throw new Error('Bathrooms must be a non-negative number');
    }
    if (data.bathrooms > 50) {
      throw new Error('Bathrooms count seems unrealistic');
    }
  }
  
  // Validate square footage
  if (data.sqft !== undefined) {
    if (typeof data.sqft !== 'number' || data.sqft <= 0) {
      throw new Error('Square footage must be a positive number');
    }
    if (data.sqft > 100000) {
      throw new Error('Square footage seems unrealistic');
    }
  }
  
  return true;
}

/**
 * Validate financial data
 * @param {Object} data - Financial data to validate
 * @throws {Error} If data is invalid
 */
export function validateFinancialData(data) {
  if (!data || typeof data !== 'object') {
    throw new Error('Financial data must be an object');
  }
  
  // Validate down payment percentage
  if (data.downPayment !== undefined) {
    if (typeof data.downPayment !== 'number' || data.downPayment < 0 || data.downPayment > 100) {
      throw new Error('Down payment must be between 0 and 100 percent');
    }
  }
  
  // Validate interest rate
  if (data.interestRate !== undefined) {
    if (typeof data.interestRate !== 'number' || data.interestRate < 0) {
      throw new Error('Interest rate must be a positive number');
    }
    if (data.interestRate > 30) {
      throw new Error('Interest rate seems unrealistically high');
    }
  }
  
  // Validate loan term
  if (data.loanTerm !== undefined) {
    if (typeof data.loanTerm !== 'number' || data.loanTerm <= 0) {
      throw new Error('Loan term must be a positive number');
    }
    if (data.loanTerm > 50) {
      throw new Error('Loan term seems unrealistically long');
    }
  }
  
  // Validate monthly rent
  if (data.monthlyRent !== undefined) {
    if (typeof data.monthlyRent !== 'number' || data.monthlyRent < 0) {
      throw new Error('Monthly rent must be a non-negative number');
    }
  }
  
  return true;
}

/**
 * Sanitize user input to prevent XSS
 * @param {string} input - Input to sanitize
 * @returns {string} Sanitized input
 */
export function sanitizeInput(input) {
  if (input == null) {
    return '';
  }
  
  // Convert to string
  const str = String(input);
  
  // Remove script tags
  let sanitized = str.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  
  // Escape HTML entities
  sanitized = sanitized
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
  
  return sanitized;
}

/**
 * Validation error class
 */
export class ValidationError extends Error {
  constructor(message, field) {
    super(message);
    this.name = 'ValidationError';
    this.field = field;
  }
}

// CommonJS export for Jest compatibility
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    validateAddress,
    validatePropertyData,
    validateFinancialData,
    sanitizeInput,
    ValidationError
  };
}