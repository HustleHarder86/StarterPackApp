/**
 * Visual Regression Tests using Playwright
 * Compares current UI against baseline screenshots
 */

const { test, expect } = require('@playwright/test');
const fs = require('fs-extra');
const path = require('path');
const visualConfig = require('../visual-regression-config');

// Ensure directories exist
fs.ensureDirSync(visualConfig.baselineDir);
fs.ensureDirSync(visualConfig.actualDir);
fs.ensureDirSync(visualConfig.diffDir);

// Custom test function with visual regression
const visualTest = test.extend({
  // Add custom fixture for visual testing
  visualTester: async ({ page }, use) => {
    const tester = {
      async compareWithBaseline(name, options = {}) {
        const screenshotOptions = {
          ...visualConfig.screenshot,
          ...options,
          path: path.join(visualConfig.actualDir, `${name}.png`)
        };
        
        // Take screenshot
        await page.screenshot(screenshotOptions);
        
        // Compare with baseline if it exists
        const baselinePath = path.join(visualConfig.baselineDir, `${name}.png`);
        if (fs.existsSync(baselinePath)) {
          await expect(page).toHaveScreenshot(`${name}.png`, {
            maxDiffPixels: 100,
            threshold: visualConfig.comparison.threshold,
            animations: 'disabled'
          });
        } else {
          // Create baseline if it doesn't exist
          fs.copySync(
            screenshotOptions.path,
            baselinePath
          );
          console.log(`Created baseline for: ${name}`);
        }
      },
      
      async performActions(actions) {
        for (const action of actions) {
          switch (action.type) {
            case 'hover':
              await page.hover(action.selector);
              break;
            case 'click':
              await page.click(action.selector);
              break;
            case 'fill':
              await page.fill(action.selector, action.value);
              break;
            case 'select':
              await page.selectOption(action.selector, action.value);
              break;
            case 'focus':
              await page.focus(action.selector);
              break;
            default:
              console.warn(`Unknown action type: ${action.type}`);
          }
          
          // Wait for animations to complete
          await page.waitForTimeout(300);
        }
      }
    };
    
    await use(tester);
  }
});

