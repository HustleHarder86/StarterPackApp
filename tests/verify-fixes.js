#!/usr/bin/env node

// Quick verification script for recent fixes
// Can be run locally to verify all changes are working

const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying Recent Property Analysis Fixes\n');

// 1. Check Railway API configuration
console.log('1️⃣ Checking Railway API Configuration...');
const apiConfigPath = path.join(__dirname, '../utils/api-config.js');
const apiConfig = fs.readFileSync(apiConfigPath, 'utf8');

if (apiConfig.includes('https://starterpackapp-production.up.railway.app')) {
  console.log('✅ Railway production URL is configured correctly');
} else {
  console.log('❌ Railway production URL not found in api-config.js');
}

// 2. Check bedroom/bathroom parsing in Railway
console.log('\n2️⃣ Checking Bedroom/Bathroom Parsing...');
const calculationsPath = path.join(__dirname, '../railway-api/src/utils/property-calculations.js');
if (fs.existsSync(calculationsPath)) {
  const calculations = fs.readFileSync(calculationsPath, 'utf8');
  if (calculations.includes('parseBedroomBathroomValue') && calculations.includes('\\+\\s*')) {
    console.log('✅ parseBedroomBathroomValue function exists with "X + Y" format support');
  } else {
    console.log('❌ parseBedroomBathroomValue function missing or incomplete');
  }
} else {
  console.log('⚠️  Railway calculations file not found - is railway-api directory present?');
}

// 3. Check ROI Finder routing
console.log('\n3️⃣ Checking ROI Finder API Routing...');
const roiFinderPath = path.join(__dirname, '../roi-finder.html');
const roiFinder = fs.readFileSync(roiFinderPath, 'utf8');

if (roiFinder.includes('buildUrl(\'railway\', \'analyzeProperty\')')) {
  console.log('✅ ROI Finder routes to Railway API');
} else if (roiFinder.includes('/api/analyze-property')) {
  console.log('❌ ROI Finder still routing to Vercel API');
} else {
  console.log('⚠️  Could not determine ROI Finder routing');
}

// 4. Check city parsing fix
console.log('\n4️⃣ Checking City Parsing Fix...');
if (roiFinder.includes('city: (() => {') && roiFinder.includes('/[A-Z]\\d[A-Z]\\s?\\d[A-Z]\\d/.test(city)')) {
  console.log('✅ City parsing fix for postal codes is implemented');
} else {
  console.log('❌ City parsing fix not found');
}

// 5. Check Perplexity timeout
console.log('\n5️⃣ Checking Perplexity Timeout Configuration...');
const analysisServicePath = path.join(__dirname, '../railway-api/src/services/property-analysis.service.js');
if (fs.existsSync(analysisServicePath)) {
  const analysisService = fs.readFileSync(analysisServicePath, 'utf8');
  if (analysisService.includes('timeout: 60000')) {
    console.log('✅ Perplexity API timeout set to 60 seconds');
  } else if (analysisService.includes('timeout: 20000')) {
    console.log('❌ Perplexity API timeout still at 20 seconds');
  } else {
    console.log('⚠️  Could not find timeout configuration');
  }
} else {
  console.log('⚠️  Railway analysis service file not found');
}

// 6. Check for duplicate API_CONFIG
console.log('\n6️⃣ Checking for Duplicate API_CONFIG...');
const configJsPath = path.join(__dirname, '../js/config.js');
if (fs.existsSync(configJsPath)) {
  const configJs = fs.readFileSync(configJsPath, 'utf8');
  if (configJs.includes('const API_CONFIG')) {
    console.log('❌ Duplicate API_CONFIG found in config.js - this will cause errors!');
  } else {
    console.log('✅ No duplicate API_CONFIG in config.js');
  }
} else {
  console.log('✅ config.js not found (good - no duplicate)');
}

// Summary
console.log('\n📊 Summary:');
console.log('All fixes should be deployed to both Railway and Vercel from the main branch.');
console.log('Use the manual test checklist to verify functionality in the browser.\n');

// Test data examples
console.log('📝 Test Data Examples:');
console.log('- Canadian Format: "4 + 2" bedrooms → should parse to 6');
console.log('- Canadian Format: "3.5 + 1" bathrooms → should parse to 4.5');
console.log('- Bad City Format: "Ontario L5A1E1" → should extract "Mississauga" from full address');
console.log('- Property Tax: $5,490 from listing → should use exact amount, not calculate');

console.log('\n✨ Run integration tests with: npm run test:integration');
console.log('📋 See tests/MANUAL_TEST_CHECKLIST.md for browser testing');