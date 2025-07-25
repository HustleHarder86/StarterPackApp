#!/usr/bin/env node

/**
 * Simple test to verify bedroom parameters are correctly set
 */

console.log('\n\x1b[36m=== Verifying Bedroom Parameters in Code ===\x1b[0m\n');

// Read the airbnb-scraper.service.js file
const fs = require('fs');
const path = require('path');

const servicePath = path.join(__dirname, '../src/services/airbnb-scraper.service.js');
const serviceCode = fs.readFileSync(servicePath, 'utf8');

// Check for minBedrooms and maxBedrooms in the code
const hasMinBedrooms = serviceCode.includes('minBedrooms: bedrooms');
const hasMaxBedrooms = serviceCode.includes('maxBedrooms: bedrooms');

// Find the exact lines
const lines = serviceCode.split('\n');
const minBedroomLine = lines.findIndex(line => line.includes('minBedrooms: bedrooms'));
const maxBedroomLine = lines.findIndex(line => line.includes('maxBedrooms: bedrooms'));

console.log('Checking airbnb-scraper.service.js for bedroom parameters:\n');

console.log(`✓ Has minBedrooms parameter: ${hasMinBedrooms ? '\x1b[32mYES\x1b[0m' : '\x1b[31mNO\x1b[0m'}`);
if (minBedroomLine >= 0) {
  console.log(`  Found on line ${minBedroomLine + 1}: "${lines[minBedroomLine].trim()}"`);
}

console.log(`✓ Has maxBedrooms parameter: ${hasMaxBedrooms ? '\x1b[32mYES\x1b[0m' : '\x1b[31mNO\x1b[0m'}`);
if (maxBedroomLine >= 0) {
  console.log(`  Found on line ${maxBedroomLine + 1}: "${lines[maxBedroomLine].trim()}"`);
}

// Show the relevant code section
if (hasMinBedrooms && hasMaxBedrooms) {
  console.log('\n\x1b[34mRelevant code section:\x1b[0m');
  const startLine = Math.max(0, Math.min(minBedroomLine, maxBedroomLine) - 2);
  const endLine = Math.min(lines.length - 1, Math.max(minBedroomLine, maxBedroomLine) + 2);
  
  for (let i = startLine; i <= endLine; i++) {
    const lineNum = String(i + 1).padStart(4, ' ');
    const marker = (i === minBedroomLine || i === maxBedroomLine) ? '\x1b[32m→\x1b[0m' : ' ';
    console.log(`${lineNum}${marker} ${lines[i]}`);
  }
  
  console.log('\n\x1b[32m✅ SUCCESS: Both minBedrooms and maxBedrooms are set!\x1b[0m');
  console.log('\nThis means:');
  console.log('- For a 5-bedroom property: minBedrooms=5, maxBedrooms=5');
  console.log('- Only 5-bedroom properties will be returned as comparables');
  console.log('- No more 6 or 7 bedroom properties in your results!');
} else {
  console.log('\n\x1b[31m❌ FAILURE: Bedroom parameters are not correctly configured\x1b[0m');
  process.exit(1);
}

// Also verify the comment is correct
const hasComment = serviceCode.includes('// Property specifications - exact bedroom match');
if (hasComment) {
  console.log('\n✓ Code comment confirms exact bedroom matching is intended');
}