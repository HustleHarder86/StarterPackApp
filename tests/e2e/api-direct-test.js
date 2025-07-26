#!/usr/bin/env node

/**
 * Direct API test - no browser needed
 * Super fast, tests API functionality directly
 */

const fetch = require('node-fetch');

const API_URL = 'https://starter-pack-app.vercel.app/api/analyze-property';
const TEST_DATA = {
  propertyAddress: '123 King Street West, Toronto, ON, M5V 3A8',
  propertyData: {
    address: '123 King Street West, Toronto, ON, M5V 3A8',
    price: 750000,
    bedrooms: 2,
    bathrooms: 2,
    sqft: 850,
    propertyType: 'Condo',
    propertyTaxes: 4500,
    condoFees: 650
  },
  requestType: 'e2e-test',
  analysisType: 'both',
  includeStrAnalysis: true,
  isE2ETest: true
};

async function testAPI() {
  console.log('🚀 Starting direct API test...\n');
  const startTime = Date.now();
  
  try {
    console.log('📤 Sending request to:', API_URL);
    
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer e2e-test-token',
        'X-E2E-Test-Mode': 'true'
      },
      body: JSON.stringify(TEST_DATA)
    });
    
    console.log('📥 Response status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Success! Analysis ID:', data.analysisId);
      
      // Quick validation of response
      if (data.data) {
        console.log('  - Property value:', data.data.property_details?.estimated_value);
        console.log('  - Monthly LTR rent:', data.data.long_term_rental?.monthly_rent);
        console.log('  - Daily STR rate:', data.data.short_term_rental?.daily_rate);
        console.log('  - ROI:', data.data.roi_percentage + '%');
      }
    } else {
      const error = await response.text();
      console.log('❌ API Error:', error);
    }
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`\n⏱️  Test completed in ${duration} seconds`);
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Run the test
testAPI();