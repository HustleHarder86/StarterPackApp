# Firebase Integration Guide

## Overview

Firebase provides the core backend services for the StarterPackApp, including authentication, database, and storage functionality.

## Configuration

### Environment Variables

**Client-side (Vite):**
```bash
VITE_FIREBASE_API_KEY=your_firebase_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_firebase_app_id
```

**Server-side (Admin SDK):**
```bash
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project-id.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour Firebase Admin Private Key\n-----END PRIVATE KEY-----\n"
```

## Services Used

### 1. Authentication
- **Location**: `auth-service.js`
- **Usage**: User login/logout, session management
- **Methods**: Email/password authentication

### 2. Firestore Database
- **Schema**:
  - `users`: User profiles and subscription data
  - `properties`: Property listing data
  - `analyses`: Analysis results and calculations
  - `reports`: Generated PDF report metadata

### 3. Storage
- **Usage**: PDF report file storage
- **Expiry**: 30-day automatic cleanup for generated reports

## SDK Initialization

### Client-side (ES Modules)
```javascript
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
```

### Server-side (Admin SDK)
```javascript
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

const admin = initializeApp({
  credential: cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
  })
});

export const adminDb = getFirestore();
export const adminAuth = getAuth();
```

## Common Operations

### Authentication
```javascript
// Sign in
import { signInWithEmailAndPassword } from 'firebase/auth';
const userCredential = await signInWithEmailAndPassword(auth, email, password);

// Sign out
import { signOut } from 'firebase/auth';
await signOut(auth);

// Check auth state
import { onAuthStateChanged } from 'firebase/auth';
onAuthStateChanged(auth, (user) => {
  if (user) {
    // User is signed in
  } else {
    // User is signed out
  }
});
```

### Firestore Operations
```javascript
import { doc, getDoc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';

// Read document
const docRef = doc(db, 'users', userId);
const docSnap = await getDoc(docRef);

// Write document
await setDoc(doc(db, 'properties', propertyId), {
  address: propertyData.address,
  price: propertyData.price,
  createdAt: new Date()
});

// Query collection
const q = query(
  collection(db, 'analyses'), 
  where('userId', '==', currentUser.uid)
);
const querySnapshot = await getDocs(q);
```

## Development & Testing

### Emulator Usage
```bash
# Install emulators
firebase setup:emulators:firestore
firebase setup:emulators:auth

# Start emulators
firebase emulators:start --only firestore,auth
```

### Connect to Emulator (Development)
```javascript
import { connectFirestoreEmulator } from 'firebase/firestore';
import { connectAuthEmulator } from 'firebase/auth';

if (process.env.NODE_ENV === 'development') {
  connectFirestoreEmulator(db, 'localhost', 8080);
  connectAuthEmulator(auth, 'http://localhost:9099');
}
```

## Security Rules

### Firestore Security Rules
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only access their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Properties and analyses are user-specific
    match /properties/{propertyId} {
      allow read, write: if request.auth != null && 
        resource.data.userId == request.auth.uid;
    }
    
    match /analyses/{analysisId} {
      allow read, write: if request.auth != null && 
        resource.data.userId == request.auth.uid;
    }
  }
}
```

## Error Handling

```javascript
import { FirebaseError } from 'firebase/app';

try {
  await someFirebaseOperation();
} catch (error) {
  if (error instanceof FirebaseError) {
    switch (error.code) {
      case 'auth/user-not-found':
        console.error('User not found');
        break;
      case 'permission-denied':
        console.error('Permission denied');
        break;
      default:
        console.error('Firebase error:', error.message);
    }
  }
}
```

## Best Practices

1. **Authentication**: Always check auth state before making authenticated requests
2. **Security**: Use security rules to protect user data
3. **Performance**: Use real-time listeners sparingly, prefer one-time reads where possible
4. **Costs**: Monitor read/write operations and optimize queries
5. **Environment**: Use environment variables for all configuration
6. **Error Handling**: Implement comprehensive error handling for all Firebase operations

## Troubleshooting

### Common Issues

1. **CORS Errors**: Ensure domain is whitelisted in Firebase Console
2. **Authentication Errors**: Check API keys and auth domain configuration
3. **Permission Denied**: Verify security rules and user authentication
4. **Quota Exceeded**: Monitor usage in Firebase Console

### Debug Mode
```javascript
import { connectFirestoreEmulator } from 'firebase/firestore';
import { setLogLevel } from 'firebase/firestore';

// Enable debug logging
setLogLevel('debug');
```

## Links

- [Firebase Console](https://console.firebase.google.com/)
- [Firebase Documentation](https://firebase.google.com/docs)
- [Firestore Documentation](https://firebase.google.com/docs/firestore)
- [Firebase Auth Documentation](https://firebase.google.com/docs/auth)