// Simple API integration test
const axios = require('axios');

const API_URLS = {
  vercel: 'http://localhost:3000',
  railway: 'http://localhost:8080',
  frontend: 'http://localhost:5173'
};

async function testEndpoint(name, url) {
  try {
    const response = await axios.get(url, { timeout: 5000 });
    console.log(`✅ ${name}: ${response.status} - ${response.statusText}`);
    if (response.data) {
      console.log(`   Response: ${JSON.stringify(response.data).substring(0, 100)}...`);
    }
    return true;
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.log(`❌ ${name}: Service not running on ${url}`);
    } else if (error.response) {
      console.log(`⚠️  ${name}: ${error.response.status} - ${error.response.statusText}`);
    } else {
      console.log(`❌ ${name}: ${error.message}`);
    }
    return false;
  }
}

async function runTests() {
  console.log('🧪 Testing API Endpoints...\n');
  
  // Test Frontend
  console.log('Frontend Tests:');
  await testEndpoint('Frontend Home', `${API_URLS.frontend}/`);
  await testEndpoint('ROI Finder', `${API_URLS.frontend}/roi-finder.html`);
  
  console.log('\nVercel API Tests:');
  await testEndpoint('Vercel Health', `${API_URLS.vercel}/api/health`);
  
  console.log('\nRailway API Tests:');
  await testEndpoint('Railway Health', `${API_URLS.railway}/health`);
  await testEndpoint('Railway Root', `${API_URLS.railway}/`);
  
  console.log('\n✅ Test complete!');
}

// Run tests
runTests().catch(console.error);