const admin = require('firebase-admin');
const config = require('../config');
const logger = require('./logger.service');

// Initialize Firebase Admin
let initialized = false;

function initializeFirebase() {
  if (initialized) {
    return admin;
  }
  
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: config.firebase.projectId,
        clientEmail: config.firebase.clientEmail,
        privateKey: config.firebase.privateKey
      })
    });
    
    initialized = true;
    logger.info('Firebase Admin initialized successfully');
    
  } catch (error) {
    logger.error('Failed to initialize Firebase Admin:', error);
    throw error;
  }
  
  return admin;
}

// Initialize on module load
const firebaseAdmin = initializeFirebase();

// Helper functions
const db = firebaseAdmin.firestore();

// Get user by ID
async function getUser(userId) {
  const userDoc = await db.collection('users').doc(userId).get();
  return userDoc.exists ? { id: userDoc.id, ...userDoc.data() } : null;
}

// Update user
async function updateUser(userId, updates) {
  await db.collection('users').doc(userId).update({
    ...updates,
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });
}

// Create analysis record
async function createAnalysis(analysisData) {
  const docRef = await db.collection('analyses').add({
    ...analysisData,
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  });
  return docRef.id;
}

// Get analysis by ID
async function getAnalysis(analysisId) {
  const doc = await db.collection('analyses').doc(analysisId).get();
  return doc.exists ? { id: doc.id, ...doc.data() } : null;
}

// Create property record
async function createProperty(propertyData) {
  const docRef = await db.collection('properties').add({
    ...propertyData,
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  });
  return docRef.id;
}

// Track API usage
async function trackAPIUsage(userId, apiName, tokens = 0) {
  const today = new Date().toISOString().split('T')[0];
  const usageRef = db.collection('usage').doc(`${userId}_${today}`);
  
  await usageRef.set({
    userId,
    date: today,
    [`${apiName}_calls`]: admin.firestore.FieldValue.increment(1),
    [`${apiName}_tokens`]: admin.firestore.FieldValue.increment(tokens),
    total_calls: admin.firestore.FieldValue.increment(1),
    total_tokens: admin.firestore.FieldValue.increment(tokens),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  }, { merge: true });
}

module.exports = {
  admin: firebaseAdmin,
  db,
  getUser,
  updateUser,
  createAnalysis,
  getAnalysis,
  createProperty,
  trackAPIUsage
};