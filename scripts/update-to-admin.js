#!/usr/bin/env node

// Update a user to admin status
require('dotenv').config();
const admin = require('firebase-admin');

// Initialize Firebase Admin
if (!admin.apps.length) {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!projectId || !clientEmail || !privateKey) {
    console.error('Missing Firebase credentials. Please check your .env file.');
    process.exit(1);
  }

  admin.initializeApp({
    credential: admin.credential.cert({
      projectId,
      clientEmail,
      privateKey,
    })
  });
}

const auth = admin.auth();
const db = admin.firestore();

async function updateToAdmin(email) {
  console.log(`\n🚀 Updating ${email} to admin status...\n`);

  try {
    // Get user by email
    const userRecord = await auth.getUserByEmail(email);
    console.log('✅ User found:', userRecord.uid);

    // Set admin custom claims
    await auth.setCustomUserClaims(userRecord.uid, {
      role: 'admin',
      tier: 'enterprise'
    });
    console.log('✅ Custom claims updated');

    // Update Firestore document
    await db.collection('users').doc(userRecord.uid).set({
      email: email,
      displayName: userRecord.displayName || 'Admin',
      role: 'admin',
      isAdmin: true,
      subscriptionTier: 'enterprise',
      subscriptionStatus: 'active',
      monthlyAnalysisLimit: -1, // unlimited
      strAnalysisEnabled: true,
      strTrialUsed: 0, // Reset trials since admin has unlimited
      features: ['all'],
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      adminGrantedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
    
    console.log('✅ Firestore document updated');

    // Log the admin grant
    await db.collection('activityLogs').add({
      userId: userRecord.uid,
      action: 'admin_granted',
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      metadata: {
        email: email,
        grantedBy: 'update_script',
        previousTier: 'unknown'
      }
    });

    console.log('\n🎉 Admin privileges granted successfully!');
    console.log('\n📋 Account Details:');
    console.log(`   Email: ${email}`);
    console.log(`   UID: ${userRecord.uid}`);
    console.log(`   Role: admin`);
    console.log(`   Tier: enterprise`);
    console.log(`   STR Access: unlimited`);
    console.log('\n✨ The user now has:');
    console.log('   - Unlimited STR analyses');
    console.log('   - No trial restrictions');
    console.log('   - Full platform access');
    console.log('   - Admin dashboard access');
    
    console.log('\n📝 Next steps:');
    console.log('1. Have the user logout and login again to refresh their session');
    console.log('2. They should see "👑 Admin - Unlimited access" on analysis screens');

  } catch (error) {
    if (error.code === 'auth/user-not-found') {
      console.error('❌ User not found with email:', email);
      console.log('\nMake sure the user has created an account first.');
    } else {
      console.error('❌ Error updating user:', error.message);
    }
  }
}

// Get email from command line
const email = process.argv[2];

if (!email) {
  console.log('Usage: node scripts/update-to-admin.js <email>');
  console.log('Example: node scripts/update-to-admin.js amy__ali@hotmail.com');
  process.exit(1);
}

updateToAdmin(email)
  .then(() => {
    console.log('\n✨ Update complete!\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });