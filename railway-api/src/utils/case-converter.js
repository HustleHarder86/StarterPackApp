/**
 * Convert object keys from camelCase to snake_case
 */

function camelToSnake(str) {
  return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
}

function toSnakeCase(obj) {
  if (obj === null || obj === undefined) {
    return obj;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(toSnakeCase);
  }
  
  if (typeof obj !== 'object' || obj instanceof Date) {
    return obj;
  }
  
  const converted = {};
  
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const snakeKey = camelToSnake(key);
      converted[snakeKey] = toSnakeCase(obj[key]);
    }
  }
  
  return converted;
}

module.exports = {
  toSnakeCase,
  camelToSnake
};