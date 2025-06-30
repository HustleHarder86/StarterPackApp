# How to Test Load the StarterPack Extension

## Steps to Load the Extension in Chrome/Edge:

1. **Open Extension Management Page**
   - Chrome: Navigate to `chrome://extensions/`
   - Edge: Navigate to `edge://extensions/`

2. **Enable Developer Mode**
   - Toggle the "Developer mode" switch in the top right corner

3. **Load the Extension**
   - Click "Load unpacked"
   - Navigate to the `/home/amy/StarterPackApp/extension/` folder
   - Select the folder (not individual files)
   - Click "Select Folder"

4. **Verify Extension Loaded**
   - You should see "StarterPack Property Analyzer" in your extensions list
   - Check for any errors in the extension card
   - The extension icon should appear in your browser toolbar

## What to Check:

1. **No Errors**: The extension card should not show any errors
2. **Icon Visible**: The extension icon should appear in the toolbar
3. **Permissions**: Check that it has permission for realtor.ca
4. **Service Worker**: Should show as "Active" or running

## Testing the Extension:

1. **Test Welcome Page**:
   - After loading, it should open the welcome page
   - URL should be: `https://starterpackapp.vercel.app/extension-welcome.html`

2. **Test on Realtor.ca**:
   - Go to any property listing on realtor.ca
   - Click the extension icon
   - You should see the popup with "Analyze This Property" button

3. **Check Console**:
   - Open DevTools (F12) on a Realtor.ca property page
   - Look for: "StarterPack extension loaded on Realtor.ca" in console

## Common Issues:

1. **Manifest errors**: Check for syntax errors in manifest.json
2. **Missing files**: Ensure all icon files exist
3. **Permission errors**: Make sure host permissions are correct
4. **Service worker errors**: Check background.js for issues

## Current Extension Status:
- ✅ manifest.json updated with correct URLs
- ✅ background.js updated with correct endpoints
- ✅ content.js updated with correct branding
- ✅ Extension welcome page deployed