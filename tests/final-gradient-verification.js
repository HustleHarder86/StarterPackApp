const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');

async function finalGradientVerification() {
  console.log('🎯 Final Gradient Design Verification...\n');
  
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1440, height: 900 },
    args: ['--force-device-scale-factor=2'] // High quality screenshots
  });
  
  const page = await browser.newPage();
  
  try {
    const verifyDir = path.join(__dirname, 'final-gradient-verification');
    await fs.mkdir(verifyDir, { recursive: true });
    
    // Load production with cache bypass
    console.log('📱 Loading production (cache bypassed)...');
    await page.goto('https://starter-pack-app.vercel.app/roi-finder.html', {
      waitUntil: 'networkidle0',
      timeout: 30000
    });
    
    // Force reload to ensure latest CSS
    await page.evaluate(() => {
      location.reload(true);
    });
    
    await page.waitForNavigation({ waitUntil: 'networkidle0' });
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Take initial screenshot
    await page.screenshot({ 
      path: path.join(verifyDir, '01-final-production.png'),
      fullPage: true 
    });
    
    // Comprehensive verification
    const verification = await page.evaluate(() => {
      // Check all critical elements
      const animatedBg = document.getElementById('animated-bg');
      const heroSection = document.querySelector('.property-hero-gradient');
      const glassCards = document.querySelectorAll('.glass-card, .card');
      const tabButtons = document.querySelectorAll('.tab-button');
      
      // Check text visibility
      let visibleTextCount = 0;
      let invisibleTextCount = 0;
      const textElements = document.querySelectorAll('p, span, h1, h2, h3, h4, h5, h6, div, label');
      
      textElements.forEach(el => {
        if (el.textContent.trim()) {
          const styles = window.getComputedStyle(el);
          const color = styles.color;
          if (color === 'rgba(0, 0, 0, 0)' || color === 'transparent') {
            invisibleTextCount++;
          } else {
            visibleTextCount++;
          }
        }
      });
      
      // Check glass effects
      let glassEffectsCount = 0;
      glassCards.forEach(card => {
        const styles = window.getComputedStyle(card);
        if (styles.backdropFilter && styles.backdropFilter.includes('blur')) {
          glassEffectsCount++;
        }
      });
      
      // Get specific styles
      const bgStyles = animatedBg ? window.getComputedStyle(animatedBg) : null;
      const firstCard = glassCards[0] ? window.getComputedStyle(glassCards[0]) : null;
      
      return {
        gradient: {
          exists: !!animatedBg,
          background: bgStyles?.background,
          zIndex: bgStyles?.zIndex,
          opacity: bgStyles?.opacity
        },
        hero: {
          exists: !!heroSection,
          hasStatsCards: document.querySelectorAll('.stats-pill').length
        },
        cards: {
          total: glassCards.length,
          withGlassEffect: glassEffectsCount,
          firstCardBg: firstCard?.backgroundColor,
          firstCardOpacity: firstCard?.backgroundColor?.match(/[\d.]+(?=\))/)?.[0]
        },
        text: {
          visible: visibleTextCount,
          invisible: invisibleTextCount
        },
        tabButtons: tabButtons.length,
        cssFiles: Array.from(document.querySelectorAll('link[rel="stylesheet"]'))
          .map(link => link.href.split('/').pop())
      };
    });
    
    console.log('✅ Gradient Background:');
    console.log(`  - Exists: ${verification.gradient.exists}`);
    console.log(`  - Z-Index: ${verification.gradient.zIndex}`);
    console.log(`  - Opacity: ${verification.gradient.opacity}`);
    
    console.log('\n✅ Hero Section:');
    console.log(`  - Exists: ${verification.hero.exists}`);
    console.log(`  - Stats Cards: ${verification.hero.hasStatsCards}`);
    
    console.log('\n✅ Glass Effects:');
    console.log(`  - Total Cards: ${verification.cards.total}`);
    console.log(`  - With Glass Effect: ${verification.cards.withGlassEffect}`);
    console.log(`  - Card Opacity: ${verification.cards.firstCardOpacity || 'N/A'}`);
    
    console.log('\n✅ Text Visibility:');
    console.log(`  - Visible Text: ${verification.text.visible}`);
    console.log(`  - Invisible Text: ${verification.text.invisible}`);
    
    console.log('\n✅ CSS Files Loaded:');
    verification.cssFiles.forEach(file => {
      if (file.includes('glass-override.css')) {
        console.log(`  - ✅ ${file}`);
      }
    });
    
    // Test with mock data
    console.log('\n📊 Testing with mock property data...');
    
    // Navigate to login if needed
    const loginVisible = await page.$('#email');
    if (loginVisible) {
      await page.type('#email', 'test@example.com');
      await page.type('#password', 'password123');
      await page.click('#login-btn');
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    // Fill property form
    const propertyForm = await page.$('#property-address');
    if (propertyForm) {
      await page.type('#property-address', '456 Gradient Street, Toronto, ON');
      await page.type('#purchase-price', '950000');
      await page.type('#down-payment', '190000');
      await page.type('#interest-rate', '5.5');
      await page.type('#property-tax', '9500');
      await page.type('#insurance', '1500');
      await page.type('#hoa-fees', '400');
      await page.type('#management-fees', '250');
      await page.type('#maintenance', '300');
      await page.type('#vacancy-rate', '5');
      await page.type('#bedrooms', '4');
      await page.type('#bathrooms', '3');
      await page.type('#sqft', '2200');
      await page.type('#expected-rent', '3800');
      
      await page.screenshot({ 
        path: path.join(verifyDir, '02-with-property-data.png'),
        fullPage: true 
      });
      
      // Analyze property
      await page.click('#analyze-btn');
      await page.waitForSelector('#analysis-results', { 
        visible: true,
        timeout: 30000 
      });
      
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      await page.screenshot({ 
        path: path.join(verifyDir, '03-analysis-results.png'),
        fullPage: true 
      });
      
      // Check if hero section appears
      const heroAfterAnalysis = await page.$('.property-hero-gradient');
      console.log('\n✅ After Analysis:');
      console.log(`  - Hero Section: ${heroAfterAnalysis ? 'Visible' : 'Not Found'}`);
    }
    
    // Mobile view test
    console.log('\n📱 Testing mobile responsiveness...');
    await page.setViewport({ width: 375, height: 812 });
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await page.screenshot({ 
      path: path.join(verifyDir, '04-mobile-view.png'),
      fullPage: true 
    });
    
    // Create final report
    const reportHTML = `
<!DOCTYPE html>
<html>
<head>
  <title>Final Gradient Verification Report</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; background: #f5f5f5; }
    .header { 
      background: linear-gradient(135deg, #667eea, #764ba2); 
      color: white; 
      padding: 40px; 
      text-align: center;
      box-shadow: 0 4px 20px rgba(0,0,0,0.1);
    }
    .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
    .status-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin-bottom: 30px; }
    .status-card { 
      background: white; 
      padding: 25px; 
      border-radius: 12px; 
      box-shadow: 0 2px 10px rgba(0,0,0,0.08);
      border-left: 4px solid #10b981;
    }
    .status-card.warning { border-left-color: #f59e0b; }
    .status-card.error { border-left-color: #ef4444; }
    .status-card h3 { margin-top: 0; color: #1f2937; }
    .metric { font-size: 2rem; font-weight: bold; color: #10b981; }
    .screenshots { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; }
    .screenshot { 
      background: white; 
      padding: 20px; 
      border-radius: 12px; 
      box-shadow: 0 2px 10px rgba(0,0,0,0.08);
      text-align: center;
    }
    .screenshot img { 
      max-width: 100%; 
      border: 1px solid #e5e7eb; 
      border-radius: 8px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    }
    .success { color: #10b981; }
    .warning { color: #f59e0b; }
    .error { color: #ef4444; }
    .summary { 
      background: linear-gradient(135deg, #e0f2fe, #ddd6fe); 
      padding: 30px; 
      border-radius: 12px;
      margin-top: 30px;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>🎨 Final Gradient Design Verification</h1>
    <p>Generated: ${new Date().toLocaleString()}</p>
  </div>
  
  <div class="container">
    <div class="status-grid">
      <div class="status-card">
        <h3>Gradient Background</h3>
        <div class="metric ${verification.gradient.exists ? 'success' : 'error'}">
          ${verification.gradient.exists ? '✅ Active' : '❌ Missing'}
        </div>
        <p>Z-Index: ${verification.gradient.zIndex}</p>
      </div>
      
      <div class="status-card ${verification.hero.exists ? '' : 'warning'}">
        <h3>Hero Section</h3>
        <div class="metric ${verification.hero.exists ? 'success' : 'warning'}">
          ${verification.hero.exists ? '✅ Present' : '⚠️ Not Visible'}
        </div>
        <p>Stats Cards: ${verification.hero.hasStatsCards}</p>
      </div>
      
      <div class="status-card">
        <h3>Glass Effects</h3>
        <div class="metric">${verification.cards.withGlassEffect}/${verification.cards.total}</div>
        <p>Cards with blur effect</p>
      </div>
      
      <div class="status-card ${verification.text.invisible > 0 ? 'error' : ''}">
        <h3>Text Visibility</h3>
        <div class="metric ${verification.text.invisible > 0 ? 'error' : 'success'}">
          ${verification.text.invisible === 0 ? '✅ 100%' : `❌ ${verification.text.invisible} hidden`}
        </div>
        <p>${verification.text.visible} visible elements</p>
      </div>
    </div>
    
    <div class="screenshots">
      <div class="screenshot">
        <h3>Production State</h3>
        <img src="01-final-production.png" alt="Production">
      </div>
      <div class="screenshot">
        <h3>With Analysis Data</h3>
        <img src="03-analysis-results.png" alt="Analysis Results">
      </div>
      <div class="screenshot">
        <h3>Mobile View</h3>
        <img src="04-mobile-view.png" alt="Mobile" style="max-width: 375px;">
      </div>
      <div class="screenshot">
        <h3>Property Form</h3>
        <img src="02-with-property-data.png" alt="Property Form">
      </div>
    </div>
    
    <div class="summary">
      <h2>📊 Summary</h2>
      <ul>
        <li>Gradient background: <strong>${verification.gradient.exists ? 'Working correctly' : 'Needs attention'}</strong></li>
        <li>Text visibility: <strong>${verification.text.invisible === 0 ? 'All text visible' : `${verification.text.invisible} elements need fixing`}</strong></li>
        <li>Glass effects: <strong>${verification.cards.withGlassEffect} of ${verification.cards.total} cards have glass effect</strong></li>
        <li>CSS files: <strong>${verification.cssFiles.includes('glass-override.css') ? 'All loaded correctly' : 'Missing glass-override.css'}</strong></li>
      </ul>
    </div>
  </div>
</body>
</html>
    `;
    
    await fs.writeFile(
      path.join(verifyDir, 'verification-report.html'),
      reportHTML
    );
    
    console.log('\n✅ Verification complete!');
    console.log('📄 Report saved to:', path.join(verifyDir, 'verification-report.html'));
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await browser.close();
  }
}

finalGradientVerification();