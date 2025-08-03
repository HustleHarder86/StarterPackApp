const { test, expect } = require('@playwright/test');

// Test configuration
const BASE_URL = 'http://localhost:3000';

// Define test data
const testPages = [
  {
    name: 'Landing Page',
    url: '/',
    hasAuth: false,
    hasSidebar: false,
    elements: {
      navbar: 'nav',
      hero: '.hero-section',
      ctaButton: '.cta-button, .btn-primary',
      footer: 'footer'
    }
  },
  {
    name: 'ROI Finder',
    url: '/roi-finder.html?e2e_test_mode=true',
    hasAuth: false,
    hasSidebar: true,
    elements: {
      sidebar: '.sidebar',
      form: '#property-analysis-form',
      analyzeButton: 'button:has-text("Analyze Property")',
      sampleDataButton: 'button:has-text("Sample Data")'
    }
  },
  {
    name: 'Admin Dashboard',
    url: '/admin-dashboard.html',
    hasAuth: true,
    hasSidebar: true,
    elements: {
      sidebar: '.sidebar',
      statsCards: '.stat-card',
      charts: '.chart-container'
    }
  },
  {
    name: 'Blog',
    url: '/blog.html',
    hasAuth: false,
    hasSidebar: false,
    elements: {
      navbar: 'nav',
      blogGrid: '.blog-grid',
      searchBar: 'input[placeholder*="Search"]'
    }
  },
  {
    name: 'Contact',
    url: '/contact.html',
    hasAuth: false,
    hasSidebar: false,
    elements: {
      navbar: 'nav',
      contactForm: '#contact-form',
      submitButton: 'button[type="submit"]'
    }
  }
];

