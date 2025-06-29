// Firebase Admin SDK initialization for server-side operations
import admin from 'firebase-admin';

// Initialize Firebase Admin
let app;

if (!admin.apps.length) {
  try {
    // Get credentials from environment variables
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

    if (!projectId || !clientEmail || !privateKey) {
      throw new Error('Missing Firebase Admin credentials. Please check environment variables.');
    }

    app = admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey,
      }),
      storageBucket: `${projectId}.appspot.com`
    });

    console.log('Firebase Admin initialized successfully');
  } catch (error) {
    console.error('Firebase Admin initialization error:', error);
    throw error;
  }
} else {
  app = admin.app();
}

// Export admin services
export const auth = admin.auth();
export const firestore = admin.firestore();
export const storage = admin.storage();

// Helper functions
export async function verifyIdToken(token) {
  try {
    const decodedToken = await auth.verifyIdToken(token);
    return decodedToken;
  } catch (error) {
    console.error('Token verification error:', error);
    throw new Error('Invalid authentication token');
  }
}

export async function createCustomToken(uid, claims = {}) {
  try {
    const token = await auth.createCustomToken(uid, claims);
    return token;
  } catch (error) {
    console.error('Custom token creation error:', error);
    throw error;
  }
}

export async function getUser(uid) {
  try {
    const user = await auth.getUser(uid);
    return user;
  } catch (error) {
    console.error('Get user error:', error);
    return null;
  }
}

export async function setCustomUserClaims(uid, claims) {
  try {
    await auth.setCustomUserClaims(uid, claims);
    return true;
  } catch (error) {
    console.error('Set custom claims error:', error);
    return false;
  }
}

// Firestore helpers
export const FieldValue = admin.firestore.FieldValue;
export const Timestamp = admin.firestore.Timestamp;

// Batch operations helper
export function createBatch() {
  return firestore.batch();
}

// Transaction helper
export async function runTransaction(callback) {
  return firestore.runTransaction(callback);
}

export default app;