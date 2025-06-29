// ESM to CommonJS wrapper for utilities
// This allows us to use ES6 modules in a CommonJS environment

const Module = require('module');
const vm = require('vm');
const fs = require('fs');

// Create a simple ESM loader for our modules
async function loadESModule(filepath) {
  const source = fs.readFileSync(filepath, 'utf8');
  
  // Simple conversion of import/export to CommonJS
  const converted = source
    .replace(/import\s+{([^}]+)}\s+from\s+['"]([^'"]+)['"]/g, 'const {$1} = require("$2")')
    .replace(/import\s+(\w+)\s+from\s+['"]([^'"]+)['"]/g, 'const $1 = require("$2")')
    .replace(/export\s+default\s+/g, 'module.exports = ')
    .replace(/export\s+{([^}]+)}/g, 'module.exports = {$1}')
    .replace(/export\s+function\s+(\w+)/g, 'module.exports.$1 = function')
    .replace(/export\s+const\s+(\w+)/g, 'module.exports.$1')
    .replace(/export\s+class\s+(\w+)/g, 'module.exports.$1 = class');
  
  return converted;
}

module.exports = { loadESModule };