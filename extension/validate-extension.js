#!/usr/bin/env node

// Extension validation script
const fs = require('fs');
const path = require('path');

console.log('🔍 Validating StarterPack Chrome Extension...\n');

// Check required files
const requiredFiles = [
  'manifest.json',
  'src/background.js',
  'src/content.js',
  'src/popup.html',
  'src/popup.js',
  'src/popup.css',
  'icons/icon-16.png',
  'icons/icon-32.png',
  'icons/icon-48.png',
  'icons/icon-128.png'
];

let allValid = true;

console.log('📁 Checking required files:');
requiredFiles.forEach(file => {
  const exists = fs.existsSync(file);
  console.log(`${exists ? '✅' : '❌'} ${file}`);
  if (!exists) allValid = false;
});

// Validate manifest.json
console.log('\n📋 Validating manifest.json:');
try {
  const manifest = JSON.parse(fs.readFileSync('manifest.json', 'utf8'));
  
  // Check manifest version
  if (manifest.manifest_version === 3) {
    console.log('✅ Manifest version 3 (correct)');
  } else {
    console.log('❌ Incorrect manifest version:', manifest.manifest_version);
    allValid = false;
  }
  
  // Check required fields
  const requiredFields = ['name', 'version', 'description', 'permissions', 'background', 'content_scripts', 'action'];
  requiredFields.forEach(field => {
    if (manifest[field]) {
      console.log(`✅ ${field}: present`);
    } else {
      console.log(`❌ ${field}: missing`);
      allValid = false;
    }
  });
  
  // Check background service worker
  if (manifest.background && manifest.background.service_worker === 'src/background.js') {
    console.log('✅ Background service worker: correctly configured');
  } else {
    console.log('❌ Background service worker: incorrect configuration');
    allValid = false;
  }
  
} catch (e) {
  console.log('❌ manifest.json parsing error:', e.message);
  allValid = false;
}

// Check JavaScript syntax
console.log('\n🔧 Checking JavaScript syntax:');
const jsFiles = ['src/background.js', 'src/content.js', 'src/popup.js'];
jsFiles.forEach(file => {
  if (fs.existsSync(file)) {
    try {
      const content = fs.readFileSync(file, 'utf8');
      // Basic syntax check - try to parse as JS
      new Function(content);
      console.log(`✅ ${file}: syntax OK`);
    } catch (e) {
      console.log(`❌ ${file}: syntax error - ${e.message.split('\n')[0]}`);
      allValid = false;
    }
  }
});

// Summary
console.log('\n🎯 Validation Summary:');
if (allValid) {
  console.log('✅ Extension is ready for installation!');
  console.log('\n📖 Installation Instructions:');
  console.log('1. Open Chrome and go to chrome://extensions/');
  console.log('2. Enable "Developer mode" (toggle in top right)');
  console.log('3. Click "Load unpacked"');
  console.log('4. Select this extension folder');
  console.log('5. The extension should appear in your extensions list');
} else {
  console.log('❌ Extension has validation errors that need to be fixed');
}