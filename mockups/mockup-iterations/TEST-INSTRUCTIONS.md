# 🚀 Mockup Testing Instructions

## ✅ Setup Complete!

Both mockups are now fully wired up with:
- ✅ Live API integration with Railway backend
- ✅ Chrome extension support from Realtor.ca
- ✅ Robust error handling and recovery
- ✅ Automatic environment detection
- ✅ Test mode support
- ✅ Mock data fallback

## 🏃 Quick Start

### 1. Start Local Development Servers

```bash
# From project root (/home/amy/StarterPackApp)
npm run dev
```

This starts:
- Vercel dev server on http://localhost:3000
- Railway API on http://localhost:3001

### 2. Open Mockups in Browser

#### Base Mockup (V1):
```
http://localhost:3000/mockups/mockup-iterations/base-mockup.html
```

#### Enhanced Mockup (V2):
```
http://localhost:3000/mockups/mockup-iterations/base-mockup2.html
```

## 🧪 Testing Scenarios

### Scenario 1: Manual Property Entry
1. Open either mockup
2. Enter a Canadian address (e.g., "123 Main St, Toronto, ON")
3. Click "Analyze Property"
4. Watch data populate all sections

### Scenario 2: Chrome Extension Flow
1. Install Chrome extension from `/extension` folder
2. Go to any Realtor.ca property listing
3. Click "Analyze with StarterPack" button
4. Mockup opens with data pre-populated
5. Analysis runs automatically

### Scenario 3: Test Mode
Add `?test=true` to URL:
```
http://localhost:3000/mockups/mockup-iterations/base-mockup.html?test=true
```

Features in test mode:
- Unlimited STR analysis (no 5-trial limit)
- Test mode banner appears
- Enhanced logging in console

### Scenario 4: Mock Data Testing
Add `?useMock=true` to URL or click "Use Mock Data" in error recovery:
```
http://localhost:3000/mockups/mockup-iterations/base-mockup.html?useMock=true
```

### Scenario 5: Extension Simulation
Simulate extension data without installing:
```
http://localhost:3000/mockups/mockup-iterations/base-mockup.html?fromExtension=true&autoAnalyze=true&street=456+Oak+Ave&city=Vancouver&province=BC&price=1200000&bedrooms=4&bathrooms=3&sqft=2400
```

## 🔍 Debugging

### Check Console Logs
Open browser DevTools (F12) and look for:
- `[MockupConfig]` - Environment settings
- `[PropertyAnalysisAPI]` - API calls
- `[ExtensionHandler]` - Extension data processing
- `[ErrorRecovery]` - Error handling
- `[Mockup]` or `[Mockup2]` - Page-specific logs

### Common Issues & Solutions

#### "CORS Error"
- Ensure Railway API is running on port 3001
- Check console for specific CORS message
- Try clicking "Check API Health" button in error UI

#### "Timeout Error"
- STR analysis can take 30-60 seconds
- Retry button will appear
- Consider using mock data for testing

#### "No Data Appearing"
- Check network tab for API responses
- Verify data mapping (snake_case → camelCase)
- Look for console errors

#### "Extension Not Working"
- Ensure you're on a Realtor.ca property page
- Check extension is loaded in Chrome
- Verify property data extraction in console

## 📊 What to Test

### In Base Mockup (V1):
- [ ] Property form submission
- [ ] STR revenue calculations update
- [ ] LTR rent calculations update
- [ ] Financial calculator responds to sliders
- [ ] Comparison tab shows data
- [ ] Error recovery UI appears on failure
- [ ] Extension data auto-populates

### In Enhanced Mockup (V2):
- [ ] All V1 features work
- [ ] Quick comparison chart updates
- [ ] Investment grade calculation
- [ ] Enhanced visualizations
- [ ] Bar charts respond to data

## 🎯 Success Criteria

✅ **Local Testing Works**: Both mockups work with `npm run dev`
✅ **Extension Flow Works**: Data flows from Realtor.ca → Mockups
✅ **Error Handling Works**: Graceful failures with recovery options
✅ **Performance**: STR analysis completes within 60 seconds
✅ **Auth Optional**: Works without Firebase authentication
✅ **Test Mode**: All test triggers work correctly
✅ **Data Mapping**: No snake_case/camelCase errors
✅ **CORS Clean**: No CORS errors in console

## 🚀 Deployment

When ready for production:

```bash
# Commit all changes
git add .
git commit -m "feat: Wire up mockups with bulletproof API integration"

# Push to trigger auto-deployment
git push origin main

# Vercel auto-deploys frontend
# Railway needs manual deploy or webhook setup
```

## 🆘 Help & Support

If you encounter issues:
1. Check browser console for errors
2. Click "Check API Health" for server status
3. Use "Mock Data" mode for UI testing
4. Review error recovery suggestions

## 🎉 You're Ready!

Start testing with:
```bash
npm run dev
```

Then open:
- http://localhost:3000/mockups/mockup-iterations/base-mockup.html
- http://localhost:3000/mockups/mockup-iterations/base-mockup2.html

Happy testing! 🚀