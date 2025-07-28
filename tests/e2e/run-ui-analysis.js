const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting UI/UX Analysis Test Suite');

// Start the development server
console.log('📡 Starting development server...');
const serverProcess = spawn('npx', ['http-server', '-p', '3000', '-c-1'], {
    cwd: path.join(__dirname, '../..'),
    stdio: 'pipe'
});

// Give server time to start
setTimeout(() => {
    console.log('🧪 Running comprehensive UI analysis test...');
    
    // Run the test
    const testProcess = spawn('node', [path.join(__dirname, 'comprehensive-ui-analysis-test.js')], {
        stdio: 'inherit'
    });
    
    testProcess.on('close', (code) => {
        console.log(`\n✅ Test completed with code ${code}`);
        
        // Kill the server
        serverProcess.kill();
        process.exit(code);
    });
    
    testProcess.on('error', (err) => {
        console.error('❌ Test error:', err);
        serverProcess.kill();
        process.exit(1);
    });
}, 3000);

// Handle errors
serverProcess.on('error', (err) => {
    console.error('❌ Server error:', err);
    process.exit(1);
});

// Handle Ctrl+C
process.on('SIGINT', () => {
    console.log('\n🛑 Stopping test...');
    serverProcess.kill();
    process.exit(0);
});