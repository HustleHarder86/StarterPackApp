/**
 * Visual Regression Testing Configuration
 * Used for comparing UI against mockups and detecting visual changes
 */

const path = require('path');

module.exports = {
  // Directories
  baselineDir: path.join(__dirname, 'visual', 'baseline'),
  actualDir: path.join(__dirname, 'visual', 'actual'),
  diffDir: path.join(__dirname, 'visual', 'diff'),
  
  // Mockup references - map pages to their design mockups
  mockups: {
    'roi-finder': {
      path: '/mockups/hybrid-design-3-compact-modern.html',
      description: 'Primary ROI Finder page with Compact Modern design',
      criticalElements: [
        '.sidebar',
        '.form-container',
        '.btn-primary',
        '.sidebar-link.active'
      ]
    },
    'admin-dashboard': {
      path: '/mockups/admin-compact-modern.html',
      description: 'Admin dashboard with data visualization',
      criticalElements: [
        '.metric-card',
        '.chart-container',
        '.data-table'
      ]
    },
    'analysis-results': {
      path: '/mockups/analysis-results-compact-modern.html',
      description: 'Property analysis results page',
      criticalElements: [
        '.investment-score-card',
        '.financial-overview',
        '.market-comparison'
      ]
    }
  },
  
  // Viewport configurations for responsive testing
  viewports: [
    { 
      width: 1920, 
      height: 1080, 
      name: 'desktop-full-hd',
      deviceScaleFactor: 1
    },
    { 
      width: 1440, 
      height: 900, 
      name: 'desktop-laptop',
      deviceScaleFactor: 1
    },
    { 
      width: 1024, 
      height: 768, 
      name: 'tablet-landscape',
      deviceScaleFactor: 2
    },
    { 
      width: 768, 
      height: 1024, 
      name: 'tablet-portrait',
      deviceScaleFactor: 2
    },
    { 
      width: 375, 
      height: 667, 
      name: 'mobile-standard',
      deviceScaleFactor: 2
    },
    { 
      width: 414, 
      height: 896, 
      name: 'mobile-large',
      deviceScaleFactor: 3
    }
  ],
  
  // Browser configurations
  browsers: ['chromium', 'firefox', 'webkit'],
  
  // Screenshot options
  screenshot: {
    fullPage: true,
    animations: 'disabled',
    caret: 'hide',
    // Mask dynamic content that changes between runs
    mask: [
      '[data-testid="timestamp"]',
      '[data-testid="user-id"]',
      '.animate-progress',
      '.loading-spinner'
    ]
  },
  
  // Comparison options
  comparison: {
    // Threshold for pixel differences (0-1)
    threshold: 0.01, // 1% difference allowed
    
    // Include anti-aliasing in diff
    includeAA: false,
    
    // Ignore colors and compare only brightness
    ignoreColors: false,
    
    // Allow slight shift in element position
    allowShift: true,
    shiftThreshold: 5, // pixels
    
    // Specific thresholds per element
    elementThresholds: {
      '.sidebar': 0.001, // Stricter for sidebar
      '.btn-primary': 0.02, // More lenient for buttons
      'input': 0.05 // Most lenient for form inputs
    }
  },
  
  // Test scenarios
  scenarios: [
    {
      name: 'default-state',
      description: 'Page in default state without interactions',
      actions: []
    },
    {
      name: 'hover-states',
      description: 'Test hover effects on interactive elements',
      actions: [
        { type: 'hover', selector: '.sidebar-link' },
        { type: 'hover', selector: '.btn-primary' },
        { type: 'hover', selector: '.metric-card' }
      ]
    },
    {
      name: 'active-states',
      description: 'Test active/focused states',
      actions: [
        { type: 'click', selector: '.sidebar-link:nth-child(2)' },
        { type: 'focus', selector: '.input-field' }
      ]
    },
    {
      name: 'filled-form',
      description: 'Form with sample data',
      actions: [
        { type: 'fill', selector: '#property-address', value: '123 Test St' },
        { type: 'fill', selector: '[name="price"]', value: '850000' },
        { type: 'select', selector: '[name="propertyType"]', value: 'Condo' }
      ]
    },
    {
      name: 'mobile-menu-open',
      description: 'Mobile menu in open state',
      viewport: 'mobile-standard',
      actions: [
        { type: 'click', selector: '.mobile-menu-toggle' }
      ]
    }
  ],
  
  // Pages to test
  pages: [
    {
      name: 'roi-finder',
      url: '/roi-finder.html',
      waitFor: '.form-container',
      scenarios: ['default-state', 'hover-states', 'filled-form', 'mobile-menu-open']
    },
    {
      name: 'login-state',
      url: '/roi-finder.html',
      waitFor: '#login-section',
      scenarios: ['default-state', 'active-states']
    },
    {
      name: 'analysis-results',
      url: '/roi-finder.html?mock=results',
      waitFor: '#analysis-results',
      scenarios: ['default-state', 'hover-states']
    }
  ],
  
  // Reporting options
  reporting: {
    // Generate HTML report
    html: true,
    htmlPath: path.join(__dirname, 'visual', 'report.html'),
    
    // Generate JSON report for CI
    json: true,
    jsonPath: path.join(__dirname, 'visual', 'report.json'),
    
    // Console output
    verbose: true,
    
    // Fail on any difference
    failOnDiff: true,
    
    // Update baseline on pass
    updateBaseline: process.env.UPDATE_BASELINE === 'true'
  },
  
  // CI/CD specific settings
  ci: {
    // Retry failed comparisons
    retries: 2,
    
    // Wait between retries
    retryDelay: 1000,
    
    // Generate artifacts
    artifacts: true,
    artifactsPath: path.join(__dirname, 'visual', 'artifacts'),
    
    // Upload to cloud storage (configure separately)
    uploadResults: process.env.CI === 'true'
  }
};

// Helper function to get config for specific page
module.exports.getPageConfig = function(pageName) {
  const page = module.exports.pages.find(p => p.name === pageName);
  const mockup = module.exports.mockups[pageName];
  
  return {
    ...page,
    mockup,
    viewports: module.exports.viewports,
    screenshot: module.exports.screenshot,
    comparison: module.exports.comparison
  };
};

// Helper function to get scenario actions
module.exports.getScenarioActions = function(scenarioName) {
  const scenario = module.exports.scenarios.find(s => s.name === scenarioName);
  return scenario ? scenario.actions : [];
};