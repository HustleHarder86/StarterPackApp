#!/usr/bin/env node

/**
 * Quick script to check Railway API status
 * Usage: node scripts/check-railway-status.js
 */

const https = require('https');

const RAILWAY_URL = 'https://starterpackapp-production.up.railway.app';
const VERCEL_URL = 'https://starter-pack-app.vercel.app';

console.log('🚂 Checking Railway API Status...\n');

// Test 1: Basic connectivity
function testBasicConnectivity() {
  return new Promise((resolve) => {
    console.log('1. Testing basic connectivity...');
    
    https.get(RAILWAY_URL, (res) => {
      if (res.statusCode === 200) {
        console.log('✅ Railway API is reachable\n');
        resolve(true);
      } else {
        console.log(`❌ Railway API returned status ${res.statusCode}\n`);
        resolve(false);
      }
    }).on('error', (err) => {
      console.log(`❌ Cannot reach Railway API: ${err.message}\n`);
      resolve(false);
    });
  });
}

// Test 2: Health check
function testHealthCheck() {
  return new Promise((resolve) => {
    console.log('2. Testing health endpoint...');
    
    https.get(`${RAILWAY_URL}/health`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          console.log('✅ Health check passed:', json.status);
          console.log('   Firebase:', json.services.firebase);
          console.log('   Perplexity:', json.services.perplexity);
          console.log('   Memory:', json.memory.usedMB, 'MB\n');
          resolve(true);
        } catch (e) {
          console.log('❌ Health check failed:', e.message, '\n');
          resolve(false);
        }
      });
    }).on('error', (err) => {
      console.log(`❌ Health check error: ${err.message}\n`);
      resolve(false);
    });
  });
}

// Test 3: CORS from Vercel origin
function testCORS() {
  return new Promise((resolve) => {
    console.log('3. Testing CORS configuration...');
    
    const options = {
      hostname: 'starterpackapp-production.up.railway.app',
      path: '/api/debug/cors-config',
      method: 'GET',
      headers: {
        'Origin': VERCEL_URL,
        'Accept': 'application/json'
      }
    };
    
    https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.isAllowed) {
            console.log('✅ CORS is properly configured');
            console.log('   Allowed origins:', json.allowedOrigins.join(', '), '\n');
          } else {
            console.log('❌ CORS is NOT allowing Vercel origin!');
            console.log('   Current origin:', json.requestOrigin);
            console.log('   Allowed origins:', json.allowedOrigins.join(', '));
            console.log('\n   Fix: Add', VERCEL_URL, 'to ALLOWED_ORIGINS in Railway\n');
          }
          resolve(json.isAllowed);
        } catch (e) {
          console.log('❌ CORS test failed:', e.message, '\n');
          resolve(false);
        }
      });
    }).on('error', (err) => {
      console.log(`❌ CORS test error: ${err.message}\n`);
      resolve(false);
    }).end();
  });
}

// Run all tests
async function runTests() {
  const results = {
    connectivity: await testBasicConnectivity(),
    health: await testHealthCheck(),
    cors: await testCORS()
  };
  
  console.log('📊 Summary:');
  console.log('─'.repeat(40));
  
  const allPassed = Object.values(results).every(r => r === true);
  
  if (allPassed) {
    console.log('✅ All tests passed! Railway API is fully operational.');
  } else {
    console.log('❌ Some tests failed. Check the output above for details.');
    
    if (!results.connectivity) {
      console.log('\n💡 Tip: Check if Railway deployment is running');
    }
    if (!results.cors) {
      console.log('\n💡 Tip: Update ALLOWED_ORIGINS in Railway environment variables');
    }
  }
  
  console.log('\n🔗 Railway Dashboard: https://railway.app/project/[your-project-id]');
  console.log('🔗 Debug Tool: https://starter-pack-app.vercel.app/debug-cors.html');
}

runTests();