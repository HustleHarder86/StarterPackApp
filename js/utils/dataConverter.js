/**
 * Centralized Data Converter Utility
 * Handles snake_case to camelCase conversion for API responses
 */

/**
 * Convert snake_case string to camelCase
 * @param {string} str - The snake_case string
 * @returns {string} The camelCase string
 */
function snakeToCamel(str) {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

/**
 * Convert camelCase string to snake_case
 * @param {string} str - The camelCase string
 * @returns {string} The snake_case string
 */
function camelToSnake(str) {
  return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
}

/**
 * Recursively convert all keys in an object from snake_case to camelCase
 * @param {any} obj - The object to convert
 * @returns {any} The converted object with camelCase keys
 */
export function toCamelCase(obj) {
  // Handle null/undefined
  if (obj === null || obj === undefined) return obj;
  
  // Handle arrays
  if (Array.isArray(obj)) {
    return obj.map(item => toCamelCase(item));
  }
  
  // Handle primitives and special objects
  if (typeof obj !== 'object' || obj instanceof Date || obj instanceof RegExp) {
    return obj;
  }
  
  // Handle regular objects
  const converted = {};
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const camelKey = snakeToCamel(key);
      converted[camelKey] = toCamelCase(obj[key]);
    }
  }
  
  return converted;
}

/**
 * Recursively convert all keys in an object from camelCase to snake_case
 * @param {any} obj - The object to convert
 * @returns {any} The converted object with snake_case keys
 */
export function toSnakeCase(obj) {
  // Handle null/undefined
  if (obj === null || obj === undefined) return obj;
  
  // Handle arrays
  if (Array.isArray(obj)) {
    return obj.map(item => toSnakeCase(item));
  }
  
  // Handle primitives and special objects
  if (typeof obj !== 'object' || obj instanceof Date || obj instanceof RegExp) {
    return obj;
  }
  
  // Handle regular objects
  const converted = {};
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const snakeKey = camelToSnake(key);
      converted[snakeKey] = toSnakeCase(obj[key]);
    }
  }
  
  return converted;
}

/**
 * Convert API response data to consistent camelCase format
 * Specifically handles the analysis data structure
 * @param {object} data - The raw API response data
 * @returns {object} The converted data with camelCase keys
 */
export function convertAnalysisData(data) {
  if (!data) return data;
  
  // Convert the entire object to camelCase
  const converted = toCamelCase(data);
  
  // Handle specific aliases that might exist in the codebase
  // Map common backend names to expected frontend names
  if (converted.shortTermRental && !converted.strAnalysis) {
    converted.strAnalysis = converted.shortTermRental;
  }
  
  if (converted.longTermRental && !converted.ltrAnalysis) {
    converted.ltrAnalysis = converted.longTermRental;
  }
  
  // Ensure nested structures are properly converted
  if (converted.propertyData) {
    // Ensure common property fields are available
    if (converted.propertyData.squareFeet === undefined && converted.propertyData.sqft) {
      converted.propertyData.squareFeet = converted.propertyData.sqft;
    }
    
    if (converted.propertyData.imageUrl === undefined && converted.propertyData.mainImage) {
      converted.propertyData.imageUrl = converted.propertyData.mainImage;
    }
  }
  
  // Handle STR analysis specific conversions
  if (converted.strAnalysis) {
    // Ensure avgNightlyRate is available if avg_nightly_rate was converted
    if (converted.strAnalysis.avgNightlyRate === undefined && converted.strAnalysis.dailyRate) {
      converted.strAnalysis.avgNightlyRate = converted.strAnalysis.dailyRate;
    }
    
    // Ensure occupancy is a percentage if it's a decimal
    if (converted.strAnalysis.occupancyRate && converted.strAnalysis.occupancyRate < 1) {
      converted.strAnalysis.avgOccupancy = Math.round(converted.strAnalysis.occupancyRate * 100);
    }
  }
  
  return converted;
}

/**
 * Convert form data to snake_case for API submission
 * @param {object} formData - The form data in camelCase
 * @returns {object} The form data in snake_case
 */
export function prepareApiPayload(formData) {
  return toSnakeCase(formData);
}

// Make functions available globally for non-module scripts
if (typeof window !== 'undefined') {
  window.dataConverter = {
    toCamelCase,
    toSnakeCase,
    convertAnalysisData,
    prepareApiPayload
  };
}

export default {
  toCamelCase,
  toSnakeCase,
  convertAnalysisData,
  prepareApiPayload
};