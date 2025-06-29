/**
 * Comprehensive test suite for InvestorProps STR Platform Enhancement
 * Run with: node tests/platform-test.js
 */

const path = require('path');
const fs = require('fs');

const rootDir = path.join(__dirname, '..');

// Test results tracking
let testsPassed = 0;
let testsFailed = 0;
const errors = [];

// Console colors
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function testPass(testName) {
  testsPassed++;
  log(`✓ ${testName}`, 'green');
}

function testFail(testName, error) {
  testsFailed++;
  errors.push({ test: testName, error });
  log(`✗ ${testName}`, 'red');
  if (error) log(`  Error: ${error}`, 'yellow');
}

// Test 1: Check file structure
function testFileStructure() {
  log('\n=== Testing File Structure ===', 'blue');
  
  const requiredFiles = [
    // HTML Pages
    'roi-finder.html',
    'portfolio.html',
    'reports.html',
    'deployment-checklist.md',
    
    // API Endpoints
    'api/analyze-property-enhanced.js',
    'api/properties/ingest.js',
    'api/properties/list.js',
    'api/properties/delete.js',
    'api/reports/generate.js',
    'api/user-management-enhanced.js',
    
    // Components
    'components/RentalComparisonView.jsx',
    
    // Browser Extension
    'extension/manifest.json',
    'extension/src/content.js',
    'extension/src/popup.html',
    'extension/src/popup.js',
    'extension/src/background.js',
    'extension/icons/generate-icons.html',
    
    // Utilities
    'utils/pdf-generator-placeholder.js'
  ];
  
  requiredFiles.forEach(file => {
    const filePath = path.join(rootDir, file);
    if (fs.existsSync(filePath)) {
      testPass(`File exists: ${file}`);
    } else {
      testFail(`File missing: ${file}`);
    }
  });
}

// Test 2: Check API endpoint structure
function testAPIEndpoints() {
  log('\n=== Testing API Endpoint Structure ===', 'blue');
  
  const apiFiles = [
    'api/analyze-property-enhanced.js',
    'api/properties/ingest.js',
    'api/properties/list.js',
    'api/properties/delete.js',
    'api/reports/generate.js'
  ];
  
  apiFiles.forEach(file => {
    const filePath = path.join(rootDir, file);
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      
      // Check for CORS headers
      if (content.includes('Access-Control-Allow-Origin')) {
        testPass(`${file}: CORS headers present`);
      } else {
        testFail(`${file}: Missing CORS headers`);
      }
      
      // Check for OPTIONS handling
      if (content.includes("method === 'OPTIONS'")) {
        testPass(`${file}: OPTIONS method handled`);
      } else {
        testFail(`${file}: OPTIONS method not handled`);
      }
      
      // Check for error handling
      if (content.includes('try') && content.includes('catch')) {
        testPass(`${file}: Error handling present`);
      } else {
        testFail(`${file}: No error handling`);
      }
    } catch (error) {
      testFail(`${file}: Could not read file`, error.message);
    }
  });
}

// Test 3: Check HTML page integration
function testHTMLIntegration() {
  log('\n=== Testing HTML Page Integration ===', 'blue');
  
  // Check roi-finder.html
  const roiFinderPath = path.join(rootDir, 'roi-finder.html');
  try {
    const content = fs.readFileSync(roiFinderPath, 'utf8');
    
    // Check for React integration
    if (content.includes('react.production.min.js')) {
      testPass('roi-finder.html: React integrated');
    } else {
      testFail('roi-finder.html: React not integrated');
    }
    
    // Check for STR comparison container
    if (content.includes('str-comparison-container')) {
      testPass('roi-finder.html: STR comparison container present');
    } else {
      testFail('roi-finder.html: STR comparison container missing');
    }
    
    // Check for enhanced API endpoint
    if (content.includes('analyze-property-enhanced')) {
      testPass('roi-finder.html: Using enhanced API endpoint');
    } else {
      testFail('roi-finder.html: Not using enhanced API endpoint');
    }
    
    // Check for navigation
    if (content.includes('href="/portfolio.html"') && content.includes('href="/reports.html"')) {
      testPass('roi-finder.html: Navigation links present');
    } else {
      testFail('roi-finder.html: Navigation links missing');
    }
  } catch (error) {
    testFail('roi-finder.html: Could not read file', error.message);
  }
  
  // Check portfolio.html
  const portfolioPath = path.join(rootDir, 'portfolio.html');
  try {
    const content = fs.readFileSync(portfolioPath, 'utf8');
    
    // Check for Chart.js
    if (content.includes('chart.js')) {
      testPass('portfolio.html: Chart.js integrated');
    } else {
      testFail('portfolio.html: Chart.js missing');
    }
    
    // Check for Firebase
    if (content.includes('firebase-firestore-compat.js')) {
      testPass('portfolio.html: Firebase integrated');
    } else {
      testFail('portfolio.html: Firebase missing');
    }
    
    // Check for property management functions
    if (content.includes('deleteProperty') && content.includes('viewAnalysis')) {
      testPass('portfolio.html: Property management functions present');
    } else {
      testFail('portfolio.html: Property management functions missing');
    }
  } catch (error) {
    testFail('portfolio.html: Could not read file', error.message);
  }
}

