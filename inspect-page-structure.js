const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');

async function inspectPageStructure() {
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
    args: ['--start-maximized']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1366, height: 768 });

  try {
    console.log('🌐 Navigating to http://localhost:3000...');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Get page title and basic info
    const pageInfo = await page.evaluate(() => ({
      title: document.title,
      url: window.location.href,
      readyState: document.readyState
    }));
    
    console.log('📄 Page info:', pageInfo);

    // Look for different possible sidebar selectors
    const sidebarElements = await page.evaluate(() => {
      const possibleSelectors = [
        '#sidebar',
        '.sidebar',
        '[class*="sidebar"]',
        'nav',
        '.nav',
        '[role="navigation"]',
        '[class*="navigation"]',
        '[class*="menu"]',
        '.side-panel',
        '.left-panel'
      ];
      
      const found = [];
      
      possibleSelectors.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        if (elements.length > 0) {
          Array.from(elements).forEach((el, index) => {
            const rect = el.getBoundingClientRect();
            found.push({
              selector: selector,
              index: index,
              tagName: el.tagName,
              id: el.id,
              className: el.className,
              position: {
                top: rect.top,
                left: rect.left,
                width: rect.width,
                height: rect.height
              },
              textContent: el.textContent?.substring(0, 100) + '...',
              hasChildren: el.children.length
            });
          });
        }
      });
      
      return found;
    });

    console.log('🔍 Found potential sidebar elements:');
    sidebarElements.forEach((el, i) => {
      console.log(`${i + 1}. ${el.selector} - ${el.tagName}#${el.id}.${el.className}`);
      console.log(`   Position: ${el.position.left}x${el.position.top}, Size: ${el.position.width}x${el.position.height}`);
      console.log(`   Children: ${el.hasChildren}, Text preview: ${el.textContent.substring(0, 50)}`);
      console.log();
    });

    // Look for specific text content that should be in sidebar
    const sidebarContent = await page.evaluate(() => {
      const searchTerms = ['ROI Finder', 'Portfolio', 'Financials', 'Market', 'Reports', 'Preferences', 'Settings', 'Logout'];
      const found = [];
      
      searchTerms.forEach(term => {
        const elements = Array.from(document.querySelectorAll('*')).filter(el => 
          el.textContent && el.textContent.includes(term) && el.offsetParent !== null
        );
        
        elements.forEach(el => {
          const rect = el.getBoundingClientRect();
          found.push({
            searchTerm: term,
            tagName: el.tagName,
            id: el.id,
            className: el.className,
            textContent: el.textContent.trim(),
            position: {
              top: rect.top,
              left: rect.left,
              width: rect.width,
              height: rect.height
            }
          });
        });
      });
      
      return found;
    });

    console.log('📝 Found sidebar content elements:');
    sidebarContent.forEach((el, i) => {
      console.log(`${i + 1}. "${el.searchTerm}" in ${el.tagName}#${el.id}.${el.className}`);
      console.log(`   Position: ${el.position.left}x${el.position.top}`);
      console.log(`   Text: "${el.textContent}"`);
      console.log();
    });

    // Take a screenshot for visual inspection
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const screenshotPath = path.join(__dirname, `page-structure-${timestamp}.png`);
    await page.screenshot({ 
      path: screenshotPath,
      fullPage: true 
    });
    console.log(`📸 Full page screenshot saved to: ${screenshotPath}`);

    // Get the full HTML structure (first 1000 characters)
    const htmlStructure = await page.evaluate(() => {
      return document.documentElement.outerHTML.substring(0, 2000);
    });

    console.log('📋 HTML structure preview:');
    console.log(htmlStructure);
    console.log('...(truncated)');

  } catch (error) {
    console.error('❌ Error during inspection:', error);
  } finally {
    await browser.close();
  }
}

inspectPageStructure().catch(console.error);