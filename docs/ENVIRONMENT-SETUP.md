# Environment Setup for StarterPackApp

## Critical Issue: STR Analysis Not Working

The STR (Short-Term Rental) analysis is currently failing because the Vercel deployment is missing required environment variables to communicate with the Railway API backend.

## Required Environment Variables

### 1. Railway API Configuration
```bash
RAILWAY_API_URL=https://real-estate-app-production-ba5c.up.railway.app
INTERNAL_API_KEY=[generate secure key]
```

### 2. Firebase Admin SDK (for Vercel)
```bash
FIREBASE_ADMIN_PROJECT_ID=your-project-id
FIREBASE_ADMIN_CLIENT_EMAIL=your-client-email
FIREBASE_ADMIN_PRIVATE_KEY=your-private-key
```

## Local Development Setup (RECOMMENDED)

1. **One-time Setup**:
   ```bash
   npm install
   ./scripts/switch-env.sh dev
   ```

2. **Start Development Servers**:
   ```bash
   npm run dev  # Starts both Vercel and Railway locally
   ```

3. **Test Locally First**:
   - Open http://localhost:3000
   - All features work instantly with hot reload
   - No deployment needed for testing!

## Production Deployment

Only deploy after testing locally:

1. **Set Environment Variables**:
   ```bash
   npx vercel env add RAILWAY_API_URL production
   npx vercel env add INTERNAL_API_KEY production
   ```

2. **Deploy**:
   ```bash
   npm run deploy:fast  # Only after local testing
   ```

## Verification

Test locally first, then verify production:

1. Go to https://starter-pack-app.vercel.app
2. Click "Load Sample Data"
3. Submit the form
4. Navigate to "Short-Term Rental" tab
5. You should now see Airbnb listings instead of "No Airbnb Data Available"

## Technical Details

- **Issue**: Vercel proxy endpoint (`/api/analyze-property`) returns 400 error
- **Cause**: Missing `INTERNAL_API_KEY` prevents authentication with Railway API
- **Solution**: Add the environment variables and redeploy

## Railway API Status

The Railway API is fully functional and includes:
- ✅ STR analysis with Airbnb data
- ✅ 20 comparable listings retrieval
- ✅ Revenue calculations
- ✅ Regulation checking
- ✅ LTR vs STR comparison

Once the environment variables are set, all features will work correctly.