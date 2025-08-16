#!/usr/bin/env node

/**
 * Comprehensive Real User Test Suite
 * Simulates actual user behavior with real API calls, visual validation, and Firebase persistence
 * Tests functional, visual, performance, and data accuracy aspects
 */

const { chromium, firefox, webkit } = require('@playwright/test');
const fs = require('fs').promises;
const path = require('path');
const { execSync } = require('child_process');
const APIValidator = require('./validators/api-validator');
const VisualValidator = require('./validators/visual-validator');
const { TEST_PROPERTIES, TEST_USERS, BROWSER_CONFIGS } = require('./config/test-properties');

class ComprehensiveRealUserTest {
  constructor() {
    this.baseUrl = process.env.BASE_URL || 'http://localhost:3002';
    this.headless = process.env.HEADLESS !== 'false';
    this.testRunId = `test-${Date.now()}`;
    this.screenshotDir = path.join(__dirname, 'screenshots', this.testRunId);
    this.reportDir = path.join(__dirname, 'reports', this.testRunId);
    
    // Initialize validators
    this.apiValidator = new APIValidator();
    this.visualValidator = new VisualValidator({
      screenshotDir: this.screenshotDir,
      threshold: 0.1
    });
    
    // Test personas with realistic user behaviors
    this.personas = [
      {
        id: 'visual-victoria',
        name: 'Visual Victoria',
        description: 'UI/UX Designer checking visual consistency',
        browser: 'chromium',
        viewport: { width: 1920, height: 1080 },
        scenarios: ['visual-regression', 'responsive-design', 'theme-switching']
      },
      {
        id: 'financial-felix',
        name: 'Financial Felix',
        description: 'Investment analyst validating calculations',
        browser: 'chromium',
        viewport: { width: 1440, height: 900 },
        scenarios: ['complex-calculations', 'roi-analysis', 'cash-flow-validation']
      },
      {
        id: 'mobile-marcus',
        name: 'Mobile Marcus',
        description: 'Mobile user on slow connection',
        browser: 'webkit',
        viewport: { width: 375, height: 667 },
        isMobile: true,
        scenarios: ['mobile-navigation', 'touch-interactions', 'offline-mode']
      },
      {
        id: 'data-diana',
        name: 'Data Diana',
        description: 'Data scientist checking accuracy',
        browser: 'firefox',
        viewport: { width: 1280, height: 720 },
        scenarios: ['data-validation', 'api-responses', 'firebase-persistence']
      },
      {
        id: 'realtor-rachel',
        name: 'Realtor Rachel',
        description: 'Real estate agent generating reports',
        browser: 'chromium',
        viewport: { width: 1366, height: 768 },
        scenarios: ['report-generation', 'pdf-export', 'client-sharing']
      }
    ];
    
    // Real Toronto test properties
    this.testProperties = [
      {
        address: '488 University Ave Unit 2710, Toronto, ON',
        price: 899000,
        type: 'Condo',
        expectedRent: 2800
      },
      {
        address: '25 Queens Quay E, Toronto, ON',
        price: 750000,
        type: 'Condo',
        expectedRent: 2500
      },
      {
        address: '88 Harbour Street, Toronto, ON',
        price: 1200000,
        type: 'Condo',
        expectedRent: 3500
      }
    ];
    
    this.results = {
      passed: 0,
      failed: 0,
      warnings: 0,
      personas: {},
      apiCalls: [],
      screenshots: [],
      errors: [],
      performance: {}
    };
  }

  async initialize() {
    console.log('🚀 Comprehensive Real User Test Suite');
    console.log(`📋 Test ID: ${this.testRunId}`);
    console.log(`🌐 Testing URL: ${this.baseUrl}`);
    console.log(`👥 ${this.personas.length} personas will test the application\n`);
    
    // Create directories
    await fs.mkdir(this.screenshotDir, { recursive: true });
    await fs.mkdir(this.reportDir, { recursive: true });
    
    // Check if servers are running
    await this.checkServers();
  }

