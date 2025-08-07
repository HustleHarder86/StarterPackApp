#!/usr/bin/env node

/**
 * Grant tester access to a user for unlimited STR analysis
 * Usage: node scripts/grant-tester-access.js <userId or email>
 */

const admin = require('firebase-admin');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
    })
  });
}

const db = admin.firestore();

async function grantTesterAccess(userIdentifier) {
  try {
    let userId = userIdentifier;
    
    // Check if it's an email
    if (userIdentifier.includes('@')) {
      // Find user by email
      const usersSnapshot = await db.collection('users')
        .where('email', '==', userIdentifier)
        .limit(1)
        .get();
      
      if (usersSnapshot.empty) {
        console.error(`❌ No user found with email: ${userIdentifier}`);
        process.exit(1);
      }
      
      userId = usersSnapshot.docs[0].id;
    }
    
    // Update user document
    await db.collection('users').doc(userId).update({
      role: 'tester',
      isTester: true,
      strTrialUsed: 0, // Reset trial counter
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    console.log(`✅ Tester access granted to user: ${userId}`);
    console.log(`   - Role set to: tester`);
    console.log(`   - STR trial counter reset to: 0`);
    console.log(`   - User now has unlimited STR analysis access`);
    
    // Verify the update
    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.data();
    console.log(`\n📊 User data:`, {
      userId: userId,
      email: userData.email,
      role: userData.role,
      isTester: userData.isTester,
      strTrialUsed: userData.strTrialUsed
    });
    
  } catch (error) {
    console.error('❌ Error granting tester access:', error);
    process.exit(1);
  }
}

async function listTesters() {
  try {
    const testersSnapshot = await db.collection('users')
      .where('role', '==', 'tester')
      .get();
    
    console.log('\n📋 Current testers:');
    if (testersSnapshot.empty) {
      console.log('   No testers found');
    } else {
      testersSnapshot.forEach(doc => {
        const data = doc.data();
        console.log(`   - ${doc.id}: ${data.email || 'No email'}`);
      });
    }
  } catch (error) {
    console.error('❌ Error listing testers:', error);
  }
}

// Main execution
const args = process.argv.slice(2);

if (args.length === 0 || args[0] === '--help') {
  console.log(`
📚 Grant Tester Access Script
=============================

Usage:
  node scripts/grant-tester-access.js <userId or email>  - Grant tester access to a user
  node scripts/grant-tester-access.js --list            - List all current testers
  node scripts/grant-tester-access.js --help            - Show this help

Examples:
  node scripts/grant-tester-access.js yBilXCUnWAdqUuJfy2YwXnRz4Xy2
  node scripts/grant-tester-access.js test@example.com

Tester Benefits:
  - Unlimited STR analysis (no 5-trial limit)
  - Trial counter not incremented
  - Access to all premium features for testing

Note: The user ID "yBilXCUnWAdqUuJfy2YwXnRz4Xy2" is already hardcoded
      as a tester in the Railway API for immediate access.
  `);
  process.exit(0);
}

if (args[0] === '--list') {
  listTesters().then(() => process.exit(0));
} else {
  grantTesterAccess(args[0]).then(() => {
    listTesters().then(() => process.exit(0));
  });
}