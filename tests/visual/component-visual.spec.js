/**
 * Visual Testing for Components
 * Tests visual appearance and design system consistency
 */

const { test, expect } = require('@playwright/test');

test.describe('Visual Component Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Load design system CSS
    await page.goto('/roi-finder-v2.html');
    await page.waitForLoadState('domcontentloaded');
  });

  test('investment verdict component visual appearance', async ({ page }) => {
    // Create test data
    const mockAnalysisData = {
      strAnalysis: { monthlyRevenue: 5400 },
      longTermRental: { monthlyRent: 3200, roi: 12.4 },
      overallScore: 8.7,
      recommendations: [
        { title: 'High Demand', description: 'Strong market demand' }
      ]
    };

    await page.evaluate((data) => {
      window.appState = { currentAnalysis: data };
    }, mockAnalysisData);

    await page.reload();
    await expect(page.locator('#analysis-results')).toBeVisible({ timeout: 15000 });

    // Take screenshot of investment verdict section
    const verdictSection = page.locator('#analysis-results .container > div').first();
    await expect(verdictSection).toHaveScreenshot('investment-verdict-recommended.png');
  });

  test('airbnb listings hero section visual appearance', async ({ page }) => {
    const mockAnalysisData = {
      strAnalysis: {
        monthlyRevenue: 5400,
        comparables: [
          {
            nightly_rate: 220,
            bedrooms: 2,
            area: 'King West',
            rating: 4.9,
            monthly_revenue: 6400,
            occupancy_rate: 98,
            performance: 'top'
          },
          {
            nightly_rate: 185,
            bedrooms: 2,
            area: 'Downtown',
            rating: 4.7,
            monthly_revenue: 5200,
            occupancy_rate: 85,
            performance: 'match'
          },
          {
            nightly_rate: 165,
            bedrooms: 2,
            area: 'Midtown',
            rating: 4.5,
            monthly_revenue: 4100,
            occupancy_rate: 72,
            performance: 'value'
          }
        ]
      },
      overallScore: 8.7
    };

    await page.evaluate((data) => {
      window.appState = { currentAnalysis: data };
    }, mockAnalysisData);

    await page.reload();
    await expect(page.locator('#analysis-results')).toBeVisible({ timeout: 15000 });

    // Take screenshot of Airbnb listings hero section
    const airbnbSection = page.locator('#analysis-results .container > div').nth(1);
    await expect(airbnbSection).toHaveScreenshot('airbnb-listings-hero.png');
  });

  test('financial summary visual appearance', async ({ page }) => {
    const mockAnalysisData = {
      strAnalysis: { monthlyRevenue: 5400 },
      longTermRental: { 
        monthlyRent: 3200, 
        roi: 12.4, 
        capRate: 8.2,
        cashFlow: 2100
      },
      overallScore: 8.7
    };

    await page.evaluate((data) => {
      window.appState = { currentAnalysis: data };
    }, mockAnalysisData);

    await page.reload();
    await expect(page.locator('#analysis-results')).toBeVisible({ timeout: 15000 });

    // Take screenshot of financial summary section
    const financialSection = page.locator('#analysis-results .container > div').nth(2);
    await expect(financialSection).toHaveScreenshot('financial-summary.png');
  });

  test('action buttons visual appearance', async ({ page }) => {
    const mockAnalysisData = {
      strAnalysis: { monthlyRevenue: 5400 },
      longTermRental: { monthlyRent: 3200 },
      overallScore: 8.7
    };

    await page.evaluate((data) => {
      window.appState = { currentAnalysis: data };
    }, mockAnalysisData);

    await page.reload();
    await expect(page.locator('#analysis-results')).toBeVisible({ timeout: 15000 });

    // Take screenshot of action buttons section
    const actionSection = page.locator('#analysis-results .container > div').nth(3);
    await expect(actionSection).toHaveScreenshot('action-buttons.png');
  });

  test('design system components visual consistency', async ({ page }) => {
    // Navigate to a test page that shows all components
    await page.goto('/tests/visual/component-showcase.html');
    await page.waitForLoadState('domcontentloaded');

    // Take screenshots of each component type
    await expect(page.locator('.card-showcase')).toHaveScreenshot('cards-showcase.png');
    await expect(page.locator('.badge-showcase')).toHaveScreenshot('badges-showcase.png');
    await expect(page.locator('.button-showcase')).toHaveScreenshot('buttons-showcase.png');
  });

  test('mobile layout visual appearance', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    const mockAnalysisData = {
      strAnalysis: {
        monthlyRevenue: 5400,
        comparables: [
          {
            nightly_rate: 185,
            bedrooms: 2,
            area: 'Downtown',
            rating: 4.7,
            monthly_revenue: 5200,
            occupancy_rate: 85,
            performance: 'match'
          }
        ]
      },
      longTermRental: { monthlyRent: 3200 },
      overallScore: 8.7
    };

    await page.evaluate((data) => {
      window.appState = { currentAnalysis: data, isMobile: true };
    }, mockAnalysisData);

    await page.reload();
    await expect(page.locator('#analysis-results')).toBeVisible({ timeout: 15000 });

    // Take full page screenshot for mobile
    await expect(page).toHaveScreenshot('mobile-analysis-full.png', { fullPage: true });
  });

  test('tablet layout visual appearance', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });

    const mockAnalysisData = {
      strAnalysis: {
        monthlyRevenue: 5400,
        comparables: [
          {
            nightly_rate: 220,
            bedrooms: 2,
            area: 'King West',
            rating: 4.9,
            monthly_revenue: 6400,
            occupancy_rate: 98,
            performance: 'top'
          },
          {
            nightly_rate: 185,
            bedrooms: 2,
            area: 'Downtown',
            rating: 4.7,
            monthly_revenue: 5200,
            occupancy_rate: 85,
            performance: 'match'
          }
        ]
      },
      longTermRental: { monthlyRent: 3200, roi: 12.4 },
      overallScore: 8.7
    };

    await page.evaluate((data) => {
      window.appState = { currentAnalysis: data };
    }, mockAnalysisData);

    await page.reload();
    await expect(page.locator('#analysis-results')).toBeVisible({ timeout: 15000 });

    // Take full page screenshot for tablet
    await expect(page).toHaveScreenshot('tablet-analysis-full.png', { fullPage: true });
  });

  test('desktop layout visual appearance', async ({ page }) => {
    await page.setViewportSize({ width: 1200, height: 800 });

    const mockAnalysisData = {
      strAnalysis: {
        monthlyRevenue: 5400,
        comparables: [
          {
            nightly_rate: 220,
            bedrooms: 2,
            area: 'King West',
            rating: 4.9,
            monthly_revenue: 6400,
            occupancy_rate: 98,
            performance: 'top'
          },
          {
            nightly_rate: 185,
            bedrooms: 2,
            area: 'Downtown',
            rating: 4.7,
            monthly_revenue: 5200,
            occupancy_rate: 85,
            performance: 'match'
          },
          {
            nightly_rate: 165,
            bedrooms: 2,
            area: 'Midtown',
            rating: 4.5,
            monthly_revenue: 4100,
            occupancy_rate: 72,
            performance: 'value'
          }
        ]
      },
      longTermRental: { monthlyRent: 3200, roi: 12.4 },
      overallScore: 8.7,
      recommendations: [
        { title: 'High Demand', description: 'Strong market demand' }
      ]
    };

    await page.evaluate((data) => {
      window.appState = { currentAnalysis: data };
    }, mockAnalysisData);

    await page.reload();
    await expect(page.locator('#analysis-results')).toBeVisible({ timeout: 15000 });

    // Take full page screenshot for desktop
    await expect(page).toHaveScreenshot('desktop-analysis-full.png', { fullPage: true });
  });

  test('error state visual appearance', async ({ page }) => {
    // Mock API error
    await page.route('/api/analyze-property.js', async route => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Analysis failed' })
      });
    });

    await expect(page.locator('#property-input-section')).toBeVisible({ timeout: 10000 });

    // Fill and submit form to trigger error
    await page.fill('#property-address', '123 Main St');
    await page.fill('#property-price', '850000');
    await page.click('button[type="submit"]');

    // Wait for error state
    await expect(page.locator('#error-state')).toBeVisible({ timeout: 10000 });

    // Take screenshot of error state
    await expect(page.locator('#error-state')).toHaveScreenshot('error-state.png');
  });

  test('loading state visual appearance', async ({ page }) => {
    // Mock delayed API response
    await page.route('/api/analyze-property.js', async route => {
      await new Promise(resolve => setTimeout(resolve, 2000));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ strAnalysis: { monthlyRevenue: 5400 } })
      });
    });

    await expect(page.locator('#property-input-section')).toBeVisible({ timeout: 10000 });

    // Fill and submit form
    await page.fill('#property-address', '123 Main St');
    await page.fill('#property-price', '850000');
    await page.click('button[type="submit"]');

    // Capture loading state
    await expect(page.locator('#loading-state')).toBeVisible();
    await expect(page.locator('#loading-state')).toHaveScreenshot('loading-state.png');
  });

  test('empty airbnb listings visual appearance', async ({ page }) => {
    const mockAnalysisData = {
      strAnalysis: {
        monthlyRevenue: 5400,
        comparables: [] // Empty comparables to trigger empty state
      },
      longTermRental: { monthlyRent: 3200 },
      overallScore: 8.7
    };

    await page.evaluate((data) => {
      window.appState = { currentAnalysis: data };
    }, mockAnalysisData);

    await page.reload();
    await expect(page.locator('#analysis-results')).toBeVisible({ timeout: 15000 });

    // Find empty state within Airbnb section
    const airbnbSection = page.locator('#analysis-results .container > div').nth(1);
    await expect(airbnbSection).toContainText('No Airbnb Data Available');
    await expect(airbnbSection).toHaveScreenshot('airbnb-empty-state.png');
  });

  test('property input form visual appearance', async ({ page }) => {
    await expect(page.locator('#property-input-section')).toBeVisible({ timeout: 10000 });

    // Take screenshot of property input form
    await expect(page.locator('#property-input-section')).toHaveScreenshot('property-input-form.png');
  });

  test('navigation header visual appearance', async ({ page }) => {
    await page.evaluate(() => {
      window.appState = { currentUser: { email: 'test@example.com' } };
      document.getElementById('user-email').textContent = 'test@example.com';
    });

    // Take screenshot of navigation header
    await expect(page.locator('nav')).toHaveScreenshot('navigation-header.png');
  });

  test('design system color scheme consistency', async ({ page }) => {
    // Test color scheme by evaluating CSS custom properties
    const colors = await page.evaluate(() => {
      const style = getComputedStyle(document.documentElement);
      return {
        primary: style.getPropertyValue('--color-primary'),
        success: style.getPropertyValue('--color-success'),
        warning: style.getPropertyValue('--color-warning'),
        danger: style.getPropertyValue('--color-danger'),
        airbnb: style.getPropertyValue('--color-airbnb')
      };
    });

    // Verify color values are correctly set
    expect(colors.primary).toBe('#667eea');
    expect(colors.success).toBe('#10b981');
    expect(colors.warning).toBe('#f59e0b');
    expect(colors.danger).toBe('#ef4444');
    expect(colors.airbnb).toBe('#ff5a5f');
  });
});

