/**
 * Playwright interceptor that transforms CommonJS modules to browser globals
 */

const { transformCommonJS } = require('./transform-commonjs');
const fs = require('fs').promises;
const path = require('path');

/**
 * Set up route interceptor for transforming JavaScript files
 * @param {Page} page - Playwright page object
 * @param {string} baseDir - Base directory for resolving file paths
 */
async function setupTransformInterceptor(page, baseDir) {
  console.log('🎭 Setting up Playwright transform interceptor...');
  
  // Cache for transformed files to avoid re-processing
  const transformCache = new Map();
  
  // Track transformed files for logging
  const transformedFiles = new Set();
  let cacheHits = 0;
  let cacheMisses = 0;
  
  await page.route('**/*.js', async (route, request) => {
    const url = request.url();
    
    // Only intercept local files, not external scripts
    if (url.startsWith('http://localhost') || url.startsWith('file://')) {
      try {
        // Extract the file path from URL
        let filePath;
        if (url.startsWith('file://')) {
          filePath = url.replace('file://', '');
        } else {
          // Remove protocol and host
          const urlPath = url.replace(/^https?:\/\/[^\/]+/, '');
          filePath = path.join(baseDir, urlPath);
        }
        
        // Check cache first
        const cacheKey = filePath;
        if (transformCache.has(cacheKey)) {
          cacheHits++;
          const cachedCode = transformCache.get(cacheKey);
          await route.fulfill({
            status: 200,
            contentType: 'application/javascript',
            body: cachedCode
          });
          return;
        }
        
        cacheMisses++;
        
        // Read the original file
        const originalCode = await fs.readFile(filePath, 'utf8');
        
        // Transform if needed
        const { code: transformedCode } = await transformCommonJS(originalCode, filePath);
        
        // Cache the result
        transformCache.set(cacheKey, transformedCode);
        
        // Track if we actually transformed it
        if (transformedCode !== originalCode) {
          transformedFiles.add(path.basename(filePath));
        }
        
        // Respond with the transformed code
        await route.fulfill({
          status: 200,
          contentType: 'application/javascript',
          body: transformedCode
        });
        
      } catch (error) {
        console.error(`❌ Failed to intercept ${url}:`, error.message);
        // Fall back to the original request
        await route.continue();
      }
    } else {
      // External scripts - don't transform
      await route.continue();
    }
  });
  
  // Log summary on page close
  page.once('close', () => {
    if (transformedFiles.size > 0 || cacheHits > 0) {
      console.log(`\n📊 Transform Summary:`);
      console.log(`   Modified files: ${transformedFiles.size}`);
      console.log(`   Cache hits: ${cacheHits}`);
      console.log(`   Cache misses: ${cacheMisses}`);
      if (transformedFiles.size > 0) {
        console.log(`   Transformed files:`);
        transformedFiles.forEach(file => console.log(`     ✓ ${file}`));
      }
    }
  });
  
  console.log('✅ Transform interceptor ready');
}

/**
 * Test the interceptor with a minimal Playwright test
 */
async function testInterceptor() {
  const { chromium } = require('playwright');
  
  console.log('🧪 Testing Playwright transform interceptor...\n');
  
  // Create a test HTML file that loads a CommonJS module
  const testHtmlPath = path.join(__dirname, 'test-interceptor.html');
  const testJsPath = path.join(__dirname, 'test-module.js');
  
  // Create test files
  await fs.writeFile(testJsPath, `
    // Test CommonJS module
    class TestModule {
      getMessage() {
        return 'Hello from CommonJS module!';
      }
    }
    module.exports = TestModule;
  `);
  
  await fs.writeFile(testHtmlPath, `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Test Interceptor</title>
    </head>
    <body>
      <div id="result">Loading...</div>
      <script src="test-module.js"></script>
      <script>
        // This should work after transformation
        if (window.TestModule) {
          const module = new window.TestModule();
          document.getElementById('result').textContent = module.getMessage();
        } else {
          document.getElementById('result').textContent = 'Failed to load module';
        }
      </script>
    </body>
    </html>
  `);
  
  const browser = await chromium.launch({ headless: true });
  
  try {
    const context = await browser.newContext();
    const page = await context.newPage();
    
    // Set up interceptor
    await setupTransformInterceptor(page, __dirname);
    
    // Capture console
    const consoleLogs = [];
    page.on('console', msg => {
      if (msg.type() !== 'debug') {
        consoleLogs.push(`[${msg.type()}] ${msg.text()}`);
      }
    });
    
    // Navigate to test page
    console.log(`📂 Loading test page...`);
    await page.goto(`file://${testHtmlPath}`);
    
    // Check the result
    const result = await page.textContent('#result');
    
    if (result === 'Hello from CommonJS module!') {
      console.log('✅ Transform successful! Module loaded correctly');
    } else {
      console.log(`❌ Transform failed. Result: ${result}`);
      if (consoleLogs.length > 0) {
        console.log('\nConsole output:');
        consoleLogs.forEach(log => console.log(`  ${log}`));
      }
    }
    
  } finally {
    await browser.close();
    
    // Clean up test files
    await fs.unlink(testHtmlPath).catch(() => {});
    await fs.unlink(testJsPath).catch(() => {});
  }
}

// Export for use in tests
module.exports = {
  setupTransformInterceptor
};

// Run test if called directly
if (require.main === module) {
  testInterceptor().catch(console.error);
}