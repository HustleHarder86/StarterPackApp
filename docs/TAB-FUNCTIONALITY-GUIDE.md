# Tab Functionality Implementation Guide

## 🚨 CRITICAL: How to Keep Tabs Working 🚨

This guide documents the exact implementation required for the rental analysis tabs (STR, LTR, Investment) to function correctly.

## The Problem We Solved

1. **Data Structure Mismatch**: Backend returns `snake_case` but frontend expects `camelCase`
2. **Script Execution**: Scripts inside `innerHTML` don't execute automatically
3. **Function Scope**: Tab switching function must be globally accessible

## Required Implementation

### 1. Data Mapping (roi-finder.html)

Always map the analysis data BEFORE rendering:

```javascript
mapAnalysisData(analysisData) {
    // Map API response fields to frontend expectations
    if (analysisData.short_term_rental) {
        analysisData.strAnalysis = analysisData.short_term_rental;
    }
    if (analysisData.long_term_rental) {
        analysisData.longTermRental = analysisData.long_term_rental;
    }
    return analysisData;
}
```

Apply mapping at ALL data entry points:
- After API response
- When loading from URL params
- When retrieving from session storage

### 2. Global Function Definition (componentLoader.js)

The `switchTab` function MUST be defined AFTER setting innerHTML:

```javascript
// WRONG - This won't work:
targetContainer.innerHTML = `
    <script>
        window.switchTab = function(tabName) { ... }
    </script>
`;

// CORRECT - Define after innerHTML:
targetContainer.innerHTML = analysisLayout;
this.attachEventHandlers();

// Define switchTab function globally
window.switchTab = function(tabName) {
    // Tab switching logic here
};
```

### 3. HTML Structure Requirements

Each tab must have:
- Button with ID: `{tabName}-tab` (e.g., `str-tab`, `ltr-tab`)
- Content div with ID: `{tabName}-content` (e.g., `str-content`, `ltr-content`)
- Class `tab-button` on buttons
- Class `tab-content` on content divs

```html
<!-- Tab Buttons -->
<button id="str-tab" class="tab-button" onclick="switchTab('str')">...</button>
<button id="ltr-tab" class="tab-button" onclick="switchTab('ltr')">...</button>

<!-- Tab Content -->
<div id="str-content" class="tab-content">...</div>
<div id="ltr-content" class="tab-content hidden">...</div>
```

## Common Pitfalls to Avoid

1. **DON'T** put the switchTab function inside innerHTML script tags
2. **DON'T** forget to map snake_case to camelCase
3. **DON'T** assume the function is available immediately (use setTimeout if needed)
4. **DON'T** forget the `hidden` class on non-active tab content

## Testing Checklist

- [ ] Click STR tab - shows short-term rental content
- [ ] Click LTR tab - shows long-term rental content  
- [ ] Click Investment tab - shows investment planning content
- [ ] Active tab has visual indicators (white background, blue text, checkmark)
- [ ] Inactive tabs are grayed out
- [ ] Console shows no errors when switching tabs

## Key Files

1. `/js/modules/componentLoader.js` - Contains tab UI and switchTab function
2. `/roi-finder.html` - Contains mapAnalysisData function
3. `/api/analyze-property.js` - Proxies to Railway (returns snake_case data)

## Debug Commands

If tabs aren't working, check in browser console:

```javascript
// Check if function exists
console.log(typeof window.switchTab); // Should be "function"

// Check tab content elements
document.querySelectorAll('.tab-content'); // Should find 3 elements

// Check data structure
console.log(window.appState.currentAnalysis); // Check if has strAnalysis/longTermRental

// Manually trigger tab switch
window.switchTab('ltr');
```

## Summary

The tabs work when:
1. Data is properly mapped from snake_case to camelCase
2. switchTab function is defined globally AFTER innerHTML
3. HTML structure follows the naming conventions
4. All three components work together

Last working implementation: July 26, 2025