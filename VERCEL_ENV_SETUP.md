# Vercel Environment Variables Setup

## Required Firebase Client Configuration

The following environment variables must be set in Vercel for the frontend to work properly:

### Client-side Firebase Configuration
These variables are safe to expose to the client and must match the Firebase project used by Railway (`real-estate-roi-app`):

```bash
# Get these from Firebase Console > Project Settings > Your Apps > Web App
VITE_FIREBASE_API_KEY=<your-web-api-key>
VITE_FIREBASE_AUTH_DOMAIN=real-estate-roi-app.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=real-estate-roi-app
VITE_FIREBASE_STORAGE_BUCKET=real-estate-roi-app.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=<your-sender-id>
VITE_FIREBASE_APP_ID=<your-app-id>
```

### How to Get These Values

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select the `real-estate-roi-app` project
3. Go to Project Settings (gear icon)
4. Scroll down to "Your apps" section
5. If no web app exists:
   - Click "Add app" > Web (</> icon)
   - Register app with nickname "StarterPack Web"
   - Copy the firebaseConfig values
6. If web app exists:
   - Click on the web app
   - Copy the configuration values

### Setting in Vercel

1. Go to your Vercel project dashboard
2. Go to Settings > Environment Variables
3. Add each variable with its value
4. Make sure to add them for Production, Preview, and Development environments
5. Redeploy your application

### Important Notes

- These MUST match the Firebase project that Railway is using (`real-estate-roi-app`)
- Without these variables, the `/api/config` endpoint will return an error
- The frontend will fall back to mock authentication if these are not set properly
- Do NOT hardcode these values in the code - always use environment variables

### Testing

After setting the environment variables:

1. Visit `/api/config` on your deployment
2. You should see the Firebase configuration returned
3. The `projectId` should be `real-estate-roi-app`
4. Authentication should work without falling back to mock mode