# Testing Framework for StarterPackApp

This directory contains testing utilities to ensure code quality before pushing to GitHub.

## Available Tests

### 1. UI Component Tests (`test-ui-components.js`)
Tests the specific UI components for:
- File existence
- Proper exports/imports
- Syntax correctness
- Runtime safety
- CSS class definitions

**Run:** `node tests/test-ui-components.js`

### 2. Browser Test (`browser-test.html`)
Visual test that loads components in a browser to check:
- Component rendering
- CSS styling
- Data processing
- No console errors

**Run:** Open `tests/browser-test.html` in your browser

### 3. Pre-Push Checklist (`pre-push-checklist.sh`)
Interactive checklist that:
- Runs automated tests
- Checks for debugger statements
- Verifies critical files exist
- Checks git status
- Prompts for manual testing confirmation

**Run:** `./tests/pre-push-checklist.sh`

## Setting Up Git Hooks

To automatically run tests before pushing:

```bash
# Configure git to use our hooks
git config core.hooksPath .githooks
```

This will run tests automatically when you `git push`.

## Quick Test Before Push

1. **Run automated tests:**
   ```bash
   node tests/test-ui-components.js
   ```

2. **Open browser test:**
   - Open `tests/browser-test.html` in Chrome/Firefox
   - Check all tests pass (green)
   - Look for any console errors

3. **Test the actual app:**
   - Open `roi-finder.html` with proper URL parameters
   - Verify the UI matches the mockup
   - Check that all interactive elements work

4. **Run the checklist:**
   ```bash
   ./tests/pre-push-checklist.sh
   ```

## What Gets Tested

- ✅ Component file existence
- ✅ JavaScript syntax validity
- ✅ Import/export statements
- ✅ CSS class definitions
- ✅ HTML structure validity
- ✅ Safe property access patterns
- ✅ No debugger statements
- ✅ Component rendering

## Adding New Tests

To add tests for new components:

1. Add the component path to `criticalComponents` array in `test-ui-components.js`
2. Add any new CSS classes to `requiredClasses` array
3. Add component-specific tests in the appropriate test function

## Common Issues and Fixes

### "Cannot read properties of undefined"
- Check for missing default parameters: `({ prop } = {})`
- Use optional chaining: `obj?.property`

### CSS classes not found
- Add missing classes to `design-system.css`
- Ensure class names match exactly (case-sensitive)

### Component not rendering
- Check all imports are correct
- Verify export statements match import names
- Ensure all dependent components are loaded

## Best Practices

1. **Always test before pushing** - Run the test suite
2. **Test in browser** - Use browser-test.html
3. **Check console** - No errors should appear
4. **Test with real data** - Use actual property analysis
5. **Test responsive** - Check mobile and desktop views