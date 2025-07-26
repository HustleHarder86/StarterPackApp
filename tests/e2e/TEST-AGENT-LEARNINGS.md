# Test Agent Learnings - Tab Functionality Debug Session

## Key Learnings from Tab Display Issue (January 2025)

### 1. **Data Structure Mismatches Between Backend and Frontend**

**Issue**: Backend API returns snake_case fields but frontend expects camelCase.

**Example**:
- Backend: `short_term_rental`, `long_term_rental`
- Frontend: `strAnalysis`, `longTermRental`

**Solution**: Always check data mapping between API responses and frontend components:
```javascript
// Quick API response check
const response = await fetch(API_URL, {...});
const data = await response.json();
console.log('API returns:', Object.keys(data));
console.log('Frontend expects:', /* check component props */);
```

### 2. **Multiple Data Entry Points**

**Issue**: Data can enter the frontend through multiple paths, each needs consistent handling:
- Fresh API calls (`analyzeProperty`)
- Loading from database (`loadExistingAnalysis`)
- URL parameters (`showAppropriateView`)
- Browser refresh with stored state

**Best Practice**: Create a central data mapping function and use it at ALL entry points.

### 3. **E2E Test Mode Considerations**

**Current Setup**:
- URL parameter: `?e2e_test_mode=true`
- Auth header: `Authorization: Bearer e2e-test-token`
- Custom header: `X-E2E-Test-Mode: true`
- Body flag: `isE2ETest: true`

**Important**: The backend returns mock data in E2E mode which may have a simpler structure than production data.

### 4. **Effective Debugging Strategies**

#### a) Check Data at Each Layer:
```javascript
// 1. API Response
console.log('Raw API response:', response);

// 2. After parsing
console.log('Parsed data:', data);

// 3. After mapping
console.log('Mapped data:', mappedData);

// 4. In component
console.log('Component received:', props);
```

#### b) Browser Console Debugging:
```javascript
// Check what's actually in the DOM
page.evaluate(() => {
  return {
    windowData: window.appState?.currentAnalysis,
    domElements: Array.from(document.querySelectorAll('[id*="tab"]')).map(el => ({
      id: el.id,
      visible: !el.classList.contains('hidden'),
      onclick: el.onclick?.toString()
    }))
  };
});
```

### 5. **Common Puppeteer Gotchas**

1. **Deprecated methods**: 
   - Use `await new Promise(resolve => setTimeout(resolve, ms))` instead of `page.waitForTimeout()`

2. **Click issues**:
   - Prefer `page.evaluate(() => document.getElementById('id').click())` over `page.click('#id')`

3. **Timing issues**:
   - Always wait after navigation: `await page.waitForSelector('#element', { timeout: 60000 })`
   - Add delays after clicks for animations: `await new Promise(resolve => setTimeout(resolve, 1000))`

### 6. **Test Organization Best Practices**

1. **Keep tests focused**: One test file per feature
2. **Clean up after debugging**: Remove temporary test files
3. **Use descriptive names**: `test-analysis-page.js` not `test1.js`
4. **Archive old tests**: Move to `tests/e2e/archive/` instead of deleting

### 7. **Deployment Awareness**

**Critical**: Changes won't reflect in tests until deployed!
- Local changes need: `git commit` + `git push` to main
- Vercel auto-deploys from main branch
- Railway requires manual deploy or auto-deploy setup

### 8. **Efficient Test Development Workflow**

1. **Start with API testing** (fastest):
   ```javascript
   // Direct API test - no browser needed
   const response = await fetch(API_URL, {...});
   ```

2. **Then test specific functionality**:
   ```javascript
   // Focus on the broken feature only
   await page.goto(url);
   await page.waitForSelector('#specific-element');
   ```

3. **Finally run comprehensive tests**:
   ```javascript
   // Full user journey after fix is verified
   ```

### 9. **Data Validation Patterns**

Always validate data exists before using:
```javascript
// Good
const monthlyRent = analysisData?.longTermRental?.monthlyRent || 0;

// Bad  
const monthlyRent = analysisData.longTermRental.monthlyRent; // Can throw error
```

### 10. **Screenshot Strategy**

Take screenshots at key points:
1. After page load
2. After form submission  
3. After tab clicks
4. On any error

```javascript
await page.screenshot({ 
  path: `tests/e2e/screenshots/${testName}-${step}.png`,
  fullPage: true 
});
```

## Quick Reference Commands

```bash
# Run fast API test
npm run test:api

# Run specific test
node tests/e2e/test-analysis-page.js

# Clean up old tests
rm tests/e2e/debug-*.js

# Check if changes are deployed
curl https://starter-pack-app.vercel.app/api/health
```

## Template for Future Tab/UI Issues

1. Check data structure:
   - What does API return?
   - What does frontend expect?
   - Is mapping happening?

2. Check visibility:
   - Is element in DOM?
   - Is it hidden with CSS?
   - Are there JS errors?

3. Check functionality:
   - Does click handler exist?
   - Is function defined?
   - Are there timing issues?

---

*Last updated: January 2025 after fixing tab display issue*