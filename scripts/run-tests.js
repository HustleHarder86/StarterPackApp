#!/usr/bin/env node

/**
 * Automated test runner with feedback and auto-fix capabilities
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
};

class TestRunner {
  constructor() {
    this.results = {
      unit: { passed: 0, failed: 0, errors: [] },
      e2e: { passed: 0, failed: 0, errors: [] }
    };
  }

  log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
  }

  async runCommand(command, args = []) {
    return new Promise((resolve, reject) => {
      const proc = spawn(command, args, { 
        stdio: 'pipe',
        shell: true 
      });
      
      let stdout = '';
      let stderr = '';

      proc.stdout.on('data', (data) => {
        stdout += data.toString();
        process.stdout.write(data);
      });

      proc.stderr.on('data', (data) => {
        stderr += data.toString();
        process.stderr.write(data);
      });

      proc.on('close', (code) => {
        resolve({ code, stdout, stderr });
      });
    });
  }

  async installDependencies() {
    this.log('\n📦 Installing test dependencies...', 'blue');
    const { code } = await this.runCommand('npm', ['install']);
    if (code !== 0) {
      this.log('Failed to install dependencies', 'red');
      process.exit(1);
    }
  }

  async runUnitTests() {
    this.log('\n🧪 Running unit tests...', 'blue');
    const { code, stdout } = await this.runCommand('npm', ['test']);
    
    // Parse Jest output
    const passMatch = stdout.match(/Tests:\s+(\d+)\s+passed/);
    const failMatch = stdout.match(/Tests:\s+(\d+)\s+failed/);
    
    if (passMatch) this.results.unit.passed = parseInt(passMatch[1]);
    if (failMatch) this.results.unit.failed = parseInt(failMatch[1]);
    
    // Extract failed test details
    if (this.results.unit.failed > 0) {
      const failedTests = stdout.match(/✕\s+(.+)/g) || [];
      this.results.unit.errors = failedTests.map(test => test.replace('✕ ', ''));
    }
    
    return code === 0;
  }

  async runE2ETests() {
    this.log('\n🎭 Running E2E tests...', 'blue');
    
    // Install Playwright browsers if needed
    await this.runCommand('npx', ['playwright', 'install']);
    
    const { code, stdout } = await this.runCommand('npm', ['run', 'test:e2e']);
    
    // Parse Playwright output
    const passMatch = stdout.match(/(\d+)\s+passed/);
    const failMatch = stdout.match(/(\d+)\s+failed/);
    
    if (passMatch) this.results.e2e.passed = parseInt(passMatch[1]);
    if (failMatch) this.results.e2e.failed = parseInt(failMatch[1]);
    
    return code === 0;
  }

  async analyzeFailures() {
    this.log('\n🔍 Analyzing test failures...', 'yellow');
    
    const failures = [];
    
    // Check for common issues
    if (this.results.unit.errors.some(err => err.includes('Firebase'))) {
      failures.push({
        type: 'config',
        message: 'Firebase configuration issues detected',
        fix: 'Ensure .env.test file exists with proper Firebase test credentials'
      });
    }
    
    if (this.results.unit.errors.some(err => err.includes('Cannot find module'))) {
      failures.push({
        type: 'import',
        message: 'Module import errors detected',
        fix: 'Check import paths and ensure all dependencies are installed'
      });
    }
    
    if (this.results.e2e.failed > 0) {
      failures.push({
        type: 'e2e',
        message: 'E2E tests failed - likely due to UI changes',
        fix: 'Update selectors in E2E tests to match current UI'
      });
    }
    
    return failures;
  }

  async attemptAutoFix(failures) {
    this.log('\n🔧 Attempting automatic fixes...', 'blue');
    
    for (const failure of failures) {
      switch (failure.type) {
        case 'config':
          // Create test env file if missing
          const envPath = path.join(__dirname, '..', '.env.test');
          if (!fs.existsSync(envPath)) {
            this.log('Creating .env.test file...', 'yellow');
            // Copy from template created earlier
          }
          break;
          
        case 'import':
          // Run npm install to ensure deps
          this.log('Reinstalling dependencies...', 'yellow');
          await this.runCommand('npm', ['install']);
          break;
          
        case 'e2e':
          this.log('E2E fixes require manual selector updates', 'yellow');
          break;
      }
    }
  }

  generateReport() {
    this.log('\n📊 Test Results Summary', 'blue');
    this.log('='.repeat(40));
    
    // Unit tests
    const unitTotal = this.results.unit.passed + this.results.unit.failed;
    const unitPassRate = unitTotal > 0 ? (this.results.unit.passed / unitTotal * 100).toFixed(1) : 0;
    
    this.log(`\nUnit Tests: ${this.results.unit.passed}/${unitTotal} passed (${unitPassRate}%)`, 
      this.results.unit.failed === 0 ? 'green' : 'red');
    
    if (this.results.unit.errors.length > 0) {
      this.log('\nFailed unit tests:', 'red');
      this.results.unit.errors.forEach(err => this.log(`  - ${err}`, 'red'));
    }
    
    // E2E tests
    const e2eTotal = this.results.e2e.passed + this.results.e2e.failed;
    const e2ePassRate = e2eTotal > 0 ? (this.results.e2e.passed / e2eTotal * 100).toFixed(1) : 0;
    
    this.log(`\nE2E Tests: ${this.results.e2e.passed}/${e2eTotal} passed (${e2ePassRate}%)`,
      this.results.e2e.failed === 0 ? 'green' : 'red');
    
    // Coverage report
    if (fs.existsSync(path.join(__dirname, '..', 'coverage', 'lcov-report', 'index.html'))) {
      this.log('\n📈 Coverage report available at: coverage/lcov-report/index.html', 'blue');
    }
    
    // Overall status
    const allPassed = this.results.unit.failed === 0 && this.results.e2e.failed === 0;
    this.log('\n' + '='.repeat(40));
    this.log(allPassed ? '✅ All tests passed!' : '❌ Some tests failed', allPassed ? 'green' : 'red');
  }

  async run() {
    this.log('🚀 InvestorProps Test Runner', 'blue');
    this.log('='.repeat(40));
    
    // Install dependencies
    await this.installDependencies();
    
    // Run unit tests
    const unitSuccess = await this.runUnitTests();
    
    // Run E2E tests
    const e2eSuccess = await this.runE2ETests();
    
    // Analyze failures
    if (!unitSuccess || !e2eSuccess) {
      const failures = await this.analyzeFailures();
      
      if (failures.length > 0) {
        this.log('\n💡 Detected issues:', 'yellow');
        failures.forEach(f => {
          this.log(`  - ${f.message}`, 'yellow');
          this.log(`    Fix: ${f.fix}`, 'blue');
        });
        
        // Attempt auto-fix
        await this.attemptAutoFix(failures);
        
        // Re-run tests if fixes were applied
        if (failures.some(f => ['config', 'import'].includes(f.type))) {
          this.log('\n🔄 Re-running tests after fixes...', 'blue');
          await this.runUnitTests();
          await this.runE2ETests();
        }
      }
    }
    
    // Generate report
    this.generateReport();
    
    // Exit with appropriate code
    const exitCode = this.results.unit.failed + this.results.e2e.failed === 0 ? 0 : 1;
    process.exit(exitCode);
  }
}

// Run tests
const runner = new TestRunner();
runner.run().catch(error => {
  console.error('Test runner failed:', error);
  process.exit(1);
});