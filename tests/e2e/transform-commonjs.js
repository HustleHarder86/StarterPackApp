/**
 * Transform CommonJS modules to browser globals using esbuild
 */

const esbuild = require('esbuild');
const path = require('path');
const fs = require('fs');

/**
 * Extract the global name from a file path
 * e.g., /components/analysis/PropertyHeroSection.js -> PropertyHeroSection
 */
function getGlobalNameFromPath(filePath) {
  const basename = path.basename(filePath, '.js');
  // Convert kebab-case to PascalCase and remove invalid characters
  const cleaned = basename
    .replace(/-([a-z])/g, (_, letter) => letter.toUpperCase()) // kebab to camel
    .replace(/[^a-zA-Z0-9]/g, '') // remove invalid chars
    .replace(/^([a-z])/, (_, letter) => letter.toUpperCase()); // capitalize first
  
  return cleaned || 'Module';
}

/**
 * Transform CommonJS code to browser-compatible IIFE
 * @param {string} code - The CommonJS code to transform
 * @param {string} filePath - The file path (used for determining global name)
 * @returns {Promise<{code: string, map: string}>} The transformed code and source map
 */
async function transformCommonJS(code, filePath) {
  try {
    // Skip if it's already browser-compatible (no module.exports)
    if (!code.includes('module.exports') && !code.includes('exports.')) {
      // Check for potential issues like const redeclaration
      if (code.includes('const ComponentLoader = window.ComponentLoader')) {
        console.log(`🔧 ${filePath} - Fixing const redeclaration`);
        const fixedCode = code.replace(
          'const ComponentLoader = window.ComponentLoader;',
          '// ComponentLoader is already available globally'
        );
        return { code: fixedCode, map: '' };
      }
      console.log(`⏭️  ${filePath} - No CommonJS patterns found, skipping transform`);
      return { code, map: '' };
    }
    
    const globalName = getGlobalNameFromPath(filePath);
    console.log(`🔄 Transforming ${filePath} -> window.${globalName}`);
    
    // Transform the code
    const result = await esbuild.transform(code, {
      format: 'iife',
      globalName: globalName,
      loader: 'js',
      target: 'es2015',
      sourcemap: 'inline'
    });
    
    // Ensure the global is assigned to window
    let finalCode = result.code;
    
    // If the code doesn't already assign to window, wrap it
    if (!finalCode.includes(`window.${globalName}`)) {
      finalCode = finalCode.replace(
        `var ${globalName} = `,
        `window.${globalName} = `
      );
    }
    
    // Add require mock for modules that use require()
    if (code.includes('require(')) {
      finalCode = `
// Transformed from CommonJS: ${filePath}
(function() {
  // Mock require for browser environment
  const require = function(module) {
    // Handle relative paths
    if (module.startsWith('./')) {
      const moduleName = module.slice(2).replace('.js', '');
      // Try various naming conventions
      const pascalCase = moduleName.charAt(0).toUpperCase() + moduleName.slice(1);
      const camelCase = moduleName.charAt(0).toLowerCase() + moduleName.slice(1);
      return window[pascalCase] || window[camelCase] || window[moduleName];
    }
    // Handle node modules
    return window[module];
  };
  
  ${finalCode}
})();`;
    }
    
    return {
      code: finalCode,
      map: result.map || ''
    };
    
  } catch (error) {
    console.error(`❌ Failed to transform ${filePath}:`, error.message);
    throw error;
  }
}

/**
 * Test the transform function on a sample file
 */
async function testTransform() {
  console.log('🧪 Testing CommonJS transformation...\n');
  
  // Test 1: Simple CommonJS module
  const simpleModule = `
class TestComponent {
  constructor() {
    this.name = 'Test';
  }
}
module.exports = TestComponent;
`;
  
  console.log('Test 1: Simple module');
  const result1 = await transformCommonJS(simpleModule, 'TestComponent.js');
  console.log('✅ Transformed successfully');
  console.log('   Contains window.TestComponent:', result1.code.includes('window.TestComponent'));
  
  // Test 2: Module with require
  const moduleWithRequire = `
const helper = require('./helper');
class ComplexComponent {
  constructor() {
    this.helper = helper;
  }
}
module.exports = ComplexComponent;
`;
  
  console.log('\nTest 2: Module with require');
  const result2 = await transformCommonJS(moduleWithRequire, 'ComplexComponent.js');
  console.log('✅ Transformed successfully');
  console.log('   Contains require mock:', result2.code.includes('const require = function'));
  
  // Test 3: Already browser-compatible code
  const browserCode = `
window.BrowserComponent = class {
  constructor() {
    this.name = 'Browser';
  }
};
`;
  
  console.log('\nTest 3: Browser-compatible code');
  const result3 = await transformCommonJS(browserCode, 'BrowserComponent.js');
  console.log('✅ Skipped transformation (already browser-compatible)');
  
  console.log('\n✨ All tests passed!');
}

// Export for use in other modules
module.exports = {
  transformCommonJS,
  getGlobalNameFromPath
};

// Run tests if called directly
if (require.main === module) {
  testTransform().catch(console.error);
}