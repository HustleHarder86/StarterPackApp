/**
 * Responsive Design Test
 * Checks for horizontal scrolling and layout issues at different screen sizes
 */

const puppeteer = require('puppeteer');

async function testResponsiveDesign() {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  
  // Test different viewport sizes
  const viewports = [
    { name: 'Mobile', width: 375, height: 667 },
    { name: 'Tablet', width: 768, height: 1024 },
    { name: 'Small Laptop', width: 1024, height: 768 },
    { name: '14" Laptop', width: 1366, height: 768 },
    { name: 'Desktop', width: 1920, height: 1080 }
  ];
  
  console.log('🧪 Testing responsive design...\n');
  
  try {
    await page.goto('http://localhost:3000/roi-finder.html', { waitUntil: 'networkidle2' });
    
    for (const viewport of viewports) {
      console.log(`📱 Testing ${viewport.name} (${viewport.width}x${viewport.height})`);
      await page.setViewport(viewport);
      
      // Wait for any layout shifts
      await page.waitForTimeout(500);
      
      // Check for horizontal scroll
      const hasHorizontalScroll = await page.evaluate(() => {
        return document.documentElement.scrollWidth > window.innerWidth;
      });
      
      // Check body overflow
      const bodyOverflow = await page.evaluate(() => {
        const body = document.body;
        return body.scrollWidth > body.clientWidth;
      });
      
      // Check main content overflow
      const mainOverflow = await page.evaluate(() => {
        const main = document.querySelector('#main-content');
        return main ? main.scrollWidth > main.clientWidth : false;
      });
      
      // Check analysis results overflow
      const analysisOverflow = await page.evaluate(() => {
        const analysis = document.querySelector('#analysis-results');
        return analysis ? analysis.scrollWidth > analysis.clientWidth : false;
      });
      
      // Get all elements that might be causing overflow
      const overflowingElements = await page.evaluate(() => {
        const elements = [];
        const all = document.querySelectorAll('*');
        
        all.forEach(el => {
          if (el.scrollWidth > el.clientWidth || el.scrollWidth > window.innerWidth) {
            const rect = el.getBoundingClientRect();
            if (rect.width > 0) {
              elements.push({
                tag: el.tagName,
                class: el.className,
                id: el.id,
                width: el.scrollWidth,
                clientWidth: el.clientWidth,
                text: el.textContent.substring(0, 50)
              });
            }
          }
        });
        
        return elements;
      });
      
      // Report results
      if (hasHorizontalScroll || bodyOverflow || mainOverflow || analysisOverflow) {
        console.log(`  ❌ Horizontal scrolling detected!`);
        console.log(`     - Document scroll: ${hasHorizontalScroll ? 'YES' : 'NO'}`);
        console.log(`     - Body overflow: ${bodyOverflow ? 'YES' : 'NO'}`);
        console.log(`     - Main overflow: ${mainOverflow ? 'YES' : 'NO'}`);
        console.log(`     - Analysis overflow: ${analysisOverflow ? 'YES' : 'NO'}`);
        
        if (overflowingElements.length > 0) {
          console.log(`     - Overflowing elements found:`);
          overflowingElements.slice(0, 5).forEach(el => {
            console.log(`       • ${el.tag}${el.id ? '#' + el.id : ''}${el.class ? '.' + el.class.split(' ')[0] : ''} (width: ${el.width}px)`);
          });
        }
      } else {
        console.log(`  ✅ No horizontal scrolling detected`);
      }
      
      // Take screenshot for visual inspection
      await page.screenshot({ 
        path: `screenshots/responsive-${viewport.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}.png`,
        fullPage: false
      });
      
      console.log('');
    }
    
    // Test with sample analysis data
    console.log('📊 Testing with analysis results...\n');
    
    // Fill form with sample data
    await page.goto('http://localhost:3000/roi-finder.html', { waitUntil: 'networkidle2' });
    await page.waitForSelector('#property-input-section', { visible: true });
    
    await page.type('#property-address', '123 Test Street, Toronto, ON');
    await page.type('#property-price', '850000');
    await page.select('#property-bedrooms', '2');
    await page.select('#property-bathrooms', '2');
    
    // Mock the analysis response
    await page.evaluateOnNewDocument(() => {
      window.fetch = async (url, options) => {
        if (url.includes('/api/analysis/property')) {
          return {
            ok: true,
            json: async () => ({
              data: {
                propertyData: { price: 850000, bedrooms: 2, bathrooms: 2 },
                strAnalysis: { monthlyRevenue: 5400, occupancyRate: 0.7 },
                longTermRental: { monthlyRent: 3200 },
                costs: { totalMonthly: 2500 }
              }
            })
          };
        }
        return window.originalFetch(url, options);
      };
    });
    
    // Test analysis results at different viewports
    for (const viewport of [viewports[1], viewports[2], viewports[3]]) {
      console.log(`📱 Testing analysis results at ${viewport.name}`);
      await page.setViewport(viewport);
      
      // Check for overflow in analysis components
      const componentsOverflow = await page.evaluate(() => {
        const components = [
          '.airbnb-listings',
          '.financial-calculator',
          '.expense-table',
          '.tab-navigation',
          '.grid'
        ];
        
        const overflows = {};
        components.forEach(selector => {
          const els = document.querySelectorAll(selector);
          els.forEach(el => {
            if (el.scrollWidth > el.clientWidth) {
              overflows[selector] = true;
            }
          });
        });
        
        return overflows;
      });
      
      if (Object.keys(componentsOverflow).length > 0) {
        console.log(`  ⚠️  Components with overflow:`, componentsOverflow);
      } else {
        console.log(`  ✅ All components fit properly`);
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await browser.close();
  }
}

// Create screenshots directory
const fs = require('fs');
if (!fs.existsSync('screenshots')) {
  fs.mkdirSync('screenshots');
}

// Run tests
testResponsiveDesign().then(() => {
  console.log('\n✅ Responsive design tests completed');
  console.log('📸 Screenshots saved to ./screenshots/');
}).catch(console.error);