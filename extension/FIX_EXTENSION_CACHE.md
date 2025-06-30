# Fix Extension Cache Issues

The extension is showing old "InvestorProps" branding because Chrome is caching the old files. Follow these steps to completely refresh the extension:

## Step 1: Remove the Old Extension
1. Go to `chrome://extensions/`
2. Find "InvestorProps Property Analyzer" 
3. Click "Remove" button
4. Confirm removal

## Step 2: Clear Extension Cache
1. Close all Chrome windows
2. Open Chrome again
3. Clear browsing data:
   - Press `Ctrl+Shift+Delete` (or `Cmd+Shift+Delete` on Mac)
   - Select "Cached images and files"
   - Click "Clear data"

## Step 3: Load Fresh Extension
1. Go to `chrome://extensions/`
2. Make sure "Developer mode" is ON (top right)
3. Click "Load unpacked"
4. Navigate to `/home/amy/StarterPackApp/extension/`
5. Click "Select Folder"

## Step 4: Verify Correct Installation
The extension should now show:
- Name: "StarterPack Property Analyzer" (not InvestorProps)
- When clicked: Shows "StarterPack" branding in popup
- Links should go to `starterpackapp.vercel.app`

## Step 5: Test
1. Click the extension icon - should show StarterPack popup
2. Try to login - should redirect to starterpackapp.vercel.app
3. The welcome page after install should be starterpackapp.vercel.app/extension-welcome.html

## If Still Showing Old Branding:
1. Check the extension ID in chrome://extensions/
2. Go to: `%LOCALAPPDATA%\Google\Chrome\User Data\Default\Extensions\[EXTENSION_ID]`
3. Delete that folder
4. Reload the extension again