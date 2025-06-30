// Test different possible Vercel domains
const https = require('https');

const possibleDomains = [
  'starterpackapp.vercel.app',
  'starter-pack-app.vercel.app',
  'starterpack.vercel.app',
  'investorprops.vercel.app',
  'starter-pack.vercel.app',
  'starterpackapp-hustleharder86s-projects.vercel.app',
  'starterpack-hustleharder86s-projects.vercel.app'
];

async function testDomain(domain) {
  return new Promise((resolve) => {
    const options = {
      hostname: domain,
      port: 443,
      path: '/roi-finder.html',
      method: 'HEAD',
      timeout: 5000
    };

    const req = https.request(options, (res) => {
      resolve({
        domain,
        status: res.statusCode,
        success: res.statusCode < 400
      });
    });

    req.on('error', (e) => {
      resolve({
        domain,
        error: e.message,
        success: false
      });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({
        domain,
        error: 'Timeout',
        success: false
      });
    });

    req.end();
  });
}

async function findWorkingDomain() {
  console.log('Testing possible Vercel domains...\n');

  for (const domain of possibleDomains) {
    const result = await testDomain(domain);
    
    if (result.success) {
      console.log(`✓ FOUND: ${result.domain} (Status: ${result.status})`);
    } else {
      console.log(`✗ ${result.domain} - ${result.error || `Status: ${result.status}`}`);
    }
  }
}

findWorkingDomain();