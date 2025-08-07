const { test, expect } = require('@playwright/test');
const path = require('path');
const fs = require('fs').promises;

test.describe('Full UX Audit - Every User Page', () => {
  const screenshotDir = 'tests/e2e/screenshots/ux-audit';
  
  test.beforeAll(async () => {
    // Create screenshot directory
    await fs.mkdir(path.join(process.cwd(), screenshotDir), { recursive: true });
  });

  test('complete user journey with visual inspection', async ({ page, context }) => {
    // Set viewport to desktop
    await page.setViewportSize({ width: 1440, height: 900 });
    
    const issues = [];
    const improvements = [];
    
    // Helper function to capture and analyze
    async function captureAndAnalyze(name, description) {
      await page.screenshot({ 
        path: `${screenshotDir}/${name}.png`,
        fullPage: true 
      });
      console.log(`📸 Captured: ${description}`);
      
      // Wait a bit for any animations
      await page.waitForTimeout(500);
    }
    
    // 1. Landing Page
    console.log('\n🏠 Testing Landing Page...');
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
    await captureAndAnalyze('01-landing-page', 'Landing Page');
    
    // Check hero section
    const heroSection = await page.$('.hero-section, [class*="hero"], #hero');
    if (!heroSection) {
      issues.push('Missing hero section on landing page');
    }
    
    // Check navigation
    const nav = await page.$('nav, .navbar, .navigation');
    if (!nav) {
      issues.push('Missing navigation bar');
    }
    
    // Check CTA buttons
    const ctaButtons = await page.$$('button, a.btn, .cta');
    if (ctaButtons.length === 0) {
      issues.push('No clear CTA buttons on landing page');
    }
    
    // 2. Navigate to ROI Finder
    console.log('\n📊 Testing ROI Finder Page...');
    
    // Try multiple selectors for navigation
    const roiLink = await page.$('a[href*="roi"], a:has-text("ROI"), a:has-text("Analyze")');
    if (roiLink) {
      await roiLink.click();
      await page.waitForLoadState('networkidle');
    } else {
      // Direct navigation
      await page.goto('http://localhost:3000/roi-finder.html');
    }
    
    await captureAndAnalyze('02-roi-finder-initial', 'ROI Finder Initial State');
    
    // Check form visibility
    const form = await page.$('#propertyForm, form');
    if (!form) {
      issues.push('Property form not visible on ROI Finder page');
    }
    
    // 3. Test Form Interaction
    console.log('\n📝 Testing Form Interaction...');
    
    // Expand form if needed
    const expandBtn = await page.$('[id*="expand"], [class*="expand"], button:has-text("Start")');
    if (expandBtn) {
      await expandBtn.click();
      await page.waitForTimeout(500);
      await captureAndAnalyze('03-form-expanded', 'Form Expanded State');
    }
    
    // Fill form with test data
    try {
      await page.fill('input[name="address"], #address', '123 Test Street, Toronto, ON');
      await page.fill('input[name="price"], #price', '750000');
      await page.fill('input[name="bedrooms"], #bedrooms', '3');
      await page.fill('input[name="bathrooms"], #bathrooms', '2');
      await page.fill('input[name="sqft"], #sqft', '1500');
      await page.fill('input[name="yearBuilt"], #yearBuilt', '2010');
      
      await captureAndAnalyze('04-form-filled', 'Form Filled with Data');
    } catch (e) {
      issues.push('Form fields not accessible or missing');
      console.error('Form fill error:', e.message);
    }
    
    // 4. Check Mobile Responsiveness
    console.log('\n📱 Testing Mobile View...');
    await page.setViewportSize({ width: 375, height: 812 }); // iPhone size
    await captureAndAnalyze('05-mobile-form', 'Mobile View - Form');
    
    // Check if navigation is mobile-friendly
    const mobileMenu = await page.$('[class*="mobile-menu"], [class*="hamburger"], button[aria-label*="menu"]');
    if (!mobileMenu && nav) {
      improvements.push('Add mobile hamburger menu for better navigation');
    }
    
    // 5. Check Tablet View
    console.log('\n📱 Testing Tablet View...');
    await page.setViewportSize({ width: 768, height: 1024 }); // iPad size
    await captureAndAnalyze('06-tablet-form', 'Tablet View - Form');
    
    // Back to desktop for analysis
    await page.setViewportSize({ width: 1440, height: 900 });
    
    // 6. Test Analysis Flow (Mock)
    console.log('\n🔄 Testing Analysis Flow...');
    
    // Click analyze button
    const analyzeBtn = await page.$('#analyzeBtn, button:has-text("Analyze")');
    if (analyzeBtn) {
      // Override fetch to return mock data quickly
      await page.route('**/api/analyze-property', route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            rental: {
              monthlyRent: 3500,
              yearlyIncome: 42000,
              capRate: 5.6
            },
            shortTermRental: {
              monthlyRevenue: 5500,
              dailyRate: 250,
              occupancyRate: 73
            },
            expenses: {
              propertyTax: 7500,
              insurance: 1800,
              maintenance: 3000
            }
          })
        });
      });
      
      await analyzeBtn.click();
      await page.waitForTimeout(2000);
      await captureAndAnalyze('07-analysis-results', 'Analysis Results Display');
    }
    
    // 7. Check Results Sections
    console.log('\n📈 Checking Results Sections...');
    
    // Check for tabs or sections
    const tabs = await page.$$('[role="tab"], .tab, [class*="tab"]');
    if (tabs.length > 0) {
      for (let i = 0; i < Math.min(tabs.length, 3); i++) {
        await tabs[i].click();
        await page.waitForTimeout(500);
        await captureAndAnalyze(`08-results-tab-${i+1}`, `Results Tab ${i+1}`);
      }
    }
    
    // 8. Check Color Scheme and Contrast
    console.log('\n🎨 Checking Visual Design...');
    
    // Check for consistent color scheme
    const primaryButtons = await page.$$eval('button, .btn', buttons => 
      buttons.map(btn => window.getComputedStyle(btn).backgroundColor)
    );
    
    if (new Set(primaryButtons).size > 5) {
      improvements.push('Standardize button colors for consistency');
    }
    
    // Check text readability
    const bodyText = await page.$eval('body', el => window.getComputedStyle(el).color);
    const bodyBg = await page.$eval('body', el => window.getComputedStyle(el).backgroundColor);
    
    // 9. Check Loading States
    console.log('\n⏳ Checking Loading States...');
    const loadingElements = await page.$$('[class*="loading"], [class*="spinner"], [class*="skeleton"]');
    if (loadingElements.length === 0) {
      improvements.push('Add loading skeletons for better perceived performance');
    }
    
    // 10. Check Error States
    console.log('\n❌ Checking Error Handling...');
    
    // Try submitting empty form
    await page.goto('http://localhost:3000/roi-finder.html');
    await page.waitForLoadState('networkidle');
    
    const submitEmpty = await page.$('#analyzeBtn, button[type="submit"]');
    if (submitEmpty) {
      await submitEmpty.click();
      await page.waitForTimeout(1000);
      await captureAndAnalyze('09-error-state', 'Error State Display');
      
      const errorMsg = await page.$('[class*="error"], [class*="alert"]');
      if (!errorMsg) {
        issues.push('No error message shown for invalid input');
      }
    }
    
    // 11. Check Footer
    console.log('\n🦶 Checking Footer...');
    const footer = await page.$('footer');
    if (!footer) {
      improvements.push('Add footer with contact info and links');
    }
    
    // Generate Report
    console.log('\n📋 Generating UX Report...\n');
    
    // Analyze specific UI elements
    const analysis = {
      issues: [
        ...issues,
        // Add any detected issues
      ],
      improvements: [
        ...improvements,
        'Ensure all interactive elements have hover states',
        'Add smooth transitions for better user experience',
        'Implement proper focus indicators for accessibility',
        'Add tooltips for complex form fields',
        'Include progress indicators for multi-step processes',
        'Add animation to make the UI feel more responsive',
        'Ensure consistent spacing throughout the app',
        'Add breadcrumbs for better navigation context',
        'Include a help/FAQ section',
        'Add user onboarding for first-time visitors'
      ],
      accessibility: [
        'Ensure all images have alt text',
        'Add ARIA labels to all interactive elements',
        'Ensure keyboard navigation works properly',
        'Check color contrast ratios meet WCAG standards',
        'Add skip navigation links'
      ],
      performance: [
        'Implement lazy loading for images',
        'Add service worker for offline capability',
        'Optimize font loading strategy',
        'Minimize CSS and JavaScript bundles'
      ]
    };
    
    // Write report
    const report = `
# UX Audit Report
Generated: ${new Date().toISOString()}

## 🚨 Critical Issues Found
${analysis.issues.length > 0 ? analysis.issues.map(i => `- ${i}`).join('\n') : '- None detected'}

## 💡 Recommended Improvements

### Visual Design
- Ensure consistent color palette throughout
- Standardize button styles and hover effects
- Improve typography hierarchy
- Add subtle shadows for depth
- Implement a cohesive icon system

### User Experience
${analysis.improvements.map(i => `- ${i}`).join('\n')}

### Accessibility
${analysis.accessibility.map(i => `- ${i}`).join('\n')}

### Performance
${analysis.performance.map(i => `- ${i}`).join('\n')}

## Screenshots
All screenshots saved to: ${screenshotDir}/
`;
    
    await fs.writeFile(`${screenshotDir}/UX-AUDIT-REPORT.md`, report);
    console.log(report);
    
    // Return results for assertions
    expect(issues.length).toBe(0);
  });
  
  test('check specific UI components', async ({ page }) => {
    await page.goto('http://localhost:3000/roi-finder.html');
    await page.waitForLoadState('networkidle');
    
    // Check for modern UI components
    const checks = {
      'Cards/Panels': await page.$$('[class*="card"], [class*="panel"]'),
      'Badges/Pills': await page.$$('[class*="badge"], [class*="pill"]'),
      'Icons': await page.$$('svg, i[class*="icon"], [class*="fa-"]'),
      'Gradients': await page.$$eval('*', els => 
        els.filter(el => {
          const style = window.getComputedStyle(el);
          return style.backgroundImage.includes('gradient');
        }).length
      ),
      'Shadows': await page.$$eval('*', els => 
        els.filter(el => {
          const style = window.getComputedStyle(el);
          return style.boxShadow !== 'none' && style.boxShadow !== '';
        }).length
      ),
      'Rounded Corners': await page.$$eval('*', els => 
        els.filter(el => {
          const style = window.getComputedStyle(el);
          return style.borderRadius !== '0px' && style.borderRadius !== '';
        }).length
      )
    };
    
    console.log('\n🎨 UI Component Analysis:');
    for (const [component, count] of Object.entries(checks)) {
      const hasComponent = Array.isArray(count) ? count.length : count;
      console.log(`${hasComponent > 0 ? '✅' : '❌'} ${component}: ${hasComponent > 0 ? hasComponent : 'Not found'}`);
    }
  });
});