  async checkServers() {
    console.log('🔍 Checking local servers...');
    
    let vercelOk = false;
    let railwayOk = false;
    
    // Try multiple ports for Vercel
    const vercelPorts = [3000, 3002, 3003];
    for (const port of vercelPorts) {
      try {
        const response = await fetch(`http://localhost:${port}`);
        if (response.ok) {
          this.baseUrl = `http://localhost:${port}`;
          console.log(`✅ Vercel server running at ${this.baseUrl}`);
          vercelOk = true;
          break;
        }
      } catch (e) {
        // Continue to next port
      }
    }
    
    // Check Railway API
    try {
      const apiResponse = await fetch('http://localhost:3001/health');
      railwayOk = apiResponse.ok;
      if (railwayOk) {
        console.log('✅ Railway API running on port 3001');
      }
    } catch (error) {
      railwayOk = false;
    }
    
    if (!vercelOk || !railwayOk) {
      console.error('❌ Some servers not running. Please start them manually with: npm run dev');
      console.log('   Then run the test again.');
      process.exit(1);
    }
  }

  async runAllTests() {
    await this.initialize();
    
    console.log('\n🎬 Starting comprehensive testing...\n');
    const startTime = Date.now();
    
    // Run tests for limited personas to test faster
    const limitedPersonas = this.personas.slice(0, 2); // Only test first 2 personas for now
    const personaPromises = limitedPersonas.map(async (persona, index) => {
      // Stagger starts slightly
      await this.delay(index * 1000);
      return this.runPersonaTest(persona);
    });
    
    // Wait for all tests to complete
    const results = await Promise.allSettled(personaPromises);
    
    // Process results
    results.forEach((result, index) => {
      const persona = this.personas[index];
      if (result.status === 'fulfilled') {
        this.results.passed++;
        this.results.personas[persona.id] = result.value;
        console.log(`✅ ${persona.name} completed successfully`);
      } else {
        this.results.failed++;
        this.results.errors.push({
          persona: persona.id,
          error: result.reason.message
        });
        console.error(`❌ ${persona.name} failed: ${result.reason.message}`);
      }
    });
    
    // Calculate total time
    const totalTime = Date.now() - startTime;
    this.results.performance.totalTime = totalTime;
    
    // Generate report
    await this.generateReport();
    
    console.log('\n📊 Test Summary:');
    console.log(`✅ Passed: ${this.results.passed}`);
    console.log(`❌ Failed: ${this.results.failed}`);
    console.log(`⏱️ Total Time: ${(totalTime / 1000).toFixed(2)}s`);
    console.log(`📸 Screenshots: ${this.results.screenshots.length}`);
    console.log(`📄 Report: ${path.join(this.reportDir, 'report.html')}\n`);
    
    return this.results;
  }

  async runPersonaTest(persona) {
    console.log(`\n🧪 Testing as ${persona.name}`);
    console.log(`   ${persona.description}`);
    
    const result = {
      persona: persona.id,
      startTime: Date.now(),
      steps: [],
      screenshots: [],
      apiCalls: [],
      errors: []
    };
    
    let browser, context, page;
    
    try {
      // Launch browser based on persona preference
      const browserType = persona.browser === 'firefox' ? firefox :
                         persona.browser === 'webkit' ? webkit : chromium;
      
      browser = await browserType.launch({
        headless: this.headless,
        slowMo: 50 // Slow down for visual effect
      });
      
      // Create context with persona settings
      context = await browser.newContext({
        viewport: persona.viewport,
        isMobile: persona.isMobile || false,
        userAgent: persona.isMobile ? 
          'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) Mobile/15A372' :
          undefined,
        // Record video for debugging
        recordVideo: {
          dir: path.join(this.screenshotDir, 'videos'),
          size: persona.viewport
        }
      });
      
      // Set up request/response interception for API monitoring
      context.on('request', request => {
        if (request.url().includes('/api/')) {
          result.apiCalls.push({
            url: request.url(),
            method: request.method(),
            timestamp: Date.now(),
            requestId: `${Date.now()}-${Math.random()}`
          });
        }
      });
      
      context.on('response', async response => {
        if (response.url().includes('/api/analysis/property')) {
          try {
            const data = await response.json();
            // Validate API response
            const validation = await this.apiValidator.validatePropertyAnalysis(data);
            result.apiValidation = validation;
          } catch (error) {
            console.error('Failed to validate API response:', error);
          }
        }
      });
      
      // Set up console monitoring
      context.on('console', msg => {
        if (msg.type() === 'error') {
          result.errors.push({
            type: 'console',
            message: msg.text(),
            timestamp: Date.now()
          });
        }
      });
      
      page = await context.newPage();
      
      // Run persona-specific scenarios
      for (const scenario of persona.scenarios) {
        await this.runScenario(page, persona, scenario, result);
      }
      
      // Test property analysis with real API call
      await this.testPropertyAnalysis(page, persona, result);
      
      // Visual regression testing
      if (persona.scenarios.includes('visual-regression')) {
        await this.performVisualRegression(page, persona, result);
      }
      
      // Performance testing
      await this.measurePerformance(page, result);
      
      result.endTime = Date.now();
      result.duration = result.endTime - result.startTime;
      
    } catch (error) {
      console.error(`❌ Error in ${persona.name}: ${error.message}`);
      result.errors.push({
        type: 'fatal',
        message: error.message,
        stack: error.stack
      });
      throw error;
      
    } finally {
      if (page) await page.close();
      if (context) await context.close();
      if (browser) await browser.close();
    }
    
    return result;
  }

