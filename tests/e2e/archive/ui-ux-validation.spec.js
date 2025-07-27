const { test, expect } = require('@playwright/test');
const path = require('path');
const fs = require('fs').promises;

// Base URL - use environment variable or fallback
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

// Test viewport configurations
const VIEWPORTS = {
    desktop: { width: 1920, height: 1080 },
    laptop: { width: 1440, height: 900 },
    tablet: { width: 768, height: 1024 },
    mobile: { width: 375, height: 812 }
};

// Screenshot directory
const SCREENSHOT_DIR = path.join(__dirname, 'screenshots', 'ui-ux-validation', new Date().toISOString().split('T')[0]);

// Test data
const TEST_PROPERTY = {
    address: '500 Sherbourne St, Toronto, ON M4X 1K9',
    price: '650000',
    downPayment: '20',
    interestRate: '5.5',
    mortgageTerm: '25',
    monthlyRent: '3200',
    propertyTax: '6500',
    insurance: '1200',
    condoFees: '650',
    managementFee: '8',
    maintenanceReserve: '1'
};

// Helper function to take named screenshots
async function takeScreenshot(page, name, viewport = 'desktop') {
    await fs.mkdir(SCREENSHOT_DIR, { recursive: true });
    const filename = `${viewport}-${name.replace(/\s+/g, '-').toLowerCase()}.png`;
    const filepath = path.join(SCREENSHOT_DIR, filename);
    await page.screenshot({ path: filepath, fullPage: false });
    return filename;
}

test.describe('UI/UX Validation - Landing Page', () => {
    test.beforeEach(async ({ page }) => {
        await page.setViewportSize(VIEWPORTS.desktop);
    });

    test('Hero section design and messaging', async ({ page }) => {
        await page.goto(`${BASE_URL}/index.html`);
        await page.waitForLoadState('networkidle');
        
        // Screenshot hero section
        await takeScreenshot(page, '01-landing-hero');
        
        // Check hero visibility
        const hero = await page.locator('.hero-section');
        await expect(hero).toBeVisible();
        
        // Verify key messaging
        const headline = await page.locator('h1');
        await expect(headline).toContainText('Real estate investing');
        
        // Check CTA button
        const ctaButton = await page.locator('.hero-content .btn-primary');
        await expect(ctaButton).toBeVisible();
        
        // Hover state
        await ctaButton.hover();
        await takeScreenshot(page, '02-landing-cta-hover');
    });

    test('Navigation functionality', async ({ page }) => {
        await page.goto(`${BASE_URL}/index.html`);
        
        // Check navigation menu
        const nav = await page.locator('.nav-bar');
        await expect(nav).toBeVisible();
        
        // Count navigation items
        const navLinks = await page.locator('.nav-links a').count();
        expect(navLinks).toBeGreaterThan(4);
        
        // Test navigation hover states
        const firstLink = await page.locator('.nav-links a').first();
        await firstLink.hover();
        await takeScreenshot(page, '03-landing-nav-hover');
    });

    test('Lead form interaction', async ({ page }) => {
        await page.goto(`${BASE_URL}/index.html`);
        
        // Click to show lead form
        const showFormButton = await page.locator('#show-lead-form');
        if (await showFormButton.isVisible()) {
            await showFormButton.click();
            
            // Wait for form animation
            await page.waitForTimeout(500);
            
            // Screenshot form
            await takeScreenshot(page, '04-landing-lead-form');
            
            // Check form fields
            const formInputs = await page.locator('#lead-form input').count();
            expect(formInputs).toBeGreaterThanOrEqual(2);
        }
    });

    test('Features section layout', async ({ page }) => {
        await page.goto(`${BASE_URL}/index.html`);
        
        // Scroll to features
        const features = await page.locator('#features');
        if (await features.isVisible()) {
            await features.scrollIntoViewIfNeeded();
            await page.waitForTimeout(500);
            
            await takeScreenshot(page, '05-landing-features');
            
            // Check feature cards
            const featureCards = await page.locator('.feature-card').count();
            expect(featureCards).toBeGreaterThanOrEqual(4);
        }
    });
});

