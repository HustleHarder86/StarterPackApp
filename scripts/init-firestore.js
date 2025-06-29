#!/usr/bin/env node

// Initialize Firestore with required collections and data
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

const db = admin.firestore();

async function initializeFirestore() {
  console.log('🔥 Initializing Firestore...\n');

  try {
    // 1. System Configuration
    console.log('📋 Creating system configuration...');
    await db.collection('config').doc('system').set({
      subscriptionTiers: {
        free: {
          name: 'Free',
          monthlyAnalysisLimit: 5,
          strTrialLimit: 5,
          strAnalysisEnabled: false,
          features: [
            'basic_analysis',
            'str_trial',
            'browser_extension',
            'dashboard'
          ]
        },
        pro: {
          name: 'Professional',
          monthlyAnalysisLimit: 100,
          strTrialLimit: -1, // unlimited
          strAnalysisEnabled: true,
          features: [
            'basic_analysis',
            'str_analysis',
            'pdf_reports',
            'portfolio',
            'browser_extension',
            'dashboard',
            'email_alerts',
            'api_access'
          ]
        },
        enterprise: {
          name: 'Enterprise',
          monthlyAnalysisLimit: -1, // unlimited
          strTrialLimit: -1,
          strAnalysisEnabled: true,
          features: ['all']
        }
      },
      pricing: {
        pro: {
          monthly: 29.99,
          annual: 299.99,
          currency: 'CAD'
        },
        enterprise: {
          custom: true
        }
      },
      currentVersion: '2.0.0',
      maintenanceMode: false,
      publicApiEnabled: true,
      defaultCurrency: 'CAD',
      supportedCountries: ['CA', 'US'],
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    console.log('✅ System configuration created');

    // 2. Feature Flags
    console.log('\n📋 Creating feature flags...');
    await db.collection('config').doc('features').set({
      strAnalysis: {
        enabled: true,
        trialLimit: 5,
        requiresProSubscription: true
      },
      browserExtension: {
        enabled: true,
        version: '1.0.0',
        minimumVersion: '1.0.0'
      },
      pdfReports: {
        enabled: true,
        requiresProSubscription: true
      },
      emailAlerts: {
        enabled: true,
        requiresProSubscription: true
      },
      portfolio: {
        enabled: true,
        maxPropertiesFree: 10,
        maxPropertiesPro: 100
      },
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    console.log('✅ Feature flags created');

    // 3. Email Templates
    console.log('\n📋 Creating email templates...');
    const emailTemplates = [
      {
        id: 'welcome',
        subject: 'Welcome to InvestorProps!',
        type: 'transactional'
      },
      {
        id: 'analysis_complete',
        subject: 'Your property analysis is ready',
        type: 'transactional'
      },
      {
        id: 'trial_ending',
        subject: 'Your STR trial is ending soon',
        type: 'marketing'
      },
      {
        id: 'subscription_created',
        subject: 'Welcome to InvestorProps Pro!',
        type: 'transactional'
      }
    ];

    for (const template of emailTemplates) {
      await db.collection('emailTemplates').doc(template.id).set({
        ...template,
        active: true,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }
    console.log('✅ Email templates created');

    // 4. Sample Property Data (for testing)
    console.log('\n📋 Creating sample property data...');
    const sampleProperty = {
      mlsNumber: 'SAMPLE123',
      address: {
        street: '123 Sample Street',
        city: 'Toronto',
        province: 'Ontario',
        postalCode: 'M5V 3A8',
        country: 'Canada'
      },
      price: 850000,
      bedrooms: 3,
      bathrooms: 2,
      sqft: 1500,
      propertyType: 'condo',
      yearBuilt: 2018,
      description: 'Sample property for testing',
      isDemo: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    };

    const propertyRef = await db.collection('demoProperties').add(sampleProperty);
    console.log('✅ Sample property created:', propertyRef.id);

    // 5. Usage Tracking Structure
    console.log('\n📋 Setting up usage tracking...');
    await db.collection('config').doc('usage').set({
      totalAnalyses: 0,
      totalUsers: 0,
      totalProperties: 0,
      monthlyAnalyses: {},
      apiCalls: {
        perplexity: 0,
        airbnb: 0,
        openai: 0
      },
      lastUpdated: admin.firestore.FieldValue.serverTimestamp()
    });
    console.log('✅ Usage tracking initialized');

    console.log('\n🎉 Firestore initialization complete!');
    console.log('\n📝 Next steps:');
    console.log('1. Run: node scripts/create-admin.js');
    console.log('2. Deploy security rules: firebase deploy --only firestore:rules');
    console.log('3. Deploy indexes: firebase deploy --only firestore:indexes');

  } catch (error) {
    console.error('\n❌ Error initializing Firestore:', error);
    process.exit(1);
  }
}

// Run initialization
initializeFirestore()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });