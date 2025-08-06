#!/usr/bin/env node

/**
 * Quick validation of development environment
 * Used by git hooks to ensure code changes won't break the dev setup
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m'
};

let hasErrors = false;

// Check for required environment files
console.log('Checking environment files...');
const requiredFiles = [
  '.env.local',
  '.env.development',
  '.env.production',
  'railway-api/.env'
];

for (const file of requiredFiles) {
  const filePath = path.join(process.cwd(), file);
  if (!fs.existsSync(filePath)) {
    console.error(`${colors.red}❌ Missing ${file}${colors.reset}`);
    console.log(`  Run: npm run setup:env`);
    hasErrors = true;
  }
}

// Check if .env.local points to localhost
const envLocal = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envLocal)) {
  const content = fs.readFileSync(envLocal, 'utf8');
  if (!content.includes('http://localhost:3001')) {
    console.warn(`${colors.yellow}⚠️  Warning: .env.local not configured for local development${colors.reset}`);
    console.log(`  Run: ./scripts/switch-env.sh dev`);
  }
}

// Check package.json scripts
console.log('Checking npm scripts...');
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const requiredScripts = ['dev', 'dev:vercel', 'dev:railway', 'test:syntax'];

for (const script of requiredScripts) {
  if (!packageJson.scripts[script]) {
    console.error(`${colors.red}❌ Missing script: ${script}${colors.reset}`);
    hasErrors = true;
  }
}

// Check for dependencies
console.log('Checking dependencies...');
const requiredDeps = ['concurrently', 'vercel', 'husky', 'lint-staged'];
const allDeps = { ...packageJson.dependencies, ...packageJson.devDependencies };

for (const dep of requiredDeps) {
  if (!allDeps[dep]) {
    console.error(`${colors.red}❌ Missing dependency: ${dep}${colors.reset}`);
    console.log(`  Run: npm install`);
    hasErrors = true;
  }
}

// Check if vercel CLI is available
try {
  execSync('npx vercel --version', { stdio: 'ignore' });
} catch (error) {
  console.error(`${colors.red}❌ Vercel CLI not available${colors.reset}`);
  console.log(`  Run: npm install vercel`);
  hasErrors = true;
}

// Check Railway API directory
const railwayApiDir = path.join(process.cwd(), 'railway-api');
if (!fs.existsSync(railwayApiDir)) {
  console.error(`${colors.red}❌ Railway API directory not found${colors.reset}`);
  hasErrors = true;
} else {
  const railwayPackageJson = path.join(railwayApiDir, 'package.json');
  if (!fs.existsSync(railwayPackageJson)) {
    console.error(`${colors.red}❌ Railway API package.json not found${colors.reset}`);
    hasErrors = true;
  }
}

if (hasErrors) {
  console.error(`\n${colors.red}❌ Development environment validation failed${colors.reset}`);
  console.log('\nPlease fix the issues above before committing.');
  console.log('See DEVELOPMENT.md for setup instructions.\n');
  process.exit(1);
} else {
  console.log(`${colors.green}✅ Development environment is valid${colors.reset}`);
  process.exit(0);
}