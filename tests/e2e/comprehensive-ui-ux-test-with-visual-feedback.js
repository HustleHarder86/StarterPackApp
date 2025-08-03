const { chromium } = require('playwright');
const fs = require('fs').promises;
const path = require('path');

class ComprehensiveUIUXTester {
  constructor() {
    this.browser = null;
    this.context = null;
    this.page = null;
    this.screenshotDir = path.join(__dirname, 'debug-screenshots', `ui-ux-test-${new Date().toISOString().replace(/[:.]/g, '-')}`);
    this.testResults = [];
    this.reportPath = path.join(this.screenshotDir, 'comprehensive-ui-ux-report.md');
  }

  async setup() {
    // Create screenshot directory
    await fs.mkdir(this.screenshotDir, { recursive: true });
    
    // Launch browser
    this.browser = await chromium.launch({ 
      headless: false, 
      slowMo: 500,
      args: ['--no-sandbox', '--disable-setuid-sandbox'] 
    });
    
    this.context = await this.browser.newContext({
      viewport: { width: 1280, height: 720 },
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    });
    
    this.page = await this.context.newPage();
    
    // Enable console logging
    this.page.on('console', msg => console.log(`PAGE LOG: ${msg.text()}`));
    this.page.on('pageerror', error => console.log(`PAGE ERROR: ${error.message}`));
  }

  async takeScreenshot(name, element = null) {
    const filename = `${String(this.testResults.length + 1).padStart(2, '0')}-${name.replace(/[^a-zA-Z0-9]/g, '-')}.png`;
    const filepath = path.join(this.screenshotDir, filename);
    
    if (element) {
      await element.screenshot({ path: filepath });
    } else {
      await this.page.screenshot({ path: filepath, fullPage: true });
    }
    
    return { filename, filepath };
  }

  async testPage(url, pageName, testConfig) {
    console.log(`\n=== Testing ${pageName} ===`);
    
    const result = {
      pageName,
      url,
      timestamp: new Date().toISOString(),
      screenshots: [],
      issues: [],
      recommendations: [],
      functionality: 'Unknown',
      visualDesign: 0,
      usability: 0,
      consistency: 'Unknown',
      interactiveElements: [],
      console_errors: []
    };

    try {
      // Navigate to page
      console.log(`Navigating to: ${url}`);
      await this.page.goto(url, { waitUntil: 'networkidle', timeout: 10000 });
      
      // Initial screenshot
      const initialScreenshot = await this.takeScreenshot(`${pageName}-initial-load`);
      result.screenshots.push(initialScreenshot);
      
      // Wait for content to load
      await this.page.waitForTimeout(2000);
      
      // Test basic page structure
      const title = await this.page.title();
      console.log(`Page title: ${title}`);
      
      // Test responsive design
      await this.testResponsiveness(pageName, result);
      
      // Test interactive elements
      await this.testInteractiveElements(testConfig.interactive || [], result);
      
      // Test forms if specified
      if (testConfig.forms) {
        await this.testForms(testConfig.forms, result);
      }
      
      // Test navigation elements
      await this.testNavigation(result);
      
      // Test visual consistency
      await this.testVisualConsistency(result);
      
      // Evaluate overall scores
      result.functionality = result.issues.length === 0 ? '✅ Working' : result.issues.length <= 2 ? '⚠️ Minor Issues' : '❌ Broken';
      result.visualDesign = Math.max(1, 10 - result.issues.filter(i => i.type === 'visual').length * 2);
      result.usability = Math.max(1, 10 - result.issues.filter(i => i.type === 'usability').length * 2);
      
      console.log(`${pageName} test completed successfully`);
      
    } catch (error) {
      console.error(`Error testing ${pageName}:`, error.message);
      result.issues.push({
        type: 'critical',
        severity: 'high',
        description: `Page load or navigation error: ${error.message}`,
        location: 'page-level'
      });
      result.functionality = '❌ Broken';
    }
    
    this.testResults.push(result);
    return result;
  }

  async testResponsiveness(pageName, result) {
    console.log('Testing responsive design...');
    
    const viewports = [
      { name: 'mobile', width: 375, height: 667 },
      { name: 'tablet', width: 768, height: 1024 },
      { name: 'desktop', width: 1280, height: 720 }
    ];
    
    for (const viewport of viewports) {
      await this.page.setViewportSize(viewport);
      await this.page.waitForTimeout(1000);
      
      const screenshot = await this.takeScreenshot(`${pageName}-${viewport.name}-${viewport.width}x${viewport.height}`);
      result.screenshots.push(screenshot);
      
      // Check for horizontal scroll
      const hasHorizontalScroll = await this.page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth;
      });
      
