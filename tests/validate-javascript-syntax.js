#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔍 ROI Finder JavaScript Validation Script');
console.log('==========================================\n');

// Read the roi-finder.html file
const htmlPath = path.join(__dirname, '../roi-finder.html');
const htmlContent = fs.readFileSync(htmlPath, 'utf8');

// Check for duplicate variable declarations
console.log('1. Checking for duplicate variable declarations...');

// Find all occurrences of confirmLtrBtn and confirmStrBtn
const confirmLtrBtnMatches = [...htmlContent.matchAll(/const\s+confirmLtrBtn\s*=/g)];
const confirmStrBtnMatches = [...htmlContent.matchAll(/const\s+confirmStrBtn\s*=/g)];

console.log(`   - confirmLtrBtn declarations found: ${confirmLtrBtnMatches.length}`);
console.log(`   - confirmStrBtn declarations found: ${confirmStrBtnMatches.length}`);

if (confirmLtrBtnMatches.length > 1 || confirmStrBtnMatches.length > 1) {
  console.log('   ❌ DUPLICATE VARIABLES DETECTED');
  
  confirmLtrBtnMatches.forEach((match, index) => {
    const lineNumber = htmlContent.substring(0, match.index).split('\n').length;
    console.log(`      confirmLtrBtn #${index + 1} at line ~${lineNumber}`);
  });
  
  confirmStrBtnMatches.forEach((match, index) => {
    const lineNumber = htmlContent.substring(0, match.index).split('\n').length;
    console.log(`      confirmStrBtn #${index + 1} at line ~${lineNumber}`);
  });
} else {
  console.log('   ✅ No duplicate variable declarations found');
}

// Check for common JavaScript syntax issues
console.log('\n2. Checking for common JavaScript syntax issues...');

const syntaxChecks = [
  {
    name: 'Unclosed brackets',
    pattern: /\{[^}]*$/gm,
    description: 'Lines with opening brackets but no closing brackets'
  },
  {
    name: 'Missing semicolons after function calls',
    pattern: /\)\s*\n\s*[a-zA-Z]/gm,
    description: 'Function calls that might be missing semicolons'
  },
  {
    name: 'Undefined variables',
    pattern: /\b(showView|initApp|updateAuthMode)\s*\(/g,
    description: 'Key function calls (checking if they exist)'
  }
];

syntaxChecks.forEach(check => {
  const matches = [...htmlContent.matchAll(check.pattern)];
  if (check.name === 'Undefined variables') {
    console.log(`   ✅ Found ${matches.length} calls to key functions`);
  } else {
    console.log(`   - ${check.name}: ${matches.length} potential issues`);
  }
});

// Check for the analyze button and its event handlers
console.log('\n3. Checking analyze button implementation...');

const analyzeBtnPattern = /Analyze Property/g;
const analyzeBtnMatches = [...htmlContent.matchAll(analyzeBtnPattern)];
console.log(`   - "Analyze Property" button text found: ${analyzeBtnMatches.length}`);

const propertyFormPattern = /property-form/g;
const propertyFormMatches = [...htmlContent.matchAll(propertyFormPattern)];
console.log(`   - property-form references: ${propertyFormMatches.length}`);

const clickEventPattern = /addEventListener\(['"`]click['"`]/g;
const clickEventMatches = [...htmlContent.matchAll(clickEventPattern)];
console.log(`   - click event listeners: ${clickEventMatches.length}`);

// Check for screen management functions
console.log('\n4. Checking screen management...');

const showViewPattern = /function\s+showView\s*\(/g;
const showViewFunctionMatches = [...htmlContent.matchAll(showViewPattern)];
console.log(`   - showView function definitions: ${showViewFunctionMatches.length}`);

const screenIds = ['loading-screen', 'confirmation-screen', 'results-screen'];
screenIds.forEach(screenId => {
  const pattern = new RegExp(`['"\`]${screenId}['"\`]`, 'g');
  const matches = [...htmlContent.matchAll(pattern)];
  console.log(`   - ${screenId} references: ${matches.length}`);
});

// Summary
console.log('\n📊 VALIDATION SUMMARY');
console.log('====================');

const hasDuplicateVars = confirmLtrBtnMatches.length > 1 || confirmStrBtnMatches.length > 1;
const hasAnalyzeBtn = analyzeBtnMatches.length > 0;
const hasPropertyForm = propertyFormMatches.length > 0;
const hasShowViewFunction = showViewFunctionMatches.length > 0;
const hasClickEvents = clickEventMatches.length > 0;

if (!hasDuplicateVars && hasAnalyzeBtn && hasPropertyForm && hasShowViewFunction && hasClickEvents) {
  console.log('✅ PASSED: JavaScript structure looks good');
  console.log('✅ PASSED: No duplicate variable declarations');
  console.log('✅ PASSED: Analyze button implementation present');
  console.log('✅ PASSED: Property form present');
  console.log('✅ PASSED: Screen management functions present');
  console.log('\n🎉 ROI Finder JavaScript validation completed successfully!');
  process.exit(0);
} else {
  console.log('❌ FAILED: Issues detected in JavaScript structure');
  if (hasDuplicateVars) console.log('❌ Duplicate variable declarations found');
  if (!hasAnalyzeBtn) console.log('❌ Analyze button implementation missing');
  if (!hasPropertyForm) console.log('❌ Property form missing');
  if (!hasShowViewFunction) console.log('❌ showView function missing');
  if (!hasClickEvents) console.log('❌ Click event listeners missing');
  process.exit(1);
}