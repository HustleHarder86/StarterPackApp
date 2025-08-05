# 🔑 Airbnb API Setup Instructions

## URGENT: Add These Environment Variables to Railway

Your STR (Short-Term Rental) analysis will NOT work without these API credentials.

### Required Environment Variables

Add these to your Railway deployment environment variables:

```bash
AIRBNB_SCRAPER_API_KEY=your-apify-api-key-here
AIRBNB_SCRAPER_API_URL=https://api.apify.com/v2/acts/your-actor-id/runs
```

### Where to Get These Values

1. **AIRBNB_SCRAPER_API_KEY**:
   - Login to [Apify Console](https://console.apify.com)
   - Go to Settings → Integrations → API
   - Copy your Personal API token

2. **AIRBNB_SCRAPER_API_URL**:
   - Find your Airbnb scraper actor in Apify
   - Common actors:
     - `maxcopell/airbnb-scraper`
     - `dtrungtin/airbnb-scraper`
   - The URL format is: `https://api.apify.com/v2/acts/[ACTOR_ID]/runs`
   - Example: `https://api.apify.com/v2/acts/maxcopell~airbnb-scraper/runs`

### How to Add to Railway

1. Go to your Railway dashboard
2. Select your `starterpackapp-api` project
3. Click on "Variables" tab
4. Click "Add Variable"
5. Add each variable with its value
6. Railway will automatically redeploy

### Testing After Setup

Once added, test by:
1. Going to your app
2. Entering a property address
3. Selecting "Short-Term Rental Analysis"
4. You should see Airbnb comparables loading

### Alternative: Free Testing Mode

If you don't have Apify credentials yet, you can add these test values:
```bash
AIRBNB_SCRAPER_API_KEY=test-mode
AIRBNB_SCRAPER_API_URL=test-mode
```

This will return mock data for testing purposes.

### Already Configured Variables ✅

Your Railway already has these configured:
- ✅ PERPLEXITY_API_KEY
- ✅ FIREBASE_* (all Firebase configs)
- ✅ Basic app configuration

### Support

If the STR analysis still doesn't work after adding these:
1. Check Railway logs for errors
2. Verify the API key is valid in Apify console
3. Ensure the actor ID in the URL is correct

---

**Note**: The app will work for Long-Term Rental analysis without these credentials, but STR analysis specifically requires the Airbnb API.