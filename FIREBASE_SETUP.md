# Firebase Setup Instructions

## Current Issue
The Firebase project `rental-roi-calculator-ddce2` appears to be deleted or the API key is invalid, causing authentication errors.

## Quick Fix - Create New Firebase Project

1. **Go to [Firebase Console](https://console.firebase.google.com/)**

2. **Create a new project** called `starterpack-app` (or any name)

3. **Enable Authentication**:
   - Go to Build > Authentication
   - Click "Get started"
   - Enable "Email/Password" provider
   - Save

4. **Enable Firestore Database**:
   - Go to Build > Firestore Database
   - Click "Create database"
   - Choose "Start in production mode"
   - Select a location (us-central1 recommended)
   - Create

5. **Get your configuration**:
   - Go to Project Settings (gear icon)
   - Scroll to "Your apps"
   - Click "Add app" > Web (</> icon)
   - Register app with nickname "StarterPack Web"
   - Copy the configuration object

6. **Update the configuration** in these files:
   - `/api/config.js` - Update the fallback values
   - `/roi-finder.html` - Update the fallback firebaseConfig
   - `/roi-finder-v2.html` - Update the firebaseConfig
   - `/portfolio.html` - Update the firebaseConfig
   - `/reports.html` - Update the firebaseConfig
   - `/admin-dashboard.html` - Update the firebaseConfig

7. **Set environment variables** in Vercel:
   ```
   VITE_FIREBASE_API_KEY=your-new-api-key
   VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your-project-id
   VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
   VITE_FIREBASE_APP_ID=your-app-id
   ```

8. **For Railway (backend)**, get service account key:
   - Go to Project Settings > Service accounts
   - Click "Generate new private key"
   - Download the JSON file
   - Set these environment variables in Railway:
   ```
   FIREBASE_PROJECT_ID=your-project-id
   FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
   FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
   ```

## Temporary Workaround

While setting up the new Firebase project, you can use Firebase Auth Emulator locally:

1. Install Firebase CLI: `npm install -g firebase-tools`
2. Run: `firebase emulators:start --only auth,firestore`
3. Update your local config to use:
   ```javascript
   if (window.location.hostname === 'localhost') {
     auth.useEmulator('http://localhost:9099');
     db.useEmulator('localhost', 8080);
   }
   ```

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