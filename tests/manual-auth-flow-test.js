const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function testAuthFlow() {
  console.log('Starting manual authentication flow test...\n');

  // Ensure screenshots directory exists
  const screenshotDir = path.join(__dirname, 'auth-flow-screenshots');
  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true });
  }

  const browser = await chromium.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });
  
  const page = await context.newPage();

  try {
    // Simulate extension parameters
    const extensionParams = {
      address: '123 Main St, Toronto, ON M1A 1A1',
      price: '799000',
      propertyTaxes: '5490',
      propertyType: 'Single Family',
      bedrooms: '3',
      bathrooms: '2',
      sqft: '1800',
      mlsNumber: 'C5808234',
      mainImage: 'https://example.com/property.jpg',
      source: 'extension'
    };

    // Build URL with extension parameters
    const params = new URLSearchParams(extensionParams);
    const baseUrl = 'http://localhost:3000';
    const url = `${baseUrl}/roi-finder.html?${params.toString()}`;

    console.log('Testing URL:', url);

    // Step 1: Try to load the page
    console.log('\n1. Loading roi-finder.html with extension parameters...');
    try {
      await page.goto(url, { waitUntil: 'networkidle', timeout: 10000 });
    } catch (error) {
      console.log('Initial load failed, trying base URL first...');
      
      // Try loading the base URL first
      await page.goto(baseUrl, { waitUntil: 'networkidle', timeout: 10000 });
      await page.waitForTimeout(1000);
      
      // Now try roi-finder
      await page.goto(url, { waitUntil: 'networkidle', timeout: 10000 });
    }

    const currentUrl = page.url();
    console.log('Current URL:', currentUrl);

    await page.screenshot({ 
      path: path.join(screenshotDir, '01-initial-load.png'),
      fullPage: true 
    });

    // Step 2: Check page content
    console.log('\n2. Checking page content...');
    
    const pageTitle = await page.title();
    console.log('Page title:', pageTitle);

    // Get page text content
    const pageText = await page.evaluate(() => document.body.innerText);
    console.log('Page contains:', pageText.substring(0, 200) + '...');

    // Check for authentication elements
    const hasGoogleSignIn = await page.locator('text=/Sign in with Google|Google Sign In/i').count() > 0;
    const hasLoginForm = await page.locator('form, input[type="email"], input[type="password"]').count() > 0;
    const hasPropertyForm = await page.locator('#propertyForm, form[name="propertyForm"]').count() > 0;

    console.log('Has Google Sign In:', hasGoogleSignIn);
    console.log('Has login form:', hasLoginForm);
    console.log('Has property form:', hasPropertyForm);

    // Step 3: Check for redirects
    if (currentUrl.includes('index.html') || currentUrl.includes('login')) {
      console.log('\n3. Redirected to login page');
      
      await page.screenshot({ 
        path: path.join(screenshotDir, '02-login-page.png'),
        fullPage: true 
      });

      // Simulate authentication
      console.log('Simulating authentication...');
      await page.evaluate(() => {
        localStorage.setItem('isAuthenticated', 'true');
        localStorage.setItem('user', JSON.stringify({
          uid: 'test-user-123',
          email: 'test@example.com',
          displayName: 'Test User'
        }));
      });

      // Navigate back to roi-finder
      await page.goto(url, { waitUntil: 'networkidle' });
      console.log('Navigated back to:', page.url());

      await page.screenshot({ 
        path: path.join(screenshotDir, '03-after-auth.png'),
        fullPage: true 
      });
    }

    // Step 4: Check for property data
    console.log('\n4. Checking for property data on page...');
    
    const hasAddress = await page.locator(`text="${extensionParams.address}"`).count() > 0;
    const hasPrice = await page.locator('text=/799,000|799000/').count() > 0;
    
    console.log('Has address displayed:', hasAddress);
    console.log('Has price displayed:', hasPrice);

    // Check form fields
    const addressInput = await page.locator('input[name="address"], #address').first();
    if (await addressInput.count() > 0) {
      const addressValue = await addressInput.inputValue();
      console.log('Address input value:', addressValue);
    }

    // Step 5: Look for analyze button
    console.log('\n5. Looking for analyze button...');
    
    const analyzeButton = await page.locator('button:has-text("Analyze"), button:has-text("Start Analysis"), #analyzeBtn').first();
    const hasAnalyzeButton = await analyzeButton.count() > 0;
    
    console.log('Has analyze button:', hasAnalyzeButton);

    if (hasAnalyzeButton) {
      console.log('Clicking analyze button...');
      
      await page.screenshot({ 
        path: path.join(screenshotDir, '04-before-analyze.png'),
        fullPage: true 
      });

      await analyzeButton.click();
      
      // Wait a bit for loading
      await page.waitForTimeout(3000);
      
      await page.screenshot({ 
        path: path.join(screenshotDir, '05-during-analysis.png'),
        fullPage: true 
      });

      // Check for results
      const hasResults = await page.locator('.results, .analysis-results, #analysisResults').count() > 0;
      console.log('Has results:', hasResults);

      if (hasResults) {
        await page.screenshot({ 
          path: path.join(screenshotDir, '06-results.png'),
          fullPage: true 
        });
      }
    }

    // Final screenshot
    await page.screenshot({ 
      path: path.join(screenshotDir, '07-final-state.png'),
      fullPage: true 
    });

    // Check console for errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.error('Console error:', msg.text());
      }
    });

    console.log('\nTest completed. Screenshots saved in:', screenshotDir);

  } catch (error) {
    console.error('Test error:', error);
    
    // Capture error screenshot
    await page.screenshot({ 
      path: path.join(screenshotDir, 'error-state.png'),
      fullPage: true 
    });
  } finally {
    await browser.close();
  }
}

// Run the test
testAuthFlow().catch(console.error);