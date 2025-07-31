const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');

async function compareMockupToProduction() {
  console.log('🎨 Comparing Production to Mockup Design...\n');
  
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1440, height: 900 }
  });
  
  try {
    const comparisonDir = path.join(__dirname, 'mockup-comparison');
    await fs.mkdir(comparisonDir, { recursive: true });
    
    // 1. Load mockup design
    console.log('📐 Loading mockup design...');
    const mockupPage = await browser.newPage();
    const mockupPath = path.join(__dirname, 'ui-mockups/mobile-first-design.html');
    await mockupPage.goto(`file://${mockupPath}`, { waitUntil: 'networkidle0' });
    
    await mockupPage.screenshot({ 
      path: path.join(comparisonDir, '01-mockup-design.png'),
      fullPage: true 
    });
    
    // Extract mockup design elements
    const mockupElements = await mockupPage.evaluate(() => {
      const heroSection = document.querySelector('.mobile-hero');
      const statsCards = document.querySelectorAll('.stats-pill');
      const glassCards = document.querySelectorAll('.bg-white');
      
      return {
        hero: {
          exists: !!heroSection,
          background: heroSection ? window.getComputedStyle(heroSection).background : null
        },
        statsCards: statsCards.length,
        design: {
          borderRadius: glassCards[0] ? window.getComputedStyle(glassCards[0]).borderRadius : null,
          shadow: glassCards[0] ? window.getComputedStyle(glassCards[0]).boxShadow : null
        }
      };
    });
    
    await mockupPage.close();
    
    // 2. Load production site
    console.log('🌐 Loading production site...');
    const prodPage = await browser.newPage();
    await prodPage.goto('https://starter-pack-app.vercel.app/roi-finder.html', {
      waitUntil: 'networkidle0'
    });
    
    // Wait for new CSS to load
    await new Promise(resolve => setTimeout(resolve, 5000));
    await prodPage.reload({ waitUntil: 'networkidle0' });
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    await prodPage.screenshot({ 
      path: path.join(comparisonDir, '02-production-current.png'),
      fullPage: true 
    });
    
    // Check production implementation
    const prodElements = await prodPage.evaluate(() => {
      const heroSection = document.querySelector('.property-hero-gradient, .hero-gradient, .mobile-hero');
      const statsCards = document.querySelectorAll('.stats-pill');
      const glassCards = document.querySelectorAll('.glass-card, .card');
      const gradient = document.getElementById('animated-bg');
      
      // Check text visibility
      const textElements = document.querySelectorAll('p, span, h1, h2, h3, div');
      let invisibleText = 0;
      textElements.forEach(el => {
        const styles = window.getComputedStyle(el);
        const color = styles.color;
        if (color === 'rgba(0, 0, 0, 0)' || color === 'transparent') {
          invisibleText++;
        }
      });
      
      return {
        hero: {
          exists: !!heroSection,
          background: heroSection ? window.getComputedStyle(heroSection).background : null
        },
        statsCards: statsCards.length,
        glassCards: glassCards.length,
        gradient: {
          background: gradient ? window.getComputedStyle(gradient).background : null
        },
        textVisibility: {
          invisibleCount: invisibleText
        }
      };
    });
    
    console.log('\n📊 Mockup vs Production Comparison:');
    console.log('\nHero Section:');
    console.log(`- Mockup: ${mockupElements.hero.exists ? '✅ Has gradient hero' : '❌ No hero'}`);
    console.log(`- Production: ${prodElements.hero.exists ? '✅ Has hero' : '❌ Missing hero section'}`);
    
    console.log('\nStats Cards:');
    console.log(`- Mockup: ${mockupElements.statsCards} stats pills`);
    console.log(`- Production: ${prodElements.statsCards} stats pills`);
    
    console.log('\nGlass Effects:');
    console.log(`- Production glass cards: ${prodElements.glassCards}`);
    
    console.log('\nText Visibility:');
    console.log(`- Invisible text elements: ${prodElements.textVisibility.invisibleCount}`);
    
    // 3. Apply inline fixes to match mockup
    console.log('\n🔧 Applying mockup-matching fixes...');
    
    await prodPage.addStyleTag({
      content: `
        /* Match mockup hero section */
        .property-hero-gradient,
        .hero-section {
          background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%) !important;
          color: white !important;
          padding: 2rem !important;
          border-radius: 1rem !important;
          margin-bottom: 2rem !important;
        }
        
        /* Match mockup card styling */
        .card, .glass-card {
          background: rgba(255, 255, 255, 0.95) !important;
          border-radius: 1rem !important;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1) !important;
          border-left: 4px solid transparent !important;
        }
        
        /* Recommendation card style from mockup */
        .card:has(.text-green-600) {
          border-left-color: #10b981 !important;
        }
        
        /* Stats pills from mockup */
        .stats-pill {
          background: rgba(255, 255, 255, 0.9) !important;
          backdrop-filter: blur(10px) !important;
          border-radius: 0.75rem !important;
          padding: 1rem !important;
          text-align: center !important;
        }
        
        /* Comparable cards */
        .comparable-card {
          border: 1px solid #e5e7eb !important;
          border-radius: 0.5rem !important;
          overflow: hidden !important;
        }
        
        /* Gradient background - stronger like mockup */
        #animated-bg {
          background: linear-gradient(135deg, #ddd6fe 0%, #fce7f3 50%, #dbeafe 100%) !important;
        }
      `
    });
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await prodPage.screenshot({ 
      path: path.join(comparisonDir, '03-production-with-mockup-styles.png'),
      fullPage: true 
    });
    
    // Create comparison report
    const reportHTML = `
<!DOCTYPE html>
<html>
<head>
  <title>Mockup vs Production Comparison</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
    .header { background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; padding: 30px; border-radius: 12px; margin-bottom: 30px; }
    .comparison-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 30px; }
    .screenshot { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    .screenshot img { max-width: 100%; border: 1px solid #ddd; border-radius: 4px; }
    .differences { background: #fff3cd; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
    .fixes { background: #d4edda; padding: 20px; border-radius: 8px; }
    ul { margin: 10px 0; }
    li { margin: 5px 0; }
    .missing { color: #dc3545; }
    .present { color: #28a745; }
  </style>
</head>
<body>
  <div class="header">
    <h1>Mockup vs Production Comparison</h1>
    <p>Generated: ${new Date().toLocaleString()}</p>
  </div>
  
  <div class="differences">
    <h2>🔍 Key Differences Found</h2>
    <ul>
      <li class="${prodElements.hero.exists ? 'present' : 'missing'}">
        Hero Section: ${prodElements.hero.exists ? '✅ Present' : '❌ Missing gradient hero section'}
      </li>
      <li class="${prodElements.statsCards > 0 ? 'present' : 'missing'}">
        Stats Pills: ${prodElements.statsCards > 0 ? '✅ Found' : '❌ Missing stats cards'}
      </li>
      <li class="${prodElements.textVisibility.invisibleCount === 0 ? 'present' : 'missing'}">
        Text Visibility: ${prodElements.textVisibility.invisibleCount === 0 ? '✅ All visible' : `❌ ${prodElements.textVisibility.invisibleCount} invisible elements`}
      </li>
    </ul>
  </div>
  
  <div class="comparison-grid">
    <div class="screenshot">
      <h3>1. Original Mockup Design</h3>
      <img src="01-mockup-design.png" alt="Mockup Design">
      <p>The target design with gradient hero, stats pills, and glass cards</p>
    </div>
    <div class="screenshot">
      <h3>2. Current Production</h3>
      <img src="02-production-current.png" alt="Current Production">
      <p>Current state with visibility issues</p>
    </div>
    <div class="screenshot">
      <h3>3. With Mockup Styles</h3>
      <img src="03-production-with-mockup-styles.png" alt="With Mockup Styles">
      <p>Production with mockup-matching CSS applied</p>
    </div>
  </div>
  
  <div class="fixes">
    <h2>✅ CSS Fixes to Match Mockup</h2>
    <pre><code>/* 1. Add gradient hero section */
.property-hero-gradient {
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  padding: 2rem;
  border-radius: 1rem;
}

/* 2. Increase glass opacity for readability */
.glass-card {
  background: rgba(255, 255, 255, 0.95);
}

/* 3. Add stats pills styling */
.stats-pill {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  border-radius: 0.75rem;
}

/* 4. Stronger gradient background */
#animated-bg {
  background: linear-gradient(135deg, #ddd6fe 0%, #fce7f3 50%, #dbeafe 100%);
}</code></pre>
  </div>
</body>
</html>
    `;
    
    await fs.writeFile(
      path.join(comparisonDir, 'comparison-report.html'),
      reportHTML
    );
    
    console.log('\n📄 Comparison report saved to:', path.join(comparisonDir, 'comparison-report.html'));
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await browser.close();
  }
}

compareMockupToProduction();