const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs').promises;

// Test configuration
const TEST_URL = 'http://localhost:8080/roi-finder.html?e2e_test_mode=true';
const SCREENSHOT_DIR = path.join(__dirname, 'screenshots', 'gradient-test', new Date().toISOString().split('T')[0]);
const VIEWPORTS = {
  desktop: { width: 1920, height: 1080 },
  tablet: { width: 768, height: 1024 },
  mobile: { width: 375, height: 812 }
};

// Test data
const TEST_USER = {
  email: 'gradient-test@example.com',
  password: 'Test123!',
  name: 'Gradient Test User'
};

const TEST_PROPERTY = {
  address: '123 Gradient Ave, Toronto, ON',
  price: '$899,000',
  propertyTaxes: '$8,500',
  condoFees: '$0',
  downPayment: '20',
  interestRate: '5.5',
  bedrooms: '3',
  bathrooms: '2',
  squareFeet: '1,800'
};

class GradientVisualTester {
  constructor() {
    this.browser = null;
    this.page = null;
    this.results = {
      timestamp: new Date().toISOString(),
      screens: [],
      issues: [],
      gradientElementsFound: {}
    };
  }

  async init() {
    // Create screenshot directory
    await fs.mkdir(SCREENSHOT_DIR, { recursive: true });
    
    // Launch browser
    this.browser = await puppeteer.launch({
      headless: false, // Set to false to see what's happening
      defaultViewport: VIEWPORTS.desktop,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    this.page = await this.browser.newPage();
    
    // Set up console logging
    this.page.on('console', msg => {
      if (msg.type() === 'error') {
        this.results.issues.push({
          type: 'console-error',
          message: msg.text(),
          location: msg.location()
        });
      }
    });
    
    // Navigate to the application
    await this.page.goto(TEST_URL, { waitUntil: 'networkidle2' });
  }

  async takeScreenshot(name, viewport = 'desktop') {
    if (viewport !== 'desktop') {
      await this.page.setViewport(VIEWPORTS[viewport]);
      await new Promise(resolve => setTimeout(resolve, 500)); // Wait for viewport change
    }
    
    const screenshotPath = path.join(SCREENSHOT_DIR, `${name}-${viewport}.png`);
    await this.page.screenshot({ 
      path: screenshotPath, 
      fullPage: true 
    });
    
    return screenshotPath;
  }

  async checkGradientElements() {
    const gradientCheck = await this.page.evaluate(() => {
      const results = {
        glassMorphism: [],
        gradientBackgrounds: [],
        gradientText: [],
        floatingOrbs: [],
        plusJakartaFont: false,
        issues: []
      };
      
      // Check for glass morphism elements
      const glassElements = document.querySelectorAll('.glass, .glass-card, .glass-dark');
      glassElements.forEach(el => {
        const styles = window.getComputedStyle(el);
        const hasBackdropFilter = styles.backdropFilter !== 'none';
        results.glassMorphism.push({
          selector: el.className,
          hasBackdropFilter,
          backgroundColor: styles.backgroundColor,
          visible: el.offsetHeight > 0
        });
      });
      
      // Check for gradient backgrounds
      const gradientElements = document.querySelectorAll('[class*="gradient-"], .btn-gradient');
      gradientElements.forEach(el => {
        const styles = window.getComputedStyle(el);
        const hasGradient = styles.backgroundImage.includes('gradient');
        results.gradientBackgrounds.push({
          selector: el.className,
          hasGradient,
          backgroundImage: styles.backgroundImage,
          visible: el.offsetHeight > 0
        });
      });
      
      // Check for gradient text
      const textGradients = document.querySelectorAll('.text-gradient');
      textGradients.forEach(el => {
        const styles = window.getComputedStyle(el);
        results.gradientText.push({
          selector: el.className,
          text: el.textContent,
          hasClip: styles.webkitBackgroundClip === 'text',
          visible: el.offsetHeight > 0
        });
      });
      
      // Check for floating orbs
      const orbs = document.querySelectorAll('.orb, .floating, .floating-delayed');
      results.floatingOrbs = orbs.length;
      
      // Check for Plus Jakarta Sans font
      const bodyStyles = window.getComputedStyle(document.body);
      results.plusJakartaFont = bodyStyles.fontFamily.includes('Plus Jakarta Sans');
      
      // Check animated background
      const animatedBg = document.getElementById('animated-bg');
      if (animatedBg) {
        results.animatedBackground = {
          exists: true,
          hasContent: animatedBg.innerHTML.length > 0,
          childCount: animatedBg.children.length
        };
      }
      
      return results;
    });
    
    return gradientCheck;
  }

  async testLoginScreen() {
    console.log('Testing Login/Signup Screen...');
    
    // Take screenshot
    await this.takeScreenshot('01-login-screen');
    
    // Check gradient elements
    const gradientCheck = await this.checkGradientElements();
    
    this.results.screens.push({
      name: 'Login/Signup',
      screenshots: ['01-login-screen-desktop.png'],
      gradientElements: gradientCheck
    });
    
    // Check for specific login elements
    const loginCheck = await this.page.evaluate(() => {
      const loginCard = document.querySelector('#login-card');
      const signupCard = document.querySelector('#signup-card');
      const navigation = document.querySelector('nav');
      
      return {
        loginCard: {
          exists: !!loginCard,
          hasGlassClass: loginCard?.classList.contains('glass-card'),
          visible: loginCard?.offsetHeight > 0
        },
        signupCard: {
          exists: !!signupCard,
          hasGlassClass: signupCard?.classList.contains('glass-card'),
          visible: signupCard?.offsetHeight > 0
        },
        navigation: {
          exists: !!navigation,
          hasGlassClass: navigation?.classList.contains('glass'),
          visible: navigation?.offsetHeight > 0
        }
      };
    });
    
    if (!loginCheck.loginCard.hasGlassClass) {
      this.results.issues.push({
        screen: 'Login',
        issue: 'Login card missing glass-card class',
        element: '#login-card'
      });
    }
    
    return loginCheck;
  }

  async testPropertyForm() {
    console.log('Testing Property Input Form...');
    
    // First, we need to bypass auth or login
    await this.page.evaluate(() => {
      // Simulate successful auth
      window.appState.currentUser = { email: 'test@example.com' };
      document.getElementById('login-section').classList.add('hidden');
      document.getElementById('property-input-section').classList.remove('hidden');
    });
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Take screenshot
    await this.takeScreenshot('02-property-form');
    
    // Check gradient elements
    const gradientCheck = await this.checkGradientElements();
    
    this.results.screens.push({
      name: 'Property Form',
      screenshots: ['02-property-form-desktop.png'],
      gradientElements: gradientCheck
    });
  }

  async testLoadingState() {
    console.log('Testing Loading State...');
    
    // Trigger loading state
    await this.page.evaluate(() => {
      document.getElementById('property-input-section').classList.add('hidden');
      document.getElementById('loading-state').classList.remove('hidden');
    });
    
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Take screenshot
    await this.takeScreenshot('03-loading-state');
    
    // Check gradient elements
    const gradientCheck = await this.checkGradientElements();
    
    this.results.screens.push({
      name: 'Loading State',
      screenshots: ['03-loading-state-desktop.png'],
      gradientElements: gradientCheck
    });
  }

  async testAnalysisResults() {
    console.log('Testing Analysis Results...');
    
    // Mock analysis data
    await this.page.evaluate(() => {
      const mockAnalysisData = {
        propertyData: {
          address: '123 Gradient Ave, Toronto, ON',
          price: 899000,
          bedrooms: 3,
          bathrooms: 2,
          squareFeet: 1800,
          propertyTaxes: 8500
        },
        strAnalysis: {
          monthlyRevenue: 4500,
          occupancyRate: 0.75,
          yearlyRevenue: 54000
        },
        longTermRental: {
          monthlyRent: 3200,
          yearlyRevenue: 38400
        },
        analysisType: 'both'
      };
      
      // Load analysis results
      document.getElementById('loading-state').classList.add('hidden');
      document.getElementById('analysis-results').classList.remove('hidden');
      
      // Render analysis (this would normally be done by componentLoader)
      if (window.componentLoader) {
        window.componentLoader.renderAnalysisResults(mockAnalysisData, document.getElementById('analysis-results'));
      }
    });
    
    await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for rendering
    
    // Test each tab
    const tabs = ['str', 'ltr', 'investment'];
    for (const tab of tabs) {
      await this.page.evaluate((tabName) => {
        if (window.switchTab) {
          window.switchTab(tabName);
        }
      }, tab);
      
      await new Promise(resolve => setTimeout(resolve, 500));
      await this.takeScreenshot(`04-analysis-${tab}-tab`);
      
      const gradientCheck = await this.checkGradientElements();
      this.results.screens.push({
        name: `Analysis - ${tab.toUpperCase()} Tab`,
        screenshots: [`04-analysis-${tab}-tab-desktop.png`],
        gradientElements: gradientCheck
      });
    }
  }

  async testMobileViews() {
    console.log('Testing Mobile Views...');
    
    // Test key screens on mobile
    const mobileScreens = [
      { name: 'login', setup: () => this.testLoginScreen() },
      { name: 'analysis', setup: () => this.testAnalysisResults() }
    ];
    
    for (const screen of mobileScreens) {
      await this.page.setViewport(VIEWPORTS.mobile);
      await new Promise(resolve => setTimeout(resolve, 500));
      await this.takeScreenshot(`05-mobile-${screen.name}`, 'mobile');
    }
  }

  async generateReport() {
    console.log('Generating report...');
    
    // Count gradient elements found
    let totalGradientElements = 0;
    this.results.screens.forEach(screen => {
      if (screen.gradientElements) {
        totalGradientElements += screen.gradientElements.glassMorphism.length;
        totalGradientElements += screen.gradientElements.gradientBackgrounds.length;
        totalGradientElements += screen.gradientElements.gradientText.length;
      }
    });
    
    // Generate summary
    this.results.summary = {
      totalScreensTested: this.results.screens.length,
      totalGradientElements,
      issuesFound: this.results.issues.length,
      plusJakartaFontLoaded: this.results.screens.some(s => s.gradientElements?.plusJakartaFont),
      timestamp: new Date().toISOString()
    };
    
    // Save JSON report
    await fs.writeFile(
      path.join(SCREENSHOT_DIR, 'test-report.json'),
      JSON.stringify(this.results, null, 2)
    );
    
    // Generate HTML report
    const htmlReport = this.generateHTMLReport();
    await fs.writeFile(
      path.join(SCREENSHOT_DIR, 'visual-report.html'),
      htmlReport
    );
    
    return this.results;
  }

  generateHTMLReport() {
    return `<!DOCTYPE html>
<html>
<head>
    <title>Gradient Design Visual Test Report</title>
    <style>
        body { font-family: -apple-system, sans-serif; margin: 20px; background: #f5f5f5; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 12px; margin-bottom: 30px; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .metric { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
        .metric h3 { margin: 0 0 10px 0; color: #667eea; }
        .metric .value { font-size: 2em; font-weight: bold; }
        .screen { background: white; margin-bottom: 30px; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
        .screen h2 { background: #f8f9fa; margin: 0; padding: 20px; border-bottom: 1px solid #e9ecef; }
        .screen-content { padding: 20px; }
        .screenshot { max-width: 100%; border: 1px solid #e9ecef; border-radius: 8px; margin: 10px 0; }
        .issue { background: #fff3cd; border: 1px solid #ffeaa7; padding: 10px; border-radius: 4px; margin: 10px 0; }
        .success { background: #d4edda; border: 1px solid #c3e6cb; padding: 10px; border-radius: 4px; margin: 10px 0; }
        .code { background: #f8f9fa; padding: 10px; border-radius: 4px; font-family: monospace; font-size: 0.9em; overflow-x: auto; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Gradient Design Visual Test Report</h1>
        <p>Generated: ${new Date().toLocaleString()}</p>
    </div>
    
    <div class="summary">
        <div class="metric">
            <h3>Screens Tested</h3>
            <div class="value">${this.results.summary.totalScreensTested}</div>
        </div>
        <div class="metric">
            <h3>Gradient Elements</h3>
            <div class="value">${this.results.summary.totalGradientElements}</div>
        </div>
        <div class="metric">
            <h3>Issues Found</h3>
            <div class="value">${this.results.summary.issuesFound}</div>
        </div>
        <div class="metric">
            <h3>Font Loaded</h3>
            <div class="value">${this.results.summary.plusJakartaFontLoaded ? '✅' : '❌'}</div>
        </div>
    </div>
    
    ${this.results.screens.map(screen => `
        <div class="screen">
            <h2>${screen.name}</h2>
            <div class="screen-content">
                ${screen.screenshots.map(ss => `
                    <img src="${ss}" alt="${screen.name}" class="screenshot" />
                `).join('')}
                
                ${screen.gradientElements ? `
                    <h3>Gradient Elements Found:</h3>
                    <div class="code">
                        <strong>Glass Morphism:</strong> ${screen.gradientElements.glassMorphism.length} elements<br>
                        <strong>Gradient Backgrounds:</strong> ${screen.gradientElements.gradientBackgrounds.length} elements<br>
                        <strong>Gradient Text:</strong> ${screen.gradientElements.gradientText.length} elements<br>
                        <strong>Floating Orbs:</strong> ${screen.gradientElements.floatingOrbs}<br>
                        <strong>Plus Jakarta Sans:</strong> ${screen.gradientElements.plusJakartaFont ? '✅ Loaded' : '❌ Not Found'}
                    </div>
                ` : ''}
            </div>
        </div>
    `).join('')}
    
    ${this.results.issues.length > 0 ? `
        <div class="screen">
            <h2>Issues Found</h2>
            <div class="screen-content">
                ${this.results.issues.map(issue => `
                    <div class="issue">
                        <strong>${issue.screen || issue.type}:</strong> ${issue.issue || issue.message}
                        ${issue.element ? `<br><code>${issue.element}</code>` : ''}
                    </div>
                `).join('')}
            </div>
        </div>
    ` : ''}
</body>
</html>`;
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
    }
  }

  async run() {
    try {
      await this.init();
      
      // Run all tests
      await this.testLoginScreen();
      await this.testPropertyForm();
      await this.testLoadingState();
      await this.testAnalysisResults();
      await this.testMobileViews();
      
      // Generate report
      const report = await this.generateReport();
      
      console.log('\n=== Test Summary ===');
      console.log(`Total screens tested: ${report.summary.totalScreensTested}`);
      console.log(`Total gradient elements found: ${report.summary.totalGradientElements}`);
      console.log(`Issues found: ${report.summary.issuesFound}`);
      console.log(`\nReport saved to: ${SCREENSHOT_DIR}/visual-report.html`);
      
      return report;
    } catch (error) {
      console.error('Test failed:', error);
      throw error;
    } finally {
      await this.cleanup();
    }
  }
}

// Run the test
if (require.main === module) {
  const tester = new GradientVisualTester();
  tester.run().catch(console.error);
}

module.exports = GradientVisualTester;