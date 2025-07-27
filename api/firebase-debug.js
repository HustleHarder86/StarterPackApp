import { applyCorsHeaders } from '../../utils/cors-config.js';

import { apiLimits } from '../utils/rate-limiter.js';
// api/debug-firebase.js
// Enhanced debug endpoint to test Firebase configuration

export default async function handler(req, res) {
  // Apply proper CORS headers
  applyCorsHeaders(req, res);
  const response = {
    timestamp: new Date().toISOString(),
    method: req.method,
    message: 'Firebase Debug Report',
    checks: {
      environmentVariables: {},
      firebaseInit: {},
      firestoreTest: {}
    }
  };

  // Step 1: Check environment variables
  response.checks.environmentVariables = {
    FIREBASE_PROJECT_ID: {
      exists: !!process.env.FIREBASE_PROJECT_ID,
      value: process.env.FIREBASE_PROJECT_ID || 'NOT SET',
      expected: 'real-estate-roi-app'
    },
    FIREBASE_CLIENT_EMAIL: {
      exists: !!process.env.FIREBASE_CLIENT_EMAIL,
      preview: process.env.FIREBASE_CLIENT_EMAIL ? 
        process.env.FIREBASE_CLIENT_EMAIL.substring(0, 20) + '...' : 
        'NOT SET',
      format: process.env.FIREBASE_CLIENT_EMAIL?.includes('@') && 
               process.env.FIREBASE_CLIENT_EMAIL?.includes('.iam.gserviceaccount.com')
    },
    FIREBASE_PRIVATE_KEY: {
      exists: !!process.env.FIREBASE_PRIVATE_KEY,
      length: process.env.FIREBASE_PRIVATE_KEY?.length || 0,
      hasBeginMarker: process.env.FIREBASE_PRIVATE_KEY?.includes('-----BEGIN PRIVATE KEY-----'),
      hasEndMarker: process.env.FIREBASE_PRIVATE_KEY?.includes('-----END PRIVATE KEY-----'),
      hasNewlines: process.env.FIREBASE_PRIVATE_KEY?.includes('\\n')
    }
  };

  // Step 2: Try to initialize Firebase Admin
  try {
    const adminModule = await import('firebase-admin');
    const admin = adminModule.default;
    
    // Check if already initialized
    if (admin.apps.length > 0) {
      response.checks.firebaseInit.status = 'ALREADY_INITIALIZED';
      response.checks.firebaseInit.appName = admin.apps[0].name;
    } else {
      // Try to initialize
      try {
        const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
        
        admin.initializeApp({
          credential: admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: privateKey
          })
        });
        
        response.checks.firebaseInit.status = 'SUCCESS';
        response.checks.firebaseInit.message = 'Firebase Admin initialized successfully';
      } catch (initError) {
        response.checks.firebaseInit.status = 'FAILED';
        response.checks.firebaseInit.error = initError.message;
        response.checks.firebaseInit.errorCode = initError.code;
        
        // Common error explanations
        if (initError.message.includes('private_key')) {
          response.checks.firebaseInit.hint = 'Private key format issue. Make sure to include the entire key with \\n characters.';
        } else if (initError.message.includes('client_email')) {
          response.checks.firebaseInit.hint = 'Client email format issue. Check the service account email.';
        } else if (initError.message.includes('project_id')) {
          response.checks.firebaseInit.hint = 'Project ID mismatch. Verify it matches your Firebase project.';
        }
      }
    }

    // Step 3: Try to write to Firestore (only if init succeeded)
    if (response.checks.firebaseInit.status === 'SUCCESS' || 
        response.checks.firebaseInit.status === 'ALREADY_INITIALIZED') {
      try {
        const db = admin.firestore();
        const testDoc = {
          test: true,
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
          message: 'Debug test write',
          nodeVersion: process.version
        };
        
        const docRef = await db.collection('debug_tests').add(testDoc);
        
        response.checks.firestoreTest.status = 'SUCCESS';
        response.checks.firestoreTest.documentId = docRef.id;
        response.checks.firestoreTest.message = 'Successfully wrote to Firestore';
        
        // Try to read it back
        const readBack = await docRef.get();
        response.checks.firestoreTest.readSuccess = readBack.exists;
        
        // Clean up test document
        await docRef.delete();
        response.checks.firestoreTest.cleanup = 'Test document deleted';
      } catch (firestoreError) {
        response.checks.firestoreTest.status = 'FAILED';
        response.checks.firestoreTest.error = firestoreError.message;
        response.checks.firestoreTest.errorCode = firestoreError.code;
        
        if (firestoreError.code === 7) {
          response.checks.firestoreTest.hint = 'Permission denied. Check Firestore security rules.';
        }
      }
    } else {
      response.checks.firestoreTest.status = 'SKIPPED';
      response.checks.firestoreTest.reason = 'Firebase Admin initialization failed';
    }
    
  } catch (error) {
    response.checks.firebaseInit.status = 'ERROR';
    response.checks.firebaseInit.error = error.message;
  }

  // Determine overall status
  const allChecksPass = 
    response.checks.environmentVariables.FIREBASE_PROJECT_ID.exists &&
    response.checks.environmentVariables.FIREBASE_CLIENT_EMAIL.exists &&
    response.checks.environmentVariables.FIREBASE_PRIVATE_KEY.exists &&
    (response.checks.firebaseInit.status === 'SUCCESS' || 
     response.checks.firebaseInit.status === 'ALREADY_INITIALIZED') &&
    response.checks.firestoreTest.status === 'SUCCESS';

  response.overallStatus = allChecksPass ? 'READY' : 'ISSUES_FOUND';
  
  // Add recommendations
  response.recommendations = [];
  
  if (!response.checks.environmentVariables.FIREBASE_PROJECT_ID.exists) {
    response.recommendations.push('Set FIREBASE_PROJECT_ID environment variable');
  }
  
  if (!response.checks.environmentVariables.FIREBASE_CLIENT_EMAIL.exists) {
    response.recommendations.push('Set FIREBASE_CLIENT_EMAIL environment variable');
  }
  
  if (!response.checks.environmentVariables.FIREBASE_PRIVATE_KEY.exists) {
    response.recommendations.push('Set FIREBASE_PRIVATE_KEY environment variable');
  } else if (!response.checks.environmentVariables.FIREBASE_PRIVATE_KEY.hasNewlines) {
    response.recommendations.push('FIREBASE_PRIVATE_KEY should contain \\n characters');
  }
  
  if (response.checks.firebaseInit.status === 'FAILED') {
    response.recommendations.push('Fix Firebase initialization: ' + response.checks.firebaseInit.hint);
  }
  
  if (response.checks.firestoreTest.status === 'FAILED' && response.checks.firestoreTest.errorCode === 7) {
    response.recommendations.push('Update Firestore security rules to allow writes');
  }

  return res.status(200).json(response);
}
