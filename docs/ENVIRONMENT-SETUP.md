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

## Quick Fix Steps

1. **Generate Internal API Key**:
   ```bash
   openssl rand -base64 32
   ```

2. **Set Vercel Environment Variables**:
   ```bash
   # Set Railway URL
   npx vercel env add RAILWAY_API_URL production
   # Enter: https://real-estate-app-production-ba5c.up.railway.app

   # Set Internal API Key
   npx vercel env add INTERNAL_API_KEY production
   # Enter: [the key you generated above]
   ```

3. **Redeploy to Vercel**:
   ```bash
   npx vercel --prod
   ```

## Verification

After deployment, test the STR analysis:

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