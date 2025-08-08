const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

(async () => {
  console.log('Capturing mockup for comparison...');
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  
  const screenshotDir = '/home/amy/StarterPackApp/test-screenshots';
  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true });
  }
  
  // Capture mockup at different viewports
  console.log('Capturing Option 4 mockup...');
  
  // Desktop view
  await page.goto('http://localhost:3000/mockups/property-analysis-mockup-4-cards.html', { 
    waitUntil: 'networkidle0' 
  });
  await page.setViewport({ width: 1280, height: 800 });
  await new Promise(resolve => setTimeout(resolve, 1000));
  await page.screenshot({ 
    path: path.join(screenshotDir, 'mockup-option4-desktop.png'),
    fullPage: true 
  });
  
  // Test card interactions in mockup
  const cards = await page.$$('.analysis-option-card');
  console.log(`Found ${cards.length} cards in mockup`);
  
  if (cards.length > 0) {
    for (let i = 0; i < cards.length; i++) {
      await cards[i].click();
      await new Promise(resolve => setTimeout(resolve, 500));
      await page.screenshot({ 
        path: path.join(screenshotDir, `mockup-card-${i + 1}-selected.png`),
        fullPage: true 
      });
    }
  }
  
  // Mobile view
  await page.setViewport({ width: 375, height: 667 });
  await new Promise(resolve => setTimeout(resolve, 1000));
  await page.screenshot({ 
    path: path.join(screenshotDir, 'mockup-option4-mobile.png'),
    fullPage: true 
  });
  
  // Tablet view
  await page.setViewport({ width: 768, height: 1024 });
  await new Promise(resolve => setTimeout(resolve, 1000));
  await page.screenshot({ 
    path: path.join(screenshotDir, 'mockup-option4-tablet.png'),
    fullPage: true 
  });
  
  console.log('Mockup screenshots captured successfully!');
  await browser.close();
})().catch(console.error);