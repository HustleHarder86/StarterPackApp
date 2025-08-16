#!/usr/bin/env node

/**
 * Firebase Test Mode Setup
 * Creates test users, properties, and analyses for development/testing
 */

const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin
const serviceAccount = require('../.firebase-service-account.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: 'real-estate-roi-app.appspot.com'
});

const db = admin.firestore();
const auth = admin.auth();

// Test data configurations
const TEST_USERS = [
  {
    email: 'free-user-fresh@test.com',
    displayName: 'Fresh Free User',
    password: 'TestPass123!',
    customClaims: { role: 'free', strTrialUsed: 0 }
  },
  {
    email: 'free-user-almost@test.com',
    displayName: 'Almost At Limit User',
    password: 'TestPass123!',
    customClaims: { role: 'free', strTrialUsed: 4 }
  },
  {
    email: 'free-user-maxed@test.com',
    displayName: 'Maxed Out User',
    password: 'TestPass123!',
    customClaims: { role: 'free', strTrialUsed: 5 }
  },
  {
    email: 'premium-user@test.com',
    displayName: 'Premium Subscriber',
    password: 'TestPass123!',
    customClaims: { role: 'premium', subscriptionTier: 'premium' }
  },
  {
    email: 'tester-unlimited@test.com',
    displayName: 'Unlimited Tester',
    password: 'TestPass123!',
    customClaims: { role: 'tester', isTester: true }
  }
];

const TEST_PROPERTIES = [
  {
    id: 'test-toronto-luxury',
    address: '123 Bay Street, Toronto, ON',
    price: 1250000,
    propertyTax: 12500,
    squareFeet: 2800,
    bedrooms: 4,
    bathrooms: 3,
    yearBuilt: 2019,
    listingUrl: 'https://realtor.ca/test-toronto-luxury',
    city: 'Toronto',
    province: 'ON',
    postalCode: 'M5J 2R8',
    propertyType: 'Detached',
    extractedAt: new Date().toISOString()
  },
  {
    id: 'test-calgary-mid',
    address: '456 17th Ave SW, Calgary, AB',
    price: 650000,
    propertyTax: 5200,
    squareFeet: 1800,
    bedrooms: 3,
    bathrooms: 2,
    yearBuilt: 2015,
    listingUrl: 'https://realtor.ca/test-calgary-mid',
    city: 'Calgary',
    province: 'AB',
    postalCode: 'T2S 0A1',
    propertyType: 'Townhouse',
    extractedAt: new Date().toISOString()
  },
  {
    id: 'test-vancouver-condo',
    address: '789 Granville St, Vancouver, BC',
    price: 450000,
    propertyTax: 3600,
    squareFeet: 650,
    bedrooms: 1,
    bathrooms: 1,
    yearBuilt: 2021,
    listingUrl: 'https://realtor.ca/test-vancouver-condo',
    city: 'Vancouver',
    province: 'BC',
    postalCode: 'V6Z 1K3',
    propertyType: 'Condo',
    extractedAt: new Date().toISOString()
  }
];

async function clearTestData() {
  console.log('🧹 Clearing existing test data...');
  
  // Delete test users
  for (const testUser of TEST_USERS) {
    try {
      const user = await auth.getUserByEmail(testUser.email);
      await auth.deleteUser(user.uid);
      console.log(`  ✓ Deleted user: ${testUser.email}`);
    } catch (error) {
      // User doesn't exist, that's fine
    }
  }
  
  // Delete test properties and their analyses
  for (const prop of TEST_PROPERTIES) {
    try {
      await db.collection('properties').doc(prop.id).delete();
      await db.collection('analyses').doc(prop.id).delete();
      console.log(`  ✓ Deleted property: ${prop.id}`);
    } catch (error) {
      console.error(`  ✗ Error deleting ${prop.id}:`, error.message);
    }
  }
}

async function createTestUsers() {
  console.log('\n👥 Creating test users...');
  const createdUsers = [];
  
  for (const userData of TEST_USERS) {
    try {
      // Create auth user
      const userRecord = await auth.createUser({
        email: userData.email,
        password: userData.password,
        displayName: userData.displayName,
        emailVerified: true
      });
      
      // Set custom claims
      await auth.setCustomUserClaims(userRecord.uid, userData.customClaims);
      
      // Create Firestore document
      await db.collection('users').doc(userRecord.uid).set({
        email: userData.email,
        displayName: userData.displayName,
        subscriptionTier: userData.customClaims.subscriptionTier || 'free',
        strTrialUsed: userData.customClaims.strTrialUsed || 0,
        isTester: userData.customClaims.isTester || false,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        lastLogin: admin.firestore.FieldValue.serverTimestamp()
      });
      
      createdUsers.push({
        uid: userRecord.uid,
        email: userData.email,
        role: userData.customClaims.role,
        strTrials: userData.customClaims.strTrialUsed || 0
      });
      
      console.log(`  ✓ Created: ${userData.email} (${userData.customClaims.role}, STR trials: ${userData.customClaims.strTrialUsed || 0}/5)`);
    } catch (error) {
      console.error(`  ✗ Error creating ${userData.email}:`, error.message);
    }
  }
  
  return createdUsers;
}

async function createTestProperties() {
  console.log('\n🏠 Creating test properties...');
  const createdProperties = [];
  
  for (const prop of TEST_PROPERTIES) {
    try {
      await db.collection('properties').doc(prop.id).set(prop);
      
      // Create sample analysis
      const analysis = {
        propertyId: prop.id,
        costs: {
          mortgage: Math.round(prop.price * 0.004), // ~0.4% monthly
          propertyTax: Math.round(prop.propertyTax / 12),
          insurance: Math.round(prop.price * 0.0003),
          utilities: 200,
          maintenance: Math.round(prop.price * 0.0008),
          total: 0
        },
        longTermRental: {
          monthlyRent: Math.round(prop.price * 0.0035),
          vacancy: 5,
          netIncome: 0,
          roi: 0,
          cashFlow: 0
        },
        strAnalysis: {
          averageDailyRate: Math.round(prop.price * 0.0008),
          occupancyRate: 65,
          monthlyRevenue: 0,
          netIncome: 0,
          roi: 0
        },
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      };
      
      // Calculate totals
      analysis.costs.total = Object.values(analysis.costs).reduce((sum, val) => sum + (val || 0), 0);
      analysis.longTermRental.netIncome = analysis.longTermRental.monthlyRent - analysis.costs.total;
      analysis.longTermRental.roi = ((analysis.longTermRental.netIncome * 12) / prop.price * 100).toFixed(2);
      analysis.strAnalysis.monthlyRevenue = Math.round(analysis.strAnalysis.averageDailyRate * 30 * (analysis.strAnalysis.occupancyRate / 100));
      analysis.strAnalysis.netIncome = analysis.strAnalysis.monthlyRevenue - analysis.costs.total;
      analysis.strAnalysis.roi = ((analysis.strAnalysis.netIncome * 12) / prop.price * 100).toFixed(2);
      
      await db.collection('analyses').doc(prop.id).set(analysis);
      
      createdProperties.push({
        id: prop.id,
        address: prop.address,
        price: prop.price,
        city: prop.city
      });
      
      console.log(`  ✓ Created: ${prop.address} ($${prop.price.toLocaleString()})`);
    } catch (error) {
      console.error(`  ✗ Error creating ${prop.id}:`, error.message);
    }
  }
  
  return createdProperties;
}

async function listCurrentData() {
  console.log('\n📊 Current Firebase Data Summary:');
  
  // Count users
  const usersSnapshot = await db.collection('users').get();
  console.log(`  • Total users: ${usersSnapshot.size}`);
  
  // Count properties
  const propertiesSnapshot = await db.collection('properties').get();
  console.log(`  • Total properties: ${propertiesSnapshot.size}`);
  
  // Count analyses
  const analysesSnapshot = await db.collection('analyses').get();
  console.log(`  • Total analyses: ${analysesSnapshot.size}`);
  
  // List test users
  console.log('\n  Test Users:');
  for (const email of TEST_USERS.map(u => u.email)) {
    try {
      const user = await auth.getUserByEmail(email);
      const userDoc = await db.collection('users').doc(user.uid).get();
      const data = userDoc.data();
      console.log(`    - ${email}: STR trials ${data?.strTrialUsed || 0}/5, tier: ${data?.subscriptionTier || 'free'}`);
    } catch (error) {
      // User doesn't exist
    }
  }
}

async function main() {
  const command = process.argv[2];
  
  console.log('🔥 Firebase Test Mode Manager');
  console.log('================================\n');
  
  try {
    switch (command) {
      case 'setup':
        await clearTestData();
        const users = await createTestUsers();
        const properties = await createTestProperties();
        await listCurrentData();
        console.log('\n✅ Test mode setup complete!');
        console.log('\n📝 Test Credentials:');
        console.log('  All passwords: TestPass123!');
        console.log('  Emails:', TEST_USERS.map(u => u.email).join(', '));
        break;
        
      case 'clear':
        await clearTestData();
        console.log('\n✅ Test data cleared!');
        break;
        
      case 'list':
        await listCurrentData();
        break;
        
      default:
        console.log('Usage: node firebase-test-mode.js [command]');
        console.log('\nCommands:');
        console.log('  setup  - Create test users and properties');
        console.log('  clear  - Remove all test data');
        console.log('  list   - Show current data summary');
    }
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
  
  process.exit(0);
}

main();