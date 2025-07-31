const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');

async function checkGradientProduction() {
  console.log('🎨 Checking Gradient Implementation on Production...\n');
  
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1440, height: 900 }
  });
  
  const page = await browser.newPage();
  
  try {
    // Navigate to production
    console.log('📱 Opening production site...');
    await page.goto('https://starter-pack-app.vercel.app/roi-finder.html', {
      waitUntil: 'networkidle0',
      timeout: 30000
    });
    
    // Wait for CSS to load
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Take screenshot
    const screenshotsDir = path.join(__dirname, 'gradient-production-screenshots');
    await fs.mkdir(screenshotsDir, { recursive: true });
    
    await page.screenshot({ 
      path: path.join(screenshotsDir, 'production-with-fixes.png'),
      fullPage: true 
    });
    
    // Check gradient implementation
    const gradientCheck = await page.evaluate(() => {
      // Check animated background
      const animatedBg = document.getElementById('animated-bg');
      const animatedBgStyles = animatedBg ? window.getComputedStyle(animatedBg) : null;
      
      // Check for glass effects
      const glassCards = document.querySelectorAll('.glass-card, .card');
      const glassEffects = [];
      
      glassCards.forEach((card, index) => {
        const styles = window.getComputedStyle(card);
        if (index < 3) { // Check first 3 cards
          glassEffects.push({
            background: styles.backgroundColor,
            backdropFilter: styles.backdropFilter || styles.webkitBackdropFilter,
            hasGlass: styles.backdropFilter?.includes('blur') || false
          });
        }
      });
      
      // Check for opaque backgrounds
      const opaqueElements = [];
      const checkElements = document.querySelectorAll('.bg-white, .bg-gray-50, .bg-gray-100');
      
      checkElements.forEach(el => {
        const styles = window.getComputedStyle(el);
        const bg = styles.backgroundColor;
        if (bg && !bg.includes('rgba') && bg !== 'transparent') {
          opaqueElements.push({
            class: el.className,
            background: bg
          });
        }
      });
      
      // Check CSS files loaded
      const cssFiles = Array.from(document.querySelectorAll('link[rel="stylesheet"]'))
        .map(link => link.href.split('/').pop());
      
      return {
        gradient: {
          exists: !!animatedBg,
          visible: animatedBgStyles?.display !== 'none',
          opacity: animatedBgStyles?.opacity,
          zIndex: animatedBgStyles?.zIndex,
          background: animatedBgStyles?.background
        },
        glassEffects: {
          count: glassCards.length,
          samples: glassEffects
        },
        opaqueElements: opaqueElements.slice(0, 5),
        cssFiles: cssFiles
      };
    });
    
    console.log('\n✅ Gradient Background:');
    console.log('  - Exists:', gradientCheck.gradient.exists);
    console.log('  - Visible:', gradientCheck.gradient.visible);
    console.log('  - Opacity:', gradientCheck.gradient.opacity);
    console.log('  - Z-Index:', gradientCheck.gradient.zIndex);
    
    console.log('\n🎨 Glass Effects:');
    console.log('  - Glass cards found:', gradientCheck.glassEffects.count);
    gradientCheck.glassEffects.samples.forEach((sample, i) => {
      console.log(`  - Card ${i + 1}: ${sample.hasGlass ? '✅ Has glass effect' : '❌ No glass effect'}`);
    });
    
    console.log('\n📋 CSS Files Loaded:');
    gradientCheck.cssFiles.forEach(file => {
      console.log(`  - ${file}`);
    });
    
    if (gradientCheck.opaqueElements.length > 0) {
      console.log('\n⚠️  Potential Opaque Elements:');
      gradientCheck.opaqueElements.forEach(el => {
        console.log(`  - ${el.class.substring(0, 50)}... - ${el.background}`);
      });
    }
    
    // Create visual comparison
    const comparisonHTML = `
<!DOCTYPE html>
<html>
<head>
  <title>Gradient Production Check</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
    .header { background: linear-gradient(135deg, #667eea, #764ba2); color: white; padding: 30px; border-radius: 12px; margin-bottom: 30px; }
    .status { background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
    .screenshot { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    .screenshot img { max-width: 100%; border: 1px solid #ddd; border-radius: 4px; }
    .success { color: #10b981; font-weight: bold; }
    .warning { color: #f59e0b; font-weight: bold; }
    .error { color: #ef4444; font-weight: bold; }
  </style>
</head>
<body>
  <div class="header">
    <h1>Gradient Production Check</h1>
    <p>Generated: ${new Date().toLocaleString()}</p>
  </div>
  
  <div class="status">
    <h2>Implementation Status</h2>
    <p class="${gradientCheck.gradient.visible ? 'success' : 'error'}">
      Gradient Background: ${gradientCheck.gradient.visible ? '✅ Visible' : '❌ Not Visible'}
    </p>
    <p class="${gradientCheck.glassEffects.count > 0 ? 'success' : 'error'}">
      Glass Effects: ${gradientCheck.glassEffects.count} components found
    </p>
    <p class="${gradientCheck.cssFiles.includes('glass-override.css') ? 'success' : 'warning'}">
      Glass Override CSS: ${gradientCheck.cssFiles.includes('glass-override.css') ? '✅ Loaded' : '⚠️ Not Found'}
    </p>
  </div>
  
  <div class="screenshot">
    <h2>Current Production Output</h2>
    <img src="production-with-fixes.png" alt="Production with Fixes">
  </div>
</body>
</html>
    `;
    
    await fs.writeFile(
      path.join(screenshotsDir, 'production-check.html'),
      comparisonHTML
    );
    
    console.log('\n📄 Report saved to:', path.join(screenshotsDir, 'production-check.html'));
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await browser.close();
  }
}

checkGradientProduction();