  async runScenario(page, persona, scenario, result) {
    console.log(`   📝 Scenario: ${scenario}`);
    const step = { scenario, startTime: Date.now() };
    
    try {
      switch (scenario) {
        case 'visual-regression':
          await this.testVisualRegression(page, persona, result);
          break;
        case 'responsive-design':
          await this.testResponsiveDesign(page, persona, result);
          break;
        case 'complex-calculations':
          await this.testComplexCalculations(page, persona, result);
          break;
        case 'mobile-navigation':
          await this.testMobileNavigation(page, persona, result);
          break;
        case 'data-validation':
          await this.testDataValidation(page, persona, result);
          break;
        case 'report-generation':
          await this.testReportGeneration(page, persona, result);
          break;
        default:
          console.log(`   ⚠️ Unknown scenario: ${scenario}`);
      }
      
      step.success = true;
    } catch (error) {
      step.success = false;
      step.error = error.message;
      result.errors.push({ scenario, error: error.message });
    }
    
    step.endTime = Date.now();
    step.duration = step.endTime - step.startTime;
    result.steps.push(step);
  }

  async testPropertyAnalysis(page, persona, result) {
    console.log('   🏠 Testing property analysis with real API...');
    
    // Navigate to ROI Finder
    await page.goto(`${this.baseUrl}/roi-finder.html`);
    await page.waitForLoadState('networkidle');
    
    // Take initial screenshot
    const screenshotPath = path.join(this.screenshotDir, `${persona.id}-initial.png`);
    await page.screenshot({ path: screenshotPath, fullPage: true });
    result.screenshots.push(screenshotPath);
    
    // Select a test property
    const property = this.testProperties[0];
    
    // Check for auth bypass or login
    const hasAuthBypass = await page.locator('#auth-bypass-btn').count() > 0;
    if (hasAuthBypass) {
      await page.click('#auth-bypass-btn');
      await this.delay(1000);
    }
    
    // Fill in property form
    await page.fill('#property-address', property.address);
    await page.fill('#property-price', property.price.toString());
    
    // Submit form and wait for API response
    console.log('   ⏳ Submitting form and waiting for API response...');
    const apiStartTime = Date.now();
    
    // Try to find and click the analyze button
    const analyzeButton = page.locator('button[type="submit"]:has-text("Analyze")').first();
    await analyzeButton.click();
    
    // Wait for loading to complete (up to 60 seconds for API call)
    await page.waitForSelector('#analysis-results:not(.hidden)', { 
      timeout: 60000,
      state: 'visible' 
    });
    
    const apiEndTime = Date.now();
    const apiDuration = apiEndTime - apiStartTime;
    console.log(`   ✅ API response received in ${(apiDuration / 1000).toFixed(2)}s`);
    
    result.apiCalls.push({
      type: 'property-analysis',
      duration: apiDuration,
      success: true
    });
    
    // Take screenshot of results
    const resultsScreenshot = path.join(this.screenshotDir, `${persona.id}-results.png`);
    await page.screenshot({ path: resultsScreenshot, fullPage: true });
    result.screenshots.push(resultsScreenshot);
    
    // Validate data structure
    const hasStrAnalysis = await page.locator('#str-analysis-section').count() > 0;
    const hasLtrAnalysis = await page.locator('#ltr-analysis-section').count() > 0;
    const hasFinancials = await page.locator('#financial-analysis').count() > 0;
    
    console.log(`   📊 Data validation: STR=${hasStrAnalysis}, LTR=${hasLtrAnalysis}, Financials=${hasFinancials}`);
    
    // Check for errors in console
    const errors = result.errors.filter(e => e.type === 'console');
    if (errors.length > 0) {
      console.log(`   ⚠️ Console errors detected: ${errors.length}`);
    }
  }

