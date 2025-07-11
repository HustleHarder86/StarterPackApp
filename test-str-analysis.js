// Test script for STR analysis API
const https = require('https');

// Test property data (similar to what browser extension would send)
const testPropertyData = {
  address: {
    street: "123 Main Street",
    city: "Toronto", 
    province: "Ontario",
    postalCode: "M5V 3A8"
  },
  price: 850000,
  propertyTaxes: 8500,
  bedrooms: 3,
  bathrooms: 2,
  sqft: 1800,
  propertyType: "Condo",
  listingPrice: 850000
};

const testPayload = {
  propertyId: "test-property-123",
  propertyData: testPropertyData
};

// Replace with your actual API URL and auth token
const API_URL = process.env.API_URL || 'https://your-railway-app.railway.app';
const AUTH_TOKEN = process.env.TEST_AUTH_TOKEN || 'your-firebase-jwt-token';

async function testSTRAnalysis() {
  console.log('Testing STR Analysis API...');
  console.log('Property Data:', JSON.stringify(testPropertyData, null, 2));
  
  const postData = JSON.stringify(testPayload);
  
  const options = {
    hostname: API_URL.replace('https://', ''),
    path: '/api/str-analysis/analyze',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData),
      'Authorization': `Bearer ${AUTH_TOKEN}`
    }
  };
  
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          console.log('\n=== STR Analysis Response ===');
          console.log('Status:', res.statusCode);
          console.log('Response:', JSON.stringify(response, null, 2));
          resolve(response);
        } catch (error) {
          console.error('Parse Error:', error);
          console.log('Raw Response:', data);
          reject(error);
        }
      });
    });
    
    req.on('error', (error) => {
      console.error('Request Error:', error);
      reject(error);
    });
    
    req.write(postData);
    req.end();
  });
}

// Run the test
if (require.main === module) {
  testSTRAnalysis()
    .then((result) => {
      if (result.success) {
        console.log('\n✅ STR Analysis successful!');
        console.log(`Nightly Rate: $${result.data.avgNightlyRate}`);
        console.log(`Occupancy: ${(result.data.occupancyRate * 100).toFixed(0)}%`);
        console.log(`Monthly Revenue: $${result.data.monthlyRevenue.toLocaleString()}`);
        console.log(`Comparables Found: ${result.data.comparableCount || 0}`);
      } else {
        console.log('\n❌ STR Analysis failed');
      }
    })
    .catch((error) => {
      console.error('\n❌ Test failed:', error.message);
    });
}