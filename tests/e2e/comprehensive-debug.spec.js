const { test, expect } = require('@playwright/test');
const { VisualDebugger } = require('./helpers/visual-debugger');

test.describe('Comprehensive Application Debug', () => {
  test.describe.configure({ mode: 'serial' });

  test('Homepage functionality', async ({ page }, testInfo) => {
    const debugger = new VisualDebugger(page, testInfo);
    await debugger.init();
    
    console.log('Testing homepage...');
    await page.goto('https://starter-pack-app.vercel.app/');
    await page.waitForLoadState('networkidle');
    await debugger.captureState('homepage-initial');
    
    // Check navigation links
    const navLinks = await page.locator('.nav-links a').count();
    console.log(`Found ${navLinks} navigation links`);
    
    // Check hero section
    const heroTitle = await page.locator('h1').first().textContent();
    console.log('Hero title:', heroTitle);
    
    // Check CTA buttons
    const ctaButtons = await page.locator('a.btn-primary, button.btn-primary').count();
    console.log(`Found ${ctaButtons} CTA buttons`);
    
    // Test navigation to blog
    if (await page.locator('a[href*="blog"]').count() > 0) {
      await debugger.captureState('homepage-before-blog-click');
      await page.locator('a[href*="blog"]').first().click();
      await page.waitForLoadState('networkidle');
      await debugger.captureState('blog-page-loaded');
      await page.goBack();
    }
    
    await debugger.captureState('homepage-final');
  });

  test('Blog section functionality', async ({ page }, testInfo) => {
    const debugger = new VisualDebugger(page, testInfo);
    await debugger.init();
    
    console.log('Testing blog section...');
    await page.goto('https://starter-pack-app.vercel.app/blog.html');
    await page.waitForLoadState('networkidle');
    await debugger.captureState('blog-initial');
    
    // Wait for posts to load
    await page.waitForTimeout(3000);
    await debugger.captureState('blog-after-load');
    
    // Check for blog posts
    const blogPosts = await page.locator('.blog-card').count();
    console.log(`Found ${blogPosts} blog posts`);
    
    // Test category filters
    const categories = await page.locator('[data-category]').count();
    console.log(`Found ${categories} category filters`);
    
    if (categories > 1) {
      await page.locator('[data-category]').nth(1).click();
      await page.waitForTimeout(1000);
      await debugger.captureState('blog-category-filtered');
    }
    
    // Test search
    await page.fill('#blog-search', 'real estate');
    await page.waitForTimeout(1000);
    await debugger.captureState('blog-search-results');
    
    // Check pagination
    const pagination = await page.locator('#pagination').isVisible();
    console.log('Pagination visible:', pagination);
    
    await debugger.captureState('blog-final');
  });

  test('ROI Finder authentication and form', async ({ page }, testInfo) => {
    const debugger = new VisualDebugger(page, testInfo);
    await debugger.init();
    
    console.log('Testing ROI Finder...');
    await page.goto('https://starter-pack-app.vercel.app/roi-finder.html');
    await page.waitForLoadState('networkidle');
    await debugger.captureState('roi-finder-initial');
    
    // Check if redirected to login
    const currentUrl = page.url();
    console.log('Current URL:', currentUrl);
    
    if (currentUrl.includes('index.html') || await page.locator('#login-form').isVisible()) {
      console.log('Redirected to login page');
      await debugger.captureState('roi-finder-login-required');
    } else {
      // Check form elements
      const formElements = await page.locator('input, select, textarea').count();
      console.log(`Found ${formElements} form elements`);
      
      // Check for analyze button
      const analyzeBtn = await page.locator('button:has-text("Analyze")').count();
      console.log(`Found ${analyzeBtn} analyze buttons`);
      
      await debugger.captureState('roi-finder-form');
    }
  });

  test('Portfolio page access', async ({ page }, testInfo) => {
    const debugger = new VisualDebugger(page, testInfo);
    await debugger.init();
    
    console.log('Testing Portfolio page...');
    await page.goto('https://starter-pack-app.vercel.app/portfolio.html');
    await page.waitForLoadState('networkidle');
    await debugger.captureState('portfolio-initial');
    
    // Check if requires authentication
    const isLoginVisible = await page.locator('#login-form, #auth-screen').isVisible();
    if (isLoginVisible) {
      console.log('Portfolio requires authentication');
      await debugger.captureState('portfolio-auth-required');
    } else {
      // Check portfolio elements
      const metrics = await page.locator('.metric-card').count();
      console.log(`Found ${metrics} metric cards`);
      
      const charts = await page.locator('canvas').count();
      console.log(`Found ${charts} charts`);
      
      await debugger.captureState('portfolio-content');
    }
  });

  test('Realtor branding settings', async ({ page }, testInfo) => {
    const debugger = new VisualDebugger(page, testInfo);
    await debugger.init();
    
    console.log('Testing Realtor Settings...');
    await page.goto('https://starter-pack-app.vercel.app/realtor-settings.html');
    await page.waitForLoadState('networkidle');
    await debugger.captureState('realtor-settings-initial');
    
    // Check form elements
    const brandingInputs = await page.locator('#branding-form input, #branding-form textarea').count();
    console.log(`Found ${brandingInputs} branding input fields`);
    
    // Check preview section
    const previewVisible = await page.locator('#branding-preview').isVisible();
    console.log('Preview section visible:', previewVisible);
    
    await debugger.captureState('realtor-settings-form');
  });

  test('API endpoints health check', async ({ page }, testInfo) => {
    const debugger = new VisualDebugger(page, testInfo);
    await debugger.init();
    
    console.log('Testing API endpoints...');
    
    // Test config API
    const configResponse = await page.request.get('https://starter-pack-app.vercel.app/api/config');
    console.log('Config API status:', configResponse.status());
    
    // Test blog posts API
    const blogResponse = await page.request.get('https://starter-pack-app.vercel.app/api/blog/posts');
    console.log('Blog API status:', blogResponse.status());
    
    // Create a simple HTML page to display results
    await page.setContent(`
      <html>
        <body style="font-family: Arial; padding: 20px;">
          <h1>API Health Check Results</h1>
          <div>
            <h2>Config API</h2>
            <p>Status: ${configResponse.status()}</p>
            <pre>${JSON.stringify(await configResponse.json(), null, 2)}</pre>
          </div>
          <div>
            <h2>Blog Posts API</h2>
            <p>Status: ${blogResponse.status()}</p>
            <pre>${JSON.stringify(await blogResponse.json(), null, 2).substring(0, 500)}...</pre>
          </div>
        </body>
      </html>
    `);
    
    await debugger.captureState('api-health-check');
  });

  test('Mobile responsiveness check', async ({ page }, testInfo) => {
    const debugger = new VisualDebugger(page, testInfo);
    await debugger.init();
    
    console.log('Testing mobile responsiveness...');
    
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Test homepage mobile
    await page.goto('https://starter-pack-app.vercel.app/');
    await page.waitForLoadState('networkidle');
    await debugger.captureState('mobile-homepage');
    
    // Test blog mobile
    await page.goto('https://starter-pack-app.vercel.app/blog.html');
    await page.waitForLoadState('networkidle');
    await debugger.captureState('mobile-blog');
    
    // Check mobile menu
    const mobileMenuBtn = await page.locator('[class*="mobile-menu"], [class*="menu-toggle"], button:has-text("Menu")').count();
    console.log(`Found ${mobileMenuBtn} mobile menu buttons`);
    
    if (mobileMenuBtn > 0) {
      await page.locator('[class*="mobile-menu"], [class*="menu-toggle"]').first().click();
      await page.waitForTimeout(500);
      await debugger.captureState('mobile-menu-open');
    }
  });

  test('Error handling and 404 pages', async ({ page }, testInfo) => {
    const debugger = new VisualDebugger(page, testInfo);
    await debugger.init();
    
    console.log('Testing error handling...');
    
    // Test 404 page
    await page.goto('https://starter-pack-app.vercel.app/non-existent-page.html');
    await page.waitForLoadState('networkidle');
    await debugger.captureState('404-page');
    
    // Test API error
    const errorResponse = await page.request.get('https://starter-pack-app.vercel.app/api/non-existent');
    console.log('Non-existent API status:', errorResponse.status());
  });
});

// After all tests, generate summary report
test.afterAll(async () => {
  console.log('\n=== Comprehensive Debug Summary ===');
  console.log('All tests completed. Check screenshots in tests/e2e/screenshots/');
  console.log('To analyze results, run: node tests/e2e/screenshot-analyzer.js report');
});