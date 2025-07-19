/**
 * End-to-End Tests for Refactored UI
 * Tests the complete user flow with new component architecture
 */

const { test, expect } = require('@playwright/test');

test.describe('Refactored ROI Finder UI', () => {
  test.beforeEach(async ({ page }) => {
    // Mock Firebase authentication
    await page.addInitScript(() => {
      window.mockFirebaseAuth = {
        currentUser: {
          uid: 'test-user-123',
          email: 'test@example.com',
          getIdToken: () => Promise.resolve('mock-token')
        }
      };
    });

    await page.goto('/roi-finder-v2.html');
  });

  test('displays loading state initially', async ({ page }) => {
    await expect(page.locator('#loading-state')).toBeVisible();
    await expect(page.locator('.loading-spinner')).toBeVisible();
    await expect(page.getByText('Loading Analysis')).toBeVisible();
  });

  test('shows property input form when no analysis data', async ({ page }) => {
    // Wait for auth to complete and show input form
    await expect(page.locator('#property-input-section')).toBeVisible({ timeout: 10000 });
    
    // Check form elements
    await expect(page.locator('#property-address')).toBeVisible();
    await expect(page.locator('#property-price')).toBeVisible();
    await expect(page.locator('#property-bedrooms')).toBeVisible();
    await expect(page.locator('#property-bathrooms')).toBeVisible();
    
    // Check form styling
    await expect(page.locator('.card-lg')).toBeVisible();
    await expect(page.getByText('Analyze a Property')).toBeVisible();
  });

  test('handles property analysis form submission', async ({ page }) => {
    // Mock API response
    await page.route('/api/analyze-property.js', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
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
          longTermRental: {
            monthlyRent: 3200,
            roi: 12.4
          },
          overallScore: 8.7
        })
      });
    });

    await expect(page.locator('#property-input-section')).toBeVisible({ timeout: 10000 });

    // Fill form
    await page.fill('#property-address', '123 Main St, Toronto, ON');
    await page.fill('#property-price', '850000');
    await page.selectOption('#property-bedrooms', '2');
    await page.selectOption('#property-bathrooms', '2');

    // Submit form
    await page.click('button[type="submit"]');

    // Should show loading state
    await expect(page.locator('#loading-state')).toBeVisible();
    await expect(page.getByText('Analyzing property...')).toBeVisible();

    // Should eventually show results
    await expect(page.locator('#analysis-results')).toBeVisible({ timeout: 10000 });
  });

  test('displays analysis results with proper component hierarchy', async ({ page }) => {
    // Mock analysis data in URL
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
      longTermRental: {
        monthlyRent: 3200,
        roi: 12.4
      },
      overallScore: 8.7,
      recommendations: [
        { title: 'High Demand', description: 'Strong market demand' }
      ]
    };

    // Simulate existing analysis load
    await page.evaluate((data) => {
      window.appState = { currentAnalysis: data };
    }, mockAnalysisData);

    await page.reload();

    // Wait for analysis results to render
    await expect(page.locator('#analysis-results')).toBeVisible({ timeout: 15000 });

    // Test component hierarchy - Investment Verdict should be first
    const sections = page.locator('#analysis-results .container > div');
    await expect(sections.first()).toContainText('RECOMMENDED');

    // Test Airbnb listings are prominent (position 2)
    const airbnbSection = sections.nth(1);
    await expect(airbnbSection).toContainText('Live Airbnb Market Data');
    await expect(airbnbSection).toContainText('LIVE DATA');

    // Test financial summary is present
    const financialSection = sections.nth(2);
    await expect(financialSection).toContainText('Financial Summary');
    await expect(financialSection).toContainText('$5,400');

    // Test action buttons are present
    const actionSection = sections.nth(3);
    await expect(actionSection).toContainText('Next Steps');
    await expect(actionSection).toContainText('Save to Portfolio');
    await expect(actionSection).toContainText('Generate Report');
  });

  test('airbnb listings hero section displays correctly', async ({ page }) => {
    // Set up analysis data with multiple comparables
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

    // Wait for Airbnb section to load
    await expect(page.getByText('Live Airbnb Market Data')).toBeVisible({ timeout: 15000 });

    // Check live data indicators
    await expect(page.locator('.animate-pulse')).toBeVisible(); // Live data dot
    await expect(page.getByText('3 active listings found')).toBeVisible();
    await expect(page.getByText('LIVE DATA')).toBeVisible();

    // Check comparable properties display
    await expect(page.getByText('$220/night')).toBeVisible();
    await expect(page.getByText('$185/night')).toBeVisible();
    await expect(page.getByText('$165/night')).toBeVisible();

    // Check performance badges
    await expect(page.getByText('TOP')).toBeVisible();
    await expect(page.getByText('MATCH')).toBeVisible();
    await expect(page.getByText('VALUE')).toBeVisible();

    // Check market summary stats
    await expect(page.getByText('Avg Nightly Rate')).toBeVisible();
    await expect(page.getByText('Avg Occupancy')).toBeVisible();
    await expect(page.getByText('Active Properties')).toBeVisible();
  });

  test('financial summary displays revenue comparison', async ({ page }) => {
    const mockAnalysisData = {
      strAnalysis: { monthlyRevenue: 5400 },
      longTermRental: { monthlyRent: 3200, roi: 12.4, capRate: 8.2 },
      overallScore: 8.7
    };

    await page.evaluate((data) => {
      window.appState = { currentAnalysis: data };
    }, mockAnalysisData);

    await page.reload();

    await expect(page.getByText('Financial Summary')).toBeVisible({ timeout: 15000 });

    // Check revenue comparison
    await expect(page.getByText('Short-Term Rental')).toBeVisible();
    await expect(page.getByText('Long-Term Rental')).toBeVisible();
    await expect(page.getByText('$5,400')).toBeVisible();
    await expect(page.getByText('$3,200')).toBeVisible();
    await expect(page.getByText('+$2,200')).toBeVisible();

    // Check key metrics
    await expect(page.getByText('Cap Rate')).toBeVisible();
    await expect(page.getByText('8.2%')).toBeVisible();
    await expect(page.getByText('Annual ROI')).toBeVisible();
    await expect(page.getByText('12.4%')).toBeVisible();
  });

  test('detailed analysis toggle works correctly', async ({ page }) => {
    const mockAnalysisData = {
      strAnalysis: { monthlyRevenue: 5400 },
      longTermRental: { monthlyRent: 3200 },
      overallScore: 8.7
    };

    await page.evaluate((data) => {
      window.appState = { currentAnalysis: data };
    }, mockAnalysisData);

    await page.reload();

    // Wait for toggle button
    await expect(page.getByText('Show Detailed Analysis')).toBeVisible({ timeout: 15000 });

    // Initially detailed section should be hidden
    await expect(page.locator('#detailed-analysis')).toHaveClass(/hidden/);

    // Click toggle
    await page.click('text=Show Detailed Analysis');

    // Should show detailed section
    await expect(page.locator('#detailed-analysis')).not.toHaveClass(/hidden/);
    await expect(page.getByText('Hide Detailed Analysis')).toBeVisible();

    // Click again to hide
    await page.click('text=Hide Detailed Analysis');
    await expect(page.locator('#detailed-analysis')).toHaveClass(/hidden/);
    await expect(page.getByText('Show Detailed Analysis')).toBeVisible();
  });

  test('mobile layout displays correctly', async ({ page }) => {
    // Set mobile viewport
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
            occupancy_rate: 85
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

    // Wait for mobile layout
    await expect(page.locator('.mobile-only')).toBeVisible({ timeout: 15000 });

    // Check mobile navigation
    await expect(page.locator('.mobile-only .grid-cols-3')).toBeVisible();
    await expect(page.getByText('Analyze')).toBeVisible();
    await expect(page.getByText('Portfolio')).toBeVisible();
    await expect(page.getByText('Reports')).toBeVisible();

    // Check mobile action buttons at bottom
    await expect(page.locator('.fixed.bottom-0')).toBeVisible();
    await expect(page.getByText('💾 Save Analysis')).toBeVisible();
    await expect(page.getByText('📊 Full Report')).toBeVisible();
  });

  test('handles error states gracefully', async ({ page }) => {
    // Mock API error
    await page.route('/api/analyze-property.js', async route => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Analysis failed' })
      });
    });

    await expect(page.locator('#property-input-section')).toBeVisible({ timeout: 10000 });

    // Fill and submit form
    await page.fill('#property-address', '123 Main St');
    await page.fill('#property-price', '850000');
    await page.click('button[type="submit"]');

    // Should show error state
    await expect(page.locator('#error-state')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Analysis Failed')).toBeVisible();
    await expect(page.getByText('Try Again')).toBeVisible();
  });

  test('action buttons are functional', async ({ page }) => {
    const mockAnalysisData = {
      strAnalysis: { monthlyRevenue: 5400 },
      longTermRental: { monthlyRent: 3200 },
      overallScore: 8.7
    };

    await page.evaluate((data) => {
      window.appState = { currentAnalysis: data };
    }, mockAnalysisData);

    await page.reload();

    // Wait for action buttons
    await expect(page.getByText('Next Steps')).toBeVisible({ timeout: 15000 });

    // Test action buttons are clickable
    await expect(page.getByText('Save to Portfolio')).toBeVisible();
    await expect(page.getByText('Generate Report')).toBeVisible();
    await expect(page.getByText('Analyze Another')).toBeVisible();

    // Check onclick handlers are attached
    const saveButton = page.locator('text=Save to Portfolio');
    await expect(saveButton).toHaveAttribute('onclick', 'saveAnalysis()');
  });

  test('design system classes are applied correctly', async ({ page }) => {
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

    // Check design system classes are present
    await expect(page.locator('.card')).toHaveCount({ min: 3 });
    await expect(page.locator('.card-elevated')).toHaveCount({ min: 1 });
    await expect(page.locator('.container')).toBeVisible();
    await expect(page.locator('.btn')).toHaveCount({ min: 3 });
    
    // Check gradient classes
    await expect(page.locator('.bg-gradient-to-r')).toHaveCount({ min: 1 });
    
    // Check badge classes
    await expect(page.locator('.badge')).toHaveCount({ min: 1 });
  });
});

test.describe('Responsive Design Tests', () => {
  const breakpoints = [
    { name: 'mobile', width: 375, height: 667 },
    { name: 'tablet', width: 768, height: 1024 },
    { name: 'desktop', width: 1200, height: 800 }
  ];

  breakpoints.forEach(({ name, width, height }) => {
    test(`displays correctly on ${name}`, async ({ page }) => {
      await page.setViewportSize({ width, height });
      await page.goto('/roi-finder-v2.html');

      const mockAnalysisData = {
        strAnalysis: { monthlyRevenue: 5400 },
        longTermRental: { monthlyRent: 3200 },
        overallScore: 8.7
      };

      await page.evaluate((data) => {
        window.appState = { currentAnalysis: data };
      }, mockAnalysisData);

      await page.reload();

      // Should load without layout issues
      await expect(page.locator('#analysis-results')).toBeVisible({ timeout: 15000 });
      
      // Check container width constraints
      const container = page.locator('.container').first();
      await expect(container).toBeVisible();
      
      // Check responsive grid behavior
      if (name === 'mobile') {
        await expect(page.locator('.mobile-only')).toBeVisible();
      } else {
        await expect(page.locator('.mobile-hidden')).toBeVisible();
      }
    });
  });
});