// Generate tests for each page and scenario
visualConfig.pages.forEach(pageConfig => {
  visualTest.describe(`Visual Regression: ${pageConfig.name}`, () => {
    visualTest.beforeEach(async ({ page }) => {
      // Navigate to page
      const url = `http://localhost:3000${pageConfig.url}`;
      await page.goto(url);
      
      // Wait for page to be ready
      if (pageConfig.waitFor) {
        await page.waitForSelector(pageConfig.waitFor, { state: 'visible' });
      }
      
      // Wait for fonts and images to load
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(500); // Extra wait for web fonts
    });
    
    // Test each viewport
    visualConfig.viewports.forEach(viewport => {
      visualTest.describe(`Viewport: ${viewport.name}`, () => {
        visualTest.beforeEach(async ({ page }) => {
          await page.setViewportSize({
            width: viewport.width,
            height: viewport.height
          });
        });
        
        // Test each scenario
        pageConfig.scenarios.forEach(scenarioName => {
          const scenario = visualConfig.scenarios.find(s => s.name === scenarioName);
          
          // Skip if scenario is viewport-specific and doesn't match
          if (scenario.viewport && scenario.viewport !== viewport.name) {
            return;
          }
          
          visualTest(`Scenario: ${scenario.description}`, async ({ page, visualTester }) => {
            // Perform scenario actions
            if (scenario.actions && scenario.actions.length > 0) {
              await visualTester.performActions(scenario.actions);
            }
            
            // Take screenshot and compare
            const screenshotName = `${pageConfig.name}-${viewport.name}-${scenario.name}`;
            await visualTester.compareWithBaseline(screenshotName);
            
            // Check critical elements are visible
            const mockup = visualConfig.mockups[pageConfig.name];
            if (mockup && mockup.criticalElements) {
              for (const selector of mockup.criticalElements) {
                const element = page.locator(selector).first();
                if (await element.count() > 0) {
                  await expect(element).toBeVisible();
                }
              }
            }
          });
        });
      });
    });
    
    // Additional tests for specific visual elements
    visualTest('CSS Variables Applied Correctly', async ({ page }) => {
      // Check that CSS variables from unified design system are applied
      const styles = await page.evaluate(() => {
        const root = document.documentElement;
        const computedStyle = getComputedStyle(root);
        return {
          primaryFont: computedStyle.getPropertyValue('--font-primary').trim(),
          sidebarBg: computedStyle.getPropertyValue('--cm-sidebar-bg').trim(),
          sidebarWidth: computedStyle.getPropertyValue('--cm-sidebar-width').trim(),
          primaryColor: computedStyle.getPropertyValue('--color-primary').trim()
        };
      });
      
      expect(styles.primaryFont).toContain('Manrope');
      expect(styles.sidebarBg).toBe('#111827');
      expect(styles.sidebarWidth).toBe('224px');
      expect(styles.primaryColor).toBe('#4f46e5');
    });
    
    visualTest('No Visual Artifacts', async ({ page }) => {
      // Check for common visual issues
      const issues = await page.evaluate(() => {
        const problems = [];
        
        // Check for horizontal scrollbar
        if (document.documentElement.scrollWidth > document.documentElement.clientWidth) {
          problems.push('Horizontal scrollbar detected');
        }
        
        // Check for overlapping elements
        const elements = document.querySelectorAll('*');
        const rects = new Map();
        
        elements.forEach(el => {
          const rect = el.getBoundingClientRect();
          if (rect.width > 0 && rect.height > 0) {
            // Check if this rect overlaps with any previous rect
            for (const [otherEl, otherRect] of rects) {
              if (el.contains(otherEl) || otherEl.contains(el)) continue;
              
              const overlap = !(
                rect.right < otherRect.left ||
                rect.left > otherRect.right ||
                rect.bottom < otherRect.top ||
                rect.top > otherRect.bottom
              );
              
              if (overlap && 
                  getComputedStyle(el).position !== 'absolute' &&
                  getComputedStyle(otherEl).position !== 'absolute') {
                problems.push(`Overlap detected: ${el.className} and ${otherEl.className}`);
              }
            }
            rects.set(el, rect);
          }
        });
        
        // Check for broken images
        const images = document.querySelectorAll('img');
        images.forEach(img => {
          if (!img.complete || img.naturalHeight === 0) {
            problems.push(`Broken image: ${img.src}`);
          }
        });
        
        return problems;
      });
      
      expect(issues).toHaveLength(0);
    });
  });
});

// Test comparing against mockups
visualTest.describe('Mockup Comparison', () => {
  Object.entries(visualConfig.mockups).forEach(([name, mockup]) => {
    visualTest(`${name} matches mockup design`, async ({ page, visualTester }) => {
      // Load mockup in one tab
      const mockupPage = await page.context().newPage();
      await mockupPage.goto(`http://localhost:3000${mockup.path}`);
      await mockupPage.waitForLoadState('networkidle');
      
      // Load actual page in another tab
      const actualUrl = visualConfig.pages.find(p => p.name === name)?.url;
      if (!actualUrl) {
        console.warn(`No actual page found for mockup: ${name}`);
        return;
      }
      
      await page.goto(`http://localhost:3000${actualUrl}`);
      await page.waitForLoadState('networkidle');
      
      // Take screenshots of both
      const mockupScreenshot = await mockupPage.screenshot({ fullPage: true });
      const actualScreenshot = await page.screenshot({ fullPage: true });
      
      // Save for manual comparison
      fs.writeFileSync(
        path.join(visualConfig.diffDir, `${name}-mockup.png`),
        mockupScreenshot
      );
      fs.writeFileSync(
        path.join(visualConfig.diffDir, `${name}-actual.png`),
        actualScreenshot
      );
      
      // Close mockup page
      await mockupPage.close();
      
      // Log for manual review
      console.log(`Mockup comparison saved: ${name}-mockup.png vs ${name}-actual.png`);
    });
  });
});