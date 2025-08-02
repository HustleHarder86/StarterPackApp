/**
 * Node.js wrapper for integration test
 * Falls back to Node.js version if Python/Playwright not available
 */

const { spawn, execSync } = require('child_process');
const path = require('path');

// Check if Python and Playwright are available
let usePython = false;
try {
  execSync('python3 --version', { stdio: 'ignore' });
  execSync('python3 -c "import playwright"', { stdio: 'ignore' });
  usePython = true;
} catch (e) {
  // Python or Playwright not available
}

if (usePython) {
  console.log('🐍 Running Python-based integration test...\n');
  const testScript = path.join(__dirname, 'python-integration-test.py');
  
  const pythonProcess = spawn('python3', [testScript], {
    stdio: 'inherit',
    cwd: process.cwd()
  });
  
  pythonProcess.on('error', (err) => {
    console.error('❌ Failed to run Python test:', err.message);
    process.exit(1);
  });
  
  pythonProcess.on('close', (code) => {
    process.exit(code);
  });
} else {
  console.log('📦 Python/Playwright not available, using Node.js version...\n');
  
  // Run the Node.js version
  require('./node-integration-test.js');
}