#!/usr/bin/env node

// Create admin user for InvestorProps
require('dotenv').config();
const admin = require('firebase-admin');
const readline = require('readline');

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

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise((resolve) => {
    rl.question(query, resolve);
  });
}

async function createAdminUser() {
  console.log('🔐 Create Admin User for InvestorProps\n');

  try {
    // Get admin email
    const email = await question('Enter admin email address: ');
    if (!email || !email.includes('@')) {
      console.error('Invalid email address');
      process.exit(1);
    }

    // Get admin password
    const password = await question('Enter admin password (min 6 characters): ');
    if (!password || password.length < 6) {
      console.error('Password must be at least 6 characters');
      process.exit(1);
    }

    // Get admin name
    const displayName = await question('Enter admin display name: ');

    console.log('\nCreating admin user...');

    // Check if user already exists
    let userRecord;
    try {
      userRecord = await auth.getUserByEmail(email);
      console.log('User already exists, updating...');
    } catch (error) {
      // User doesn't exist, create new
      userRecord = await auth.createUser({
        email: email,
        password: password,
        displayName: displayName || 'Admin',
        emailVerified: true
      });
      console.log('✅ User created successfully');
    }

    // Set admin custom claim
    await auth.setCustomUserClaims(userRecord.uid, {
      role: 'admin',
      tier: 'enterprise'
    });
    console.log('✅ Admin role assigned');

    // Create/update user document in Firestore
    await db.collection('users').doc(userRecord.uid).set({
      email: email,
      displayName: displayName || 'Admin',
      role: 'admin',
      subscriptionTier: 'enterprise',
      subscriptionStatus: 'active',
      monthlyAnalysisLimit: -1, // unlimited
      strAnalysisEnabled: true,
      strTrialUsed: 0,
      features: ['all'],
      createdAt: userRecord.metadata.creationTime,
      lastLogin: new Date().toISOString(),
      isAdmin: true
    }, { merge: true });
    console.log('✅ User profile created in Firestore');

    // Create initial activity log
    await db.collection('activityLogs').add({
      userId: userRecord.uid,
      action: 'admin_created',
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      metadata: {
        email: email,
        createdBy: 'setup_script'
      }
    });

    console.log('\n🎉 Admin user created successfully!');
    console.log(`\n📧 Email: ${email}`);
    console.log(`🔑 UID: ${userRecord.uid}`);
    console.log(`👤 Name: ${displayName || 'Admin'}`);
    console.log('\n⚡ The admin user has:');
    console.log('   - Full access to all features');
    console.log('   - Unlimited analyses');
    console.log('   - Access to admin dashboard');
    console.log('   - Ability to manage other users');
    
    console.log('\n📝 Next steps:');
    console.log('1. Login at: /roi-finder.html');
    console.log('2. Access admin dashboard at: /admin-dashboard.html');
    console.log('3. Test the platform with full features');

  } catch (error) {
    console.error('\n❌ Error creating admin user:', error.message);
    process.exit(1);
  } finally {
    rl.close();
  }
}

// Add test user creation function
async function createTestUser() {
  const shouldCreate = await question('\nWould you like to create a test user too? (y/n): ');
  
  if (shouldCreate.toLowerCase() === 'y') {
    console.log('\n🧪 Creating test user...');
    
    try {
      const testUser = await auth.createUser({
        email: 'test@example.com',
        password: 'Test123!',
        displayName: 'Test User',
        emailVerified: true
      });

      await db.collection('users').doc(testUser.uid).set({
        email: 'test@example.com',
        displayName: 'Test User',
        role: 'user',
        subscriptionTier: 'free',
        subscriptionStatus: 'active',
        monthlyAnalysisCount: 0,
        monthlyAnalysisLimit: 5,
        strAnalysisEnabled: false,
        strTrialUsed: 0,
        strTrialLimit: 5,
        createdAt: testUser.metadata.creationTime,
        isTestUser: true
      });

      console.log('✅ Test user created:');
      console.log('   Email: test@example.com');
      console.log('   Password: Test123!');
      console.log('   Tier: Free (with 5 STR trials)');
    } catch (error) {
      if (error.code === 'auth/email-already-exists') {
        console.log('ℹ️  Test user already exists');
      } else {
        console.error('Error creating test user:', error.message);
      }
    }
  }
}

// Run the script
createAdminUser()
  .then(() => createTestUser())
  .then(() => {
    console.log('\n✨ Setup complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });