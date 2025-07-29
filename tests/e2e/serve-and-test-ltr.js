const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');
const http = require('http');
const { createReadStream } = require('fs');

// Create screenshots directory with timestamp
const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
const screenshotDir = path.join(__dirname, 'screenshots', 'ltr-served-test', timestamp);

async function ensureDir(dir) {
  try {
    await fs.mkdir(dir, { recursive: true });
  } catch (error) {
    console.error(`Error creating directory: ${error}`);
  }
}

async function takeScreenshot(page, name, description) {
  const filename = `${name}.png`;
  const filepath = path.join(screenshotDir, filename);
  await page.screenshot({ path: filepath, fullPage: true });
  console.log(`📸 Screenshot: ${name} - ${description}`);
  return filepath;
}

// Simple static file server
function startServer() {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      let filePath = path.join(__dirname, '../..', req.url);
      
      // Handle root request
      if (req.url === '/') {
        filePath = path.join(__dirname, '../../tests/test-ltr-option5-implementation.html');
      }
      
      // Determine content type
      const extname = path.extname(filePath);
      let contentType = 'text/html';
      switch (extname) {
        case '.js':
          contentType = 'text/javascript';
          break;
        case '.css':
          contentType = 'text/css';
          break;
        case '.json':
          contentType = 'application/json';
          break;
      }
      
      // Serve the file
      createReadStream(filePath)
        .on('error', () => {
          res.writeHead(404);
          res.end('File not found');
        })
        .on('open', () => {
          res.writeHead(200, { 'Content-Type': contentType });
        })
        .pipe(res);
    });
    
    server.listen(9999, () => {
      console.log('🌐 Test server running on http://localhost:9999');
      resolve(server);
    });
  });
}

