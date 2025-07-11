// Debug the tri_angle/new-fast-airbnb-scraper actor
require('dotenv').config({ path: '.env.local' });
const { ApifyClient } = require('apify-client');

async function debugFastScraper() {
  console.log('🔍 Debugging tri_angle/new-fast-airbnb-scraper...\n');
  
  const client = new ApifyClient({
    token: process.env.AIRBNB_SCRAPER_API_KEY
  });
  
  try {
    // Get actor info to see expected input format
    const actor = await client.actor('tri_angle/new-fast-airbnb-scraper').get();
    console.log('Actor Info:');
    console.log('- Name:', actor.name);
    console.log('- Description:', actor.description?.substring(0, 200) + '...');
    console.log('- Stats:', actor.stats);
    console.log('');
    
    // Try different input format - many fast scrapers use simpler parameters
    const simpleInput = {
      startUrls: [
        "https://www.airbnb.com/s/Toronto--Ontario--Canada/homes"
      ],
      maxItems: 10, // Very small test
      currency: "CAD"
    };
    
    console.log('Testing with simple input format:');
    console.log(JSON.stringify(simpleInput, null, 2));
    
    const run = await client.actor('tri_angle/new-fast-airbnb-scraper').call(simpleInput, {
      timeout: 60000 // 1 minute max
    });
    
    console.log(`\nRun completed: ${run.status}`);
    
    // Get a few items to see the structure
    const { items } = await client.dataset(run.defaultDatasetId).listItems({ limit: 3 });
    
    console.log(`\n=== SAMPLE RESULTS (${items.length} items) ===`);
    items.forEach((item, i) => {
      console.log(`\n--- Item ${i + 1} ---`);
      console.log('Available fields:', Object.keys(item));
      
      // Look for price fields
      const priceFields = Object.keys(item).filter(key => 
        key.toLowerCase().includes('price') || 
        key.toLowerCase().includes('cost') ||
        key.toLowerCase().includes('rate')
      );
      console.log('Price-related fields:', priceFields);
      
      // Look for room fields  
      const roomFields = Object.keys(item).filter(key =>
        key.toLowerCase().includes('bed') ||
        key.toLowerCase().includes('room') ||
        key.toLowerCase().includes('bath')
      );
      console.log('Room-related fields:', roomFields);
      
      // Show actual values
      console.log('Sample data:');
      console.log('- Name/Title:', item.name || item.title);
      if (priceFields.length > 0) {
        priceFields.forEach(field => {
          console.log(`- ${field}:`, item[field]);
        });
      }
      if (roomFields.length > 0) {
        roomFields.forEach(field => {
          console.log(`- ${field}:`, item[field]);
        });
      }
    });
    
  } catch (error) {
    console.error('Error:', error.message);
    
    if (error.message.includes('not found')) {
      console.log('\n💡 The actor ID might be incorrect or the actor might not be public.');
      console.log('Try checking the Apify console for the correct actor ID.');
    }
  }
}

debugFastScraper();