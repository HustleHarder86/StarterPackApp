# Visual Testing Guide for StarterPack

This guide explains how to use Playwright to capture screenshots of the application and analyze them for UI/UX improvements.

## Prerequisites

1. Install Playwright:
   ```bash
   npm install -D @playwright/test
   npx playwright install
   ```

2. Ensure the application is running:
   ```bash
   npm run dev
   ```

3. Ensure Railway API is running (for real analysis):
   ```bash
   cd railway-api && npm run dev
   ```

## Running Visual Tests

### 1. Capture Screenshots

Run the visual analysis test to capture screenshots at key points:

```bash
# Run visual tests only
npx playwright test visual-analysis-test.spec.js

# Run with headed browser to watch it happen
npx playwright test visual-analysis-test.spec.js --headed

# Run for specific browser
npx playwright test visual-analysis-test.spec.js --project=chromium
```

### 2. View Captured Screenshots

Screenshots are saved to `tests/e2e/screenshots/`. The test captures:

1. **Initial Page State** - How the form looks on load
2. **Analysis Modes** - LTR/STR selection UI
3. **Loading States** - Progress indicators
4. **Results Pages** - Full analysis results
5. **Individual Sections**:
   - Property details
   - Financial metrics
   - Charts and visualizations
   - Recommendations
   - STR comparisons
   - Airbnb comparables
6. **Responsive Views** - Mobile and tablet layouts
7. **Error States** - Form validation and API errors

### 3. Analyze Screenshots

Run the analysis script to get a checklist of things to review:

```bash
node tests/e2e/analyze-screenshots.js
```

This generates:
- A checklist of what to look for in each screenshot
- General improvement areas to consider
- An analysis template (analysis-template.md) for documenting findings

### 4. Review Screenshots with Claude

To have Claude (me) analyze the screenshots and provide specific UI/UX improvements:

1. Use the Read tool to view a screenshot:
   ```
   Read the screenshot at: tests/e2e/screenshots/05-full-results.png
   ```

2. Claude can then analyze:
   - Visual hierarchy and information architecture
   - Color contrast and accessibility
   - Typography and readability
   - Data visualization effectiveness
   - Mobile responsiveness issues
   - Professional appearance
   - User flow improvements

## Screenshot Naming Convention

- `01-initial-page.png` - Starting state
- `02-analysis-modes.png` - Mode selection
- `03-ltr-mode-selected.png` - LTR selected
- `04-loading-state.png` - Loading indicator
- `05-full-results.png` - Complete results
- `06-property-details.png` - Property info section
- `07-financial-metrics.png` - Financial calculations
- `08-charts.png` - Data visualizations
- `09-recommendations.png` - AI recommendations
- `10-str-mode-selected.png` - STR selected
- `11-str-results.png` - STR analysis results
- `12-str-comparison.png` - LTR vs STR comparison
- `13-airbnb-comparables.png` - Comparable properties
- `14-mobile-results.png` - Mobile view (390x844)
- `15-tablet-results.png` - Tablet view (768x1024)
- `16-empty-form-error.png` - Validation error
- `17-minimal-data-loading.png` - Loading without extension data

## Improvement Process

1. **Capture Current State**: Run visual tests to get baseline screenshots
2. **Analyze**: Review screenshots for improvement opportunities
3. **Prioritize**: Rank improvements by impact and effort
4. **Implement**: Make changes to HTML/CSS/JS
5. **Re-test**: Capture new screenshots to verify improvements
6. **A/B Test**: Consider testing major changes with users

## Common Issues to Check

### Visual Hierarchy
- Is the most important information prominent?
- Are sections clearly separated?
- Is the eye flow logical?

### Data Presentation
- Are numbers formatted consistently ($X,XXX)?
- Are percentages clear (X.XX%)?
- Do charts add value or confusion?

### Mobile Experience
- Do all elements fit on screen?
- Are touch targets at least 44x44px?
- Does horizontal scrolling occur?

### Loading States
- Is progress clearly communicated?
- Are users informed what's happening?
- Is there a way to cancel?

### Error Handling
- Are errors visible but not alarming?
- Is recovery guidance provided?
- Are validation messages helpful?

### Professional Appeal
- Does it look trustworthy for financial decisions?
- Is the design consistent throughout?
- Are there any amateur elements?

## Tips for Better Screenshots

1. **Use Consistent Data**: The test uses predefined property data for consistency
2. **Multiple Viewports**: Test captures desktop, tablet, and mobile views
3. **Real API Calls**: Tests use actual API (can mock for faster tests)
4. **Full Page Captures**: Most screenshots capture the entire page
5. **Section Captures**: Individual sections are also captured for detailed review

## Next Steps

After capturing and analyzing screenshots:

1. Document findings in `analysis-template.md`
2. Create GitHub issues for improvements
3. Implement high-priority fixes first
4. Re-run visual tests to verify improvements
5. Consider user testing for major changes