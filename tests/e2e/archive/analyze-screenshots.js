#!/usr/bin/env node

// Script to analyze screenshots and provide UX/UI improvement suggestions
const fs = require('fs');
const path = require('path');

const SCREENSHOTS_DIR = path.join(__dirname, 'screenshots');

// Analysis categories
const analysisCategories = {
  layout: 'Layout and Structure',
  typography: 'Typography and Readability',
  colors: 'Color Scheme and Contrast',
  mobile: 'Mobile Responsiveness',
  dataViz: 'Data Visualization',
  userFlow: 'User Flow and Navigation',
  accessibility: 'Accessibility',
  performance: 'Visual Performance'
};

// Screenshot analysis metadata
const screenshotAnalysis = {
  '01-initial-page.png': {
    description: 'Initial page load state',
    checkFor: ['Clear call-to-action', 'Input field visibility', 'Branding consistency']
  },
  '02-analysis-modes.png': {
    description: 'Analysis mode selection',
    checkFor: ['Clear mode differentiation', 'Selected state visibility', 'Mode descriptions']
  },
  '03-ltr-mode-selected.png': {
    description: 'LTR mode selected state',
    checkFor: ['Visual feedback for selection', 'Button state changes']
  },
  '04-loading-state.png': {
    description: 'Loading/progress indicator',
    checkFor: ['Loading animation quality', 'Progress messaging', 'User expectations']
  },
  '05-full-results.png': {
    description: 'Complete analysis results',
    checkFor: ['Information hierarchy', 'Scannability', 'Key metrics prominence']
  },
  '06-property-details.png': {
    description: 'Property details section',
    checkFor: ['Data organization', 'Label clarity', 'Value formatting']
  },
  '07-financial-metrics.png': {
    description: 'Financial calculations display',
    checkFor: ['Number formatting', 'Metric explanations', 'Positive/negative indicators']
  },
  '08-charts.png': {
    description: 'Data visualizations',
    checkFor: ['Chart readability', 'Legend clarity', 'Color usage', 'Mobile scaling']
  },
  '09-recommendations.png': {
    description: 'AI-generated recommendations',
    checkFor: ['Readability', 'Actionability', 'Priority indication']
  },
  '10-str-mode-selected.png': {
    description: 'STR mode selection',
    checkFor: ['Mode distinction from LTR', 'Feature highlighting']
  },
  '11-str-results.png': {
    description: 'STR analysis results',
    checkFor: ['STR-specific metrics', 'Comparison clarity', 'Revenue projections']
  },
  '12-str-comparison.png': {
    description: 'STR vs LTR comparison',
    checkFor: ['Side-by-side clarity', 'Winner indication', 'Key differences']
  },
  '13-airbnb-comparables.png': {
    description: 'Airbnb comparable properties',
    checkFor: ['Property cards layout', 'Key info visibility', 'Source attribution']
  },
  '14-mobile-results.png': {
    description: 'Mobile responsive view',
    checkFor: ['Touch target sizes', 'Scroll behavior', 'Information density']
  },
  '15-tablet-results.png': {
    description: 'Tablet responsive view',
    checkFor: ['Layout adaptation', 'Multi-column usage', 'Touch interactions']
  },
  '16-empty-form-error.png': {
    description: 'Error state for empty form',
    checkFor: ['Error message clarity', 'Visual prominence', 'Recovery guidance']
  },
  '17-minimal-data-loading.png': {
    description: 'Loading with minimal data',
    checkFor: ['Expectation setting', 'Fallback messaging']
  }
};

