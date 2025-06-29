# STR Platform Enhancement Deployment Checklist

## Phase 1: Extension Setup ✓
- [x] Icon generator created at `extension/icons/generate-icons.html`
- [ ] Generate all 4 icon sizes (16x16, 32x32, 48x48, 128x128)
- [ ] Load extension in Chrome/Edge developer mode
- [ ] Test extension on Realtor.ca property listings

## Phase 2: Vercel Deployment
- [ ] Deploy branch to Vercel staging/preview
- [ ] Add required environment variables:
  ```
  AIRBNB_SCRAPER_API_KEY=your-key
  AIRBNB_SCRAPER_API_URL=https://api.example.com/v1
  ```
- [ ] Verify new API endpoints are working:
  - `/api/analyze-property-enhanced` - Enhanced property analysis with STR
  - `/api/properties/ingest` - Browser extension data receiver
  - `/api/properties/list` - User properties listing
  - `/api/user-management-enhanced` - Updated user management with STR tracking

## Phase 3: Frontend Integration
- [ ] Update `roi-finder.html` to include RentalComparisonView component
- [ ] Add STR analysis toggle/button to existing property analysis form
- [ ] Update results display to show both LTR and STR analysis
- [ ] Test STR trial counter for free users (5 free analyses)

## Phase 4: Testing
- [ ] Test browser extension property data extraction
- [ ] Test enhanced analysis with both LTR and STR results
- [ ] Verify STR trial limits work correctly
- [ ] Test subscription tier enforcement
- [ ] Ensure proper error handling for missing API keys

## Environment Variables Required

### For STR Feature:
```bash
AIRBNB_SCRAPER_API_KEY=your-api-key
AIRBNB_SCRAPER_API_URL=https://api.example.com/v1
```

### Existing Required:
```bash
PERPLEXITY_API_KEY=pplx-xxxxx
FIREBASE_PROJECT_ID=your-project
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@project.iam
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

## Deployment Commands

```bash
# Deploy to Vercel preview
vercel

# Deploy to production
vercel --prod

# View deployment logs
vercel logs

# Set environment variables
vercel env add AIRBNB_SCRAPER_API_KEY
vercel env add AIRBNB_SCRAPER_API_URL
```

## Post-Deployment Verification

1. **Extension Testing**:
   - Navigate to a Realtor.ca property listing
   - Click extension icon
   - Verify "Analyze with StarterPackApp" button appears
   - Click button and verify redirect to app with property data

2. **STR Analysis Testing**:
   - Log in as free user
   - Analyze a property
   - Verify STR analysis option appears
   - Use STR analysis and verify trial counter decrements
   - Verify comparison view shows both LTR and STR data

3. **API Health Check**:
   - Check `/api/analyze-property-enhanced` returns enhanced data
   - Verify Airbnb API integration works
   - Check error handling for missing API keys

## Notes

- The STR feature is behind a Pro tier paywall with 5 free trials
- Browser extension requires manual installation by users
- Airbnb Scraper API costs $0.05 per 100 results
- Results are cached for 24 hours to reduce API costs