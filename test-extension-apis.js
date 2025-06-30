// Direct API test without browser
const https = require('https');

console.log('Testing StarterPack Extension APIs...\n');

const tests = [
  {
    name: 'Extension Welcome Page',
    url: 'https://starterpackapp.vercel.app/extension-welcome.html',
    method: 'HEAD',
    expectedStatus: [200]
  },
  {
    name: 'Extension Test Page',
    url: 'https://starterpackapp.vercel.app/extension-test.html',
    method: 'HEAD',
    expectedStatus: [200]
  },
  {
    name: 'Main App (ROI Finder)',
    url: 'https://starterpackapp.vercel.app/roi-finder.html',
    method: 'HEAD',
    expectedStatus: [200]
  },
  {
    name: 'Config API',
    url: 'https://starterpackapp.vercel.app/api/config',
    method: 'GET',
    expectedStatus: [200]
  },
  {
    name: 'User Management API',
    url: 'https://starterpackapp.vercel.app/api/user-management',
    method: 'GET',
    expectedStatus: [401, 403] // Should require auth
  },
  {
    name: 'Properties Ingest API (OPTIONS)',
    url: 'https://starterpackapp.vercel.app/api/properties/ingest',
    method: 'OPTIONS',
    expectedStatus: [200, 204]
  }
];

async function testUrl(test) {
  return new Promise((resolve) => {
    const url = new URL(test.url);
    const options = {
      hostname: url.hostname,
      port: 443,
      path: url.pathname + url.search,
      method: test.method,
      headers: {
        'User-Agent': 'StarterPack-Extension-Test'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        const success = test.expectedStatus.includes(res.statusCode);
        console.log(`${success ? '✓' : '✗'} ${test.name}`);
        console.log(`  Status: ${res.statusCode} ${res.statusMessage}`);
        console.log(`  URL: ${test.url}`);
        
        if (!success) {
          console.log(`  Expected: ${test.expectedStatus.join(' or ')}`);
          if (data) {
            console.log(`  Response: ${data.substring(0, 200)}...`);
          }
        }
        console.log('');
        resolve({ ...test, status: res.statusCode, success });
      });
    });

    req.on('error', (e) => {
      console.log(`✗ ${test.name}`);
      console.log(`  Error: ${e.message}`);
      console.log('');
      resolve({ ...test, error: e.message, success: false });
    });

    req.end();
  });
}

async function runTests() {
  console.log('='.repeat(50));
  console.log('Starting API Tests...');
  console.log('='.repeat(50));
  console.log('');

  const results = [];
  
  for (const test of tests) {
    const result = await testUrl(test);
    results.push(result);
  }

  console.log('='.repeat(50));
  console.log('Summary:');
  console.log('='.repeat(50));
  
  const passed = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  
  console.log(`Total: ${results.length}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  
  if (failed > 0) {
    console.log('\nFailed tests:');
    results.filter(r => !r.success).forEach(r => {
      console.log(`- ${r.name}: ${r.status || r.error}`);
    });
  }
}

runTests();