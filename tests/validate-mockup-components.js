const fs = require('fs');
const path = require('path');

console.log('Validating Mockup Components...\n');

// Check if files exist and have content
const components = [
    'components/analysis/InvestmentVerdictMockup.js',
    'components/analysis/AirbnbListingsMockup.js'
];

let allValid = true;

components.forEach(componentPath => {
    const fullPath = path.join(__dirname, '..', componentPath);
    console.log(`Checking ${componentPath}...`);
    
    if (fs.existsSync(fullPath)) {
        const content = fs.readFileSync(fullPath, 'utf8');
        const fileSize = content.length;
        
        // Check for key exports
        const hasExports = content.includes('export const');
        const hasTemplate = content.includes('return `');
        const hasClasses = content.includes('class=');
        
        console.log(`  ✅ File exists (${fileSize} bytes)`);
        console.log(`  ${hasExports ? '✅' : '❌'} Has exports`);
        console.log(`  ${hasTemplate ? '✅' : '❌'} Has template literals`);
        console.log(`  ${hasClasses ? '✅' : '❌'} Has CSS classes`);
        
        // Check for specific content
        if (componentPath.includes('InvestmentVerdictMockup')) {
            const hasHeader = content.includes('Purple gradient header');
            const hasRecommended = content.includes('RECOMMENDED STRATEGY');
            console.log(`  ${hasHeader ? '✅' : '❌'} Has purple gradient header`);
            console.log(`  ${hasRecommended ? '✅' : '❌'} Has RECOMMENDED STRATEGY badge`);
            if (!hasHeader || !hasRecommended) allValid = false;
        }
        
        if (componentPath.includes('AirbnbListingsMockup')) {
            const hasListings = content.includes('Live Airbnb Market Data');
            const hasCards = content.includes('TOP PERFORMER');
            console.log(`  ${hasListings ? '✅' : '❌'} Has Live Airbnb Market Data`);
            console.log(`  ${hasCards ? '✅' : '❌'} Has listing cards`);
            if (!hasListings || !hasCards) allValid = false;
        }
        
        if (!hasExports || !hasTemplate || !hasClasses) {
            allValid = false;
        }
    } else {
        console.log(`  ❌ File does not exist!`);
        allValid = false;
    }
    console.log('');
});

// Check componentLoader.js uses the new components
console.log('Checking componentLoader.js integration...');
const loaderPath = path.join(__dirname, '..', 'js/modules/componentLoader.js');
if (fs.existsSync(loaderPath)) {
    const loaderContent = fs.readFileSync(loaderPath, 'utf8');
    const usesMockup = loaderContent.includes('InvestmentVerdictMockup.js') && 
                       loaderContent.includes('AirbnbListingsMockup.js');
    console.log(`  ${usesMockup ? '✅' : '❌'} ComponentLoader uses mockup components`);
    if (!usesMockup) allValid = false;
} else {
    console.log('  ❌ componentLoader.js not found!');
    allValid = false;
}

console.log('\n' + '='.repeat(50));
if (allValid) {
    console.log('✅ All validations passed! Components are properly implemented.');
} else {
    console.log('❌ Some validations failed. Please check the issues above.');
    process.exit(1);
}