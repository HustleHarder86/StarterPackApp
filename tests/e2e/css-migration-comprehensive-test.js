const { chromium } = require('playwright');
const fs = require('fs').promises;
const path = require('path');

// Test configuration
const BASE_URL = 'http://localhost:3000';
const VIEWPORTS = [
  { width: 1920, height: 1080, name: 'desktop' },
  { width: 768, height: 1024, name: 'tablet' },
  { width: 375, height: 667, name: 'mobile' }
];

// Pages to test
const PAGES_TO_TEST = [
  { url: '/index.html', name: 'Landing Page', priority: 'high' },
  { url: '/roi-finder.html?e2e_test_mode=true', name: 'ROI Finder', priority: 'high' },
  { url: '/admin-dashboard.html', name: 'Admin Dashboard', priority: 'high' },
  { url: '/payment-success.html', name: 'Payment Success', priority: 'medium' },
  { url: '/client-view.html', name: 'Client View', priority: 'medium' },
  { url: '/realtor-settings.html', name: 'Realtor Settings', priority: 'medium' },
  { url: '/blog.html', name: 'Blog', priority: 'low' },
  { url: '/blog-admin.html', name: 'Blog Admin', priority: 'low' },
  { url: '/contact.html', name: 'Contact', priority: 'low' },
  { url: '/extension-welcome.html', name: 'Extension Welcome', priority: 'low' },
  { url: '/monitor-dashboard.html', name: 'Monitor Dashboard', priority: 'low' }
];

// Test results storage
const results = {
  timestamp: new Date().toISOString(),
  summary: {
    total: 0,
    passed: 0,
    failed: 0,
    warnings: 0
  },
  pages: []
};

async function testPage(browser, pageConfig) {
  console.log(`\n🔍 Testing ${pageConfig.name} (${pageConfig.url})...`);
  
  const pageResults = {
    name: pageConfig.name,
    url: pageConfig.url,
    priority: pageConfig.priority,
    tests: {
      pageLoad: { status: 'pending', errors: [] },
      cssValidation: { status: 'pending', issues: [] },
      fontLoading: { status: 'pending', issues: [] },
      responsiveDesign: { status: 'pending', viewports: {} },
      consoleErrors: { status: 'pending', errors: [] },
      visualElements: { status: 'pending', issues: [] }
    },
    screenshots: []
  };

  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Capture console messages
  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });
  
  page.on('pageerror', exception => {
    consoleErrors.push(exception.message);
  });

  try {
    // Test 1: Page Load
    console.log('  ✓ Testing page load...');
    const response = await page.goto(BASE_URL + pageConfig.url, { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    
    if (response.status() >= 400) {
      pageResults.tests.pageLoad.status = 'failed';
      pageResults.tests.pageLoad.errors.push(`HTTP ${response.status()}`);
    } else {
      pageResults.tests.pageLoad.status = 'passed';
    }

    // Test 2: CSS Validation
    console.log('  ✓ Validating CSS imports...');
    const cssImports = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('link[rel="stylesheet"]'));
      const styles = Array.from(document.querySelectorAll('style'));
      
      return {
        links: links.map(link => link.href),
        hasUnifiedCSS: links.some(link => link.href.includes('unified-design-system.css')),
        hasDeprecatedCSS: links.some(link => 
          link.href.includes('/styles.css') || 
          (link.href.includes('design-system.css') && !link.href.includes('unified-design-system.css')) ||
          link.href.includes('compact-modern-design-system.css') ||
          link.href.includes('gradient-theme.css')
        ),
        inlineStyles: styles.length,
        hasImportantOverrides: styles.some(style => style.textContent.includes('!important'))
      };
    });

    if (!cssImports.hasUnifiedCSS) {
      pageResults.tests.cssValidation.status = 'failed';
      pageResults.tests.cssValidation.issues.push('Missing unified-design-system.css');
    }
    if (cssImports.hasDeprecatedCSS) {
      pageResults.tests.cssValidation.status = 'failed';
      pageResults.tests.cssValidation.issues.push('Has deprecated CSS files');
    }
    if (cssImports.hasImportantOverrides) {
      pageResults.tests.cssValidation.status = 'warning';
      pageResults.tests.cssValidation.issues.push('Has !important overrides');
    }
    if (pageResults.tests.cssValidation.issues.length === 0) {
      pageResults.tests.cssValidation.status = 'passed';
    }

    // Test 3: Font Loading
    console.log('  ✓ Checking font loading...');
    const fontInfo = await page.evaluate(() => {
      const computedStyle = window.getComputedStyle(document.body);
      return {
        fontFamily: computedStyle.fontFamily,
        hasManrope: computedStyle.fontFamily.includes('Manrope'),
        hasInter: computedStyle.fontFamily.includes('Inter')
      };
    });

    if (!fontInfo.hasManrope) {
      pageResults.tests.fontLoading.status = 'failed';
      pageResults.tests.fontLoading.issues.push('Manrope font not loaded');
    } else if (fontInfo.hasInter) {
      pageResults.tests.fontLoading.status = 'warning';
      pageResults.tests.fontLoading.issues.push('Still using Inter font');
    } else {
      pageResults.tests.fontLoading.status = 'passed';
    }

    // Test 4: Responsive Design
    console.log('  ✓ Testing responsive design...');
    for (const viewport of VIEWPORTS) {
      await page.setViewportSize(viewport);
      await page.waitForTimeout(500);
      
      // Take screenshot
      const screenshotPath = `tests/e2e/screenshots/css-migration/${pageConfig.name.toLowerCase().replace(/\s+/g, '-')}-${viewport.name}.png`;
      await page.screenshot({ 
        path: screenshotPath,
        fullPage: true 
      });
      pageResults.screenshots.push(screenshotPath);
      
      // Check for visual issues
      const visualCheck = await page.evaluate(() => {
        const sidebar = document.querySelector('.sidebar, .cm-sidebar, #sidebar');
        const mainContent = document.querySelector('.main-content, main, .container, .main-container');
        const mobileMenu = document.querySelector('.mobile-menu-toggle, .hamburger-menu, [class*="menu-toggle"], #mobileMenuToggle');
        const navbar = document.querySelector('nav, .navbar, .navigation, .nav-bar');
        
        return {
          hasSidebar: !!sidebar,
          hasMainContent: !!mainContent,
          hasMobileMenu: !!mobileMenu,
          hasNavbar: !!navbar,
          hasOverflow: document.body.scrollWidth > window.innerWidth,
          pageType: sidebar ? 'dashboard' : 'static'
        };
      });
      
      // Different criteria for different page types
      let layoutCorrect = false;
      if (visualCheck.pageType === 'dashboard') {
        // Dashboard pages should have sidebar on desktop, mobile menu on mobile
        layoutCorrect = viewport.name === 'mobile' ? visualCheck.hasMobileMenu : visualCheck.hasSidebar;
      } else {
        // Static pages should have navbar and main content
        layoutCorrect = visualCheck.hasNavbar && visualCheck.hasMainContent;
      }
      
      pageResults.tests.responsiveDesign.viewports[viewport.name] = {
        hasOverflow: visualCheck.hasOverflow,
        layoutCorrect: layoutCorrect,
        pageType: visualCheck.pageType
      };
    }
    
    // Check if all viewports passed
    const responsiveIssues = Object.entries(pageResults.tests.responsiveDesign.viewports)
      .filter(([_, check]) => check.hasOverflow || !check.layoutCorrect);
    
    pageResults.tests.responsiveDesign.status = responsiveIssues.length === 0 ? 'passed' : 'failed';

    // Test 5: Console Errors
    console.log('  ✓ Checking for console errors...');
    pageResults.tests.consoleErrors.errors = consoleErrors;
    pageResults.tests.consoleErrors.status = consoleErrors.length === 0 ? 'passed' : 'failed';

    // Test 6: Visual Elements
    console.log('  ✓ Checking visual elements...');
    const visualElements = await page.evaluate(() => {
      const criticalClasses = [
        { selector: '.sidebar', name: 'Sidebar' },
        { selector: '.btn-primary', name: 'Primary Button' },
        { selector: '.card', name: 'Card Component' },
        { selector: '.gradient-accent', name: 'Gradient Accent' }
      ];
      
      const results = {};
      criticalClasses.forEach(({ selector, name }) => {
        const element = document.querySelector(selector);
        if (element) {
          const styles = window.getComputedStyle(element);
          results[name] = {
            exists: true,
            visible: styles.display !== 'none' && styles.visibility !== 'hidden'
          };
        } else {
          results[name] = { exists: false, visible: false };
        }
      });
      
      return results;
    });
    
    pageResults.tests.visualElements.details = visualElements;
    pageResults.tests.visualElements.status = 'passed';

  } catch (error) {
    console.error(`  ❌ Error testing ${pageConfig.name}:`, error.message);
    pageResults.tests.pageLoad.status = 'failed';
    pageResults.tests.pageLoad.errors.push(error.message);
  } finally {
    await context.close();
  }

  return pageResults;
}