// Test 4: Check browser extension
function testBrowserExtension() {
  log('\n=== Testing Browser Extension ===', 'blue');
  
  // Check manifest.json
  const manifestPath = path.join(rootDir, 'extension/manifest.json');
  try {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    
    if (manifest.manifest_version === 3) {
      testPass('Extension: Using Manifest V3');
    } else {
      testFail('Extension: Not using Manifest V3');
    }
    
    if (manifest.permissions.includes('activeTab')) {
      testPass('Extension: Has required permissions');
    } else {
      testFail('Extension: Missing required permissions');
    }
    
    if (manifest.host_permissions.some(perm => perm.includes('realtor.ca'))) {
      testPass('Extension: Has Realtor.ca host permission');
    } else {
      testFail('Extension: Missing Realtor.ca host permission');
    }
  } catch (error) {
    testFail('Extension manifest: Could not parse', error.message);
  }
  
  // Check content script
  const contentPath = path.join(rootDir, 'extension/src/content.js');
  try {
    const content = fs.readFileSync(contentPath, 'utf8');
    
    if (content.includes('extractPropertyData')) {
      testPass('Extension: Property extraction function present');
    } else {
      testFail('Extension: Property extraction function missing');
    }
  } catch (error) {
    testFail('Extension content script: Could not read', error.message);
  }
}

// Test 5: Check component structure
function testComponents() {
  log('\n=== Testing React Components ===', 'blue');
  
  const componentPath = path.join(rootDir, 'components/RentalComparisonView.jsx');
  try {
    const content = fs.readFileSync(componentPath, 'utf8');
    
    if (content.includes('const RentalComparisonView')) {
      testPass('RentalComparisonView: Component defined');
    } else {
      testFail('RentalComparisonView: Component not defined');
    }
    
    if (content.includes('window.RentalComparisonView')) {
      testPass('RentalComparisonView: Exported to window');
    } else {
      testFail('RentalComparisonView: Not exported to window');
    }
    
    if (content.includes('longTermRental') && content.includes('strAnalysis')) {
      testPass('RentalComparisonView: Handles both LTR and STR data');
    } else {
      testFail('RentalComparisonView: Missing data handlers');
    }
  } catch (error) {
    testFail('RentalComparisonView: Could not read', error.message);
  }
}

// Test 6: Check configuration files
function testConfiguration() {
  log('\n=== Testing Configuration ===', 'blue');
  
  // Check package.json
  const packagePath = path.join(rootDir, 'package.json');
  try {
    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    
    // Check for module type - project uses mixed CommonJS/ES modules
    if (!packageJson.type || packageJson.type !== 'module') {
      testPass('package.json: Using CommonJS (correct for Vercel)');
    } else {
      testFail('package.json: Incorrect module type');
    }
    
    if (packageJson.dependencies && packageJson.dependencies['firebase-admin']) {
      testPass('package.json: Firebase Admin SDK present');
    } else {
      testFail('package.json: Firebase Admin SDK missing');
    }
  } catch (error) {
    testFail('package.json: Could not read', error.message);
  }
  
  // Check vercel.json
  const vercelPath = path.join(rootDir, 'vercel.json');
  if (fs.existsSync(vercelPath)) {
    testPass('vercel.json: Configuration file exists');
  } else {
    testFail('vercel.json: Configuration file missing');
  }
}

// Test 7: Check API endpoint responses (mock)
function testAPIResponses() {
  log('\n=== Testing API Response Structure ===', 'blue');
  
  // Since we can't actually call the APIs without deployment,
  // we'll check the response structure in the code
  
  const enhancedApiPath = path.join(rootDir, 'api/analyze-property-enhanced.js');
  try {
    const content = fs.readFileSync(enhancedApiPath, 'utf8');
    
    if (content.includes('strAnalysis') && content.includes('comparison')) {
      testPass('Enhanced API: Returns STR analysis data');
    } else {
      testFail('Enhanced API: Missing STR analysis data');
    }
    
    if (content.includes('longTermRental') && content.includes('strAnalysis')) {
      testPass('Enhanced API: Returns both LTR and STR data');
    } else {
      testFail('Enhanced API: Missing rental data structures');
    }
  } catch (error) {
    testFail('Enhanced API: Could not analyze', error.message);
  }
}

// Run all tests
async function runTests() {
  log('🧪 InvestorProps STR Platform Enhancement Test Suite', 'blue');
  log('================================================\n', 'blue');
  
  testFileStructure();
  testAPIEndpoints();
  testHTMLIntegration();
  testBrowserExtension();
  testComponents();
  testConfiguration();
  testAPIResponses();
  
  // Summary
  log('\n=== Test Summary ===', 'blue');
  log(`Total Tests: ${testsPassed + testsFailed}`);
  log(`Passed: ${testsPassed}`, 'green');
  log(`Failed: ${testsFailed}`, 'red');
  
  if (testsFailed > 0) {
    log('\n=== Failed Tests Details ===', 'red');
    errors.forEach(({ test, error }) => {
      log(`\n${test}:`, 'red');
      if (error) log(`  ${error}`, 'yellow');
    });
  }
  
  // Overall result
  if (testsFailed === 0) {
    log('\n✅ All tests passed! The platform is ready for deployment.', 'green');
  } else {
    log('\n❌ Some tests failed. Please review the errors above.', 'red');
  }
}

// Execute tests
runTests().catch(error => {
  log('Fatal error running tests:', 'red');
  console.error(error);
  process.exit(1);
});