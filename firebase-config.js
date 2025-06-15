// firebase-config.js
// Initialize Firebase in your app

import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getFunctions } from 'firebase/functions';

// For Vite-based projects (like React with Vite)
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// For Next.js or plain Node.js in API routes
// const firebaseConfig = {
//   apiKey: process.env.FIREBASE_API_KEY,
//   authDomain: process.env.FIREBASE_AUTH_DOMAIN,
//   projectId: process.env.FIREBASE_PROJECT_ID,
//   storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
//   messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
//   appId: process.env.FIREBASE_APP_ID
// };

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const functions = getFunctions(app);

// Firestore Collections Structure
/*
users/
  - uid (document ID)
    - email
    - displayName
    - createdAt
    - subscriptionStatus: 'trial' | 'active' | 'cancelled' | 'past_due'
    - subscriptionTier: 'starter' | 'pro' | 'enterprise'
    - stripeCustomerId
    - trialEndsAt
    - monthlyAnalysisCount
    - monthlyAnalysisLimit
    - lastResetDate
    - company
    - phoneNumber

analyses/
  - analysisId (document ID)
    - userId
    - propertyAddress
    - createdAt
    - propertyValue
    - roi
    - recommendations
    - costs
    - shortTermRental
    - longTermRental
    - reportUrl

subscriptions/
  - userId (document ID)
    - stripeSubscriptionId
    - stripePriceId
    - status
    - currentPeriodStart
    - currentPeriodEnd
    - cancelAtPeriodEnd
    - tier
    - monthlyLimit
*/
