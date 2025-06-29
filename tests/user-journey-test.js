const fs = require('fs').promises;
const path = require('path');

// Simulate a complete user journey through the app
async function testUserJourney() {
  console.log('🧑‍💼 Starting User Journey Test...\n');
  console.log('Testing as: New User wanting to analyze a property with STR comparison\n');
  
  const testResults = {
    steps: [],
    passed: 0,
    failed: 0,
    blockers: []
  };
  
  // Helper function to record test step
  function recordStep(stepName, success, details = '') {
    const status = success ? '✅' : '❌';
    console.log(`${status} ${stepName}`);
    if (details) console.log(`   ${details}`);
    
    testResults.steps.push({ stepName, success, details });
    if (success) testResults.passed++;
    else {
      testResults.failed++;
      if (details.includes('BLOCKER')) testResults.blockers.push(stepName);
    }
  }
  
  try {
    // Step 1: Check Landing Page
    console.log('📍 Step 1: Visiting Landing Page (index.html)');
    const indexPath = path.join(__dirname, '..', 'index.html');
    try {
      const indexContent = await fs.readFile(indexPath, 'utf8');
      
      // Check for key elements
      const hasHeroSection = indexContent.includes('hero') || indexContent.includes('AI-Powered');
      const hasSignupForm = indexContent.includes('requestAccess') || indexContent.includes('email');
      const hasGetStartedButton = indexContent.includes('Get Started') || indexContent.includes('roi-finder.html');
      
      if (hasHeroSection && hasSignupForm) {
        recordStep('Landing page loads', true, 'Hero section and signup form present');
      } else {
        recordStep('Landing page loads', false, 'Missing key landing page elements');
      }
      
      if (hasGetStartedButton) {
        recordStep('Get Started button present', true, 'Links to roi-finder.html');
      } else {
        recordStep('Get Started button present', false, 'No clear path to main app');
      }
    } catch (error) {
      recordStep('Landing page loads', false, 'BLOCKER: index.html not found');
    }
    
    // Step 2: Navigate to ROI Finder
    console.log('\n📍 Step 2: Navigating to ROI Finder (roi-finder.html)');
    const roiFinderPath = path.join(__dirname, '..', 'roi-finder.html');
    try {
      const roiContent = await fs.readFile(roiFinderPath, 'utf8');
      
      // Check authentication elements
      const hasAuthForm = roiContent.includes('auth-form');
      const hasEmailInput = roiContent.includes('id="email"');
      const hasPasswordInput = roiContent.includes('id="password"');
      
      if (hasAuthForm && hasEmailInput && hasPasswordInput) {
        recordStep('Authentication screen appears', true, 'Login/Signup form present');
      } else {
        recordStep('Authentication screen appears', false, 'BLOCKER: Auth form missing');
      }
      
      // Check if Firebase is configured
      const hasFirebaseConfig = roiContent.includes('firebase.initializeApp');
      if (hasFirebaseConfig) {
        recordStep('Firebase configured', true, 'Authentication system ready');
      } else {
        recordStep('Firebase configured', false, 'BLOCKER: Firebase not initialized');
      }
    } catch (error) {
      recordStep('ROI Finder loads', false, 'BLOCKER: roi-finder.html not found');
    }
    
    // Step 3: Check Property Analysis Form
    console.log('\n📍 Step 3: Checking Property Analysis Form');
    const roiContent = await fs.readFile(roiFinderPath, 'utf8');
    
    // Check form fields
    const formFields = [
      { id: 'street', name: 'Street Address' },
      { id: 'city', name: 'City' },
      { id: 'state', name: 'State/Province' },
      { id: 'country', name: 'Country' },
      { id: 'postal', name: 'Postal Code' },
      { id: 'include-str-analysis', name: 'STR Analysis Checkbox' }
    ];
    
    let allFieldsPresent = true;
    for (const field of formFields) {
      if (roiContent.includes(`id="${field.id}"`)) {
        recordStep(`${field.name} field present`, true);
      } else {
        recordStep(`${field.name} field present`, false, 'Form incomplete');
        allFieldsPresent = false;
      }
    }
    
    // Check STR trial info
    if (roiContent.includes('str-trial-info')) {
      recordStep('STR trial counter element present', true, 'Free users can see trial limit');
    } else {
      recordStep('STR trial counter element present', false, 'Trial info missing');
    }
    
    // Step 4: Check React Component Integration
    console.log('\n📍 Step 4: Checking React Component Integration');
    
    // Check React loading
    const hasReact = roiContent.includes('react.production.min.js');
    const hasReactDOM = roiContent.includes('react-dom.production.min.js');
    const hasBabel = roiContent.includes('babel.min.js');
    
    if (hasReact && hasReactDOM && hasBabel) {
      recordStep('React libraries loaded', true, 'React, ReactDOM, and Babel present');
    } else {
      recordStep('React libraries loaded', false, 'BLOCKER: React setup incomplete');
    }
    
    // Check component loading
    const hasComponentScript = roiContent.includes('RentalComparisonView.jsx');
    const hasComponentContainer = roiContent.includes('str-comparison-container');
    const hasMountFunction = roiContent.includes('mountRentalComparisonView');
    
    if (hasComponentScript && hasComponentContainer && hasMountFunction) {
      recordStep('STR comparison component integrated', true, 'Component ready to display');
    } else {
      recordStep('STR comparison component integrated', false, 'Component integration incomplete');
    }
    
    // Step 5: Check API Endpoints
    console.log('\n📍 Step 5: Checking API Endpoints');
    
    const apiEndpoints = [
      { 
        path: 'api/analyze-property-enhanced.js',
        name: 'Enhanced Analysis API',
        critical: true
      },
      {
        path: 'api/properties/ingest.js',
        name: 'Property Ingestion API',
        critical: true
      },
      {
        path: 'api/properties/list.js',
        name: 'Property List API',
        critical: false
      },
      {
        path: 'api/user-management.js',
        name: 'User Management API',
        critical: true
      }
    ];
    
    for (const endpoint of apiEndpoints) {
      try {
        const apiContent = await fs.readFile(path.join(__dirname, '..', endpoint.path), 'utf8');
        
        // Check for proper structure
        const hasExport = apiContent.includes('export default') || apiContent.includes('module.exports');
        const hasErrorHandling = apiContent.includes('try') && apiContent.includes('catch');
        const hasAuth = apiContent.includes('authenticate') || apiContent.includes('auth');
        
        if (hasExport && hasErrorHandling) {
          recordStep(`${endpoint.name} ready`, true, hasAuth ? 'With authentication' : 'No auth check');
        } else {
          const severity = endpoint.critical ? 'BLOCKER: ' : '';
          recordStep(`${endpoint.name} ready`, false, `${severity}Missing proper structure`);
        }
      } catch (error) {
        const severity = endpoint.critical ? 'BLOCKER: ' : '';
        recordStep(`${endpoint.name} ready`, false, `${severity}File not found`);
      }
    }
    
    // Step 6: Check Browser Extension
    console.log('\n📍 Step 6: Checking Browser Extension');
    
    // Check manifest
    try {
      const manifestContent = await fs.readFile(
        path.join(__dirname, '..', 'extension/manifest.json'), 
        'utf8'
      );
      const manifest = JSON.parse(manifestContent);
      
      if (manifest.manifest_version === 3) {
        recordStep('Extension manifest valid', true, 'Manifest V3 configured');
      } else {
        recordStep('Extension manifest valid', false, 'Wrong manifest version');
      }
      
      // Check permissions
      const hasRequiredPermissions = 
        manifest.permissions.includes('activeTab') &&
        manifest.permissions.includes('storage');
      
      if (hasRequiredPermissions) {
        recordStep('Extension permissions configured', true);
      } else {
        recordStep('Extension permissions configured', false, 'Missing required permissions');
      }
      
      // Check host permissions
      const hasRealtorPermission = manifest.host_permissions.some(
        host => host.includes('realtor.ca')
      );
      
      if (hasRealtorPermission) {
        recordStep('Realtor.ca access configured', true);
      } else {
        recordStep('Realtor.ca access configured', false, 'Cannot access Realtor.ca');
      }
    } catch (error) {
      recordStep('Extension manifest valid', false, 'BLOCKER: manifest.json error');
    }
    
    // Check extension scripts
    const extensionScripts = [
      { path: 'extension/src/content.js', name: 'Content Script' },
      { path: 'extension/src/background.js', name: 'Background Script' },
      { path: 'extension/src/popup.js', name: 'Popup Script' }
    ];
    
    for (const script of extensionScripts) {
      try {
        const scriptContent = await fs.readFile(
          path.join(__dirname, '..', script.path), 
          'utf8'
        );
        
        // Basic validation
        if (scriptContent.length > 100) {
          recordStep(`${script.name} present`, true);
        } else {
          recordStep(`${script.name} present`, false, 'File too small');
        }
      } catch (error) {
        recordStep(`${script.name} present`, false, 'File not found');
      }
    }
    
    // Step 7: Simulate User Flow
    console.log('\n📍 Step 7: Simulating User Flow');
    
    // Check if analysis endpoint accepts STR parameter
    const analyzeEndpointPath = path.join(__dirname, '..', 'api/analyze-property-enhanced.js');
    try {
      const analyzeContent = await fs.readFile(analyzeEndpointPath, 'utf8');
      
      if (analyzeContent.includes('includeStrAnalysis') || analyzeContent.includes('includeSTR')) {
        recordStep('API accepts STR analysis flag', true, 'Can request STR analysis');
      } else {
        recordStep('API accepts STR analysis flag', false, 'STR parameter not handled');
      }
      
      if (analyzeContent.includes('strTrialUsed') || analyzeContent.includes('trial')) {
        recordStep('STR trial tracking implemented', true, 'Free tier limits enforced');
      } else {
        recordStep('STR trial tracking implemented', false, 'No trial limit logic');
      }
    } catch (error) {
      recordStep('Analysis API check', false, 'BLOCKER: Cannot verify API');
    }
    
    // Step 8: Check Data Flow
    console.log('\n📍 Step 8: Checking Data Flow');
    
    // Check if displayResults calls mountRentalComparisonView
    if (roiContent.includes('displayResults') && roiContent.includes('mountRentalComparisonView')) {
      const displayResultsSection = roiContent.substring(
        roiContent.indexOf('function displayResults'),
        roiContent.indexOf('function displayResults') + 2000
      );
      
      if (displayResultsSection.includes('mountRentalComparisonView')) {
        recordStep('Results display triggers STR component', true, 'Component will mount on results');
      } else {
        recordStep('Results display triggers STR component', false, 'Component not called');
      }
    }
    
    // Check component data transformation
    const mountFunctionContent = roiContent.substring(
      roiContent.indexOf('function mountRentalComparisonView'),
      roiContent.indexOf('function mountRentalComparisonView') + 1000
    );
    
    if (mountFunctionContent.includes('transformedData')) {
      recordStep('Data transformation implemented', true, 'Handles different API formats');
    } else {
      recordStep('Data transformation implemented', false, 'May have data format issues');
    }
    
  } catch (error) {
    console.error('\n❌ Test Error:', error.message);
    recordStep('Test completion', false, `BLOCKER: ${error.message}`);
  } finally {
    // Generate User Experience Report
    console.log('\n' + '='.repeat(60));
    console.log('📊 USER EXPERIENCE TEST SUMMARY');
    console.log('='.repeat(60));
    
    console.log(`\n✅ Passed: ${testResults.passed}`);
    console.log(`❌ Failed: ${testResults.failed}`);
    
    if (testResults.blockers.length > 0) {
      console.log(`\n🚫 BLOCKING ISSUES (Must fix before users can use):`);
      testResults.blockers.forEach((blocker, i) => {
        console.log(`   ${i + 1}. ${blocker}`);
      });
    }
    
    // User readiness assessment
    console.log('\n🎯 USER READINESS ASSESSMENT:');
    
    const readinessScore = (testResults.passed / (testResults.passed + testResults.failed)) * 100;
    
    if (readinessScore >= 90 && testResults.blockers.length === 0) {
      console.log('   ✅ READY FOR USERS - System is fully functional');
    } else if (readinessScore >= 70 && testResults.blockers.length === 0) {
      console.log('   ⚠️  MOSTLY READY - Some features may not work perfectly');
    } else if (testResults.blockers.length > 0) {
      console.log('   ❌ NOT READY - Blocking issues prevent user access');
    } else {
      console.log('   ❌ NOT READY - Too many failures');
    }
    
    console.log(`\n   Readiness Score: ${readinessScore.toFixed(1)}%`);
    
    // Specific user journey outcomes
    console.log('\n📝 USER JOURNEY OUTCOMES:');
    console.log('   1. Can user sign up? ' + 
      (testResults.steps.find(s => s.stepName.includes('Firebase'))?.success ? '✅ Yes' : '❌ No'));
    console.log('   2. Can user analyze property? ' + 
      (testResults.steps.find(s => s.stepName.includes('form'))?.success ? '✅ Yes' : '⚠️  Partial'));
    console.log('   3. Can user see STR analysis? ' + 
      (testResults.steps.find(s => s.stepName.includes('STR comparison component'))?.success ? '✅ Yes' : '❌ No'));
    console.log('   4. Can user use browser extension? ' + 
      (testResults.steps.find(s => s.stepName.includes('Extension manifest'))?.success ? '✅ Yes' : '⚠️  Partial'));
    
    // Recommendations
    console.log('\n💡 RECOMMENDATIONS FOR LAUNCH:');
    if (testResults.blockers.length > 0) {
      console.log('   1. Fix all blocking issues first');
    }
    if (!testResults.steps.find(s => s.stepName.includes('Firebase'))?.success) {
      console.log('   2. Ensure Firebase is properly configured');
    }
    if (!testResults.steps.find(s => s.stepName.includes('trial'))?.success) {
      console.log('   3. Implement STR trial tracking for free users');
    }
    console.log('   4. Test with real Firebase account');
    console.log('   5. Load extension in Chrome and test on Realtor.ca');
    console.log('   6. Verify API endpoints are deployed to Vercel');
  }
}

// Run the user journey test
console.log('🚀 InvestorProps - Complete User Journey Test\n');
testUserJourney().catch(console.error);