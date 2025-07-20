# Firebase Setup Instructions

## Current Setup
The application uses the Firebase project `real-estate-roi-app` which is already configured in Railway. The frontend loads Firebase configuration from environment variables through the `/api/config` endpoint.

## Environment Variables Required

The frontend requires Firebase client configuration to be set in Vercel environment variables. See `VERCEL_ENV_SETUP.md` for detailed instructions.

### Required Variables:
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`

### Important Notes:
- The Firebase project ID must be `real-estate-roi-app` to match Railway
- All Firebase configuration is loaded from environment variables
- No Firebase configuration should be hardcoded in the source code
- The `/api/config` endpoint serves the configuration to the frontend

## How Configuration Works

1. **Frontend**: Calls `/api/config` to get Firebase configuration
2. **API Endpoint**: Returns configuration from environment variables
3. **Fallback**: If configuration fails, uses mock authentication (development only)
4. **Railway Backend**: Uses the same Firebase project with service account credentials

## Authentication Flow for Extension

The authentication flow ensures users stay logged in:

1. User clicks "Analyze" in the browser extension
2. Extension opens `roi-finder.html` with property data
3. Firebase checks authentication state:
   - If logged in: Proceed with analysis
   - If not logged in: Show login form, save redirect URL
4. After login, user is redirected back with property data
5. Analysis proceeds automatically

The key is Firebase's persistence setting:
```javascript
auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL)
```

This keeps users logged in across browser sessions.