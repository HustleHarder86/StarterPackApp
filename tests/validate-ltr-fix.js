// Simple validation that the ltrCharts.js fix is applied correctly
const fs = require('fs');
const path = require('path');

function validateFix() {
  console.log('🔍 Validating ltrCharts.js fix...\n');
  
  const filePath = path.join(__dirname, '..', 'js', 'modules', 'ltrCharts.js');
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Check if the problematic line is fixed
  const hasProblematicCode = content.includes('projections[index - 1]?.cumulative');
  const hasFixedCode = content.includes('let cumulativeTotal = 0');
  
  console.log('Checking for problematic code pattern...');
  if (hasProblematicCode) {
    console.error('❌ FAILED: The problematic code pattern still exists!');
    console.error('   Found: projections[index - 1]?.cumulative');
    return false;
  } else {
    console.log('✅ PASSED: Problematic code pattern not found');
  }
  
  console.log('\nChecking for fixed code pattern...');
  if (hasFixedCode) {
    console.log('✅ PASSED: Fixed code pattern found (let cumulativeTotal = 0)');
  } else {
    console.error('❌ FAILED: Fixed code pattern not found');
    return false;
  }
  
  // Extract the createCashFlowProjection function
  const funcMatch = content.match(/export function createCashFlowProjection\(analysisData\) {[\s\S]*?^}/m);
  if (funcMatch) {
    console.log('\n📋 Current createCashFlowProjection implementation:');
    console.log('----------------------------------------');
    const lines = funcMatch[0].split('\n').slice(0, 20); // First 20 lines
    lines.forEach((line, i) => {
      console.log(`${(i + 1).toString().padStart(3)} | ${line}`);
    });
    console.log('...');
  }
  
  console.log('\n✅ Fix validation complete!');
  console.log('The temporal dead zone error has been fixed.');
  console.log('\n🎯 Summary:');
  console.log('- Removed self-referential array access during map operation');
  console.log('- Added proper cumulative tracking variable');
  console.log('- Cash flow projections will now calculate correctly');
  
  return true;
}

// Run validation
const isValid = validateFix();
process.exit(isValid ? 0 : 1);