// Debug script with timeout to see what's happening
require('dotenv').config({ path: '.env.local' });
const { ApifyClient } = require('apify-client');

async function debugWithTimeout() {
  console.log('🔍 Testing Apify with timeout...\n');
  
  const client = new ApifyClient({
    token: process.env.AIRBNB_SCRAPER_API_KEY
  });
  
  const input = {
    locationQueries: ["Toronto, Ontario"],
    currency: "CAD",
    locale: "en-US",
    priceMin: 50,
    priceMax: 500,
    minBedrooms: 2,
    minBathrooms: 1,
    adults: 6
  };
  
  try {
    console.log('Starting actor with 60s timeout...');
    
    // Add timeout to the actor run
    const runPromise = client.actor('NDa1latMI7JHJzSYU').call(input, {
      timeout: 60000, // 60 seconds
      memory: 512
    });
    
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Timeout after 60 seconds')), 60000)
    );
    
    const run = await Promise.race([runPromise, timeoutPromise]);
    
    console.log(`Actor completed! Run ID: ${run.id}, Status: ${run.status}`);
    
    // Get just first few items to see structure
    const { items } = await client.dataset(run.defaultDatasetId).listItems({ limit: 3 });
    
    console.log(`\n=== SAMPLE DATA (${items.length} items) ===`);
    items.forEach((item, i) => {
      console.log(`\n--- Item ${i + 1} ---`);
      console.log('Available properties:', Object.keys(item));
      console.log('Name/Title:', item.name || item.title);
      console.log('Price fields:', {
        price: item.price,
        basePrice: item.basePrice,
        pricing: item.pricing
      });
      console.log('Room fields:', {
        bedrooms: item.bedrooms,
        beds: item.beds,
        accommodates: item.accommodates
      });
    });
    
  } catch (error) {
    console.error('Error:', error.message);
    
    if (error.message.includes('Timeout')) {
      console.log('\n💡 The actor is taking too long. This is normal for first runs.');
      console.log('Try reducing the search scope or using a different actor.');
    }
  }
}

debugWithTimeout();