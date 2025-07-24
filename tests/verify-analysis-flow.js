#!/usr/bin/env node

const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  console.log('Testing Analysis Type Flow...\n');
  
  try {
    // Test 1: Load test page
    await page.goto('http://localhost:8080/tests/test-analysis-type-flow.html');
    console.log('✓ Test page loaded successfully');
    
    // Test 2: Check property confirmation component
    await page.waitForSelector('#confirmation-test', { timeout: 5000 });
    const confirmationVisible = await page.$eval('#confirmation-test', el => el.innerHTML.length > 0);
    console.log(confirmationVisible ? '✓ Property confirmation component rendered' : '✗ Property confirmation failed');
    
    // Test 3: Check STR trial notice for free user
    await page.select('#userType', 'free');
    await page.click('button[onclick="runTest()"]');
    await page.waitForTimeout(500);
    
    const trialNoticeVisible = await page.$eval('#str-trial-notice', el => el.style.display !== 'none');
    console.log(trialNoticeVisible ? '✓ STR trial notice shown for free users' : '✗ Trial notice not shown');
    
    // Test 4: Check tab switching functionality
    const tabTestContent = await page.$eval('#tab-test', el => el.innerHTML);
    const hasTabButtons = tabTestContent.includes('str-tab') && tabTestContent.includes('ltr-tab');
    console.log(hasTabButtons ? '✓ Tab buttons rendered' : '✗ Tab buttons missing');
    
    // Test 5: Click LTR tab
    await page.evaluate(() => window.switchTab('ltr'));
    await page.waitForTimeout(100);
    
    const ltrVisible = await page.$eval('#ltr-content', el => !el.classList.contains('hidden'));
    const strHidden = await page.$eval('#str-content', el => el.classList.contains('hidden'));
    console.log(ltrVisible && strHidden ? '✓ Tab switching works correctly' : '✗ Tab switching failed');
    
    // Test 6: Test different analysis types
    await page.select('#analysisType', 'ltr');
    await page.click('button[onclick="runTest()"]');
    await page.waitForTimeout(500);
    
    const analysisResults = await page.$eval('#results-test', el => el.textContent);
    const showsLTROnly = analysisResults.includes('Show STR: false') && analysisResults.includes('Show LTR: true');
    console.log(showsLTROnly ? '✓ LTR-only analysis type works' : '✗ LTR-only analysis failed');
    
    // Test 7: Check test results
    const testResults = await page.$$eval('.test-result', results => 
      results.map(r => ({
        passed: r.classList.contains('pass'),
        text: r.textContent
      }))
    );
    
    const passedCount = testResults.filter(r => r.passed).length;
    const totalCount = testResults.length;
    
    console.log(`\n📊 Test Summary: ${passedCount}/${totalCount} tests passed`);
    
    if (passedCount === totalCount) {
      console.log('\n✅ All tests passed! The analysis type flow is working correctly.');
    } else {
      console.log('\n⚠️  Some tests failed. Review the results above.');
      testResults.filter(r => !r.passed).forEach(r => {
        console.log(`  - Failed: ${r.text}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Test error:', error.message);
  } finally {
    await browser.close();
  }
})();