const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');

async function testDeploymentURLs() {
  console.log('🔍 Testing various deployment URLs...');
  
  const timestamp = new Date().toISOString().replace(/:/g, '-').slice(0, -5);
  const screenshotDir = path.join(__dirname, 'screenshots', 'deployment-url-test', timestamp);
  await fs.mkdir(screenshotDir, { recursive: true });
  
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1440, height: 900 },
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  // URLs to test
  const urlsToTest = [
    'https://investorprops.vercel.app',
    'https://investorprops.vercel.app/',
    'https://investorprops.vercel.app/index.html',
    'https://investorprops.vercel.app/roi-finder.html',
    'https://investorprops.vercel.app/roi-finder',
    'https://investorprops.com',
    'https://www.investorprops.com',
    'https://starterpackapp.vercel.app',
    'https://starterpackapp.vercel.app/roi-finder.html'
  ];
  
  const results = [];
  
  for (let i = 0; i < urlsToTest.length; i++) {
    const url = urlsToTest[i];
    console.log(`\n📍 Testing URL ${i + 1}/${urlsToTest.length}: ${url}`);
    
    try {
      const response = await page.goto(url, {
        waitUntil: 'domcontentloaded',
        timeout: 15000
      });
      
      const status = response.status();
      const finalUrl = page.url();
      
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      await page.screenshot({
        path: path.join(screenshotDir, `test-${i + 1}-${url.replace(/[^a-zA-Z0-9]/g, '_')}.png`),
        fullPage: false
      });
      
      // Check page content
      const pageTitle = await page.title();
      const hasForm = await page.$('#propertyForm, form') !== null;
      const bodyText = await page.evaluate(() => document.body.innerText.substring(0, 100));
      
      results.push({
        url,
        status,
        finalUrl,
        pageTitle,
        hasForm,
        bodyPreview: bodyText,
        success: status === 200
      });
      
      console.log(`  Status: ${status}`);
      console.log(`  Title: ${pageTitle}`);
      console.log(`  Has Form: ${hasForm}`);
      console.log(`  Redirected to: ${finalUrl !== url ? finalUrl : 'No redirect'}`);
      
    } catch (error) {
      console.log(`  ❌ Error: ${error.message}`);
      results.push({
        url,
        error: error.message,
        success: false
      });
    }
  }
  
  // Save results
  await fs.writeFile(
    path.join(screenshotDir, 'url-test-results.json'),
    JSON.stringify(results, null, 2)
  );
  
  console.log('\n📊 Summary:');
  console.log(`Successful URLs: ${results.filter(r => r.success).length}`);
  console.log(`Failed URLs: ${results.filter(r => !r.success).length}`);
  
  console.log('\n✅ Successful URLs:');
  results.filter(r => r.success).forEach(r => {
    console.log(`  - ${r.url} (Status: ${r.status}, Title: ${r.pageTitle})`);
  });
  
  await browser.close();
}

testDeploymentURLs().catch(console.error);