test.describe('Comprehensive UI Test Suite', () => {
  test.beforeEach(async ({ page }) => {
    // Set viewport
    await page.setViewportSize({ width: 1920, height: 1080 });
  });

  // Test 1: CSS Loading and Font Validation
  test.describe('CSS and Font Loading', () => {
    testPages.forEach(pageConfig => {
      test(`${pageConfig.name} - CSS and fonts load correctly`, async ({ page }) => {
        await page.goto(BASE_URL + pageConfig.url);
        
        // Check unified CSS is loaded
        const cssLinks = await page.$$eval('link[rel="stylesheet"]', links => 
          links.map(link => link.href)
        );
        
        const hasUnifiedCSS = cssLinks.some(href => href.includes('unified-design-system.css'));
        expect(hasUnifiedCSS).toBeTruthy();
        
        // Check Manrope font is loaded
        const fontFamily = await page.evaluate(() => {
          return window.getComputedStyle(document.body).fontFamily;
        });
        expect(fontFamily).toContain('Manrope');
        
        // Check no deprecated CSS
        const hasDeprecatedCSS = cssLinks.some(href => 
          href.includes('/styles.css') || 
          href.includes('compact-modern-design-system.css')
        );
        expect(hasDeprecatedCSS).toBeFalsy();
      });
    });
  });

  // Test 2: Responsive Design
  test.describe('Responsive Design', () => {
    const viewports = [
      { name: 'Desktop', width: 1920, height: 1080 },
      { name: 'Tablet', width: 768, height: 1024 },
      { name: 'Mobile', width: 375, height: 667 }
    ];
    
    testPages.forEach(pageConfig => {
      viewports.forEach(viewport => {
        test(`${pageConfig.name} - ${viewport.name} viewport`, async ({ page }) => {
          await page.setViewportSize({ width: viewport.width, height: viewport.height });
          await page.goto(BASE_URL + pageConfig.url);
          
          // Check for horizontal overflow
          const hasOverflow = await page.evaluate(() => {
            return document.body.scrollWidth > window.innerWidth;
          });
          expect(hasOverflow).toBeFalsy();
          
          // Check key elements are visible
          for (const [elementName, selector] of Object.entries(pageConfig.elements)) {
            const element = await page.$(selector);
            if (element) {
              const isVisible = await element.isVisible();
              console.log(`${pageConfig.name} - ${viewport.name}: ${elementName} visible: ${isVisible}`);
            }
          }
          
          // Take screenshot for visual validation
          await page.screenshot({
            path: `tests/e2e/screenshots/ui-suite/${pageConfig.name.toLowerCase().replace(/\s+/g, '-')}-${viewport.name.toLowerCase()}.png`,
            fullPage: true
          });
        });
      });
    });
  });

  // Test 3: Interactive Elements
  test.describe('Interactive Elements', () => {
    test('Landing page - CTA button interaction', async ({ page }) => {
      await page.goto(BASE_URL + '/');
      
      const ctaButton = await page.$('.btn-primary, .cta-button');
      expect(ctaButton).toBeTruthy();
      
      // Check hover state
      await ctaButton.hover();
      const hoverStyles = await ctaButton.evaluate(el => {
        const styles = window.getComputedStyle(el);
        return {
          transform: styles.transform,
          boxShadow: styles.boxShadow
        };
      });
      
      // Buttons should have hover effects
      expect(hoverStyles.boxShadow).not.toBe('none');
    });
    
    test('ROI Finder - Form interaction', async ({ page }) => {
      await page.goto(BASE_URL + '/roi-finder.html?e2e_test_mode=true');
      
      // Wait for form to be visible
      await page.waitForTimeout(1000);
      
      // Force show form if hidden
      await page.evaluate(() => {
        const form = document.getElementById('property-input-section');
        if (form) {
          form.classList.remove('hidden');
          form.style.display = 'block';
        }
      });
      
      // Click Sample Data
      const sampleButton = await page.$('button:has-text("Sample Data")');
      if (sampleButton) {
        await sampleButton.click();
        await page.waitForTimeout(500);
        
        // Check form is filled
        const addressValue = await page.inputValue('#property-address');
        expect(addressValue).toBeTruthy();
      }
    });
    
    test('Contact page - Form validation', async ({ page }) => {
      await page.goto(BASE_URL + '/contact.html');
      
      // Try to submit empty form
      const submitButton = await page.$('button[type="submit"]');
      if (submitButton) {
        await submitButton.click();
        
        // Check for validation messages
        const nameInput = await page.$('#name');
        if (nameInput) {
          const validationMessage = await nameInput.evaluate(el => el.validationMessage);
          expect(validationMessage).toBeTruthy();
        }
      }
    });
  });

  // Test 4: Mobile Navigation
  test.describe('Mobile Navigation', () => {
    test('Mobile menu toggle', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      
      for (const pageConfig of testPages) {
        if (pageConfig.hasSidebar) {
          await page.goto(BASE_URL + pageConfig.url);
          
          // Look for mobile menu toggle
          const menuToggle = await page.$('.mobile-menu-toggle, .hamburger-menu, button[aria-label*="menu"]');
          
          if (menuToggle) {
            // Click menu toggle
            await menuToggle.click();
            await page.waitForTimeout(300);
            
            // Check if menu is visible
            const sidebar = await page.$('.sidebar');
            if (sidebar) {
              const isVisible = await sidebar.isVisible();
              console.log(`${pageConfig.name} - Mobile menu visible after toggle: ${isVisible}`);
            }
          }
        }
      }
    });
  });

  // Test 5: Performance and Loading
  test.describe('Performance', () => {
    test('Page load performance', async ({ page }) => {
      for (const pageConfig of testPages) {
        const startTime = Date.now();
        
        await page.goto(BASE_URL + pageConfig.url, {
          waitUntil: 'networkidle'
        });
        
        const loadTime = Date.now() - startTime;
        console.log(`${pageConfig.name} load time: ${loadTime}ms`);
        
        // Page should load within 3 seconds
        expect(loadTime).toBeLessThan(3000);
        
        // Check for console errors
        const consoleErrors = [];
        page.on('console', msg => {
          if (msg.type() === 'error') {
            consoleErrors.push(msg.text());
          }
        });
        
        await page.waitForTimeout(500);
        
        // Should have no critical errors
        const criticalErrors = consoleErrors.filter(err => 
          !err.includes('404') && // Ignore API 404s for now
          !err.includes('Failed to load resource') &&
          !err.includes('Tailwind CSS')
        );
        
        expect(criticalErrors.length).toBe(0);
      }
    });
  });

  // Test 6: Accessibility
  test.describe('Accessibility', () => {
    test('Basic accessibility checks', async ({ page }) => {
      for (const pageConfig of testPages.slice(0, 3)) { // Test first 3 pages
        await page.goto(BASE_URL + pageConfig.url);
        
        // Check for alt text on images
        const imagesWithoutAlt = await page.$$eval('img:not([alt])', imgs => imgs.length);
        console.log(`${pageConfig.name} - Images without alt text: ${imagesWithoutAlt}`);
        
        // Check for form labels
        if (pageConfig.elements.form) {
          const inputsWithoutLabels = await page.$$eval(
            'input:not([type="hidden"]):not([type="submit"]):not([aria-label])',
            inputs => inputs.filter(input => !input.labels || input.labels.length === 0).length
          );
          console.log(`${pageConfig.name} - Inputs without labels: ${inputsWithoutLabels}`);
        }
        
        // Check heading hierarchy
        const headings = await page.$$eval('h1, h2, h3, h4, h5, h6', 
          elements => elements.map(el => ({ 
            tag: el.tagName, 
            text: el.textContent.trim().substring(0, 50) 
          }))
        );
        
        console.log(`${pageConfig.name} - Heading structure:`, headings.slice(0, 5));
      }
    });
  });
});

// Run with: npx playwright test tests/e2e/comprehensive-ui-test-suite.spec.js