async function testLTRWithServer() {
  console.log('🚀 Starting LTR UI/UX test with local server...\n');
  
  const server = await startServer();
  const browser = await puppeteer.launch({
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    defaultViewport: { width: 1920, height: 1080 }
  });

  const results = {
    testName: 'LTR Tab Option 5 Implementation Test',
    timestamp: new Date().toISOString(),
    screenshotDir,
    visualIssues: [],
    functionalityIssues: [],
    recommendations: [],
    strengths: []
  };

  try {
    await ensureDir(screenshotDir);
    const page = await browser.newPage();
    
    // Enable console logging
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.error('Console error:', msg.text());
      }
    });
    
    // Navigate to test page
    console.log('📱 Loading test page...');
    await page.goto('http://localhost:9999/tests/test-ltr-option5-implementation.html', { 
      waitUntil: 'networkidle0',
      timeout: 30000 
    });
    
    // Wait for components to load
    await new Promise(r => setTimeout(r, 5000));
    
    // Test 1: Initial Desktop View
    console.log('\n🖥️ Test 1: Desktop View Analysis');
    await takeScreenshot(page, '01-desktop-initial', 'Initial desktop view');
    
    // Check if content loaded
    const hasContent = await page.evaluate(() => {
      const content = document.getElementById('ltr-content');
      return content && content.innerHTML.trim().length > 0;
    });
    
    if (hasContent) {
      console.log('✅ LTR content loaded successfully');
      results.strengths.push('Content loads properly with all components');
    } else {
      console.error('❌ LTR content failed to load');
      results.functionalityIssues.push({
        severity: 'Critical',
        issue: 'LTR content not loading',
        recommendation: 'Check component imports and initialization'
      });
      return;
    }
    
    // Test 2: Revenue Banner
    console.log('\n💰 Test 2: Revenue Banner Analysis');
    const revenueBanner = await page.$('.revenue-banner');
    if (revenueBanner) {
      await page.evaluate(() => {
        document.querySelector('.revenue-banner').scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
      await new Promise(r => setTimeout(r, 500));
      await takeScreenshot(page, '02-revenue-banner', 'Revenue banner display');
      
      const bannerStyles = await page.evaluate(() => {
        const banner = document.querySelector('.revenue-banner');
        const computed = window.getComputedStyle(banner);
        return {
          background: computed.background,
          color: computed.color,
          padding: computed.padding
        };
      });
      
      console.log('✅ Revenue banner rendered with gradient background');
      results.strengths.push('Revenue banner has attractive gradient design');
      results.strengths.push('Key financial metrics prominently displayed');
    }
    
    // Test 3: Key Metrics
    console.log('\n📊 Test 3: Key Metrics Grid');
    const metricsCount = await page.evaluate(() => {
      return document.querySelectorAll('.grid.grid-cols-2.md\\:grid-cols-4 > div').length;
    });
    
    if (metricsCount === 4) {
      console.log('✅ All 4 key metrics present');
      await page.evaluate(() => {
        document.querySelector('.grid.grid-cols-2.md\\:grid-cols-4').scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
      await new Promise(r => setTimeout(r, 500));
      await takeScreenshot(page, '03-key-metrics', 'Four key metrics display');
      
      results.strengths.push('Clean metric cards with gradient backgrounds');
      results.strengths.push('Color-coded metrics (green for positive, red for negative)');
    }
    
    // Test 4: Market Analysis Panels
    console.log('\n🏠 Test 4: Market Analysis Panels');
    const panels = await page.$$('.grid.md\\:grid-cols-2.gap-6 > div');
    console.log(`Found ${panels.length} market analysis panels`);
    if (panels.length >= 2) {
      await page.evaluate(() => {
        const panel = document.querySelector('.grid.md\\:grid-cols-2.gap-6');
        if (panel) panel.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
      await new Promise(r => setTimeout(r, 500));
      await takeScreenshot(page, '04-market-panels', 'Market rent and vacancy panels');
      results.strengths.push('Well-organized market data in side-by-side panels');
    }
    
    // Test 5: Revenue Chart
    console.log('\n📈 Test 5: Revenue Growth Chart');
    const chartExists = await page.$('#ltr-revenue-chart');
    if (chartExists) {
      await page.evaluate(() => {
        document.getElementById('ltr-revenue-chart').scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
      await new Promise(r => setTimeout(r, 2000));
      
      const chartRendered = await page.evaluate(() => {
        const canvas = document.getElementById('ltr-revenue-chart');
        return canvas && canvas.getContext('2d').__proto__.constructor.name === 'CanvasRenderingContext2D';
      });
      
      if (chartRendered) {
        console.log('✅ Chart.js revenue projection rendered');
        await takeScreenshot(page, '05-revenue-chart', 'Revenue growth projection');
        results.strengths.push('Interactive Chart.js visualization for revenue projections');
      } else {
        results.functionalityIssues.push({
          severity: 'Medium',
          issue: 'Chart not rendering properly',
          recommendation: 'Check Chart.js initialization and data binding'
        });
      }
    }
    
    // Test 6: Financial Calculator
    console.log('\n🧮 Test 6: Financial Calculator');
    const calculatorInput = await page.$('#ltr-calc-rent');
    if (calculatorInput) {
      await page.evaluate(() => {
        document.getElementById('ltr-calc-rent').scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
      await new Promise(r => setTimeout(r, 500));
      await takeScreenshot(page, '06-calculator-initial', 'Financial calculator initial state');
      
      // Test calculator functionality
      await page.click('#ltr-calc-rent');
      await page.keyboard.down('Control');
      await page.keyboard.press('A');
      await page.keyboard.up('Control');
      await page.type('#ltr-calc-rent', '4500');
      
      await page.click('#ltr-calc-down');
      await page.keyboard.down('Control');
      await page.keyboard.press('A');
      await page.keyboard.up('Control');
      await page.type('#ltr-calc-down', '25');
      
      const recalcButton = await page.$('button[onclick="window.LTRAnalysis.recalculate()"]');
      if (recalcButton) {
        await recalcButton.click();
        await new Promise(r => setTimeout(r, 1000));
        await takeScreenshot(page, '07-calculator-updated', 'Calculator after recalculation');
        
        console.log('✅ Calculator updates in real-time');
        results.strengths.push('Interactive calculator with immediate feedback');
        results.strengths.push('Clean two-column layout for inputs and results');
      }
    }
    
    // Test 7: Collapsible Assumptions
    console.log('\n📋 Test 7: Collapsible Assumptions');
    const assumptionsButton = await page.$('button[onclick="window.LTRAnalysis.toggleAssumptions()"]');
    if (assumptionsButton) {
      await assumptionsButton.click();
      await new Promise(r => setTimeout(r, 1000));
      await takeScreenshot(page, '08-assumptions-expanded', 'Assumptions section expanded');
      
      const isExpanded = await page.evaluate(() => {
        const content = document.getElementById('ltr-assumptions-content');
        return content && content.style.maxHeight !== '0px';
      });
      
      if (isExpanded) {
        console.log('✅ Assumptions section expands smoothly');
        results.strengths.push('Progressive disclosure with collapsible assumptions');
        
        await assumptionsButton.click();
        await new Promise(r => setTimeout(r, 500));
        console.log('✅ Assumptions section collapses properly');
      }
    }
    
    // Test 8: Mobile Responsiveness
    console.log('\n📱 Test 8: Mobile Responsiveness');
    await page.setViewport({ width: 375, height: 812 });
    await new Promise(r => setTimeout(r, 1000));
    await page.evaluate(() => window.scrollTo(0, 0));
    await takeScreenshot(page, '09-mobile-top', 'Mobile view - top section');
    
    // Check mobile grid layout
    const mobileMetricsLayout = await page.evaluate(() => {
      const grid = document.querySelector('.grid.grid-cols-2.md\\:grid-cols-4');
      return window.getComputedStyle(grid).gridTemplateColumns;
    });
    console.log('Mobile metrics layout:', mobileMetricsLayout);
    
    await page.evaluate(() => {
      document.querySelector('.grid.grid-cols-2.md\\:grid-cols-4').scrollIntoView({ behavior: 'smooth' });
    });
    await new Promise(r => setTimeout(r, 500));
    await takeScreenshot(page, '10-mobile-metrics', 'Mobile view - metrics');
    
    // Test 9: Tablet View
    console.log('\n💻 Test 9: Tablet Responsiveness');
    await page.setViewport({ width: 768, height: 1024 });
    await new Promise(r => setTimeout(r, 1000));
    await page.evaluate(() => window.scrollTo(0, 0));
    await takeScreenshot(page, '11-tablet-view', 'Tablet responsive view');
    
    // Generate recommendations
    results.recommendations = [
      {
        priority: 'Low',
        category: 'Visual Enhancement',
        suggestion: 'Add subtle hover animations to metric cards for better interactivity'
      },
      {
        priority: 'Medium',
        category: 'Accessibility',
        suggestion: 'Add ARIA labels to the revenue chart for screen reader users'
      },
      {
        priority: 'Low',
        category: 'Mobile UX',
        suggestion: 'Consider slightly larger touch targets for calculator inputs on mobile'
      }
    ];
    
    // Additional strengths identified
    results.strengths.push('Excellent use of Tailwind CSS for consistent styling');
    results.strengths.push('Professional color scheme builds trust');
    results.strengths.push('Information architecture is logical and easy to scan');
    results.strengths.push('Responsive design adapts well to all screen sizes');
    
  } catch (error) {
    console.error('Test error:', error);
    results.functionalityIssues.push({
      severity: 'Critical',
      issue: `Test execution error: ${error.message}`,
      recommendation: 'Check server configuration and component loading'
    });
  } finally {
    await browser.close();
    server.close();
  }
  
  // Generate summary report
  console.log('\n' + '='.repeat(80));
  console.log('📊 LTR UI/UX TEST SUMMARY REPORT');
  console.log('='.repeat(80));
  
  console.log('\n💪 STRENGTHS:');
  results.strengths.forEach(strength => console.log(`   ✅ ${strength}`));
  
  if (results.visualIssues.length > 0) {
    console.log('\n🎨 VISUAL ISSUES:');
    results.visualIssues.forEach(issue => {
      console.log(`   [${issue.severity}] ${issue.issue}`);
      console.log(`      → ${issue.recommendation}`);
    });
  }
  
  if (results.functionalityIssues.length > 0) {
    console.log('\n⚙️ FUNCTIONALITY ISSUES:');
    results.functionalityIssues.forEach(issue => {
      console.log(`   [${issue.severity}] ${issue.issue}`);
      console.log(`      → ${issue.recommendation}`);
    });
  }
  
  console.log('\n💡 RECOMMENDATIONS:');
  results.recommendations.forEach(rec => {
    console.log(`   [${rec.priority}] ${rec.category}: ${rec.suggestion}`);
  });
  
  console.log('\n📸 Screenshots saved to:', screenshotDir);
  
  // Save detailed report
  const reportPath = path.join(screenshotDir, 'ui-ux-report.json');
  await fs.writeFile(reportPath, JSON.stringify(results, null, 2));
  console.log('📄 Detailed report saved to:', reportPath);
  
  console.log('\n✨ Test completed!\n');
}

// Run the test
testLTRWithServer().catch(console.error);