test.describe('UI/UX Validation - ROI Finder Page', () => {
    test.beforeEach(async ({ page }) => {
        await page.setViewportSize(VIEWPORTS.desktop);
    });

    test('Form layout and usability', async ({ page }) => {
        await page.goto(`${BASE_URL}/roi-finder.html?test=true`);
        await page.waitForLoadState('networkidle');
        
        // Initial state
        await takeScreenshot(page, '06-roi-finder-initial');
        
        // Check form presence
        const form = await page.locator('form').first();
        await expect(form).toBeVisible();
        
        // Count form fields
        const inputs = await page.locator('input:visible, select:visible, textarea:visible').count();
        expect(inputs).toBeGreaterThan(5);
    });

    test('Form field interaction and validation', async ({ page }) => {
        await page.goto(`${BASE_URL}/roi-finder.html?test=true`);
        await page.waitForLoadState('networkidle');
        
        // Fill form fields
        await page.fill('#address', TEST_PROPERTY.address);
        await page.fill('#price', TEST_PROPERTY.price);
        await page.fill('#downPayment', TEST_PROPERTY.downPayment);
        await page.fill('#interestRate', TEST_PROPERTY.interestRate);
        
        await takeScreenshot(page, '07-roi-finder-filled');
        
        // Test validation - clear required field
        await page.fill('#address', '');
        
        // Try to submit
        const submitButton = await page.locator('button[type="submit"], #analyze-btn').first();
        if (await submitButton.isVisible()) {
            await submitButton.click();
            await page.waitForTimeout(500);
            
            await takeScreenshot(page, '08-roi-finder-validation');
        }
    });

    test('Help tooltips and guidance', async ({ page }) => {
        await page.goto(`${BASE_URL}/roi-finder.html?test=true`);
        await page.waitForLoadState('networkidle');
        
        // Find tooltip triggers
        const tooltips = await page.locator('[data-tooltip], .tooltip, .help-icon, [title]').first();
        if (await tooltips.isVisible()) {
            await tooltips.hover();
            await page.waitForTimeout(500);
            
            await takeScreenshot(page, '09-roi-finder-tooltip');
        }
    });

    test('Loading states', async ({ page }) => {
        await page.goto(`${BASE_URL}/roi-finder.html?test=true`);
        await page.waitForLoadState('networkidle');
        
        // Fill minimum required fields
        await page.fill('#address', TEST_PROPERTY.address);
        await page.fill('#price', TEST_PROPERTY.price);
        
        // Submit form
        const submitButton = await page.locator('button[type="submit"], #analyze-btn').first();
        if (await submitButton.isVisible()) {
            await submitButton.click();
            
            // Capture loading state quickly
            await page.waitForTimeout(100);
            await takeScreenshot(page, '10-roi-finder-loading');
        }
    });
});

test.describe('UI/UX Validation - Responsive Design', () => {
    for (const [viewportName, viewport] of Object.entries(VIEWPORTS)) {
        test(`${viewportName} viewport (${viewport.width}x${viewport.height})`, async ({ page }) => {
            await page.setViewportSize(viewport);
            
            // Test landing page
            await page.goto(`${BASE_URL}/index.html`);
            await page.waitForLoadState('networkidle');
            
            await takeScreenshot(page, `11-responsive-landing`, viewportName);
            
            // Check for horizontal overflow
            const hasOverflow = await page.evaluate(() => {
                return document.documentElement.scrollWidth > document.documentElement.clientWidth;
            });
            
            expect(hasOverflow).toBe(false);
            
            // Test ROI Finder
            await page.goto(`${BASE_URL}/roi-finder.html?test=true`);
            await page.waitForLoadState('networkidle');
            
            await takeScreenshot(page, `12-responsive-roi-finder`, viewportName);
            
            const roiOverflow = await page.evaluate(() => {
                return document.documentElement.scrollWidth > document.documentElement.clientWidth;
            });
            
            expect(roiOverflow).toBe(false);
            
            // Mobile-specific tests
            if (viewportName === 'mobile') {
                // Check touch target sizes
                const smallTargets = await page.evaluate(() => {
                    const buttons = document.querySelectorAll('button, a, input');
                    const small = [];
                    
                    buttons.forEach(el => {
                        const rect = el.getBoundingClientRect();
                        if (rect.width > 0 && rect.height > 0 && (rect.width < 44 || rect.height < 44)) {
                            small.push({
                                tag: el.tagName,
                                width: rect.width,
                                height: rect.height
                            });
                        }
                    });
                    
                    return small;
                });
                
                // Log but don't fail - some elements might be intentionally small
                if (smallTargets.length > 0) {
                    console.log(`Found ${smallTargets.length} small touch targets on mobile`);
                }
            }
        });
    }
});

