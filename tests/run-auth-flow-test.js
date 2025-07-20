const { exec, spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
};

console.log(`${colors.blue}${colors.bright}Starting Authentication Flow Test...${colors.reset}\n`);

// Function to start local server
function startServer() {
  return new Promise((resolve, reject) => {
    console.log(`${colors.yellow}Starting local development server...${colors.reset}`);
    
    // Try different server commands
    const serverCommands = [
      { cmd: 'npm', args: ['run', 'dev'] },
      { cmd: 'npx', args: ['vercel', 'dev', '--listen', '3000'] },
      { cmd: 'npx', args: ['http-server', '.', '-p', '3000'] },
      { cmd: 'python3', args: ['-m', 'http.server', '3000'] },
      { cmd: 'python', args: ['-m', 'http.server', '3000'] }
    ];

    let serverProcess = null;
    let commandIndex = 0;

    function tryNextCommand() {
      if (commandIndex >= serverCommands.length) {
        reject(new Error('Could not start server with any available command'));
        return;
      }

      const { cmd, args } = serverCommands[commandIndex];
      console.log(`Trying: ${cmd} ${args.join(' ')}`);

      serverProcess = spawn(cmd, args, {
        stdio: 'pipe',
        shell: true
      });

      serverProcess.stdout.on('data', (data) => {
        const output = data.toString();
        if (output.includes('Ready') || output.includes('Serving') || output.includes('3000')) {
          console.log(`${colors.green}Server started successfully!${colors.reset}\n`);
          setTimeout(() => resolve(serverProcess), 2000); // Give server time to fully start
        }
      });

      serverProcess.stderr.on('data', (data) => {
        console.error(`Server error: ${data}`);
      });

      serverProcess.on('error', (error) => {
        console.log(`Failed with ${cmd}: ${error.message}`);
        commandIndex++;
        tryNextCommand();
      });

      // Give it some time to start
      setTimeout(() => {
        if (serverProcess && !serverProcess.killed) {
          // Check if server is running by making a request
          const http = require('http');
          http.get('http://localhost:3000', (res) => {
            console.log(`${colors.green}Server is responding on port 3000!${colors.reset}\n`);
            resolve(serverProcess);
          }).on('error', () => {
            commandIndex++;
            serverProcess.kill();
            tryNextCommand();
          });
        }
      }, 3000);
    }

    tryNextCommand();
  });
}

// Function to run Playwright tests
function runTests() {
  return new Promise((resolve, reject) => {
    console.log(`${colors.yellow}Running Playwright tests...${colors.reset}\n`);

    const testProcess = spawn('npx', ['playwright', 'test', 'tests/e2e/auth-flow-test.spec.js', '--reporter=list'], {
      stdio: 'inherit',
      shell: true
    });

    testProcess.on('close', (code) => {
      if (code === 0) {
        console.log(`\n${colors.green}${colors.bright}Tests completed successfully!${colors.reset}`);
        resolve();
      } else {
        console.log(`\n${colors.red}${colors.bright}Tests failed with code ${code}${colors.reset}`);
        reject(new Error(`Tests failed with code ${code}`));
      }
    });

    testProcess.on('error', (error) => {
      console.error(`Test error: ${error}`);
      reject(error);
    });
  });
}

// Function to display results
function displayResults() {
  console.log(`\n${colors.blue}${colors.bright}Test Results:${colors.reset}\n`);

  const screenshotDir = path.join(__dirname, 'e2e', 'screenshots');
  
  try {
    const files = fs.readdirSync(screenshotDir).filter(f => f.startsWith('flow-'));
    
    if (files.length > 0) {
      console.log(`${colors.green}Screenshots captured:${colors.reset}`);
      files.forEach(file => {
        console.log(`  - ${file}`);
      });
      console.log(`\nScreenshots saved in: ${screenshotDir}`);
    } else {
      console.log(`${colors.yellow}No screenshots were captured${colors.reset}`);
    }
  } catch (error) {
    console.log(`${colors.yellow}Screenshot directory not found${colors.reset}`);
  }
}

// Main execution
async function main() {
  let serverProcess = null;

  try {
    // Create screenshots directory if it doesn't exist
    const screenshotDir = path.join(__dirname, 'e2e', 'screenshots');
    if (!fs.existsSync(screenshotDir)) {
      fs.mkdirSync(screenshotDir, { recursive: true });
    }

    // Start server
    serverProcess = await startServer();

    // Run tests
    await runTests();

    // Display results
    displayResults();

  } catch (error) {
    console.error(`\n${colors.red}${colors.bright}Error: ${error.message}${colors.reset}`);
  } finally {
    // Clean up
    if (serverProcess) {
      console.log(`\n${colors.yellow}Stopping server...${colors.reset}`);
      serverProcess.kill();
    }
    process.exit(0);
  }
}

// Handle Ctrl+C
process.on('SIGINT', () => {
  console.log(`\n${colors.yellow}Test interrupted by user${colors.reset}`);
  process.exit(0);
});

main();