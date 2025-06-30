// Test the correct domain
const https = require('https');

console.log('Testing starter-pack-app.vercel.app APIs...\n');

const tests = [
  {
    name: 'Extension Welcome Page',
    url: 'https://starter-pack-app.vercel.app/extension-welcome.html',
    method: 'HEAD',
    expectedStatus: [200]
  },
  {
    name: 'Extension Test Page',
    url: 'https://starter-pack-app.vercel.app/extension-test.html',
    method: 'HEAD',
    expectedStatus: [200]
  },
  {
    name: 'Main App (ROI Finder)',
    url: 'https://starter-pack-app.vercel.app/roi-finder.html',
    method: 'HEAD',
    expectedStatus: [200]
  },
  {
    name: 'Config API',
    url: 'https://starter-pack-app.vercel.app/api/config',
    method: 'GET',
    expectedStatus: [200]
  },
  {
    name: 'User Management API',
    url: 'https://starter-pack-app.vercel.app/api/user-management',
    method: 'GET',
    expectedStatus: [401, 403]
  }
];

async function testUrl(test) {
  return new Promise((resolve) => {
    const url = new URL(test.url);
    const options = {
      hostname: url.hostname,
      port: 443,
      path: url.pathname,
      method: test.method
    };

    const req = https.request(options, (res) => {
      const success = test.expectedStatus.includes(res.statusCode);
      console.log(`${success ? '✓' : '✗'} ${test.name}`);
      console.log(`  Status: ${res.statusCode}`);
      console.log(`  URL: ${test.url}\n`);
      resolve({ ...test, status: res.statusCode, success });
    });

    req.on('error', (e) => {
      console.log(`✗ ${test.name}`);
      console.log(`  Error: ${e.message}\n`);
      resolve({ ...test, error: e.message, success: false });
    });

    req.end();
  });
}

async function runTests() {
  for (const test of tests) {
    await testUrl(test);
  }
}

runTests();