// Generate analysis report
function generateAnalysisReport() {
  console.log('🔍 StarterPack Visual Analysis Report');
  console.log('=' .repeat(50));
  console.log(`Generated: ${new Date().toISOString()}\n`);

  // Check which screenshots exist
  const existingScreenshots = [];
  
  Object.keys(screenshotAnalysis).forEach(filename => {
    const filepath = path.join(SCREENSHOTS_DIR, filename);
    if (fs.existsSync(filepath)) {
      existingScreenshots.push(filename);
      const stats = fs.statSync(filepath);
      console.log(`✅ Found: ${filename} (${(stats.size / 1024).toFixed(1)}KB)`);
    } else {
      console.log(`❌ Missing: ${filename}`);
    }
  });

  console.log(`\n📊 Found ${existingScreenshots.length} of ${Object.keys(screenshotAnalysis).length} screenshots\n`);

  // Provide analysis instructions
  console.log('📋 ANALYSIS CHECKLIST\n');
  
  existingScreenshots.forEach(filename => {
    const analysis = screenshotAnalysis[filename];
    console.log(`\n📸 ${filename}`);
    console.log(`   ${analysis.description}`);
    console.log('   Check for:');
    analysis.checkFor.forEach(item => {
      console.log(`   - ${item}`);
    });
  });

  // General improvement areas to consider
  console.log('\n\n🎯 GENERAL IMPROVEMENT AREAS TO EVALUATE:\n');

  console.log('1. Visual Hierarchy');
  console.log('   - Is the most important information immediately visible?');
  console.log('   - Are CTAs prominent and accessible?');
  console.log('   - Is there proper spacing between sections?');

  console.log('\n2. Data Presentation');
  console.log('   - Are financial numbers formatted consistently?');
  console.log('   - Do charts add value or create confusion?');
  console.log('   - Are positive/negative values clearly distinguished?');

  console.log('\n3. User Experience');
  console.log('   - Is the loading state informative?');
  console.log('   - Are error messages helpful?');
  console.log('   - Can users easily understand the analysis?');

  console.log('\n4. Mobile Optimization');
  console.log('   - Are all elements accessible on small screens?');
  console.log('   - Do charts scale appropriately?');
  console.log('   - Are touch targets large enough (44x44px)?');

  console.log('\n5. Professional Appeal');
  console.log('   - Does it look trustworthy for financial decisions?');
  console.log('   - Is the design consistent throughout?');
  console.log('   - Are there any amateur-looking elements?');

  console.log('\n6. Accessibility');
  console.log('   - Is text contrast sufficient (WCAG AA)?');
  console.log('   - Are interactive elements clearly indicated?');
  console.log('   - Is the tab order logical?');

  // Specific things to look for
  console.log('\n\n🔎 SPECIFIC ITEMS TO CHECK:\n');
  
  const specificChecks = [
    'Property tax display: Is $5,490 clearly shown as annual?',
    'Bedroom/bathroom display: Is "4 + 2 = 6 bedrooms" clear?',
    'Loading messages: Do they indicate what\'s happening?',
    'STR vs LTR: Is the comparison easy to understand?',
    'Charts: Do they work on mobile or get cut off?',
    'Error states: Are they prominent but not alarming?',
    'Canadian formatting: Currency in CAD, postal codes correct?',
    'API attribution: Is Perplexity AI mentioned appropriately?',
    'Subscription prompts: Are Pro features clearly marked?',
    'Print styling: Would the results print well?'
  ];

  specificChecks.forEach((check, i) => {
    console.log(`${i + 1}. ${check}`);
  });

  // Output location reminder
  console.log('\n\n📁 NEXT STEPS:\n');
  console.log('1. Review each screenshot in: ' + SCREENSHOTS_DIR);
  console.log('2. Note specific improvements for each screen');
  console.log('3. Prioritize by impact (High/Medium/Low)');
  console.log('4. Consider A/B testing major changes');
  console.log('5. Ensure changes work across all viewports\n');
}

// Run analysis
generateAnalysisReport();

// Create a markdown template for findings
const findingsTemplate = `# Visual Analysis Findings - ${new Date().toISOString().split('T')[0]}

## Summary
_Brief overview of overall visual quality and user experience_

## High Priority Improvements

### 1. [Issue Name]
- **Screenshot**: [filename]
- **Current**: [description]
- **Suggested**: [improvement]
- **Impact**: High/Medium/Low

## Medium Priority Improvements

### 1. [Issue Name]
- **Screenshot**: [filename]
- **Current**: [description]
- **Suggested**: [improvement]
- **Impact**: High/Medium/Low

## Low Priority / Nice-to-Have

### 1. [Issue Name]
- **Screenshot**: [filename]
- **Current**: [description]
- **Suggested**: [improvement]
- **Impact**: High/Medium/Low

## Positive Observations
_Things that are working well_

## Implementation Notes
_Technical considerations for suggested changes_
`;

// Save template
fs.writeFileSync(
  path.join(SCREENSHOTS_DIR, 'analysis-template.md'),
  findingsTemplate
);

console.log('📝 Analysis template saved to: screenshots/analysis-template.md');