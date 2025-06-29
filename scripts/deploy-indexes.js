#!/usr/bin/env node

/**
 * Deploy Firestore indexes
 * Run: node scripts/deploy-indexes.js
 */

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔥 Deploying Firestore indexes...\n');

// Check if firebase CLI is installed
exec('firebase --version', (error, stdout, stderr) => {
  if (error) {
    console.error('❌ Firebase CLI not found. Please install it:');
    console.error('   npm install -g firebase-tools');
    process.exit(1);
  }
  
  console.log(`✅ Firebase CLI version: ${stdout.trim()}`);
  
  // Check if indexes file exists
  const indexesPath = path.join(__dirname, '..', 'firestore.indexes.json');
  if (!fs.existsSync(indexesPath)) {
    console.error('❌ firestore.indexes.json not found');
    process.exit(1);
  }
  
  // Deploy indexes
  console.log('\n📤 Deploying indexes...');
  exec('firebase deploy --only firestore:indexes', (error, stdout, stderr) => {
    if (error) {
      console.error('❌ Deployment failed:', error.message);
      if (stderr) console.error(stderr);
      process.exit(1);
    }
    
    console.log(stdout);
    console.log('\n✅ Indexes deployed successfully!');
    console.log('\n📝 Note: It may take a few minutes for indexes to be fully built.');
    console.log('   Check status at: https://console.firebase.google.com/project/[PROJECT_ID]/firestore/indexes');
  });
});