#!/usr/bin/env node

/**
 * E2E Test to verify API data flow in both base mockups
 * Tests if real API data is being fetched and displayed correctly
 */

const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs').promises;

const BASE_URL = 'http://localhost:8080';
const API_URL = 'http://localhost:3001/api';

// Test configuration
const TEST_PROPERTY = {
  address: '1514 - 150 East Liberty St, Toronto, ON',
  price: 849900,
  bedrooms: 2,
  bathrooms: 2,
  sqft: 1100,
  propertyTax: 5490
};

class APIDataFlowTest {
  constructor() {
    this.browser = null;
    this.results = {
      timestamp: new Date().toISOString(),
      mockup1: { apiCalls: [], dataDisplayed: {}, errors: [] },
      mockup2: { apiCalls: [], dataDisplayed: {}, errors: [] }
    };
  }

  async initialize() {
    console.log('🚀 Starting API Data Flow Test');
    console.log('📍 Testing with property:', TEST_PROPERTY.address);
    console.log('');
    
    this.browser = await puppeteer.launch({
      headless: false,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      devtools: true
    });
  }

  async testMockup(mockupPath, mockupName) {
    console.log(`\n📊 Testing ${mockupName}...`);
    const page = await this.browser.newPage();
    const result = this.results[mockupName === 'base-mockup.html' ? 'mockup1' : 'mockup2'];
    
    // Set up request interception to monitor API calls
    await page.setRequestInterception(true);
    
    // Track API calls
    page.on('request', request => {
      const url = request.url();
      if (url.includes('/api/')) {
        console.log(`  📡 API Call: ${url.split('/api/')[1]}`);
        result.apiCalls.push({
          url: url,
          method: request.method(),
          timestamp: new Date().toISOString()
        });
      }
      request.continue();
    });

    // Track API responses
    page.on('response', async response => {
      const url = response.url();
      if (url.includes('/api/') && response.status() === 200) {
        try {
          const data = await response.json();
          console.log(`  ✅ API Response received:`, Object.keys(data).slice(0, 5).join(', '));
          
          // Store key data points
          if (data.analysis) {
            result.dataDisplayed.apiData = {
              hasSTR: !!data.analysis.strAnalysis,
              hasLTR: !!data.analysis.longTermRental,
              hasFinancials: !!data.analysis.costs,
              monthlyRevenue: data.analysis.strAnalysis?.monthlyRevenue || data.analysis.strAnalysis?.monthlyRate,
              monthlyRent: data.analysis.longTermRental?.monthlyRent
            };
          }
        } catch (e) {
          // Not JSON response
        }
      }
    });

    // Monitor console for errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log(`  ❌ Console Error: ${msg.text()}`);
        result.errors.push(msg.text());
      }
    });

    try {
      // Navigate to mockup
      console.log(`  🌐 Loading ${mockupName}...`);
      await page.goto(`${BASE_URL}/mockups/mockup-iterations/${mockupName}`, {
        waitUntil: 'networkidle0',
        timeout: 30000
      });

      // Wait for initial load
      await page.waitForTimeout(2000);

      // Fill in property details
      console.log('  📝 Filling property form...');
      
      // Check if form fields exist and fill them
      const addressInput = await page.$('#property-address, [name="address"]');
      if (addressInput) {
        await addressInput.click({ clickCount: 3 });
        await addressInput.type(TEST_PROPERTY.address);
      }

      const priceInput = await page.$('#purchase-price, [name="purchasePrice"]');
      if (priceInput) {
        await priceInput.click({ clickCount: 3 });
        await priceInput.type(TEST_PROPERTY.price.toString());
      }

      // Submit form
      console.log('  🚀 Submitting analysis request...');
      const submitButton = await page.$('button[type="submit"], button:has-text("Analyze"), button:has-text("Get Analysis")');
      if (submitButton) {
        await submitButton.click();
      } else {
        // Try clicking any primary button
        await page.click('.btn-primary, .button-primary, button.primary');
      }

      // Wait for API response
      console.log('  ⏳ Waiting for API response...');
      await page.waitForTimeout(5000);

      // Check what data is displayed
      console.log('  🔍 Checking displayed data...');
      
      // Check for STR data
      const strMonthlyRevenue = await page.$eval(
        '#str-monthly-revenue, .str-monthly-revenue, [data-field="str-monthly-revenue"]',
        el => el.textContent
      ).catch(() => null);
      
      if (strMonthlyRevenue) {
        result.dataDisplayed.strMonthlyRevenue = strMonthlyRevenue;
        console.log(`  💰 STR Monthly Revenue: ${strMonthlyRevenue}`);
      }

      // Check for LTR data
      const ltrMonthlyRent = await page.$eval(
        '#ltr-monthly-rent, .ltr-monthly-rent, [data-field="ltr-monthly-rent"]',
        el => el.textContent
      ).catch(() => null);
      
      if (ltrMonthlyRent) {
        result.dataDisplayed.ltrMonthlyRent = ltrMonthlyRent;
        console.log(`  🏠 LTR Monthly Rent: ${ltrMonthlyRent}`);
      }

      // Check for financial metrics
      const cashFlow = await page.$eval(
        '#monthly-cash-flow, .cash-flow, [data-field="cash-flow"]',
        el => el.textContent
      ).catch(() => null);
      
      if (cashFlow) {
        result.dataDisplayed.cashFlow = cashFlow;
        console.log(`  💵 Cash Flow: ${cashFlow}`);
      }

      // Check for ROI
      const roi = await page.$eval(
        '#roi-percentage, .roi, [data-field="roi"]',
        el => el.textContent
      ).catch(() => null);
      
      if (roi) {
        result.dataDisplayed.roi = roi;
        console.log(`  📈 ROI: ${roi}`);
      }

      // Check for cap rate
      const capRate = await page.$eval(
        '#cap-rate, .cap-rate, [data-field="cap-rate"]',
        el => el.textContent
      ).catch(() => null);
      
      if (capRate) {
        result.dataDisplayed.capRate = capRate;
        console.log(`  📊 Cap Rate: ${capRate}`);
      }

      // Take screenshot
      const screenshotPath = path.join(__dirname, `screenshots`, `api-test-${mockupName.replace('.html', '')}-${Date.now()}.png`);
      await fs.mkdir(path.dirname(screenshotPath), { recursive: true });
      await page.screenshot({ path: screenshotPath, fullPage: true });
      console.log(`  📸 Screenshot saved: ${screenshotPath}`);

      // Check if we have any real data
      const hasRealData = result.apiCalls.length > 0 && 
                         (result.dataDisplayed.strMonthlyRevenue || 
                          result.dataDisplayed.ltrMonthlyRent || 
                          result.dataDisplayed.cashFlow);
      
      if (hasRealData) {
        console.log(`  ✅ Real API data detected and displayed!`);
      } else {
        console.log(`  ⚠️  No real API data detected or displayed`);
      }

    } catch (error) {
      console.error(`  ❌ Error testing ${mockupName}:`, error.message);
      result.errors.push(error.message);
    } finally {
      await page.close();
    }
  }

  async runTests() {
    await this.initialize();

    // Test both mockups
    await this.testMockup('base-mockup.html', 'base-mockup.html');
    await this.testMockup('base-mockup2.html', 'base-mockup2.html');

    // Generate report
    await this.generateReport();

    // Cleanup
    await this.browser.close();
  }

  async generateReport() {
    console.log('\n' + '='.repeat(60));
    console.log('📋 TEST RESULTS SUMMARY');
    console.log('='.repeat(60));

    // Mockup 1 Results
    console.log('\n🎯 Base Mockup 1:');
    console.log(`  • API Calls Made: ${this.results.mockup1.apiCalls.length}`);
    console.log(`  • Data Points Displayed: ${Object.keys(this.results.mockup1.dataDisplayed).length}`);
    console.log(`  • Errors: ${this.results.mockup1.errors.length}`);
    
    if (this.results.mockup1.dataDisplayed.apiData) {
      console.log(`  • Has STR Data: ${this.results.mockup1.dataDisplayed.apiData.hasSTR}`);
      console.log(`  • Has LTR Data: ${this.results.mockup1.dataDisplayed.apiData.hasLTR}`);
    }

    // Mockup 2 Results
    console.log('\n🎯 Base Mockup 2:');
    console.log(`  • API Calls Made: ${this.results.mockup2.apiCalls.length}`);
    console.log(`  • Data Points Displayed: ${Object.keys(this.results.mockup2.dataDisplayed).length}`);
    console.log(`  • Errors: ${this.results.mockup2.errors.length}`);
    
    if (this.results.mockup2.dataDisplayed.apiData) {
      console.log(`  • Has STR Data: ${this.results.mockup2.dataDisplayed.apiData.hasSTR}`);
      console.log(`  • Has LTR Data: ${this.results.mockup2.dataDisplayed.apiData.hasLTR}`);
    }

    // Overall verdict
    console.log('\n' + '='.repeat(60));
    const mockup1Working = this.results.mockup1.apiCalls.length > 0 && 
                          Object.keys(this.results.mockup1.dataDisplayed).length > 1;
    const mockup2Working = this.results.mockup2.apiCalls.length > 0 && 
                          Object.keys(this.results.mockup2.dataDisplayed).length > 1;

    if (mockup1Working && mockup2Working) {
      console.log('✅ BOTH MOCKUPS ARE FETCHING AND DISPLAYING API DATA');
    } else if (mockup1Working || mockup2Working) {
      console.log('⚠️  ONLY ONE MOCKUP IS WORKING PROPERLY');
    } else {
      console.log('❌ NEITHER MOCKUP IS FETCHING REAL API DATA');
    }

    // Save results to file
    const reportPath = path.join(__dirname, `api-data-flow-test-${Date.now()}.json`);
    await fs.writeFile(reportPath, JSON.stringify(this.results, null, 2));
    console.log(`\n📄 Full report saved to: ${reportPath}`);
  }
}

// Run the test
const test = new APIDataFlowTest();
test.runTests().catch(console.error);