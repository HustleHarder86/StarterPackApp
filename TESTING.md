# 🧪 StarterPackApp Testing Guide

## Quick Reference

### Run Tests
```bash
npm run test:quick         # Syntax + lint checks
npm run test:e2e           # Full E2E suite
npm run test:comprehensive # Everything
./test-5min-timeout.sh     # Test 5-minute STR timeout
```

### Timeout Configuration
- STR analysis can take up to 5 minutes
- See [docs/TIMEOUT-CONFIGURATION.md](docs/TIMEOUT-CONFIGURATION.md) for details
- Progress indicators show during long-running analysis

## 🔑 Tester Access for Unlimited STR Analysis

### Quick Setup for Testers

Testers automatically get **unlimited STR (Short-Term Rental) analysis** without consuming the 5-trial limit. This is essential for thorough testing of the application.

### Who Has Tester Access?

1. **Hardcoded User IDs** (Immediate Access)
   ```
   yBilXCUnWAdqUuJfy2YwXnRz4Xy2  # Primary tester account
   test-user-e2e                  # E2E test account
   test-user-id                   # Generic test account
   ```

2. **Email Domains** (Automatic Access)
   - `*@test.com`
   - `*@e2e.com`
   - `*@starterpackapp.com`

3. **Database Roles**
   - Users with `role: 'tester'`
   - Users with `isTester: true`

4. **Test Headers** (For Automated Testing)
   ```javascript
   // E2E Test Mode
   headers: {
     'X-E2E-Test-Mode': 'true'
   }
   
   // Test API Key
   headers: {
     'X-Test-API-Key': process.env.TEST_API_KEY
   }
   ```

### Granting Tester Access

```bash
# Grant tester access by user ID
node scripts/grant-tester-access.js yBilXCUnWAdqUuJfy2YwXnRz4Xy2

# Grant tester access by email
node scripts/grant-tester-access.js tester@example.com

# List all current testers
node scripts/grant-tester-access.js --list

# Show help
node scripts/grant-tester-access.js --help
```

## 🚀 Test Environments

### Local Testing
```bash
# Start development servers
npm run dev

# Access at
http://localhost:3000       # Frontend (Vercel)
http://localhost:3001       # Backend API (Railway)
```

### Production Testing
```
https://starter-pack-app.vercel.app              # Main production
https://starterpackapp.com                       # Custom domain
https://real-estate-app-production-ba5c.up.railway.app  # Railway API
```

## 📋 Test Commands

### Quick Tests
```bash
npm run test:quick          # Syntax validation & lint
npm run test:fast           # Quick functionality test
npm run test:api            # API endpoint tests
```

### Comprehensive Tests
```bash
npm run test:comprehensive  # Full test suite
npm run test:e2e           # End-to-end tests with Playwright
npm run test:visual        # Visual regression tests
npm run test:mobile        # Mobile responsiveness tests
```

### Specific Feature Tests
```bash
npm run test:analysis      # Property analysis flow
npm run test:integration   # Integration tests
npm run test:extension     # Browser extension tests
```

## 🔬 E2E Testing with Tester Access

### Example: Testing STR Analysis with Unlimited Access

```javascript
// tests/e2e/test-str-unlimited.js
const { test, expect } = require('@playwright/test');

test('STR analysis with tester access', async ({ page }) => {
  // Navigate to the app
  await page.goto('http://localhost:3000/roi-finder.html');
  
  // Login with tester account (has unlimited access)
  await page.fill('#email', 'tester@starterpackapp.com');
  await page.fill('#password', 'test-password');
  await page.click('#login-button');
  
  // Or use test headers for automated testing
  await page.setExtraHTTPHeaders({
    'X-E2E-Test-Mode': 'true'
  });
  
  // Run STR analysis multiple times without limit
  for (let i = 0; i < 10; i++) {
    await page.fill('#property-address', `123 Test St ${i}, Toronto, ON`);
    await page.click('#analyze-property');
    
    // Should always work for testers (no trial limit)
    await expect(page.locator('#str-analysis-results')).toBeVisible();
    console.log(`✅ STR Analysis ${i + 1} completed successfully`);
  }
});
```

