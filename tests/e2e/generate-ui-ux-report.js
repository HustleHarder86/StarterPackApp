const fs = require('fs').promises;
const path = require('path');

async function generateUIUXReport() {
  // Find the latest test results
  const screenshotDir = path.join(__dirname, 'screenshots', 'comprehensive-ui-ux');
  const dates = await fs.readdir(screenshotDir);
  const latestDate = dates.sort().pop();
  const testDir = path.join(screenshotDir, latestDate);
  
  // Read test report if exists
  let testResults = {};
  try {
    const reportPath = path.join(testDir, 'test-report.json');
    const reportContent = await fs.readFile(reportPath, 'utf8');
    testResults = JSON.parse(reportContent);
  } catch (error) {
    console.log('No test report found, analyzing screenshots only...');
  }
  
  // Get all screenshots
  const files = await fs.readdir(testDir);
  const screenshots = files.filter(f => f.endsWith('.png')).sort();
  
  // Generate markdown report
  let report = `# UI/UX Test Report - ${latestDate}\n\n`;
  report += `## Test Summary\n\n`;
  
  if (testResults.summary) {
    report += `- **Total Tests**: ${testResults.summary.total}\n`;
    report += `- **Passed**: ${testResults.summary.passed} ✅\n`;
    report += `- **Failed**: ${testResults.summary.failed} ❌\n\n`;
    
    report += `### Issue Summary\n`;
    report += `- **Critical Issues**: ${testResults.summary.criticalIssues} 🚨\n`;
    report += `- **High Priority**: ${testResults.summary.highIssues} ⚠️\n`;
    report += `- **Medium Priority**: ${testResults.summary.mediumIssues} 📌\n`;
    report += `- **Low Priority**: ${testResults.summary.lowIssues} 💡\n\n`;
  }
  
  // List screenshots with descriptions
  report += `## Visual Evidence\n\n`;
  report += `Screenshots captured during testing:\n\n`;
  
  const screenshotDescriptions = {
    '01-initial-page-load': 'Initial page load showing login screen',
    '01-login-screen': 'Login screen with authentication forms',
    '02-login-filled': 'Login form filled with credentials',
    '03-logged-in': 'Dashboard after successful login',
    '04-form-filled': 'Property analysis form with all fields completed',
    '05-form-ready-to-submit': 'Form ready for submission after validation',
    '06-results-loaded': 'Analysis results page loaded',
    '07-ltr-tab': 'Long Term Rental analysis tab',
    '08-str-tab': 'Short Term Rental analysis tab',
    '09-investment-tab': 'Investment Analysis tab',
    '10-mobile-view': 'Mobile responsive view',
    '11-error-handling': 'Error handling demonstration'
  };
  
  for (const screenshot of screenshots) {
    const name = screenshot.replace('.png', '');
    const description = screenshotDescriptions[name] || 'Screenshot';
    report += `- **${screenshot}**: ${description}\n`;
  }
  
  // Detailed findings
  if (testResults.issues) {
    report += `\n## Detailed Findings\n\n`;
    
    if (testResults.issues.critical && testResults.issues.critical.length > 0) {
      report += `### 🚨 Critical Issues\n\n`;
      testResults.issues.critical.forEach(issue => {
        report += `- ${issue}\n`;
      });
      report += '\n';
    }
    
    if (testResults.issues.high && testResults.issues.high.length > 0) {
      report += `### ⚠️ High Priority Issues\n\n`;
      testResults.issues.high.forEach(issue => {
        report += `- ${issue}\n`;
      });
      report += '\n';
    }
    
    if (testResults.issues.medium && testResults.issues.medium.length > 0) {
      report += `### 📌 Medium Priority Issues\n\n`;
      testResults.issues.medium.forEach(issue => {
        report += `- ${issue}\n`;
      });
      report += '\n';
    }
    
    if (testResults.issues.low && testResults.issues.low.length > 0) {
      report += `### 💡 Low Priority Issues\n\n`;
      testResults.issues.low.forEach(issue => {
        report += `- ${issue}\n`;
      });
      report += '\n';
    }
  }
  
  // Recommendations
  report += `## Recommendations\n\n`;
  report += `Based on the UI/UX testing, here are key recommendations:\n\n`;
  
  const recommendations = [
    {
      category: 'Navigation',
      items: [
        'Ensure all tabs are clearly labeled and accessible',
        'Add breadcrumb navigation for better user orientation',
        'Implement keyboard navigation support'
      ]
    },
    {
      category: 'Forms',
      items: [
        'Add clear validation messages for all required fields',
        'Implement real-time validation feedback',
        'Consider auto-save functionality for form data'
      ]
    },
    {
      category: 'Mobile Experience',
      items: [
        'Optimize touch targets for mobile devices',
        'Ensure all features are accessible on mobile',
        'Test landscape orientation support'
      ]
    },
    {
      category: 'Performance',
      items: [
        'Add loading indicators for all async operations',
        'Implement progressive enhancement for slow connections',
        'Cache analysis results for faster access'
      ]
    }
  ];
  
  recommendations.forEach(rec => {
    report += `### ${rec.category}\n\n`;
    rec.items.forEach(item => {
      report += `- ${item}\n`;
    });
    report += '\n';
  });
  
  // Test execution details
  report += `## Test Execution Details\n\n`;
  report += `- **Test Date**: ${latestDate}\n`;
  report += `- **Screenshot Directory**: ${testDir}\n`;
  report += `- **Total Screenshots**: ${screenshots.length}\n`;
  
  if (testResults.timestamp) {
    report += `- **Execution Time**: ${testResults.timestamp}\n`;
  }
  
  // Save report
  const reportPath = path.join(testDir, 'UI-UX-Test-Report.md');
  await fs.writeFile(reportPath, report);
  
  console.log(`\n✅ UI/UX Test Report generated: ${reportPath}\n`);
  console.log(report);
}

// Run report generation
generateUIUXReport().catch(console.error);