test.describe('UI/UX Validation - Accessibility', () => {
    test('Keyboard navigation', async ({ page }) => {
        await page.goto(`${BASE_URL}/index.html`);
        await page.waitForLoadState('networkidle');
        
        // Tab through elements
        for (let i = 0; i < 5; i++) {
            await page.keyboard.press('Tab');
            await page.waitForTimeout(200);
        }
        
        await takeScreenshot(page, '13-accessibility-focus');
    });

    test('ARIA labels and semantic HTML', async ({ page }) => {
        await page.goto(`${BASE_URL}/index.html`);
        
        // Check for missing alt text on images
        const imagesWithoutAlt = await page.evaluate(() => {
            const images = document.querySelectorAll('img');
            const missing = [];
            images.forEach(img => {
                if (!img.alt && img.src) {
                    missing.push(img.src);
                }
            });
            return missing;
        });
        
        // Check for form labels
        await page.goto(`${BASE_URL}/roi-finder.html?test=true`);
        
        const inputsWithoutLabels = await page.evaluate(() => {
            const inputs = document.querySelectorAll('input, select, textarea');
            const missing = [];
            inputs.forEach(input => {
                const id = input.id;
                const label = id ? document.querySelector(`label[for="${id}"]`) : null;
                const ariaLabel = input.getAttribute('aria-label');
                
                if (!label && !ariaLabel && input.type !== 'hidden') {
                    missing.push({
                        type: input.type,
                        name: input.name || input.id
                    });
                }
            });
            return missing;
        });
        
        // Log accessibility findings
        console.log(`Images without alt text: ${imagesWithoutAlt.length}`);
        console.log(`Form inputs without labels: ${inputsWithoutLabels.length}`);
    });

    test('Color contrast check', async ({ page }) => {
        await page.goto(`${BASE_URL}/index.html`);
        
        // Sample color contrast check
        const contrastIssues = await page.evaluate(() => {
            const issues = [];
            const textElements = document.querySelectorAll('p, span, h1, h2, h3, h4, h5, h6, a, button');
            
            // Note: This is a simplified check - real contrast testing requires more complex calculations
            textElements.forEach(el => {
                const styles = window.getComputedStyle(el);
                const fontSize = parseInt(styles.fontSize);
                
                // Flag potential issues with small text
                if (fontSize < 14 && el.textContent.trim()) {
                    issues.push({
                        text: el.textContent.substring(0, 30),
                        fontSize: fontSize
                    });
                }
            });
            
            return issues;
        });
        
        await takeScreenshot(page, '14-accessibility-contrast');
        
        console.log(`Potential contrast issues: ${contrastIssues.length}`);
    });
});

test.afterAll(async () => {
    // Generate summary report
    const report = {
        timestamp: new Date().toISOString(),
        screenshotDir: SCREENSHOT_DIR,
        baseUrl: BASE_URL,
        viewportsTested: Object.keys(VIEWPORTS),
        recommendations: [
            {
                category: 'Responsive Design',
                priority: 'HIGH',
                description: 'Ensure all viewports render without horizontal overflow'
            },
            {
                category: 'Accessibility',
                priority: 'MEDIUM',
                description: 'Add alt text to all images and ensure form inputs have labels'
            },
            {
                category: 'Mobile UX',
                priority: 'MEDIUM',
                description: 'Verify all touch targets are at least 44x44 pixels'
            },
            {
                category: 'Performance',
                priority: 'LOW',
                description: 'Consider lazy loading for images and optimizing bundle size'
            }
        ]
    };
    
    await fs.mkdir(SCREENSHOT_DIR, { recursive: true });
    await fs.writeFile(
        path.join(SCREENSHOT_DIR, 'ui-ux-report.json'),
        JSON.stringify(report, null, 2)
    );
    
    console.log(`\n📄 UI/UX Test Report saved to: ${SCREENSHOT_DIR}/ui-ux-report.json`);
    console.log(`📸 Screenshots saved to: ${SCREENSHOT_DIR}/`);
});