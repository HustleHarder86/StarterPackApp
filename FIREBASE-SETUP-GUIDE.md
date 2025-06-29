# 🔥 Firebase Setup Guide for StarterPackApp

This guide will walk you through setting up Firebase for the StarterPackApp STR platform.

## 📋 Prerequisites

- Google account
- Node.js installed
- Firebase CLI (`npm install -g firebase-tools`)

## 🚀 Step-by-Step Setup

### 1. Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click "Create a project"
3. Enter project name: `starterpackapp` (or your preferred name)
4. Enable Google Analytics (optional)
5. Click "Create project"

### 2. Enable Required Services

#### Authentication
1. In Firebase Console, go to **Authentication**
2. Click "Get started"
3. Enable **Email/Password** provider:
   - Click "Email/Password"
   - Toggle "Enable"
   - Toggle "Email link (passwordless sign-in)" if desired
   - Click "Save"

#### Firestore Database
1. Go to **Firestore Database**
2. Click "Create database"
3. Choose **Start in production mode** (we have security rules)
4. Select your region (e.g., `us-central1`)
5. Click "Enable"

#### Storage
1. Go to **Storage**
2. Click "Get started"
3. Start in production mode (we have security rules)
4. Choose same region as Firestore
5. Click "Done"

### 3. Get Configuration Keys

#### Client Configuration (for frontend)
1. Go to **Project Settings** (gear icon)
2. Scroll down to "Your apps"
3. Click "Web" icon (</>) 
4. Register app with nickname "StarterPackApp Web"
5. Copy the configuration object:

```javascript
const firebaseConfig = {
  apiKey: "...",
  authDomain: "...",
  projectId: "...",
  storageBucket: "...",
  messagingSenderId: "...",
  appId: "..."
};
```

#### Server Configuration (for API)
1. Go to **Project Settings** > **Service accounts**
2. Click "Generate new private key"
3. Save the downloaded JSON file securely
4. Extract these values from the JSON:
   - `project_id`
   - `client_email`
   - `private_key`

### 4. Set Environment Variables

Create `.env.local` file in your project root:

```bash
# Client-side (from firebaseConfig)
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id

# Server-side (from service account JSON)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour-Private-Key-Here\n-----END PRIVATE KEY-----\n"
```

### 5. Deploy Security Rules

1. Install Firebase CLI:
```bash
npm install -g firebase-tools
```

2. Login to Firebase:
```bash
firebase login
```

3. Initialize Firebase (in project root):
```bash
firebase init
```
- Select: Firestore, Storage, Hosting
- Use existing project
- Accept default file names
- Configure as single-page app: No
- Set up automatic builds: No

4. Update `.firebaserc` with your project ID:
```json
{
  "projects": {
    "default": "your-actual-project-id"
  }
}
```

5. Deploy rules and indexes:
```bash
firebase deploy --only firestore:rules,firestore:indexes,storage:rules
```

### 6. Initialize Data Structure

Run this script to create initial Firestore structure:

```javascript
// init-firestore.js
const admin = require('firebase-admin');

// Initialize with your service account
admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
  })
});

const db = admin.firestore();

async function initializeFirestore() {
  // Create system config
  await db.collection('config').doc('system').set({
    subscriptionTiers: {
      free: {
        monthlyAnalysisLimit: 5,
        strTrialLimit: 5,
        features: ['basic_analysis', 'str_trial']
      },
      pro: {
        monthlyAnalysisLimit: 100,
        strTrialLimit: -1, // unlimited
        features: ['basic_analysis', 'str_analysis', 'pdf_reports', 'portfolio']
      },
      enterprise: {
        monthlyAnalysisLimit: -1, // unlimited
        strTrialLimit: -1,
        features: ['all']
      }
    },
    currentVersion: '2.0.0',
    maintenanceMode: false
  });

  console.log('Firestore initialized successfully!');
}

initializeFirestore().catch(console.error);
```

### 7. Create First Admin User

```javascript
// create-admin.js
const admin = require('firebase-admin');

async function createAdminUser(email) {
  try {
    // Create user
    const userRecord = await admin.auth().createUser({
      email: email,
      password: 'ChangeMe123!',
      emailVerified: true
    });

    // Set admin claim
    await admin.auth().setCustomUserClaims(userRecord.uid, {
      role: 'admin'
    });

    // Create user document
    await admin.firestore().collection('users').doc(userRecord.uid).set({
      email: email,
      role: 'admin',
      subscriptionTier: 'enterprise',
      subscriptionStatus: 'active',
      createdAt: new Date().toISOString()
    });

    console.log(`Admin user created: ${email}`);
    console.log('Default password: ChangeMe123!');
    console.log('Please change the password after first login');
  } catch (error) {
    console.error('Error creating admin:', error);
  }
}

createAdminUser('admin@starterpackapp.com');
```

### 8. Test Firebase Connection

Create `test-firebase.html`:

```html
<!DOCTYPE html>
<html>
<head>
  <title>Firebase Connection Test</title>
</head>
<body>
  <h1>Firebase Connection Test</h1>
  <div id="status">Testing...</div>
  
  <script type="module">
    import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.0.0/firebase-app.js';
    import { getAuth, signInWithEmailAndPassword } from 'https://www.gstatic.com/firebasejs/10.0.0/firebase-auth.js';
    import { getFirestore, collection, getDocs } from 'https://www.gstatic.com/firebasejs/10.0.0/firebase-firestore.js';
    
    const firebaseConfig = {
      // Your config here
    };
    
    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    const db = getFirestore(app);
    
    document.getElementById('status').innerHTML = 'Firebase initialized!';
  </script>
</body>
</html>
```

## 🎯 Vercel Deployment

Add these environment variables to your Vercel project:

1. Go to Vercel Dashboard > Your Project > Settings > Environment Variables
2. Add all variables from `.env.local`
3. Deploy the project

## 📊 Firebase Console URLs

After setup, bookmark these URLs (replace `your-project-id`):

- **Console**: `https://console.firebase.google.com/project/your-project-id`
- **Authentication**: `https://console.firebase.google.com/project/your-project-id/authentication/users`
- **Firestore**: `https://console.firebase.google.com/project/your-project-id/firestore`
- **Storage**: `https://console.firebase.google.com/project/your-project-id/storage`
- **Usage**: `https://console.firebase.google.com/project/your-project-id/usage`

## 🔒 Security Checklist

- [ ] Firestore rules deployed
- [ ] Storage rules deployed
- [ ] Service account key stored securely
- [ ] Environment variables set in Vercel
- [ ] Admin user created
- [ ] Test user created for development

## 🚨 Common Issues

### "Permission Denied" Error
- Check if security rules are deployed
- Verify user is authenticated
- Check if indexes are created

### "Firebase App Already Exists"
- The app is being initialized multiple times
- Check for duplicate initialization code

### "Invalid API Key"
- Verify the API key matches your project
- Check for extra spaces or quotes

### "CORS Error"
- Add your domain to authorized domains in Firebase Console
- Check Authentication > Settings > Authorized domains

## 📝 Next Steps

1. Test authentication with a real user
2. Create some test properties
3. Run an analysis with STR
4. Verify data appears in Firestore
5. Check Storage for any uploaded files

## 🎉 Success!

Your Firebase backend is now configured for StarterPackApp! The platform is ready to:
- Authenticate users
- Store property data
- Track analyses
- Manage subscriptions
- Generate reports

Remember to monitor your Firebase usage and costs in the Firebase Console.