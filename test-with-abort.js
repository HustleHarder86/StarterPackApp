// Test with automatic abort after short time to control costs
require('dotenv').config({ path: '.env.local' });
const { ApifyClient } = require('apify-client');

async function testWithAutoAbort() {
  console.log('🔍 Testing with auto-abort after 15 seconds to control costs...\n');
  
  const client = new ApifyClient({
    token: process.env.AIRBNB_SCRAPER_API_KEY
  });
  
  // Use comprehensive parameters for tri_angle/new-fast-airbnb-scraper
  const input = {
    "locationQueries": ["Toronto"],
    "locale": "en-CA",
    "currency": "CAD",
    "adults": 4,
    "children": 0,
    "infants": 0,
    "pets": 0,
    "checkIn": "2025-08-15",
    "checkOut": "2025-08-18", 
    "priceMin": 50,
    "priceMax": 500,
    "minBedrooms": 2,
    "minBathrooms": 1,
    "minBeds": 2
  };
  
  console.log('Input:', JSON.stringify(input, null, 2));
  
  try {
    console.log('\nStarting actor (will auto-abort after 15 seconds)...');
    
    // Start the actor (don't wait for completion)
    const run = await client.actor("tri_angle/new-fast-airbnb-scraper").start(input);
    console.log(`Started run: ${run.id}`);
    
    // Wait 15 seconds then abort
    console.log('Waiting 15 seconds then aborting...');
    await new Promise(resolve => setTimeout(resolve, 15000));
    
    console.log('Aborting run to control costs...');
    await client.run(run.id).abort();
    
    // Wait a moment for abort to process
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Check what we got in those 15 seconds
    const { items } = await client.dataset(run.defaultDatasetId).listItems({ limit: 10 });
    
    console.log(`\n📊 Results from 15-second test: ${items.length} items`);
    
    if (items.length > 0) {
      console.log('\n✅ SUCCESS! Got sample data:');
      const firstItem = items[0];
      
      console.log('\nFirst item structure:');
      console.log('Available fields:', Object.keys(firstItem));
      
      // Show key fields
      console.log('\nKey data:');
      console.log('- Name:', firstItem.name || firstItem.title);
      console.log('- Price:', firstItem.price);
      console.log('- Bedrooms:', firstItem.bedrooms);
      console.log('- Property Type:', firstItem.propertyType || firstItem.roomType);
      
      // Show price-related fields
      const priceFields = Object.keys(firstItem).filter(k => 
        k.toLowerCase().includes('price') || k.toLowerCase().includes('cost')
      );
      console.log('\nPrice fields found:', priceFields);
      priceFields.forEach(field => {
        console.log(`- ${field}:`, firstItem[field]);
      });
      
      // Show full structure of first item (truncated)
      console.log('\n=== FULL FIRST ITEM ===');
      console.log(JSON.stringify(firstItem, null, 2));
      
    } else {
      console.log('❌ No results in 15 seconds - actor might be slow to start');
    }
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
  }
}

testWithAutoAbort();