### Using Test Mode in Manual Testing

1. **Via URL Parameter**
   ```
   http://localhost:3000/roi-finder.html?e2e_test_mode=true
   ```

2. **Via Browser Console**
   ```javascript
   // Enable test mode
   localStorage.setItem('testMode', 'true');
   localStorage.setItem('testUserId', 'yBilXCUnWAdqUuJfy2YwXnRz4Xy2');
   
   // Reload the page
   location.reload();
   ```

## 🛠️ Test Data & Fixtures

### Sample Property for Testing
```javascript
const testProperty = {
  address: "123 King Street West, Unit 1205, Toronto, ON M5H 1A1",
  price: 850000,
  bedrooms: 2,
  bathrooms: 2,
  sqft: 900,
  propertyTaxes: 5400,
  condoFees: 650,
  propertyType: "condo"
};
```

### Mock STR Analysis Response
```javascript
const mockSTRAnalysis = {
  avgNightlyRate: 175,
  occupancyRate: 70,
  monthlyRevenue: 3675,
  annualRevenue: 44100,
  comparables: [
    {
      id: "948952522936415908",
      title: "Downtown Condo with City Views",
      nightly_rate: 185,
      bedrooms: 2,
      occupancy_rate: 0.75
    }
  ]
};
```

## 🐛 Debugging Tests

### Enable Debug Logs
```bash
# Run tests with debug output
DEBUG=* npm run test:e2e

# Run specific test with headed browser
npx playwright test test-str-analysis.spec.js --headed --debug
```

### Check Test Screenshots
```bash
# Analyze test screenshots
node tests/e2e/screenshot-analyzer.js report

# View screenshots
ls tests/e2e/screenshots/
```

### Common Test Issues & Solutions

| Issue | Solution |
|-------|----------|
| STR trial limit reached | Use tester account or add user ID to whitelist |
| CORS errors in tests | Add `X-E2E-Test-Mode: true` header |
| Authentication failures | Check Firebase test credentials |
| API timeout | Increase timeout or check Railway API status |

## 📊 Test Coverage Requirements

- **Unit Tests**: 80% coverage minimum
- **Integration Tests**: All API endpoints
- **E2E Tests**: Critical user flows
- **Visual Tests**: Key UI components

## 🔄 Continuous Testing

### Pre-commit Hooks
Automatically runs on `git commit`:
- JavaScript syntax validation
- Environment validation
- Quick smoke tests

### GitHub Actions (Coming Soon)
- Run full test suite on PR
- Deploy preview on test pass
- Block merge on test failure

## 📝 Test Documentation

### Write Test Cases
```javascript
/**
 * Test: STR Analysis with Tester Access
 * Purpose: Verify unlimited STR analysis for testers
 * Prerequisites: Tester account or test headers
 * Expected: No trial limit, all analyses succeed
 */
```

### Report Issues
1. Check if user has tester access
2. Verify environment variables
3. Check Railway API logs
4. Create issue with reproduction steps

## 🎯 Testing Checklist

Before deploying any changes:

- [ ] Run `npm run test:quick` locally
- [ ] Test with tester account (unlimited STR)
- [ ] Verify in both Chrome and Safari
- [ ] Check mobile responsiveness
- [ ] Test with slow network (Network throttling)
- [ ] Verify error handling
- [ ] Check console for errors
- [ ] Review network requests

## 💡 Pro Tips

1. **Always use tester accounts** for development to avoid trial limits
2. **Set up test data** in Firebase for consistent testing
3. **Use screenshots** to debug visual issues
4. **Check logs** in Railway dashboard for API issues
5. **Test locally first** before deploying to production

## 🆘 Need Help?

- Check [TEST-AGENT-LEARNINGS.md](./tests/e2e/TEST-AGENT-LEARNINGS.md) for debugging patterns
- Review [CLAUDE.md](./CLAUDE.md) for architecture details
- Contact team for tester access issues

---

*Last Updated: August 2025*
*Tester Access Feature: Active ✅*