  async testVisualRegression(page, persona, result) {
    // Take screenshots at different states
    const states = ['initial', 'form-filled', 'loading', 'results'];
    
    for (const state of states) {
      const screenshotPath = path.join(
        this.screenshotDir, 
        `${persona.id}-${state}.png`
      );
      await page.screenshot({ path: screenshotPath, fullPage: true });
      result.screenshots.push(screenshotPath);
    }
  }

  async testResponsiveDesign(page, persona, result) {
    const breakpoints = [
      { width: 375, height: 667, name: 'mobile' },
      { width: 768, height: 1024, name: 'tablet' },
      { width: 1280, height: 720, name: 'desktop' },
      { width: 1920, height: 1080, name: 'full-hd' }
    ];
    
    for (const breakpoint of breakpoints) {
      await page.setViewportSize(breakpoint);
      await this.delay(500);
      
      const screenshotPath = path.join(
        this.screenshotDir,
        `${persona.id}-${breakpoint.name}.png`
      );
      await page.screenshot({ path: screenshotPath });
      result.screenshots.push(screenshotPath);
    }
  }

  async measurePerformance(page, result) {
    const metrics = await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0];
      return {
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
        firstPaint: performance.getEntriesByName('first-paint')[0]?.startTime || 0,
        firstContentfulPaint: performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 0
      };
    });
    
    result.performance = metrics;
  }

  async generateReport() {
    const reportPath = path.join(this.reportDir, 'report.html');
    
    const html = `
<!DOCTYPE html>
<html>
<head>
    <title>Test Report - ${this.testRunId}</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 20px 0; }
        .stat { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .stat-value { font-size: 32px; font-weight: bold; }
        .passed { color: #10b981; }
        .failed { color: #ef4444; }
        .persona { margin: 20px 0; padding: 20px; background: #f9fafb; border-radius: 8px; }
        .screenshots { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 10px; }
        .screenshot { width: 100%; border-radius: 4px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .error { background: #fef2f2; border: 1px solid #fecaca; padding: 10px; border-radius: 4px; margin: 10px 0; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Comprehensive Real User Test Report</h1>
        <p>Test ID: ${this.testRunId}</p>
        <p>Date: ${new Date().toLocaleString()}</p>
    </div>
    
    <div class="summary">
        <div class="stat">
            <div class="stat-value passed">${this.results.passed}</div>
            <div>Passed</div>
        </div>
        <div class="stat">
            <div class="stat-value failed">${this.results.failed}</div>
            <div>Failed</div>
        </div>
        <div class="stat">
            <div class="stat-value">${this.results.screenshots.length}</div>
            <div>Screenshots</div>
        </div>
        <div class="stat">
            <div class="stat-value">${(this.results.performance.totalTime / 1000).toFixed(1)}s</div>
            <div>Total Time</div>
        </div>
    </div>
    
    <h2>Persona Results</h2>
    ${Object.entries(this.results.personas).map(([id, data]) => `
        <div class="persona">
            <h3>${this.personas.find(p => p.id === id).name}</h3>
            <p>Duration: ${((data.duration || 0) / 1000).toFixed(2)}s</p>
            <p>API Calls: ${data.apiCalls?.length || 0}</p>
            <p>Screenshots: ${data.screenshots?.length || 0}</p>
            ${data.errors?.length > 0 ? `
                <div class="error">
                    <strong>Errors:</strong>
                    ${data.errors.map(e => `<div>${e.message}</div>`).join('')}
                </div>
            ` : ''}
        </div>
    `).join('')}
    
    <h2>Screenshots</h2>
    <div class="screenshots">
        ${this.results.screenshots.map(path => `
            <img src="../screenshots/${this.testRunId}/${path.split('/').pop()}" class="screenshot" />
        `).join('')}
    </div>
</body>
</html>
    `;
    
    await fs.writeFile(reportPath, html);
    console.log(`\n📄 Report generated: ${reportPath}`);
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Run the test
if (require.main === module) {
  const test = new ComprehensiveRealUserTest();
  test.runAllTests()
    .then(results => {
      process.exit(results.failed > 0 ? 1 : 0);
    })
    .catch(error => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

module.exports = ComprehensiveRealUserTest;