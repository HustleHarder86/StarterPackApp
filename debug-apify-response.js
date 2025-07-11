// Debug script to see the raw Apify response format
require('dotenv').config({ path: '.env.local' });
const { airbnbScraper } = require('./utils/airbnb-scraper.js');

async function debugApifyResponse() {
  console.log('🔍 Debugging Apify response format...\n');
  
  const testProperty = {
    address: { city: "Toronto", province: "Ontario" },
    bedrooms: 3,
    bathrooms: 2,
    propertyType: "Condo"
  };
  
  try {
    // Get raw search results
    const searchResults = await airbnbScraper.searchComparables(testProperty);
    
    console.log(`Found ${searchResults.listings.length} listings\n`);
    
    // Show first 3 raw listings to understand the data structure
    console.log('=== FIRST 3 RAW LISTINGS ===');
    searchResults.listings.slice(0, 3).forEach((listing, i) => {
      console.log(`\n--- Listing ${i + 1} ---`);
      console.log('Raw listing object:');
      console.log(JSON.stringify(listing, null, 2));
    });
    
    // Show what properties are available
    console.log('\n=== AVAILABLE PROPERTIES ===');
    const firstListing = searchResults.listings[0];
    if (firstListing) {
      console.log('Properties in first listing:');
      console.log(Object.keys(firstListing));
    }
    
  } catch (error) {
    console.error('Debug failed:', error.message);
  }
}

debugApifyResponse();