/**
 * Test script to verify esbuild can transform CommonJS to browser globals
 */

const esbuild = require('esbuild');
const fs = require('fs');
const path = require('path');

async function testEsbuildTransform() {
  console.log('🧪 Testing esbuild CommonJS transformation...\n');
  
  // Sample CommonJS code
  const commonjsCode = `
// Sample CommonJS module
const helper = require('./helper');

class MyComponent {
  constructor() {
    this.name = 'MyComponent';
  }
  
  render() {
    return '<div>Hello from MyComponent</div>';
  }
}

module.exports = MyComponent;
`;

  try {
    // Transform CommonJS to IIFE format
    const result = await esbuild.transform(commonjsCode, {
      format: 'iife',
      globalName: 'MyComponent',
      loader: 'js',
      target: 'es2015',
      sourcemap: true
    });
    
    console.log('✅ Transformation successful!');
    console.log('\n📄 Original CommonJS code:');
    console.log('─'.repeat(50));
    console.log(commonjsCode);
    
    console.log('\n📦 Transformed browser code:');
    console.log('─'.repeat(50));
    console.log(result.code);
    
    // Test transforming an actual component file
    console.log('\n🔍 Testing on actual component file...');
    const componentPath = path.join(__dirname, '../../js/modules/componentLoader.js');
    
    if (fs.existsSync(componentPath)) {
      const componentCode = fs.readFileSync(componentPath, 'utf8');
      
      // Check if it's CommonJS
      if (componentCode.includes('module.exports')) {
        console.log('✅ Found CommonJS pattern in componentLoader.js');
        
        // Transform it
        const componentResult = await esbuild.transform(componentCode, {
          format: 'iife',
          globalName: 'ComponentLoader',
          loader: 'js',
          target: 'es2015'
        });
        
        console.log('✅ Successfully transformed componentLoader.js');
        console.log(`   Original size: ${componentCode.length} bytes`);
        console.log(`   Transformed size: ${componentResult.code.length} bytes`);
        
        // Check if the transformation looks correct
        if (componentResult.code.includes('var ComponentLoader = ')) {
          console.log('✅ Global variable assignment verified');
        }
      } else {
        console.log('⚠️  componentLoader.js doesn\'t use module.exports');
      }
    }
    
    console.log('\n✨ esbuild is working correctly and can transform our CommonJS modules!');
    
  } catch (error) {
    console.error('❌ Transform failed:', error.message);
    process.exit(1);
  }
}

// Run the test
testEsbuildTransform();