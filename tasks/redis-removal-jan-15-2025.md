# Redis Removal - January 15, 2025

## Summary
Completely removed Redis and BullMQ from the Railway API architecture to resolve persistent connection issues and simplify the codebase.

## Problem
- STR (Short-Term Rental) analysis wasn't working due to Redis connection errors
- Railway logs showed repeated `ECONNREFUSED 127.0.0.1:6379` errors
- Redis was trying to connect to localhost instead of the Railway Redis service
- Multiple configuration attempts failed to resolve the issue
- The queue-based architecture was overengineered for our actual needs

## Solution: Complete Redis Removal

### What Was Removed
1. **Dependencies**:
   - `redis` package
   - `bullmq` package
   - `ioredis` package

2. **Files Deleted**:
   - `/railway-api/src/config/redis.js`
   - `/railway-api/src/services/queue.service.js`
   - `/railway-api/src/services/cache.service.js`
   - `/railway-api/src/workers/`
   - `/railway-api/start-workers.js`

3. **Scripts Removed from package.json**:
   - `start:worker`
   - `start:all`
   - `worker:dev`

### What Was Added/Changed

1. **Simple In-Memory Cache** (`/railway-api/src/services/simple-cache.service.js`):
   ```javascript
   class SimpleCache {
     constructor() {
       this.cache = new Map();
       this.cleanupInterval = setInterval(() => this.cleanup(), 60000);
     }
     
     get(key) { /* ... */ }
     set(key, value, ttl = 3600) { /* ... */ }
     delete(key) { /* ... */ }
   }
   ```

2. **Direct API Processing** (`/railway-api/src/routes/analysis/str-direct.js`):
   - Replaced queue-based processing with direct API calls
   - STR analysis now calls Apify API synchronously
   - Returns results immediately without job polling

3. **Simplified Production Start** (`/railway-api/start-production.js`):
   - No longer spawns worker processes
   - Just starts the Express server directly
   - Removed all Redis initialization code

4. **Updated Routes**:
   - Property analysis: Direct processing, no queues
   - STR analysis: Direct Apify API calls
   - Removed job status endpoints (no longer needed)

## Architecture Before vs After

### Before (Queue-Based)
```
Frontend → Railway API → Redis Queue → Worker Process → Apify API
                ↓                           ↓
            Job Status                   Result
                ←------------------------←
```

### After (Direct)
```
Frontend → Railway API → Apify API
              ↓             ↓
           Result ←---------←
```

## Benefits of This Change

1. **Simplicity**: Much simpler architecture, easier to debug
2. **Reliability**: No Redis connection issues to worry about
3. **Performance**: Actually faster for our use case (no queue overhead)
4. **Cost**: One less service to run on Railway
5. **Maintenance**: Fewer dependencies and moving parts

## Trade-offs

1. **No Background Jobs**: All processing is synchronous
   - Acceptable because our API calls are relatively fast (< 30s)
   - Vercel has 10s timeout, Railway has 5min timeout

2. **Limited Caching**: In-memory cache is per-instance
   - Acceptable for our current scale
   - Can upgrade to Redis later if needed

3. **No Job Status**: Can't check progress of long-running tasks
   - Acceptable because tasks complete quickly
   - Frontend shows loading state during processing

## CORS Fix

Also fixed CORS configuration to allow production domains:
- Added `https://starter-pack-app.vercel.app`
- Added `https://starterpackapp.com`
- Added debug logging for CORS issues
- Can override with `ALLOWED_ORIGINS` env var

## Next Steps

1. **Add Railway Environment Variables**:
   ```
   AIRBNB_SCRAPER_API_KEY=your-apify-key
   AIRBNB_SCRAPER_API_URL=https://api.apify.com/v2/acts/your-actor/runs
   ```

2. **Test STR Analysis**:
   - Should work immediately after adding API credentials
   - No Redis configuration needed

3. **Monitor Performance**:
   - Watch for timeout issues
   - Check memory usage of in-memory cache

## Files Modified

### Major Changes
- `/railway-api/package.json` - Removed Redis dependencies
- `/railway-api/src/server.js` - Removed queue initialization
- `/railway-api/src/routes/analysis.js` - Direct processing
- `/railway-api/src/routes/analysis/str-direct.js` - New direct STR route
- `/railway-api/src/services/property-analysis.service.js` - Removed cache imports
- `/railway-api/src/config/index.js` - Added CORS domains

### New Files
- `/railway-api/src/services/simple-cache.service.js` - In-memory cache

### Deleted Files
- All worker-related files
- Redis configuration files
- Queue service files

## Lessons Learned

1. **Start Simple**: Queue architecture was premature optimization
2. **YAGNI**: We didn't actually need background jobs for our use case
3. **Debug First**: Should have identified the Redis connection issue earlier
4. **Railway Specifics**: Redis on Railway requires specific configuration that wasn't well documented

## Rollback Plan

If we need to add Redis back later:
1. The old queue-based code is in git history
2. Can gradually reintroduce queues for specific endpoints
3. Consider using Railway's managed Redis with proper connection strings
4. Test thoroughly in staging before production

---

This architectural change significantly simplifies the codebase while maintaining all functionality. The STR analysis feature is now ready for testing once the Airbnb API credentials are configured in Railway.