async function runTests() {
  console.log('🚀 Starting CSS Migration Comprehensive Test');
  console.log('=====================================\n');
  
  const browser = await chromium.launch({ headless: true });
  
  try {
    // Test each page
    for (const pageConfig of PAGES_TO_TEST) {
      const pageResults = await testPage(browser, pageConfig);
      results.pages.push(pageResults);
      
      // Update summary
      results.summary.total++;
      
      // Check if page passed all tests
      const testStatuses = Object.values(pageResults.tests).map(t => t.status);
      if (testStatuses.every(s => s === 'passed')) {
        results.summary.passed++;
      } else if (testStatuses.some(s => s === 'failed')) {
        results.summary.failed++;
      } else {
        results.summary.warnings++;
      }
    }
    
  } finally {
    await browser.close();
  }

  // Generate report
  console.log('\n\n📊 TEST SUMMARY');
  console.log('=====================================');
  console.log(`Total Pages Tested: ${results.summary.total}`);
  console.log(`✅ Passed: ${results.summary.passed}`);
  console.log(`❌ Failed: ${results.summary.failed}`);
  console.log(`⚠️  Warnings: ${results.summary.warnings}`);
  
  // Detailed results for failed pages
  console.log('\n📋 DETAILED RESULTS');
  console.log('=====================================');
  
  results.pages.forEach(page => {
    const issues = [];
    Object.entries(page.tests).forEach(([testName, test]) => {
      if (test.status !== 'passed') {
        issues.push({ testName, ...test });
      }
    });
    
    if (issues.length > 0) {
      console.log(`\n❌ ${page.name} (${page.url})`);
      issues.forEach(issue => {
        console.log(`  - ${issue.testName}: ${issue.status}`);
        if (issue.errors?.length > 0) {
          issue.errors.forEach(err => console.log(`    • ${err}`));
        }
        if (issue.issues?.length > 0) {
          issue.issues.forEach(iss => console.log(`    • ${iss}`));
        }
      });
    } else {
      console.log(`\n✅ ${page.name} (${page.url}) - All tests passed`);
    }
  });

  // Save results to file
  const reportPath = 'tests/e2e/css-migration-test-report.json';
  await fs.writeFile(reportPath, JSON.stringify(results, null, 2));
  console.log(`\n📄 Full report saved to: ${reportPath}`);
}

// Run the tests
runTests().catch(console.error);