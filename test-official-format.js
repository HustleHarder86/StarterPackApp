// Test using the exact format from tri_angle documentation
require('dotenv').config({ path: '.env.local' });
const { ApifyClient } = require('apify-client');

async function testOfficialFormat() {
  console.log('🔍 Testing tri_angle actor with official sample format...\n');
  
  const client = new ApifyClient({
    token: process.env.AIRBNB_SCRAPER_API_KEY
  });
  
  // Exact format from the documentation you provided
  const input = {
    "locationQueries": [
      "Toronto"  // Simplified to just city name like the London example
    ],
    "locale": "en-US", 
    "currency": "CAD"  // Changed to CAD for Toronto
  };
  
  console.log('Using exact official format:');
  console.log(JSON.stringify(input, null, 2));
  
  try {
    console.log('\nCalling tri_angle/new-fast-airbnb-scraper...');
    
    // Run the Actor and wait for it to finish
    const run = await client.actor("tri_angle/new-fast-airbnb-scraper").call(input);
    
    console.log(`Run Status: ${run.status}`);
    console.log(`Run ID: ${run.id}`);
    
    if (run.status === 'SUCCEEDED') {
      // Fetch and print Actor results from the run's dataset
      console.log('\nFetching results...');
      const { items } = await client.dataset(run.defaultDatasetId).listItems({ limit: 5 });
      
      console.log(`\n✅ Found ${items.length} results!`);
      
      if (items.length > 0) {
        console.log('\n=== FIRST RESULT ===');
        const firstItem = items[0];
        console.log('Available fields:', Object.keys(firstItem));
        console.log('\nFull first item:');
        console.log(JSON.stringify(firstItem, null, 2));
        
        // Look for price information
        console.log('\n=== PRICE ANALYSIS ===');
        Object.keys(firstItem).forEach(key => {
          if (key.toLowerCase().includes('price') || 
              key.toLowerCase().includes('cost') ||
              key.toLowerCase().includes('rate')) {
            console.log(`${key}:`, firstItem[key]);
          }
        });
        
        // Look for room information
        console.log('\n=== ROOM ANALYSIS ===');
        Object.keys(firstItem).forEach(key => {
          if (key.toLowerCase().includes('bed') ||
              key.toLowerCase().includes('room') ||
              key.toLowerCase().includes('bath') ||
              key.toLowerCase().includes('guest')) {
            console.log(`${key}:`, firstItem[key]);
          }
        });
      }
    } else {
      console.log(`\n❌ Run failed with status: ${run.status}`);
    }
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
  }
}

testOfficialFormat();