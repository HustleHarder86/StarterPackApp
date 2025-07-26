# Test Runner Agent Configuration

## Purpose
This agent specializes in running tests, debugging test failures, and ensuring code quality for the StarterPackApp project.

## Key Resources

### 📚 MUST READ BEFORE DEBUGGING
- **[TEST-AGENT-LEARNINGS.md](../tests/e2e/TEST-AGENT-LEARNINGS.md)** - Contains critical debugging patterns and lessons learned from real sessions

### Quick Test Commands
```bash
# Fast tests (recommended order)
npm run test:api          # Direct API testing (7-10 seconds)
npm run test:fast         # Browser E2E test (20-30 seconds)
npm run test:analysis     # Tab functionality test
npm run test:visual       # Screenshot capture test

# Comprehensive tests
npm run test:comprehensive  # Full test suite
npm run test:e2e           # All E2E tests
```

## Common Issues & Solutions

### 1. Tab Content Not Displaying
- **Cause**: Backend returns `snake_case`, frontend expects `camelCase`
- **Solution**: Check data mapping in `roi-finder.html` → `mapAnalysisData()`
- **Test**: `node tests/e2e/api-direct-test.js`

### 2. E2E Test Authentication
- **URL**: `?e2e_test_mode=true`
- **Headers**: `Authorization: Bearer e2e-test-token`, `X-E2E-Test-Mode: true`
- **Body**: `isE2ETest: true`

### 3. Deployment Testing
- **Important**: Changes must be deployed before testing live URLs
- **Deploy**: `git push origin main` (auto-deploys to Vercel)
- **Wait**: 1-2 minutes for deployment

## Debugging Workflow

1. **Start with API tests** - Fastest, no browser needed
2. **Check data structure** - What does API return vs what frontend expects?
3. **Use browser console** - `page.evaluate()` to inspect window state
4. **Take screenshots** - At key points for visual debugging
5. **Check deployment** - Are changes live on Vercel?

## Test File Organization

```
tests/e2e/
├── TEST-AGENT-LEARNINGS.md    # Debugging guide (READ THIS!)
├── api-direct-test.js         # Fast API testing
├── simple-fast-test.js        # Quick browser test
├── test-analysis-page.js      # Tab functionality
├── visual-check.js            # Screenshot capture
└── archive/                   # Old tests for reference
```

## Key Patterns

### Check Data at Each Layer
```javascript
// 1. API Response
console.log('API returns:', response.data);

// 2. After mapping
console.log('Mapped data:', this.mapAnalysisData(data));

// 3. In browser
await page.evaluate(() => window.appState?.currentAnalysis);
```

### Puppeteer Best Practices
```javascript
// Use evaluate for clicks
await page.evaluate(() => document.getElementById('id').click());

// Wait properly
await new Promise(resolve => setTimeout(resolve, 1000));

// Take screenshots on errors
await page.screenshot({ path: 'error.png', fullPage: true });
```

## Remember
- Clean up debug files after fixing issues
- Update TEST-AGENT-LEARNINGS.md with new discoveries
- Test locally before assuming deployment issues