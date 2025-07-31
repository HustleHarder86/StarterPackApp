const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs').promises;

async function captureGradientScreenshots() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });
  
  const screenshotDir = path.join(__dirname, 'screenshots', 'gradient-check');
  await fs.mkdir(screenshotDir, { recursive: true });
  
  try {
    // Navigate to the app
    console.log('Navigating to app...');
    await page.goto('http://localhost:8080/roi-finder.html?e2e_test_mode=true', {
      waitUntil: 'networkidle2',
      timeout: 30000
    });
    
    // Wait a bit for styles to load
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Capture initial state
    console.log('Capturing login screen...');
    await page.screenshot({ 
      path: path.join(screenshotDir, '01-login-screen.png'),
      fullPage: true 
    });
    
    // Check what's visible
    const pageContent = await page.evaluate(() => {
      const loginSection = document.getElementById('login-section');
      const loginCard = document.getElementById('login-card');
      const nav = document.querySelector('nav');
      const animatedBg = document.getElementById('animated-bg');
      
      return {
        loginVisible: loginSection && !loginSection.classList.contains('hidden'),
        loginCardClasses: loginCard ? loginCard.className : 'not found',
        navClasses: nav ? nav.className : 'not found',
        animatedBgContent: animatedBg ? animatedBg.innerHTML.substring(0, 100) : 'not found',
        bodyFont: window.getComputedStyle(document.body).fontFamily
      };
    });
    
    console.log('Page content:', pageContent);
    
    // Try to show property form
    await page.evaluate(() => {
      if (window.appState) {
        window.appState.currentUser = { email: 'test@example.com' };
      }
      const loginSection = document.getElementById('login-section');
      const propertySection = document.getElementById('property-input-section');
      if (loginSection) loginSection.classList.add('hidden');
      if (propertySection) propertySection.classList.remove('hidden');
    });
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    console.log('Capturing property form...');
    await page.screenshot({ 
      path: path.join(screenshotDir, '02-property-form.png'),
      fullPage: true 
    });
    
    // Check gradient elements
    const gradientCheck = await page.evaluate(() => {
      const results = {
        glassElements: [],
        gradientElements: [],
        issues: []
      };
      
      // Find all elements with glass classes
      document.querySelectorAll('.glass, .glass-card, .glass-dark').forEach(el => {
        results.glassElements.push({
          tag: el.tagName,
          classes: el.className,
          visible: el.offsetHeight > 0
        });
      });
      
      // Find all elements with gradient classes
      document.querySelectorAll('[class*="gradient-"]').forEach(el => {
        results.gradientElements.push({
          tag: el.tagName,
          classes: el.className,
          visible: el.offsetHeight > 0
        });
      });
      
      // Check CSS is loaded
      const designSystemLink = document.querySelector('link[href*="design-system.css"]');
      if (!designSystemLink) {
        results.issues.push('design-system.css not linked');
      }
      
      // Check if gradient CSS variables exist
      const rootStyles = getComputedStyle(document.documentElement);
      const gradientPrimary = rootStyles.getPropertyValue('--gradient-primary');
      if (!gradientPrimary) {
        results.issues.push('CSS variables not loaded');
      }
      
      return results;
    });
    
    console.log('Gradient elements found:', gradientCheck);
    
    // Save results
    await fs.writeFile(
      path.join(screenshotDir, 'gradient-check.json'),
      JSON.stringify({ pageContent, gradientCheck }, null, 2)
    );
    
    console.log(`\nScreenshots saved to: ${screenshotDir}`);
    console.log('Glass elements found:', gradientCheck.glassElements.length);
    console.log('Gradient elements found:', gradientCheck.gradientElements.length);
    if (gradientCheck.issues.length > 0) {
      console.log('Issues:', gradientCheck.issues);
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await browser.close();
  }
}

// Kill any existing servers and start fresh
const { exec } = require('child_process');
exec('pkill -f "python3 -m http.server"', () => {
  // Start server
  console.log('Starting HTTP server...');
  exec('python3 -m http.server 8080', { cwd: path.join(__dirname, '..') });
  
  // Wait for server to start
  setTimeout(() => {
    captureGradientScreenshots();
  }, 2000);
});