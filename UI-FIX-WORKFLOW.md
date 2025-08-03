# UI Fix Workflow - Standard Operating Procedure

This workflow should be followed for ALL UI fixes to ensure quality and prevent integration issues.

## 🎯 Workflow Steps

### 1. **Identify the Component** 
- Locate the exact file and component
- Find the specific element(s) to modify
- Note any dependencies (scripts, styles, data)

### 2. **Create a Mock First**
- Build a simple HTML mock of the desired fix
- Include all necessary styles and structure
- Test the mock in isolation to confirm it matches requirements

### 3. **Implement the Fix**
- Apply changes to the actual component
- Ensure data bindings are correct (watch for snake_case vs camelCase)
- Maintain existing functionality while making changes

### 4. **Quick Local Test**
- Create a standalone test HTML file with just the affected component
- Load with mock data that matches production structure
- Verify visually and functionally
- Check browser console for errors

### 5. **Automated Playwright Testing** 🆕 CRITICAL STEP
Run comprehensive automated tests using Playwright and the e2e-test-validator agent:

#### A. Start Local Server
```bash
# Option 1: Python server (recommended for quick testing)
python3 -m http.server 3000

# Option 2: Vercel dev server (if testing API endpoints)
npm run dev
```

#### B. Run Existing Playwright Tests
```bash
# Run all E2E tests
npm run test:e2e

# Run specific test file
npx playwright test tests/e2e/roi-finder-integration.spec.js

# Run with UI mode for debugging
npm run test:e2e:ui

# Run in headed mode to see browser
npm run test:e2e:debug
```

#### C. Create Custom Test for Your Fix
Create a new test file `tests/e2e/ui-fix-[component-name].spec.js`:

```javascript
const { test, expect } = require('@playwright/test');

test.describe('UI Fix: [Component Name]', () => {
  const baseURL = 'http://localhost:3000';
  
  test.beforeEach(async ({ page }) => {
    // Capture console errors
    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    page.on('pageerror', exception => {
      errors.push(exception.message);
    });
    
    // Navigate with E2E test mode
    const url = new URL('/[page].html', baseURL);
    url.searchParams.set('e2e_test_mode', 'true');
    await page.goto(url.toString());
    
    // Verify no JavaScript errors
    expect(errors).toHaveLength(0);
  });

  test('visual appearance matches mock', async ({ page }) => {
    // Take screenshot of initial state
    await page.screenshot({ 
      path: 'tests/e2e/screenshots/[component]-initial.png',
      fullPage: true 
    });
    
    // Verify key elements are visible
    await expect(page.locator('[selector]')).toBeVisible();
  });

  test('responsive design works correctly', async ({ page }) => {
    const viewports = [
      { width: 1920, height: 1080, name: 'desktop' },
      { width: 1366, height: 768, name: 'laptop' },
      { width: 375, height: 667, name: 'mobile' }
    ];
    
    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      await page.screenshot({ 
        path: `tests/e2e/screenshots/[component]-${viewport.name}.png` 
      });
      
      // Verify layout doesn't break
      await expect(page.locator('[main-container]')).toBeVisible();
    }
  });

  test('interactive elements work', async ({ page }) => {
    // Test buttons
    await page.click('[button-selector]');
    await expect(page.locator('[expected-result]')).toBeVisible();
    
    // Test form inputs
    await page.fill('[input-selector]', 'test value');
    await expect(page.locator('[input-selector]')).toHaveValue('test value');
    
    // Test dropdowns
    await page.selectOption('[select-selector]', 'option-value');
  });

  test('no console errors during interaction', async ({ page }) => {
    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    
    // Perform all interactions
    await page.click('[button]');
    await page.fill('[input]', 'value');
    
    // Verify no errors
    expect(errors).toHaveLength(0);
  });
});
```

#### D. Use e2e-test-validator Agent
Launch the e2e-test-validator agent with this prompt:
```
Please test the [component name] UI fix at http://localhost:3000/[page].html

Test Requirements:
1. Visual appearance matches the mock at mocks/[mock-name].html
2. All interactive elements work properly
3. No JavaScript errors in console
4. Responsive design works at 1920x1080, 1366x768, and 375x667
5. Loading states display correctly
6. Form validation works as expected
7. Data flows correctly through the component

Take screenshots of:
- Initial page load
- Each major interaction (button clicks, form fills)
- Mobile responsive view
- Any error states encountered

Debug any failures by:
- Checking console for specific error messages
- Verifying element selectors exist
- Testing data flow with console.log statements
- Comparing with the working mock

Report results with:
- Pass/fail status for each test
- Screenshots showing the current state
- Specific error messages and line numbers
- Recommendations for fixes
```

