# Manual Test Checklist for Property Analysis Updates

This checklist helps verify all the recent changes are working correctly.

## Prerequisites
- [ ] Both Railway and Vercel have deployed from main branch
- [ ] Browser extension is installed and updated

## Test 1: Canadian Property Format (Bedrooms/Bathrooms)
1. [ ] Go to a Realtor.ca listing with "X + Y" bedroom format (e.g., "4 + 2 bedrooms")
2. [ ] Click the StarterPack extension
3. [ ] Verify the popup shows the raw format (e.g., "4 + 2")
4. [ ] Click "Analyze Property"
5. [ ] On roi-finder.html, verify:
   - [ ] Bedrooms show as total (e.g., 6 for "4 + 2")
   - [ ] Bathrooms show as total (e.g., 4.5 for "3.5 + 1")

## Test 2: API Routing (All to Railway)
1. [ ] Open browser DevTools Network tab
2. [ ] Perform LTR analysis
3. [ ] Verify request goes to:
   - [ ] `https://starterpackapp-production.up.railway.app/api/analysis/property`
   - [ ] NOT to vercel.app domain
4. [ ] Perform STR analysis
5. [ ] Verify request also goes to Railway API

## Test 3: City Parsing Fix
1. [ ] Find a listing where city field contains postal code
2. [ ] Analyze the property
3. [ ] In results, verify:
   - [ ] City shows actual city name (e.g., "Mississauga")
   - [ ] City does NOT show "Ontario L5A1E1" format

## Test 4: 60-Second Timeout
1. [ ] Analyze a property and start timer
2. [ ] If analysis takes > 30 seconds:
   - [ ] Verify it does NOT timeout at 30s (old Vercel limit)
   - [ ] Verify it continues processing
3. [ ] If analysis takes > 60 seconds:
   - [ ] Verify graceful timeout error appears
   - [ ] No "FUNCTION_INVOCATION_TIMEOUT" error

## Test 5: Property Tax Preservation
1. [ ] Find listing with explicit property tax (e.g., $5,490/year)
2. [ ] Analyze property
3. [ ] In results, verify:
   - [ ] Property tax shows exact listing amount ($5,490)
   - [ ] NOT a calculated estimate

## Test 6: STR Analysis Integer Fix
1. [ ] Find property with decimal bathrooms (e.g., 2.5)
2. [ ] Run STR analysis
3. [ ] Verify:
   - [ ] No "Field input.minBathrooms must be integer" error
   - [ ] STR analysis completes successfully
   - [ ] Comparables are shown

## Console Checks
Open browser console and verify:
- [ ] No "API_CONFIG already declared" errors
- [ ] Console shows "STR: true" when STR mode selected
- [ ] Request logs show Railway URL

## Expected Request Format
When analyzing, check Network tab request payload includes:
```json
{
  "propertyAddress": "123 Main St, Mississauga, ON L5A 1E1",
  "propertyData": {
    "bedrooms": "4 + 2",      // Raw format preserved
    "bathrooms": "3.5 + 1",   // Raw format preserved  
    "address": {
      "city": "Mississauga"   // Correctly parsed
    }
  },
  "analysisMode": "str"       // or "ltr"
}
```

## Common Issues to Watch For
- ❌ Timeout at exactly 30 seconds → Vercel being used instead of Railway
- ❌ City shows as "Ontario L5A1E1" → City parsing not working
- ❌ Bedrooms show as "4 + 2" in results → Parsing not applied
- ❌ Property tax differs from listing → Using estimates instead of actuals

## Success Criteria
- ✅ All analyses complete without timeout (unless > 60s)
- ✅ Canadian property formats parsed correctly
- ✅ All requests go to Railway API
- ✅ City names extracted properly
- ✅ Actual listing data preserved