test.describe('Animation and Interaction Tests', () => {
  test('loading animations display correctly', async ({ page }) => {
    await page.goto('/roi-finder-v2.html');
    
    // Check loading spinner animation
    await expect(page.locator('.loading-spinner')).toBeVisible();
    await expect(page.locator('.animate-spin')).toBeVisible();
    
    // Check pulse animation
    await expect(page.locator('.animate-pulse')).toBeVisible();
  });

  test('hover effects work correctly', async ({ page }) => {
    const mockAnalysisData = {
      strAnalysis: { monthlyRevenue: 5400 },
      longTermRental: { monthlyRent: 3200 },
      overallScore: 8.7
    };

    await page.evaluate((data) => {
      window.appState = { currentAnalysis: data };
    }, mockAnalysisData);

    await page.reload();
    await expect(page.locator('#analysis-results')).toBeVisible({ timeout: 15000 });

    // Test card hover effects
    const cards = page.locator('.card-elevated');
    await cards.first().hover();
    
    // Take screenshot during hover
    await expect(cards.first()).toHaveScreenshot('card-hover-effect.png');
  });

  test('transition animations work correctly', async ({ page }) => {
    const mockAnalysisData = {
      strAnalysis: { monthlyRevenue: 5400 },
      longTermRental: { monthlyRent: 3200 },
      overallScore: 8.7
    };

    await page.evaluate((data) => {
      window.appState = { currentAnalysis: data };
    }, mockAnalysisData);

    await page.reload();
    await expect(page.getByText('Show Detailed Analysis')).toBeVisible({ timeout: 15000 });

    // Test toggle animation
    await page.click('text=Show Detailed Analysis');
    
    // Wait for animation to complete
    await page.waitForTimeout(500);
    
    // Take screenshot after animation
    await expect(page.locator('#detailed-analysis')).toHaveScreenshot('detailed-analysis-expanded.png');
  });
});