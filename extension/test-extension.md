# Extension Testing Guide

## Installation Steps

1. **Open Chrome/Edge Extensions Page**
   - Chrome: `chrome://extensions/`
   - Edge: `edge://extensions/`

2. **Enable Developer Mode**
   - Toggle the "Developer mode" switch in the top right

3. **Load Extension**
   - Click "Load unpacked"
   - Navigate to `/home/amy/StarterPackApp/extension/`
   - Select the folder and click "Select"

4. **Verify Installation**
   - Extension should appear in the list
   - Icon should be visible in the browser toolbar
   - No errors should be displayed

## Testing Steps

### 1. Test Popup
- Click the extension icon in toolbar
- Should show login form
- Login button should be functional
- UI should be responsive

### 2. Test on Realtor.ca
- Navigate to: `https://www.realtor.ca/`
- Search for any property
- Click on a property listing to view details
- Look for "Analyze with StarterPackApp" button near the price
- Button should be styled and visible

### 3. Test Data Extraction
- Click "Analyze with StarterPackApp" button
- Should show "Extracting data..." briefly
- Should either:
  - Open new tab with analysis (if logged in)
  - Show error to login first (if not logged in)

### 4. Test Authentication Flow
1. Click extension icon
2. Enter test credentials
3. Should show logged-in state with:
   - User email
   - Analysis count
   - STR trial count
   - Dashboard link

## Expected Behavior

- **Content Script**: Loads on all Realtor.ca property pages
- **Analyze Button**: Appears near property price
- **Data Extraction**: Captures all property details
- **API Integration**: Sends data to backend
- **Navigation**: Opens analysis in new tab

## Common Issues

1. **Icons Not Loading**
   - Placeholder icons were created
   - Generate real icons using `extension/icons/generate-icons.html`

2. **Button Not Appearing**
   - Check console for errors
   - Verify you're on a property details page
   - Try refreshing the page

3. **API Errors**
   - Ensure you're logged in via popup
   - Check network tab for API response
   - Verify backend is running

## Console Commands for Debugging

```javascript
// Check if content script loaded
console.log('Content script loaded:', window.location.href);

// Test data extraction
const data = extractPropertyData();
console.log('Extracted data:', data);

// Check for analyze button
const button = document.getElementById('starterpack-analyze-btn');
console.log('Button exists:', !!button);
```