#### E. Common Playwright Debugging Commands
```bash
# Run specific test with debugging
npx playwright test [test-file] --debug

# Run with trace viewer for detailed debugging
npx playwright test --trace on
npx playwright show-trace

# Generate new test by recording interactions
npx playwright codegen http://localhost:3000/[page].html

# Update screenshots (visual regression)
npx playwright test --update-snapshots
```

#### F. Test Data Considerations
Per TEST-AGENT-LEARNINGS.md, always verify:
- Backend API returns snake_case, frontend expects camelCase
- E2E test mode returns simplified mock data
- Multiple data entry points need consistent handling

```javascript
// Add data structure validation in tests
test('data structure mapping works correctly', async ({ page }) => {
  // Make API call
  const response = await page.evaluate(async () => {
    const res = await fetch('/api/analyze-property', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer e2e-test-token',
        'X-E2E-Test-Mode': 'true'
      },
      body: JSON.stringify({ /* test data */ })
    });
    return res.json();
  });
  
  // Log for debugging
  console.log('API response keys:', Object.keys(response));
  
  // Verify expected structure
  expect(response).toHaveProperty('short_term_rental'); // backend format
  // Component should handle conversion to strAnalysis
});
```

### 6. **Pre-Commit Validation** ⚠️ CRITICAL STEP
- **Run code-reviewer agent** to compare:
  - Mock vs implementation structure
  - CSS class availability
  - Data property mapping
  - Event handler consistency
  - Script dependencies
  
- **Run ui-ux-tester agent** for final validation:
  - Capture screenshots of the fix
  - Validate visual appearance
  - Check for responsive issues
  - Verify no console errors
  - Compare with mock design

#### Validation Requirements:
✅ **Must Pass ALL of these:**
- No JavaScript errors
- All interactive elements functional
- Visual design matches mock
- Responsive at all breakpoints
- Performance acceptable (no lag)
- Accessibility maintained

### 7. **Fix Issues Found**
- Address ALL discrepancies identified by agents
- Update both implementation AND tests if needed
- Re-run full test suite after fixes
- Document any workarounds or limitations

### 8. **Final Testing Loop** 🆕
Before committing, run the complete test suite:

```bash
# 1. Run syntax validation
npm run test:syntax

# 2. Run your specific UI fix test
npx playwright test tests/e2e/ui-fix-[component-name].spec.js

# 3. Run comprehensive E2E tests
npm run test:comprehensive

# 4. Generate test report
npm run test:report
```

If ANY test fails:
1. **Debug with Playwright UI**: `npx playwright test --ui`
2. **Check trace files**: `npx playwright show-trace`
3. **Fix issues and re-run**: Repeat until all pass
4. **Update mock if needed**: Ensure mock still matches implementation

### 9. **Final Commit & Push**
Only proceed after ALL tests pass:

```bash
# Create feature branch if not already on one
git checkout -b claude/ui-fix-[component]-YYYYMMDD_HHMMSS

# Add files (excluding test artifacts)
git add -A
git add -u

# Commit with test results
git commit -m "fix: [component] UI improvements

- [List specific changes made]
- All Playwright tests passing
- Responsive design verified at all breakpoints
- No console errors detected

Test results: tests/e2e/screenshots/[component]-*.png

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>"

# Push to feature branch
git push origin [branch-name]

# Create PR for review
gh pr create --title "UI Fix: [Component Name]" --body "## Summary
- Fixed [specific issues]
- All tests passing
- Screenshots available in PR

## Test Results
- ✅ Syntax validation passed
- ✅ Playwright E2E tests passed
- ✅ Responsive design verified
- ✅ No console errors

## Screenshots
See tests/e2e/screenshots/ for visual validation"
```

## 🧪 Playwright Test Scenarios

### Standard Test Cases to Include:

#### 1. **Component Loading**
```javascript
// Test that component loads without errors
await page.goto('http://localhost:3000/page.html');
await page.waitForLoadState('networkidle');
const errors = [];
page.on('console', msg => {
  if (msg.type() === 'error') errors.push(msg.text());
});
expect(errors).toHaveLength(0);
```

#### 2. **Interactive Elements**
```javascript
// Test all buttons, links, form inputs
await page.click('#submit-button');
await page.fill('#input-field', 'test data');
await page.selectOption('#dropdown', 'option-value');
```

#### 3. **Responsive Design**
```javascript
// Test different viewport sizes
const viewports = [
  { width: 1920, height: 1080, name: 'desktop' },
  { width: 1366, height: 768, name: 'laptop' },
  { width: 375, height: 667, name: 'mobile' }
];

for (const viewport of viewports) {
  await page.setViewportSize(viewport);
  await page.screenshot({ path: `test-${viewport.name}.png` });
}
```

#### 4. **Visual Regression**
```javascript
// Compare with baseline screenshots
await expect(page).toHaveScreenshot('component-baseline.png');
```

