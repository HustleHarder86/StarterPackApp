#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

console.log('🧪 Running ROI Finder Integration Tests...\n');

// Start the dev server
console.log('Starting development server...');
const server = spawn('npm', ['run', 'dev'], {
  stdio: 'pipe',
  shell: true
});

let serverReady = false;

// Wait for server to be ready
server.stdout.on('data', (data) => {
  const output = data.toString();
  if (output.includes('Ready') || output.includes('Local:') || output.includes('3000')) {
    if (!serverReady) {
      serverReady = true;
      console.log('✅ Server is ready!\n');
      runTests();
    }
  }
});

server.stderr.on('data', (data) => {
  console.error('Server error:', data.toString());
});

// Run the integration tests
function runTests() {
  console.log('Running integration tests...\n');
  
  const testProcess = spawn('npx', [
    'playwright', 
    'test', 
    'tests/e2e/roi-finder-integration.spec.js',
    '--reporter=list'
  ], {
    stdio: 'inherit',
    shell: true
  });
  
  testProcess.on('close', (code) => {
    console.log('\n🏁 Tests completed with code:', code);
    
    // Kill the server
    console.log('Stopping development server...');
    server.kill('SIGTERM');
    
    // Exit with the test result code
    process.exit(code);
  });
}

// Handle cleanup on exit
process.on('SIGINT', () => {
  console.log('\n\nStopping processes...');
  server.kill('SIGTERM');
  process.exit(1);
});

// Timeout if server doesn't start
setTimeout(() => {
  if (!serverReady) {
    console.error('❌ Server failed to start within 30 seconds');
    server.kill('SIGTERM');
    process.exit(1);
  }
}, 30000);