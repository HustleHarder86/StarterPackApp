# STR Analysis Local Testing Guide

## Prerequisites

1. **Two Terminal Windows**: You'll need to run both Vercel and Railway servers
2. **Environment Variables**: Both `.env` files configured
3. **Test User Account**: With appropriate subscription tier

## Step 1: Set Up Environment Variables

### Vercel (.env.local)
```bash
# Firebase client configuration
VITE_FIREBASE_API_KEY=your-firebase-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id

# Stripe (optional for testing)
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_xxx
```

### Railway API (railway-api/.env)
```bash
# Port
PORT=3001

# Firebase Admin
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour private key\n-----END PRIVATE KEY-----\n"

# AI APIs
PERPLEXITY_API_KEY=pplx-xxx  # Required for LTR analysis
AIRBNB_SCRAPER_API_KEY=your-apify-key  # Required for STR analysis
AIRBNB_SCRAPER_API_URL=https://api.apify.com/v2/acts/your-actor/run-sync-get-dataset-items

# Optional
OPENAI_API_KEY=sk-xxx
```

## Step 2: Start Local Servers

### Terminal 1: Start Vercel (Port 3000)
```bash
cd /home/amy/StarterPackApp
npm run dev
# Should start on http://localhost:3000
```

### Terminal 2: Start Railway API (Port 3001)
```bash
cd /home/amy/StarterPackApp/railway-api
npm run dev
# Should start on http://localhost:3001
```

## Step 3: Verify Configuration

1. **Check Vercel is running**: 
   - Open http://localhost:3000
   - Should see the homepage

2. **Check Railway API is running**:
   - Open http://localhost:3001/health
   - Should see: `{"status":"ok","timestamp":"..."}`

3. **Check Analysis endpoint**:
   - Open http://localhost:3001/api/analysis/health
   - Should see operational status

## Step 4: Test STR Analysis Flow

### A. Manual Testing via UI

1. **Login to the app**:
   - Go to http://localhost:3000/roi-finder.html
   - Sign in with test account

2. **Fill Property Form**:
   ```
   Address: 123 Main St, Toronto, ON, Canada
   Price: 850000
   Bedrooms: 3
   Bathrooms: 2
   Square Feet: 1800
   Property Type: Single Family Home
   ```

3. **Select STR Mode**:
   - On confirmation screen, click "Short-Term Rental (STR)"
   - Verify button highlights
   - Check trial count displays (if free user)

4. **Run Analysis**:
   - Click "Confirm & Analyze"
   - Open browser console (F12)
   - Look for:
     ```
     Using API endpoint: http://localhost:3001/api/analysis/property
     Request body includes: includeStrAnalysis: true
     ```

5. **Verify Results**:
   - Page title should show "(LTR + STR)"
   - RentalComparisonView should appear
   - STR comparables should display

### B. Direct API Testing

```bash
# Test Railway STR endpoint directly
curl -X POST http://localhost:3001/api/analysis/property \
  -H "Content-Type: application/json" \
  -d '{
    "propertyAddress": "123 Main St, Toronto, ON, Canada",
    "propertyData": {
      "price": 850000,
      "bedrooms": 3,
      "bathrooms": 2,
      "sqft": 1800,
      "address": {
        "city": "Toronto",
        "state": "ON"
      }
    },
    "includeStrAnalysis": true,
    "userId": "test-user-id"
  }'
```

## Step 5: Debug Common Issues

### Issue: "API endpoint not found"
```bash
# Check Railway logs
cd railway-api
tail -f logs/combined.log
```

### Issue: "CORS error"
- Verify Railway CORS middleware is configured
- Check browser console for specific origin errors

### Issue: "No STR results"
1. Check Railway logs for Airbnb API calls
2. Verify AIRBNB_SCRAPER_API_KEY is set
3. Check if bedrooms/bathrooms are passed correctly

### Issue: "Wrong endpoint used"
- Check `window.ENV.railwayUrl` in browser console
- Should be: `http://localhost:3001`

## Step 6: Monitor Logs

### Vercel Logs
```bash
# In Terminal 1, you'll see:
- API route calls
- Static file serving
- Any Vercel function errors
```

### Railway Logs
```bash
# In Terminal 2, watch for:
- "Property analysis request received"
- "STR analysis requested"
- "Calling Airbnb scraper API"
- "STR analysis completed"
```

### Browser Console
```javascript
// Enable debug mode
localStorage.setItem('debug', 'true');

// Check current configuration
console.log(window.ENV);
console.log(window.buildUrl('railway', 'analyzeProperty'));

// Monitor network requests
// Network tab → Filter by "api" → Check request/response
```

## Test Scenarios

### 1. Free User STR Trial
- Login with free account
- Run STR analysis
- Verify trial count decrements
- After 5 uses, should show upgrade prompt

### 2. Pro User Unlimited STR
- Login with pro account
- Run multiple STR analyses
- Verify no trial limits

### 3. API Failure Handling
- Temporarily rename AIRBNB_SCRAPER_API_KEY
- Run STR analysis
- Should show graceful error message

### 4. Mixed Mode Analysis
- Run LTR only (select "Traditional Rental")
- Verify no Railway API call
- Run STR (select "Short-Term Rental")
- Verify Railway API is called

## Troubleshooting Commands

```bash
# Check if ports are in use
lsof -i :3000  # Vercel
lsof -i :3001  # Railway

# Kill processes if needed
kill -9 $(lsof -t -i:3000)
kill -9 $(lsof -t -i:3001)

# Clear test data
# In Firebase Console → Firestore → Delete test documents

# Test Railway API directly
cd railway-api
npm test

# Run E2E tests
cd ..
npm run test:e2e
```

## Expected Test Results

✅ **Successful STR Analysis**:
- Analysis completes in 10-30 seconds
- Shows both LTR and STR results
- Displays 3-5 Airbnb comparables
- Shows revenue comparison chart
- Break-even occupancy calculated

❌ **Failed STR Analysis**:
- LTR results still show
- Error message for STR section
- Logs show specific API error

---

Last Updated: January 2025