## 🚫 Common Pitfalls to Avoid

1. **Data Structure Mismatches**
   - Mock uses `propertyData.image` but API provides `property_data.image_url`
   - Always verify actual data structure from API

2. **Missing CSS Dependencies**
   - Mock works because styles are inline
   - Component breaks because CSS class doesn't exist
   - Always check design-system.css and component styles

3. **Script Timing Issues**
   - Scripts executing before DOM ready
   - Chart.js or other libraries not loaded
   - Always check initialization order

4. **Event Handler Differences**
   - Mock uses onclick but component needs addEventListener
   - Different function names or scopes
   - Always match existing patterns

5. **Playwright-Specific Issues** 🆕
   - Not waiting for dynamic content to load
   - Testing too quickly (add appropriate waits)
   - Not handling async operations properly
   - Missing error boundary testing

## 📋 Pre-Flight Checklist

Before committing any UI fix:
- [ ] Mock created and approved (mocks/[component]-mock.html)
- [ ] Implementation matches mock structure exactly
- [ ] Local test file created and works correctly
- [ ] Playwright test file created (tests/e2e/ui-fix-[component].spec.js)
- [ ] All Playwright tests written:
  - [ ] Visual appearance test with screenshots
  - [ ] Responsive design test (desktop/laptop/mobile)
  - [ ] Interactive elements test (buttons/forms/dropdowns)
  - [ ] Console error monitoring test
  - [ ] Data structure mapping test
- [ ] Playwright tests debugged until passing:
  - [ ] npm run test:syntax - no syntax errors
  - [ ] npx playwright test [your-test] - all tests green
  - [ ] npm run test:comprehensive - no regressions
- [ ] Agent validations completed:
  - [ ] code-reviewer agent - implementation matches mock
  - [ ] ui-ux-tester agent - visual appearance correct
  - [ ] e2e-test-validator agent - full functionality verified
- [ ] Test artifacts reviewed:
  - [ ] Screenshots at all breakpoints look correct
  - [ ] No console errors in any test run
  - [ ] Performance acceptable (no lag/delays)
  - [ ] Existing features still work
- [ ] Documentation updated if needed

## 🎨 When to Use This Workflow

- Any visual component changes
- Layout modifications
- Adding/removing UI elements
- Styling updates
- Interactive feature changes
- Chart/visualization updates
- Form validations or submissions
- Animation or transition effects
- Mobile responsiveness updates

## 🔧 Debugging Tools and Commands

### Quick Server Start
```bash
# Python server for local testing
python3 -m http.server 3000

# Or use Node
npx http-server -p 3000
```

### Common Debugging Commands
```bash
# Run syntax tests
npm run test:syntax

# Run E2E tests
npm run test:e2e

# Check for CSS conflicts
grep -r "class-name" styles/

# Find JavaScript errors
grep -r "console.error" js/
```

### Agent Commands for Testing
```bash
# Full UI test with screenshots
# Use ui-ux-tester agent

# Functional testing with error checking  
# Use e2e-test-validator agent

# Code quality review
# Use code-reviewer agent

# Comprehensive debugging with test-runner agent
# Use test-runner agent when tests are failing
```

## 🔍 Playwright Troubleshooting Guide

### Common Issues and Solutions

#### 1. **Test Timeouts**
```javascript
// Increase timeout for slow operations
test('slow loading test', async ({ page }) => {
  test.setTimeout(60000); // 60 seconds
  await page.goto(url, { waitUntil: 'networkidle' });
});
```

#### 2. **Element Not Found**
```javascript
// Wait for element before interacting
await page.waitForSelector('#element-id', { state: 'visible' });
await page.click('#element-id');
```

#### 3. **Flaky Tests**
```javascript
// Add retries for unstable tests
test.describe('Flaky Feature', () => {
  test.describe.configure({ retries: 3 });
  // tests...
});
```

#### 4. **Authentication Issues in E2E Mode**
```javascript
// Ensure E2E test mode is properly set
const url = new URL(page.url());
url.searchParams.set('e2e_test_mode', 'true');
await page.goto(url.toString());
```

#### 5. **Screenshot Comparison Failures**
```bash
# Update baseline screenshots
npx playwright test --update-snapshots

# Or disable for specific test
await expect(page).toHaveScreenshot({ maxDiffPixels: 100 });
```

#### 6. **Console Errors Not Caught**
```javascript
// Set up error tracking before navigation
const errors = [];
page.on('console', msg => {
  if (msg.type() === 'error') errors.push(msg.text());
});
page.on('pageerror', err => errors.push(err.message));

// Navigate AFTER setting up listeners
await page.goto(url);
```

---

**Remember**: It's faster to validate before pushing than to fix after deployment! Always run the full test suite and debug until all tests pass. When stuck, use the test-runner agent to help debug failing tests.