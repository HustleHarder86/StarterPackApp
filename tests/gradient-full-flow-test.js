const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');

async function testGradientFullFlow() {
  console.log('🎨 Testing Gradient Design Full User Flow...\n');
  
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1440, height: 900 }
  });
  
  const page = await browser.newPage();
  
  try {
    const screenshotsDir = path.join(__dirname, 'gradient-full-flow');
    await fs.mkdir(screenshotsDir, { recursive: true });
    
    // 1. Navigate to the app
    console.log('📱 Loading application...');
    await page.goto('https://starter-pack-app.vercel.app/roi-finder.html', {
      waitUntil: 'networkidle0',
      timeout: 30000
    });
    
    // Wait for deployment to complete
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Reload to ensure latest CSS
    await page.reload({ waitUntil: 'networkidle0' });
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Take initial screenshot
    await page.screenshot({ 
      path: path.join(screenshotsDir, '01-initial-state.png'),
      fullPage: true 
    });
    
    // Check if glass-override.css is loaded
    const cssCheck = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('link[rel="stylesheet"]'));
      return links.map(link => link.href);
    });
    
    console.log('\n📋 CSS Files Loaded:');
    cssCheck.forEach(css => {
      if (css.includes('glass-override.css')) {
        console.log('  ✅ glass-override.css loaded!');
      }
    });
    
    // Check gradient visibility
    const gradientCheck = await page.evaluate(() => {
      const animatedBg = document.getElementById('animated-bg');
      const bodyBg = window.getComputedStyle(document.body).backgroundColor;
      const mainContent = document.getElementById('main-content');
      const mainBg = mainContent ? window.getComputedStyle(mainContent).backgroundColor : null;
      
      // Check for glass effects
      const elements = document.querySelectorAll('*');
      let glassCount = 0;
      let opaqueWhiteCount = 0;
      
      elements.forEach(el => {
        const styles = window.getComputedStyle(el);
        if (styles.backdropFilter && styles.backdropFilter.includes('blur')) {
          glassCount++;
        }
        if (styles.backgroundColor === 'rgb(255, 255, 255)') {
          opaqueWhiteCount++;
        }
      });
      
      return {
        gradient: {
          visible: animatedBg && window.getComputedStyle(animatedBg).display !== 'none',
          zIndex: animatedBg ? window.getComputedStyle(animatedBg).zIndex : null
        },
        bodyBackground: bodyBg,
        mainBackground: mainBg,
        glassEffectsCount: glassCount,
        opaqueWhiteCount: opaqueWhiteCount
      };
    });
    
    console.log('\n🎨 Gradient Status:');
    console.log('  - Gradient visible:', gradientCheck.gradient.visible);
    console.log('  - Gradient z-index:', gradientCheck.gradient.zIndex);
    console.log('  - Body background:', gradientCheck.bodyBackground);
    console.log('  - Main background:', gradientCheck.mainBackground);
    console.log('  - Glass effects count:', gradientCheck.glassEffectsCount);
    console.log('  - Opaque white elements:', gradientCheck.opaqueWhiteCount);
    
    // Mobile view
    console.log('\n📱 Testing mobile view...');
    await page.setViewport({ width: 375, height: 812 });
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await page.screenshot({ 
      path: path.join(screenshotsDir, '02-mobile-view.png'),
      fullPage: true 
    });
    
    // Create comparison report
    const reportHTML = `
<!DOCTYPE html>
<html>
<head>
  <title>Gradient Full Flow Test</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
    .header { background: linear-gradient(135deg, #667eea, #764ba2); color: white; padding: 30px; border-radius: 12px; margin-bottom: 30px; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; }
    .screenshot { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    .screenshot img { max-width: 100%; border: 1px solid #ddd; border-radius: 4px; }
    .status { background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
    .success { color: #10b981; }
    .warning { color: #f59e0b; }
    .error { color: #ef4444; }
    .issue { background: #fee; padding: 15px; border-radius: 8px; margin: 10px 0; }
  </style>
</head>
<body>
  <div class="header">
    <h1>Gradient Design Full Flow Test</h1>
    <p>Generated: ${new Date().toLocaleString()}</p>
    <p>Testing complete user flow with gradient design implementation</p>
  </div>
  
  <div class="status">
    <h2>Current Issues Found</h2>
    ${!cssCheck.some(css => css.includes('glass-override.css')) ? `
    <div class="issue">
      <strong>❌ glass-override.css not loaded</strong>
      <p>The glass morphism override CSS file is not being loaded on production. This is why the glass effects are not fully applied.</p>
    </div>
    ` : ''}
    ${gradientCheck.gradient.zIndex === '0' ? `
    <div class="issue">
      <strong>⚠️ Gradient z-index should be -1</strong>
      <p>The gradient background has z-index: 0 instead of -1, which might cause layering issues.</p>
    </div>
    ` : ''}
    ${gradientCheck.opaqueWhiteCount > 5 ? `
    <div class="issue">
      <strong>⚠️ ${gradientCheck.opaqueWhiteCount} opaque white elements found</strong>
      <p>There are still elements with solid white backgrounds that should have glass effects.</p>
    </div>
    ` : ''}
  </div>
  
  <div class="status">
    <h2>Implementation Status</h2>
    <ul>
      <li>Gradient Background: <span class="${gradientCheck.gradient.visible ? 'success' : 'error'}">${gradientCheck.gradient.visible ? '✅ Visible' : '❌ Not Visible'}</span></li>
      <li>Glass Effects: <span class="${gradientCheck.glassEffectsCount > 10 ? 'success' : 'warning'}">${gradientCheck.glassEffectsCount} elements with blur effect</span></li>
      <li>Body Transparency: <span class="${gradientCheck.bodyBackground === 'rgba(0, 0, 0, 0)' ? 'success' : 'error'}">${gradientCheck.bodyBackground}</span></li>
      <li>CSS Files: <span class="${cssCheck.some(css => css.includes('glass-override.css')) ? 'success' : 'error'}">${cssCheck.some(css => css.includes('glass-override.css')) ? '✅ All loaded' : '❌ Missing glass-override.css'}</span></li>
    </ul>
  </div>
  
  <div class="grid">
    <div class="screenshot">
      <h3>Desktop View</h3>
      <img src="01-initial-state.png" alt="Desktop View">
    </div>
    <div class="screenshot">
      <h3>Mobile View</h3>
      <img src="02-mobile-view.png" alt="Mobile View" style="max-width: 375px; margin: 0 auto; display: block;">
    </div>
  </div>
  
  <div class="status">
    <h2>Next Steps</h2>
    <ol>
      <li>Wait for Vercel deployment to complete (glass-override.css needs to be deployed)</li>
      <li>Verify gradient z-index is set to -1 in production</li>
      <li>Check that all component backgrounds are using glass effects</li>
      <li>Test with actual property data to see full analysis flow</li>
    </ol>
  </div>
</body>
</html>
    `;
    
    await fs.writeFile(
      path.join(screenshotsDir, 'test-report.html'),
      reportHTML
    );
    
    console.log('\n✅ Test complete!');
    console.log('📄 Report saved to:', path.join(screenshotsDir, 'test-report.html'));
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await browser.close();
  }
}

testGradientFullFlow();