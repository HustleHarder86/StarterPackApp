const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');

async function debugGradientVisibility() {
  console.log('🔍 Debugging Gradient Visibility Issues...\n');
  
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1440, height: 900 }
  });
  
  const page = await browser.newPage();
  
  try {
    const debugDir = path.join(__dirname, 'gradient-visibility-debug');
    await fs.mkdir(debugDir, { recursive: true });
    
    // Navigate to production
    console.log('📱 Loading production site...');
    await page.goto('https://starter-pack-app.vercel.app/roi-finder.html', {
      waitUntil: 'networkidle0'
    });
    
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Take baseline screenshot
    await page.screenshot({ 
      path: path.join(debugDir, '01-current-state.png'),
      fullPage: true 
    });
    
    // Analyze visibility issues
    const visibilityAnalysis = await page.evaluate(() => {
      const issues = [];
      
      // Check text contrast
      const checkTextContrast = (element) => {
        const styles = window.getComputedStyle(element);
        const color = styles.color;
        const bgColor = styles.backgroundColor;
        
        // Parse RGB values
        const parseRGB = (color) => {
          const match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
          return match ? [parseInt(match[1]), parseInt(match[2]), parseInt(match[3])] : null;
        };
        
        const textRGB = parseRGB(color);
        const bgRGB = parseRGB(bgColor);
        
        if (textRGB && bgRGB) {
          // Simple contrast check
          const brightness = (rgb) => (rgb[0] * 299 + rgb[1] * 587 + rgb[2] * 114) / 1000;
          const textBrightness = brightness(textRGB);
          const bgBrightness = brightness(bgRGB);
          const contrast = Math.abs(textBrightness - bgBrightness);
          
          return {
            color,
            bgColor,
            contrast,
            isLowContrast: contrast < 125
          };
        }
        return null;
      };
      
      // Check all text elements
      const textElements = document.querySelectorAll('p, span, h1, h2, h3, h4, h5, h6, div, label');
      let lowContrastCount = 0;
      const lowContrastExamples = [];
      
      textElements.forEach(el => {
        const contrast = checkTextContrast(el);
        if (contrast && contrast.isLowContrast && el.textContent.trim()) {
          lowContrastCount++;
          if (lowContrastExamples.length < 5) {
            lowContrastExamples.push({
              text: el.textContent.substring(0, 50),
              color: contrast.color,
              bgColor: contrast.bgColor,
              className: el.className
            });
          }
        }
      });
      
      // Check gradient background
      const animatedBg = document.getElementById('animated-bg');
      const gradientStyles = animatedBg ? window.getComputedStyle(animatedBg) : null;
      
      // Check glass effects
      const glassElements = document.querySelectorAll('.glass-card, .card, [class*="rounded"]');
      const glassIssues = [];
      
      glassElements.forEach(el => {
        const styles = window.getComputedStyle(el);
        const bg = styles.backgroundColor;
        const backdrop = styles.backdropFilter || styles.webkitBackdropFilter;
        
        if (bg.includes('0.7') || bg.includes('0.5')) {
          glassIssues.push({
            className: el.className.substring(0, 50),
            background: bg,
            backdropFilter: backdrop
          });
        }
      });
      
      // Check specific problem areas
      const propertyCards = document.querySelectorAll('[class*="property-card"], [class*="comparable"]');
      const tabButtons = document.querySelectorAll('.tab-button');
      const heroSection = document.querySelector('.property-hero-gradient, .hero-gradient');
      
      return {
        lowContrast: {
          count: lowContrastCount,
          examples: lowContrastExamples
        },
        gradient: {
          exists: !!animatedBg,
          background: gradientStyles?.background,
          opacity: gradientStyles?.opacity,
          zIndex: gradientStyles?.zIndex
        },
        glassEffects: {
          count: glassElements.length,
          issues: glassIssues.slice(0, 5)
        },
        components: {
          propertyCards: propertyCards.length,
          tabButtons: tabButtons.length,
          heroSection: !!heroSection
        }
      };
    });
    
    console.log('\n❌ Visibility Issues Found:');
    console.log(`- Low contrast text elements: ${visibilityAnalysis.lowContrast.count}`);
    console.log('\nExamples of low contrast text:');
    visibilityAnalysis.lowContrast.examples.forEach(ex => {
      console.log(`  - "${ex.text.trim()}"...`);
      console.log(`    Color: ${ex.color}, BG: ${ex.bgColor}`);
    });
    
    console.log('\n🎨 Gradient Status:');
    console.log(`- Background: ${visibilityAnalysis.gradient.background?.substring(0, 50)}...`);
    console.log(`- Opacity: ${visibilityAnalysis.gradient.opacity}`);
    console.log(`- Z-Index: ${visibilityAnalysis.gradient.zIndex}`);
    
    console.log('\n🔍 Glass Effects Issues:');
    visibilityAnalysis.glassEffects.issues.forEach(issue => {
      console.log(`- ${issue.className}: ${issue.background}`);
    });
    
    console.log('\n📦 Components:');
    console.log(`- Property cards: ${visibilityAnalysis.components.propertyCards}`);
    console.log(`- Tab buttons: ${visibilityAnalysis.components.tabButtons}`);
    console.log(`- Hero section: ${visibilityAnalysis.components.heroSection}`);
    
    // Test fixes by injecting CSS
    console.log('\n🔧 Testing CSS fixes...');
    
    await page.addStyleTag({
      content: `
        /* Fix text contrast */
        body, p, span, div, h1, h2, h3, h4, h5, h6 {
          color: #1f2937 !important;
        }
        
        /* Darken glass backgrounds for better contrast */
        .glass-card, .card, [class*="rounded"] {
          background: rgba(255, 255, 255, 0.85) !important;
          backdrop-filter: blur(10px) !important;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.07) !important;
        }
        
        /* Stronger gradient background */
        #animated-bg {
          background: linear-gradient(135deg, #e0e7ff 0%, #fce7f3 50%, #dbeafe 100%) !important;
          opacity: 1 !important;
        }
        
        /* Fix white on white text */
        .text-white {
          color: #ffffff !important;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1) !important;
        }
        
        /* Ensure form inputs are visible */
        input, select, textarea {
          background: rgba(255, 255, 255, 0.9) !important;
          border: 1px solid rgba(0, 0, 0, 0.1) !important;
          color: #1f2937 !important;
        }
        
        /* Fix tab visibility */
        .tab-button {
          background: rgba(255, 255, 255, 0.9) !important;
          color: #1f2937 !important;
        }
        
        .tab-button.active {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
          color: white !important;
        }
      `
    });
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await page.screenshot({ 
      path: path.join(debugDir, '02-with-fixes.png'),
      fullPage: true 
    });
    
    // Create comparison report
    const reportHTML = `
<!DOCTYPE html>
<html>
<head>
  <title>Gradient Visibility Debug Report</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
    .header { background: linear-gradient(135deg, #667eea, #764ba2); color: white; padding: 30px; border-radius: 12px; margin-bottom: 30px; }
    .issue { background: #fee; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
    .fix { background: #d4edda; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
    .comparison { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
    .screenshot { background: white; padding: 20px; border-radius: 8px; }
    .screenshot img { max-width: 100%; border: 1px solid #ddd; }
    pre { background: #f8f9fa; padding: 15px; border-radius: 4px; overflow-x: auto; }
  </style>
</head>
<body>
  <div class="header">
    <h1>Gradient Visibility Debug Report</h1>
    <p>Generated: ${new Date().toLocaleString()}</p>
  </div>
  
  <div class="issue">
    <h2>🚨 Critical Issues Found</h2>
    <ol>
      <li><strong>Low Contrast Text:</strong> ${visibilityAnalysis.lowContrast.count} elements have poor text visibility</li>
      <li><strong>Glass Effects Too Transparent:</strong> Background opacity at 0.7 is too low for readability</li>
      <li><strong>Gradient Too Subtle:</strong> Current gradient doesn't provide enough visual interest</li>
      <li><strong>Missing Hero Section:</strong> No gradient hero section like in mockup</li>
    </ol>
  </div>
  
  <div class="fix">
    <h2>✅ Recommended Fixes</h2>
    <pre><code>/* 1. Fix text contrast */
.glass-card, .card {
  background: rgba(255, 255, 255, 0.85) !important; /* Increase from 0.7 */
}

/* 2. Ensure text is always readable */
body { color: #1f2937 !important; }

/* 3. Stronger gradient background */
#animated-bg {
  background: linear-gradient(135deg, #e0e7ff 0%, #fce7f3 50%, #dbeafe 100%) !important;
}

/* 4. Fix specific components */
.tab-button:not(.active) {
  background: rgba(255, 255, 255, 0.9) !important;
  color: #1f2937 !important;
}</code></pre>
  </div>
  
  <div class="comparison">
    <div class="screenshot">
      <h3>Current State (Visibility Issues)</h3>
      <img src="01-current-state.png" alt="Current State">
    </div>
    <div class="screenshot">
      <h3>With CSS Fixes Applied</h3>
      <img src="02-with-fixes.png" alt="With Fixes">
    </div>
  </div>
</body>
</html>
    `;
    
    await fs.writeFile(
      path.join(debugDir, 'debug-report.html'),
      reportHTML
    );
    
    console.log('\n📄 Debug report saved to:', path.join(debugDir, 'debug-report.html'));
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await browser.close();
  }
}

debugGradientVisibility();