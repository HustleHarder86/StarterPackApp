# ROI Finder Integration Test

## Purpose
This test suite loads the actual `roi-finder.html` page in a real browser environment to catch:
- JavaScript module loading errors
- Component initialization issues
- Runtime errors that syntax validators miss
- Integration problems between components

## How It Works

### 1. **Auth Bypass**
Uses the existing `e2e_test_mode=true` URL parameter to bypass Firebase authentication:
```javascript
const url = new URL('/roi-finder.html', baseURL);
url.searchParams.set('e2e_test_mode', 'true');
```

### 2. **Tests Performed**

#### Load Test
- Verifies page loads without JavaScript errors
- Checks all console output for errors
- Ensures basic UI elements are present

#### Component Loading Test
- Verifies all Compact Modern components are loaded globally
- Checks ComponentLoader initialization
- Ensures proper class inheritance

#### Analysis Flow Test
- Simulates property data from extension
- Triggers auto-analyze
- Verifies results are displayed with Compact Modern UI

#### Mobile Functionality Test
- Tests mobile viewport
- Verifies hamburger menu is visible
- Checks sidebar hide/show behavior

#### Form Submission Test
- Fills out property form
- Submits and monitors API calls
- Verifies no errors during submission

#### Module System Test
- Specifically checks for module-related errors
- Verifies no import/export/require errors
- Confirms component loader is properly instantiated

## Running the Tests

### Quick Run
```bash
npm run test:integration
```

### With Browser UI (Headed Mode)
```bash
npm run test:integration:headed
```

### Individual Test File
```bash
npx playwright test tests/e2e/roi-finder-integration.spec.js
```

## What This Catches That Other Tests Miss

1. **Runtime Errors**: Syntax may be valid but fail when executed
2. **Module Loading**: ES6 vs CommonJS issues only appear at runtime
3. **Global Dependencies**: Missing window.X assignments
4. **Component Integration**: How components work together
5. **Real Browser Environment**: Actual browser API compatibility

## Example Errors This Would Have Caught

```javascript
// These passed syntax check but failed at runtime:
Uncaught SyntaxError: Unexpected token 'export'
Uncaught TypeError: Class extends value undefined
Uncaught ReferenceError: ComponentLoaderCompactModern is not defined
```

## Adding New Tests

To add new integration tests, add them to `roi-finder-integration.spec.js`:

```javascript
test('should verify new feature', async ({ page }) => {
  const url = new URL('/roi-finder.html', baseURL);
  url.searchParams.set('e2e_test_mode', 'true');
  
  await page.goto(url.toString());
  
  // Your test logic here
});
```

## Best Practices

1. Always use `e2e_test_mode=true` to bypass auth
2. Listen for console errors to catch runtime issues
3. Wait for appropriate load states before assertions
4. Test both desktop and mobile viewports
5. Verify component initialization, not just presence

This integration test suite ensures the production page actually works, not just that individual pieces are syntactically correct.