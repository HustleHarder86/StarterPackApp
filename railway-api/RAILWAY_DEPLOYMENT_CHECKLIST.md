# Railway Deployment Checklist

## Critical Environment Variables

Make sure these environment variables are set in Railway:

### 1. **ALLOWED_ORIGINS** (CRITICAL FOR CORS)
```
ALLOWED_ORIGINS=https://starter-pack-app.vercel.app,https://starterpackapp.vercel.app,http://localhost:3000,http://localhost:8080
```
**Note**: This MUST include the exact Vercel URL with correct spelling (starter-pack-app not starterpackapp)

### 2. **Firebase Admin SDK**
- `FIREBASE_PROJECT_ID` - Your Firebase project ID
- `FIREBASE_CLIENT_EMAIL` - Service account email
- `FIREBASE_PRIVATE_KEY` - Service account private key (include the \n characters)

### 3. **API Keys**
- `PERPLEXITY_API_KEY` - Must start with "pplx-"
- `OPENAI_API_KEY` - OpenAI API key
- `AIRBNB_SCRAPER_API_KEY` - Rapid API key for Airbnb scraper
- `AIRBNB_SCRAPER_API_URL` - Rapid API URL

### 4. **Other Settings**
- `NODE_ENV=production`
- `PORT=3000` (or let Railway auto-assign)
- `LOG_LEVEL=info`

## Common Issues

### CORS Error
If you see "has been blocked by CORS policy" in browser console:
1. Check Railway logs for "CORS rejected origin" messages
2. Verify ALLOWED_ORIGINS includes your exact Vercel URL
3. Make sure there are no trailing slashes in URLs
4. Restart Railway deployment after changing env vars

### Server Crash on Startup
If server crashes immediately:
1. Check for missing required environment variables
2. Verify FIREBASE_PRIVATE_KEY has proper line breaks (\n)
3. Check Railway logs for specific error messages

### API Route Errors
If specific routes fail:
1. Ensure all middleware imports are correct
2. Check that required services are properly initialized
3. Verify API keys are valid and not expired

## Deployment Steps

1. Push code changes to GitHub main branch
2. Railway auto-deploys from main
3. Check Railway deployment logs
4. Verify all environment variables are set
5. Test API endpoints from Vercel app

## Testing

After deployment, test these endpoints:
- `GET /` - Should return API info
- `GET /health` - Should return server status
- `GET /api/debug/cors-config` - Check CORS configuration
- `POST /api/analysis/property` - Main analysis endpoint (requires auth)

### Using the Debug Tool

1. Deploy `debug-cors.html` to Vercel
2. Visit https://starter-pack-app.vercel.app/debug-cors.html
3. Run all three tests to diagnose issues

### Quick CORS Fix

If CORS is blocking requests:

1. Go to Railway dashboard
2. Navigate to Variables tab
3. Update `ALLOWED_ORIGINS` to include exact Vercel URL:
   ```
   ALLOWED_ORIGINS=https://starter-pack-app.vercel.app,https://starterpackapp.vercel.app,http://localhost:3000,http://localhost:8080
   ```
4. Redeploy by clicking "Deploy" button

### Monitoring Logs

In Railway dashboard:
1. Go to Deployments tab
2. Click on latest deployment
3. View logs for CORS messages like:
   - "CORS check" - Shows incoming requests
   - "CORS rejected origin" - Shows blocked requests
   - "CORS allowed www variant" - Shows allowed variants