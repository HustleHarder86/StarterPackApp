#!/usr/bin/env node

/**
 * Development file watcher
 * Automatically runs tests when files change during development
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
  dim: '\x1b[2m'
};

// Directories to watch
const watchDirs = [
  'api',
  'railway-api',
  'components',
  'js',
  'styles'
];

// File extensions to watch
const watchExtensions = ['.js', '.jsx', '.html', '.css'];

// Debounce timer
let debounceTimer = null;
const DEBOUNCE_DELAY = 1000; // 1 second

console.log(`${colors.blue}🔍 Development Watcher Started${colors.reset}`);
console.log(`${colors.dim}Watching for changes in: ${watchDirs.join(', ')}${colors.reset}\n`);

function runTests() {
  console.clear();
  console.log(`${colors.yellow}⚡ Changes detected - running tests...${colors.reset}\n`);
  
  try {
    // Run syntax validation
    execSync('npm run test:syntax', { stdio: 'inherit' });
    console.log(`${colors.green}✅ Syntax validation passed${colors.reset}`);
    
    // Run quick tests
    execSync('npm run test:quick', { stdio: 'inherit' });
    console.log(`${colors.green}✅ Quick tests passed${colors.reset}`);
    
    console.log(`\n${colors.green}✨ All tests passed! Continue coding...${colors.reset}\n`);
  } catch (error) {
    console.log(`\n${colors.red}❌ Tests failed! Please fix the issues above.${colors.reset}\n`);
  }
  
  console.log(`${colors.dim}Watching for changes...${colors.reset}`);
}

function handleFileChange(filename) {
  // Ignore certain files
  if (filename.includes('node_modules') || 
      filename.includes('.git') || 
      filename.includes('test-') ||
      filename.includes('.env')) {
    return;
  }
  
  // Check if file has a watched extension
  const hasWatchedExtension = watchExtensions.some(ext => filename.endsWith(ext));
  if (!hasWatchedExtension) {
    return;
  }
  
  console.log(`${colors.dim}File changed: ${filename}${colors.reset}`);
  
  // Debounce to avoid multiple rapid test runs
  if (debounceTimer) {
    clearTimeout(debounceTimer);
  }
  
  debounceTimer = setTimeout(() => {
    runTests();
  }, DEBOUNCE_DELAY);
}

// Set up watchers for each directory
watchDirs.forEach(dir => {
  const dirPath = path.join(process.cwd(), dir);
  
  if (!fs.existsSync(dirPath)) {
    console.log(`${colors.yellow}⚠️  Directory not found: ${dir}${colors.reset}`);
    return;
  }
  
  // Recursive watch
  fs.watch(dirPath, { recursive: true }, (eventType, filename) => {
    if (filename) {
      handleFileChange(path.join(dir, filename));
    }
  });
});

// Watch root-level HTML files
fs.watch(process.cwd(), (eventType, filename) => {
  if (filename && filename.endsWith('.html')) {
    handleFileChange(filename);
  }
});

console.log(`${colors.dim}Watching for changes...${colors.reset}`);

// Handle exit gracefully
process.on('SIGINT', () => {
  console.log(`\n${colors.blue}👋 Stopping development watcher${colors.reset}`);
  process.exit(0);
});

// Keep the process running
process.stdin.resume();