      if (hasHorizontalScroll) {
        result.issues.push({
          type: 'responsive',
          severity: 'medium',
          description: `Horizontal scroll detected on ${viewport.name} view`,
          location: `${viewport.width}x${viewport.height}`
        });
      }
    }
    
    // Reset to desktop view
    await this.page.setViewportSize({ width: 1280, height: 720 });
  }

  async testInteractiveElements(selectors, result) {
    console.log('Testing interactive elements...');
    
    for (const selector of selectors) {
      try {
        const elements = await this.page.$$(selector);
        
        for (let i = 0; i < elements.length; i++) {
          const element = elements[i];
          
          // Test hover state
          await element.hover();
          await this.page.waitForTimeout(500);
          
          // Check if element is clickable
          const isClickable = await element.isEnabled();
          
          // Test click (if safe to do so)
          if (isClickable && !selector.includes('submit')) {
            await element.click();
            await this.page.waitForTimeout(1000);
            
            const clickScreenshot = await this.takeScreenshot(`interactive-${selector.replace(/[^a-zA-Z0-9]/g, '')}-clicked`);
            result.screenshots.push(clickScreenshot);
          }
          
          result.interactiveElements.push({
            selector,
            index: i,
            isClickable,
            tested: true
          });
        }
      } catch (error) {
        result.issues.push({
          type: 'interactive',
          severity: 'medium',
          description: `Could not test interactive element: ${selector} - ${error.message}`,
          location: selector
        });
      }
    }
  }

  async testForms(formSelectors, result) {
    console.log('Testing form functionality...');
    
    for (const formConfig of formSelectors) {
      try {
        const form = await this.page.$(formConfig.selector);
        if (!form) continue;
        
        // Test form inputs
        for (const inputConfig of formConfig.inputs || []) {
          const input = await this.page.$(inputConfig.selector);
          if (input) {
            await input.fill(inputConfig.testValue || 'test@example.com');
            await this.page.waitForTimeout(500);
          }
        }
        
        // Screenshot form filled
        const formScreenshot = await this.takeScreenshot(`form-${formConfig.name || 'unknown'}-filled`);
        result.screenshots.push(formScreenshot);
        
        // Test validation (if specified)
        if (formConfig.testValidation) {
          // Clear required field to test validation
          if (formConfig.inputs && formConfig.inputs[0]) {
            await this.page.fill(formConfig.inputs[0].selector, '');
            await this.page.waitForTimeout(500);
            
            const validationScreenshot = await this.takeScreenshot(`form-${formConfig.name}-validation`);
            result.screenshots.push(validationScreenshot);
          }
        }
        
      } catch (error) {
        result.issues.push({
          type: 'form',
          severity: 'medium',
          description: `Form testing error: ${error.message}`,
          location: formConfig.selector
        });
      }
    }
  }

  async testNavigation(result) {
    console.log('Testing navigation elements...');
    
    const navSelectors = [
      'nav a',
      '.navbar a',
      '.menu a',
      '[role="navigation"] a',
      '.navigation a'
    ];
    
    for (const selector of navSelectors) {
      try {
        const links = await this.page.$$(selector);
        
        for (let i = 0; i < Math.min(links.length, 5); i++) { // Test max 5 links per selector
          const link = links[i];
          const href = await link.getAttribute('href');
          const text = await link.textContent();
          
          if (href && !href.startsWith('#') && !href.startsWith('javascript:')) {
            result.interactiveElements.push({
              type: 'navigation',
              selector,
              href,
              text: text?.trim(),
              tested: true
            });
          }
        }
      } catch (error) {
        // Navigation testing is optional, don't fail the whole test
        console.log(`Navigation test warning: ${error.message}`);
      }
    }
  }

  async testVisualConsistency(result) {
    console.log('Testing visual consistency...');
    
    try {
      // Check for design system usage
      const hasDesignSystem = await this.page.evaluate(() => {
        const stylesheets = Array.from(document.styleSheets);
        return stylesheets.some(sheet => {
          try {
            return sheet.href && (
              sheet.href.includes('compact-modern') ||
              sheet.href.includes('design-system') ||
              sheet.href.includes('unified-design')
            );
          } catch {
            return false;
          }
        });
      });
      
      if (!hasDesignSystem) {
        result.issues.push({
          type: 'visual',
          severity: 'low',
          description: 'Design system CSS not detected',
          location: 'global'
        });
      }
      
      // Check for gradient implementation
      const hasGradients = await this.page.evaluate(() => {
        const elements = document.querySelectorAll('*');
        return Array.from(elements).some(el => {
          const style = getComputedStyle(el);
          return style.background && style.background.includes('gradient');
        });
      });
      
      result.consistency = hasDesignSystem ? 'Good' : 'Needs Improvement';
      
    } catch (error) {
      result.issues.push({
        type: 'visual',
        severity: 'low',
        description: `Visual consistency check failed: ${error.message}`,
        location: 'global'
      });
    }
  }

  async generateReport() {
    console.log('\n=== Generating Comprehensive Report ===');
    
    let report = `# Comprehensive UI/UX Test Report
Generated: ${new Date().toLocaleString()}

## Executive Summary
- **Total Pages Tested**: ${this.testResults.length}
- **Working Pages**: ${this.testResults.filter(r => r.functionality.includes('Working')).length}
- **Pages with Issues**: ${this.testResults.filter(r => r.functionality.includes('Issues')).length}
- **Broken Pages**: ${this.testResults.filter(r => r.functionality.includes('Broken')).length}

## Individual Page Results

`;

    for (const result of this.testResults) {
      report += `### ${result.pageName}
**URL**: ${result.url}
**Functionality Status**: ${result.functionality}
**Visual Design Score**: ${result.visualDesign}/10
**Usability Score**: ${result.usability}/10
**Design Consistency**: ${result.consistency}

**Screenshots**: ${result.screenshots.length} captured
${result.screenshots.map(s => `- ![${s.filename}](${s.filename})`).join('\n')}

**Issues Found**: ${result.issues.length}
${result.issues.map(issue => `- **${issue.severity.toUpperCase()}**: ${issue.description} (${issue.location})`).join('\n')}

**Interactive Elements Tested**: ${result.interactiveElements.length}
${result.interactiveElements.map(el => `- ${el.selector || el.type}: ${el.tested ? '✅' : '❌'}`).join('\n')}

---

`;
    }

    report += `## Overall Recommendations

### High Priority Fixes
${this.testResults
  .flatMap(r => r.issues.filter(i => i.severity === 'high'))
  .map(issue => `- ${issue.description}`)
  .join('\n')}

### Visual Improvements
${this.testResults
  .flatMap(r => r.issues.filter(i => i.type === 'visual'))
  .map(issue => `- ${issue.description}`)
  .join('\n')}

### Usability Enhancements
${this.testResults
  .flatMap(r => r.issues.filter(i => i.type === 'usability'))
  .map(issue => `- ${issue.description}`)
  .join('\n')}

## Test Configuration
- **Browser**: Chromium
- **Viewports Tested**: Mobile (375x667), Tablet (768x1024), Desktop (1280x720)
- **Total Screenshots**: ${this.testResults.reduce((sum, r) => sum + r.screenshots.length, 0)}
- **Test Duration**: Approximately ${Math.ceil(this.testResults.length * 2)} minutes

## Files Generated
- Screenshots: \`${this.screenshotDir}\`
- Report: \`${this.reportPath}\`
`;

    await fs.writeFile(this.reportPath, report);
    console.log(`Report generated: ${this.reportPath}`);
    
    return report;
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
    }
  }

  async runComprehensiveTest() {
    await this.setup();
    
    // Define test configurations for each page
    const testConfigs = [
      {
        url: 'http://localhost:8080/roi-finder.html',
        name: 'ROI Finder',
        interactive: ['button', 'input', 'select', '.btn', '.button'],
        forms: [
          {
            selector: 'form',
            name: 'property-analysis',
            inputs: [
              { selector: 'input[type="text"]', testValue: '123 Main St, Toronto, ON' },
              { selector: 'input[type="number"]', testValue: '500000' }
            ],
            testValidation: true
          }
        ]
      },
      {
        url: 'http://localhost:8080/index.html',
        name: 'Home Page',
        interactive: ['.cta-button', 'button', '.btn', 'nav a'],
        forms: []
      },
      {
        url: 'http://localhost:8080/contact.html',
        name: 'Contact Page',
        interactive: ['button', '.btn'],
        forms: [
          {
            selector: 'form',
            name: 'contact',
            inputs: [
              { selector: 'input[name="email"]', testValue: 'test@example.com' },
              { selector: 'input[name="name"]', testValue: 'Test User' },
              { selector: 'textarea', testValue: 'Test message content' }
            ],
            testValidation: true
          }
        ]
      },
      {
        url: 'http://localhost:8080/admin-dashboard.html',
        name: 'Admin Dashboard',
        interactive: ['button', '.btn', 'input'],
        forms: [
          {
            selector: 'form',
            name: 'login',
            inputs: [
              { selector: 'input[type="email"]', testValue: 'admin@example.com' },
              { selector: 'input[type="password"]', testValue: 'testpassword' }
            ]
          }
        ]
      },
      {
        url: 'http://localhost:8080/blog.html',
        name: 'Blog Page',
        interactive: ['a', '.btn', 'button'],
        forms: []
      }
    ];

    // Run tests for each page
    for (const config of testConfigs) {
      await this.testPage(config.url, config.name, config);
    }

    // Generate comprehensive report
    const report = await this.generateReport();
    
    await this.cleanup();
    
    return {
      results: this.testResults,
      report,
      screenshotDir: this.screenshotDir
    };
  }
}

// Run the comprehensive test
async function main() {
  const tester = new ComprehensiveUIUXTester();
  
  try {
    console.log('Starting Comprehensive UI/UX Testing...');
    const results = await tester.runComprehensiveTest();
    
    console.log('\n=== Test Summary ===');
    console.log(`Screenshots saved to: ${results.screenshotDir}`);
    console.log(`Total pages tested: ${results.results.length}`);
    console.log('Individual results:');
    
    results.results.forEach(result => {
      console.log(`- ${result.pageName}: ${result.functionality} (${result.visualDesign}/10 design, ${result.usability}/10 usability)`);
    });
    
    console.log(`\nFull report: ${path.join(results.screenshotDir, 'comprehensive-ui-ux-report.md')}`);
    
  } catch (error) {
    console.error('Test failed:', error);
    await tester.cleanup();
    process.exit(1);
  }
}

// Allow running as standalone script
if (require.main === module) {
  main();
}

module.exports = { ComprehensiveUIUXTester };