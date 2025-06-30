# CRITICAL: Extension Fix Steps

## The Problem
1. The extension is still using OLD code with `starterpackapp.vercel.app` (no hyphens)
2. The correct domain is `starter-pack-app.vercel.app` (with hyphens)
3. The extension hasn't been reloaded with the fixes

## Step-by-Step Fix

### 1. COMPLETELY REMOVE THE OLD EXTENSION
1. Go to `chrome://extensions/`
2. Find "StarterPack Property Analyzer"
3. Click **Remove** (not just disable)
4. Confirm removal

### 2. CLOSE ALL CHROME WINDOWS
- Close Chrome completely
- Make sure no Chrome processes are running

### 3. PULL THE LATEST CODE
Open terminal and run:
```bash
cd /home/amy/StarterPackApp
git pull origin main
```

### 4. VERIFY THE FIXES ARE PRESENT
Check that the files have the correct domain:
```bash
grep -n "starter-pack-app.vercel.app" extension/manifest.json
grep -n "starter-pack-app.vercel.app" extension/src/popup.js
```

You should see the corrected domain (with hyphens).

### 5. LOAD THE EXTENSION FRESH
1. Open Chrome
2. Go to `chrome://extensions/`
3. Enable "Developer mode"
4. Click "Load unpacked"
5. Navigate to `/home/amy/StarterPackApp/extension/`
6. Click "Select Folder"

### 6. TEST THE EXTENSION
1. Go to `https://starter-pack-app.vercel.app/roi-finder.html` (WITH HYPHENS!)
2. Make sure you're logged in
3. Click the extension icon
4. It should now work correctly

## Important URLs
- ❌ WRONG: `starterpackapp.vercel.app` (no hyphens - doesn't exist!)
- ✅ CORRECT: `starter-pack-app.vercel.app` (with hyphens - this works!)

## If Still Not Working
The extension might be cached. Try:
1. Clear Chrome's cache completely
2. Delete the extension folder from Chrome's profile
3. Restart computer
4. Load extension again