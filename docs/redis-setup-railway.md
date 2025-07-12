# Redis Setup for Railway - STR Analysis

## Current Status (January 11, 2025)

### What We've Done:
1. ✅ Moved STR analysis from Vercel to Railway API (correct architecture)
2. ✅ Implemented STR analysis with Apify Airbnb scraper integration
3. ✅ Added Perplexity AI for real-time regulation checking
4. ✅ Created fallback mode for when Redis isn't available
5. ✅ Fixed Redis configuration to detect Railway environment

### Current Issue:
- Redis service is added to Railway but not properly connected
- API is falling back to synchronous processing (works but not ideal)
- Need to connect Redis service variables to API service

## How to Connect Redis in Railway

### Step 1: Check Redis Service
1. Go to your Railway project dashboard
2. Click on the **Redis** service (should show as a separate box)
3. Click the **"Variables"** tab
4. You should see these variables:
   - `REDIS_URL` (full connection string)
   - `REDIS_HOST` (hostname)
   - `REDIS_PORT` (usually 6379)
   - `REDIS_PASSWORD` (auth password)

### Step 2: Connect Redis to Your API Service
1. Click on your **API service** (not the Redis service)
2. Go to the **"Variables"** tab
3. Add these reference variables:

   **Option A - Using REDIS_URL (Recommended):**
   ```
   REDIS_URL = ${{Redis.REDIS_URL}}
   ```

   **Option B - Using Individual Components:**
   ```
   REDIS_HOST = ${{Redis.REDIS_HOST}}
   REDIS_PORT = ${{Redis.REDIS_PORT}}
   REDIS_PASSWORD = ${{Redis.REDIS_PASSWORD}}
   ```

4. The `${{Redis.VARIABLE_NAME}}` syntax tells Railway to reference the Redis service's variables

### Step 3: Restart API Service
1. After adding the variables, click **"Deploy"** or **"Restart"**
2. Watch the logs to confirm Redis connects properly

### What Success Looks Like
In your Railway API logs, you should see:
```
Using Redis URL from REDIS_URL
Redis connected successfully
Using Redis queue service
```

Instead of:
```
WARNING: No Redis URL found in environment
Using fallback processing for STR analysis
```

## Testing STR Analysis After Redis Setup

1. Go to a Realtor.ca property listing
2. Click the browser extension
3. Click "Analyze Property"
4. Click "Short-Term Rental Analysis"

### With Redis Connected:
- Job ID format: `str-analysis-1` (proper queue job)
- Background processing with progress updates
- Can handle multiple analyses concurrently
- Results cached for 24 hours

### Without Redis (Current Fallback):
- Job ID format: `fallback-1` (synchronous processing)
- Processes immediately but blocks other requests
- No caching
- Still works but less efficient

## Environment Variables Status

### Currently Working:
- ✅ `PERPLEXITY_API_KEY` - Real-time regulation checking
- ✅ `AIRBNB_SCRAPER_API_KEY` - Airbnb data from Apify
- ✅ `FIREBASE_*` - Database and auth
- ⚠️ `REDIS_URL` - Needs connection from Redis service

### API Features Ready:
- ✅ STR analysis with real Airbnb data
- ✅ Municipal regulation checking (Toronto, Vancouver, etc.)
- ✅ LTR vs STR comparison
- ✅ Financial projections and ROI calculations
- ✅ Compliance risk assessment

## Next Steps After Redis Connection

1. **Verify Queue System**:
   - Check job processing in background
   - Confirm progress updates work
   - Test concurrent analyses

2. **Deploy Frontend Integration**:
   - Load STR components in `roi-finder.html`
   - Update to use Railway API endpoints

3. **Monitor Performance**:
   - Check Apify API usage (50 result limit per analysis)
   - Monitor Redis memory usage
   - Track job completion times

## Quick Reference Commands

**Check Redis connection in logs:**
```bash
# In Railway dashboard, check recent logs for:
"Redis connected successfully"
```

**Test STR endpoint directly:**
```bash
curl -X POST https://starterpackapp-api.up.railway.app/api/analysis/str/analyze \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"propertyId":"test-123","propertyData":{...}}'
```

## Troubleshooting

**If Redis still won't connect:**
1. Check if Redis service is running (green status)
2. Verify variable references use correct syntax: `${{Redis.REDIS_URL}}`
3. Check for typos in variable names
4. Try redeploying both services
5. Check Redis service logs for connection issues

**Fallback mode is working fine for now** - STR analysis works without Redis, just less efficiently.

---

*Last updated: January 11, 2025 - Ready to complete Redis connection*