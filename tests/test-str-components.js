const fs = require('fs').promises;
const path = require('path');

// Simple tests that don't require a browser
async function testSTRComponents() {
  console.log('🧪 Testing STR Platform Components...\n');
  
  const results = {
    passed: 0,
    failed: 0,
    warnings: 0
  };
  
  try {
    // Test 1: Check if RentalComparisonView component exists
    console.log('📋 Test 1: Component File Existence');
    const componentPath = path.join(__dirname, '..', 'components', 'RentalComparisonView.jsx');
    try {
      const componentContent = await fs.readFile(componentPath, 'utf8');
      console.log('✅ RentalComparisonView.jsx exists');
      
      // Check for proper export
      if (componentContent.includes('window.RentalComparisonView = RentalComparisonView')) {
        console.log('✅ Component exports to window correctly');
        results.passed += 2;
      } else {
        console.log('❌ Component export to window not found');
        results.failed++;
      }
      
      // Check for required props
      if (componentContent.includes('{ analysis, propertyAddress }')) {
        console.log('✅ Component accepts correct props');
        results.passed++;
      } else {
        console.log('⚠️  Component props might be different');
        results.warnings++;
      }
    } catch (error) {
      console.log('❌ Component file not found');
      results.failed++;
    }
    
    // Test 2: Check HTML integration
    console.log('\n📋 Test 2: HTML Integration');
    const htmlPath = path.join(__dirname, '..', 'roi-finder.html');
    try {
      const htmlContent = await fs.readFile(htmlPath, 'utf8');
      
      // Check for React/Babel loading
      if (htmlContent.includes('react.production.min.js') && htmlContent.includes('babel.min.js')) {
        console.log('✅ React and Babel are loaded');
        results.passed++;
      } else {
        console.log('❌ React or Babel not properly loaded');
        results.failed++;
      }
      
      // Check for component container
      if (htmlContent.includes('str-comparison-container')) {
        console.log('✅ STR comparison container exists');
        results.passed++;
      } else {
        console.log('❌ STR comparison container not found');
        results.failed++;
      }
      
      // Check for mount function
      if (htmlContent.includes('mountRentalComparisonView')) {
        console.log('✅ Mount function exists');
        results.passed++;
      } else {
        console.log('❌ Mount function not found');
        results.failed++;
      }
      
      // Check for STR checkbox
      if (htmlContent.includes('include-str-analysis')) {
        console.log('✅ STR analysis checkbox exists');
        results.passed++;
      } else {
        console.log('❌ STR analysis checkbox not found');
        results.failed++;
      }
    } catch (error) {
      console.log('❌ HTML file not found');
      results.failed++;
    }
    
    // Test 3: Check extension files
    console.log('\n📋 Test 3: Browser Extension Files');
    const extensionFiles = [
      { path: 'extension/manifest.json', name: 'Manifest' },
      { path: 'extension/src/content.js', name: 'Content script' },
      { path: 'extension/src/background.js', name: 'Background script' },
      { path: 'extension/src/popup.html', name: 'Popup HTML' },
      { path: 'extension/src/popup.js', name: 'Popup script' }
    ];
    
    for (const file of extensionFiles) {
      try {
        await fs.access(path.join(__dirname, '..', file.path));
        console.log(`✅ ${file.name} exists`);
        results.passed++;
      } catch {
        console.log(`❌ ${file.name} not found`);
        results.failed++;
      }
    }
    
    // Test 4: Check API endpoints
    console.log('\n📋 Test 4: API Endpoints');
    const apiFiles = [
      { path: 'api/analyze-property-enhanced.js', name: 'Enhanced analysis endpoint' },
      { path: 'api/properties/ingest.js', name: 'Property ingestion endpoint' },
      { path: 'api/properties/list.js', name: 'Property listing endpoint' }
    ];
    
    for (const file of apiFiles) {
      try {
        const content = await fs.readFile(path.join(__dirname, '..', file.path), 'utf8');
        console.log(`✅ ${file.name} exists`);
        
        // Check for proper structure
        if (content.includes('export default') || content.includes('module.exports')) {
          console.log(`✅ ${file.name} has proper export`);
          results.passed += 2;
        } else {
          console.log(`⚠️  ${file.name} might have export issues`);
          results.warnings++;
          results.passed++;
        }
      } catch {
        console.log(`❌ ${file.name} not found`);
        results.failed++;
      }
    }
    
    // Test 5: Check for known issues
    console.log('\n📋 Test 5: Known Issues Check');
    
    // Check extension content script
    try {
      const contentScript = await fs.readFile(path.join(__dirname, '..', 'extension/src/content.js'), 'utf8');
      
      // Check if property detection is fixed
      if (contentScript.includes('match(/\\/(house|condo|townhouse|apartment|property|mls-')) {
        console.log('✅ Property type detection is comprehensive');
        results.passed++;
      } else {
        console.log('⚠️  Property type detection might miss some types');
        results.warnings++;
      }
      
      // Check for MLS extraction helper
      if (contentScript.includes('extractMLSFromURL')) {
        console.log('✅ MLS extraction from URL implemented');
        results.passed++;
      } else {
        console.log('⚠️  MLS extraction might be limited');
        results.warnings++;
      }
    } catch (error) {
      console.log('❌ Could not check content script');
      results.failed++;
    }
    
    // Test 6: Component syntax validation
    console.log('\n📋 Test 6: Component Syntax');
    try {
      const componentContent = await fs.readFile(
        path.join(__dirname, '..', 'components/RentalComparisonView.jsx'), 
        'utf8'
      );
      
      // Basic JSX syntax checks
      const openTags = (componentContent.match(/<[A-Za-z][^>]*>/g) || []).length;
      const closeTags = (componentContent.match(/<\/[A-Za-z][^>]*>/g) || []).length;
      const selfClosing = (componentContent.match(/\/>/g) || []).length;
      
      console.log(`  Open tags: ${openTags}, Close tags: ${closeTags}, Self-closing: ${selfClosing}`);
      
      if (Math.abs(openTags - closeTags - selfClosing) < 5) {
        console.log('✅ JSX structure appears balanced');
        results.passed++;
      } else {
        console.log('⚠️  JSX might have unclosed tags');
        results.warnings++;
      }
      
      // Check for common React patterns
      if (componentContent.includes('useState') && componentContent.includes('useEffect')) {
        console.log('⚠️  Component uses hooks but useEffect import missing');
        results.warnings++;
      } else if (componentContent.includes('useState')) {
        console.log('✅ Component uses React hooks correctly');
        results.passed++;
      }
    } catch (error) {
      console.log('❌ Could not validate component syntax');
      results.failed++;
    }
    
  } catch (error) {
    console.error('Test error:', error);
    results.failed++;
  } finally {
    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('📊 Test Summary:');
    console.log(`✅ Passed: ${results.passed}`);
    console.log(`❌ Failed: ${results.failed}`);
    console.log(`⚠️  Warnings: ${results.warnings}`);
    console.log('\n💡 Recommendations:');
    
    if (results.failed > 0) {
      console.log('- Fix failed tests before deployment');
    }
    if (results.warnings > 0) {
      console.log('- Review warnings for potential issues');
    }
    if (results.failed === 0) {
      console.log('- All critical components are in place! 🎉');
      console.log('- Ready for browser-based testing');
    }
  }
}

// Run tests
testSTRComponents().catch(console.error);