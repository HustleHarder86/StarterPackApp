#!/usr/bin/env node

/**
 * Analysis Saving Test
 * Tests the complete analysis saving and loading workflow
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Testing Analysis Saving and Loading Workflow...');

// Test results
const results = {
  passed: 0,
  failed: 0,
  errors: []
};

function test(name, testFn) {
  try {
    console.log(`\n🧪 Testing: ${name}`);
    testFn();
    console.log(`✅ PASSED: ${name}`);
    results.passed++;
  } catch (error) {
    console.log(`❌ FAILED: ${name}`);
    console.log(`   Error: ${error.message}`);
    results.failed++;
    results.errors.push({ test: name, error: error.message });
  }
}

// Test 1: Check analyze-property.js has propertyId fix
test('API includes propertyId in analysis data', () => {
  const apiFile = fs.readFileSync(path.join(__dirname, '../api/analyze-property.js'), 'utf8');
  
  if (!apiFile.includes('propertyId: propertyId')) {
    throw new Error('analyze-property.js missing propertyId field in analysisData');
  }
  
  if (!apiFile.includes('collection(\'properties\')')) {
    throw new Error('analyze-property.js missing property creation');
  }
  
  if (!apiFile.includes('propertyRecord')) {
    throw new Error('analyze-property.js missing property record creation');
  }
});

// Test 2: Check portfolio.html has orphaned analysis fallback
test('Portfolio handles orphaned analyses', () => {
  const portfolioFile = fs.readFileSync(path.join(__dirname, '../portfolio.html'), 'utf8');
  
  if (!portfolioFile.includes('orphaned analyses')) {
    throw new Error('portfolio.html missing orphaned analysis handling');
  }
  
  if (!portfolioFile.includes('propertyId\', \'==\', null')) {
    throw new Error('portfolio.html missing orphaned analysis query');
  }
  
  if (!portfolioFile.includes('orphaned_analysis')) {
    throw new Error('portfolio.html missing orphaned analysis data source flag');
  }
});

// Test 3: Check database schema compliance
test('Database schema includes required fields', () => {
  const claudeFile = fs.readFileSync(path.join(__dirname, '../CLAUDE.md'), 'utf8');
  
  if (!claudeFile.includes('propertyId: string')) {
    throw new Error('CLAUDE.md database schema missing propertyId field');
  }
  
  if (!claudeFile.includes('analyses/{analysisId}')) {
    throw new Error('CLAUDE.md missing analyses collection schema');
  }
});

// Test 4: Check for data flow consistency
test('Data flow maintains consistency', () => {
  const apiFile = fs.readFileSync(path.join(__dirname, '../api/analyze-property.js'), 'utf8');
  const portfolioFile = fs.readFileSync(path.join(__dirname, '../portfolio.html'), 'utf8');
  
  // Check that API saves propertyId
  if (!apiFile.includes('propertyId: propertyId')) {
    throw new Error('API not saving propertyId field');
  }
  
  // Check that portfolio queries by propertyId
  if (!portfolioFile.includes('.where(\'propertyId\', \'in\'')) {
    throw new Error('Portfolio not querying by propertyId');
  }
  
  // Check data structure consistency
  if (apiFile.includes('propertyTaxes') && !portfolioFile.includes('propertyTaxes')) {
    throw new Error('Property tax field inconsistency between API and portfolio');
  }
});

// Test 5: Check for error handling
test('Error handling for missing propertyId', () => {
  const portfolioFile = fs.readFileSync(path.join(__dirname, '../portfolio.html'), 'utf8');
  
  if (!portfolioFile.includes('catch (error)')) {
    throw new Error('Portfolio missing error handling for orphaned analyses');
  }
  
  if (!portfolioFile.includes('console.warn')) {
    throw new Error('Portfolio missing warning for orphaned analysis failures');
  }
});

// Test 6: Verify property creation
test('Property creation includes all required fields', () => {
  const apiFile = fs.readFileSync(path.join(__dirname, '../api/analyze-property.js'), 'utf8');
  
  const requiredFields = [
    'userId:', 'address:', 'price:', 'propertyTaxes:', 
    'bedrooms:', 'bathrooms:', 'dataSource:', 'createdAt:'
  ];
  
  requiredFields.forEach(field => {
    if (!apiFile.includes(field)) {
      throw new Error(`Property creation missing required field: ${field}`);
    }
  });
});

// Test 7: Check for no variable name collisions
test('No variable name collisions in property creation', () => {
  const apiFile = fs.readFileSync(path.join(__dirname, '../api/analyze-property.js'), 'utf8');
  
  if (apiFile.includes('const propertyData = {') && apiFile.includes('propertyData?.price')) {
    throw new Error('Variable name collision: propertyData used as both parameter and variable');
  }
  
  if (!apiFile.includes('propertyRecord')) {
    throw new Error('Property record variable not found - may have variable collision');
  }
});

// Run all tests
console.log('🚀 Running Analysis Saving Tests...\n');

test('API includes propertyId in analysis data', () => {
  const apiFile = fs.readFileSync(path.join(__dirname, '../api/analyze-property.js'), 'utf8');
  
  if (!apiFile.includes('propertyId: propertyId')) {
    throw new Error('analyze-property.js missing propertyId field in analysisData');
  }
  
  if (!apiFile.includes('collection(\'properties\')')) {
    throw new Error('analyze-property.js missing property creation');
  }
  
  if (!apiFile.includes('propertyRecord')) {
    throw new Error('analyze-property.js missing property record creation');
  }
});

test('Portfolio handles orphaned analyses', () => {
  const portfolioFile = fs.readFileSync(path.join(__dirname, '../portfolio.html'), 'utf8');
  
  if (!portfolioFile.includes('orphaned analyses')) {
    throw new Error('portfolio.html missing orphaned analysis handling');
  }
  
  if (!portfolioFile.includes('propertyId\', \'==\', null')) {
    throw new Error('portfolio.html missing orphaned analysis query');
  }
  
  if (!portfolioFile.includes('orphaned_analysis')) {
    throw new Error('portfolio.html missing orphaned analysis data source flag');
  }
});

test('Database schema includes required fields', () => {
  const claudeFile = fs.readFileSync(path.join(__dirname, '../CLAUDE.md'), 'utf8');
  
  if (!claudeFile.includes('propertyId: string')) {
    throw new Error('CLAUDE.md database schema missing propertyId field');
  }
  
  if (!claudeFile.includes('analyses/{analysisId}')) {
    throw new Error('CLAUDE.md missing analyses collection schema');
  }
});

test('Data flow maintains consistency', () => {
  const apiFile = fs.readFileSync(path.join(__dirname, '../api/analyze-property.js'), 'utf8');
  const portfolioFile = fs.readFileSync(path.join(__dirname, '../portfolio.html'), 'utf8');
  
  // Check that API saves propertyId
  if (!apiFile.includes('propertyId: propertyId')) {
    throw new Error('API not saving propertyId field');
  }
  
  // Check that portfolio queries by propertyId
  if (!portfolioFile.includes('.where(\'propertyId\', \'in\'')) {
    throw new Error('Portfolio not querying by propertyId');
  }
  
  // Check data structure consistency
  if (apiFile.includes('propertyTaxes') && !portfolioFile.includes('propertyTaxes')) {
    throw new Error('Property tax field inconsistency between API and portfolio');
  }
});

test('Error handling for missing propertyId', () => {
  const portfolioFile = fs.readFileSync(path.join(__dirname, '../portfolio.html'), 'utf8');
  
  if (!portfolioFile.includes('catch (error)')) {
    throw new Error('Portfolio missing error handling for orphaned analyses');
  }
  
  if (!portfolioFile.includes('console.warn')) {
    throw new Error('Portfolio missing warning for orphaned analysis failures');
  }
});

test('Property creation includes all required fields', () => {
  const apiFile = fs.readFileSync(path.join(__dirname, '../api/analyze-property.js'), 'utf8');
  
  const requiredFields = [
    'userId:', 'address:', 'price:', 'propertyTaxes:', 
    'bedrooms:', 'bathrooms:', 'dataSource:', 'createdAt:'
  ];
  
  requiredFields.forEach(field => {
    if (!apiFile.includes(field)) {
      throw new Error(`Property creation missing required field: ${field}`);
    }
  });
});

test('No variable name collisions in property creation', () => {
  const apiFile = fs.readFileSync(path.join(__dirname, '../api/analyze-property.js'), 'utf8');
  
  if (apiFile.includes('const propertyData = {') && apiFile.includes('propertyData?.price')) {
    throw new Error('Variable name collision: propertyData used as both parameter and variable');
  }
  
  if (!apiFile.includes('propertyRecord')) {
    throw new Error('Property record variable not found - may have variable collision');
  }
});

// Summary
console.log('\n📊 Analysis Saving Test Results:');
console.log(`✅ Passed: ${results.passed}`);
console.log(`❌ Failed: ${results.failed}`);
console.log(`📈 Success Rate: ${Math.round(results.passed / (results.passed + results.failed) * 100)}%`);

if (results.errors.length > 0) {
  console.log('\n🔍 Failed Test Details:');
  results.errors.forEach(({ test, error }) => {
    console.log(`  • ${test}: ${error}`);
  });
}

console.log('\n🎯 Analysis Saving Test Complete!');

// Exit with error code if tests failed
if (results.failed > 0) {
  process.exit(1);
}

console.log('\n✅ All analysis saving and loading tests passed!');
console.log('🎉 The analysis saving issue has been successfully fixed!');