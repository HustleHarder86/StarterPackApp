// Test different input formats for tri_angle/new-fast-airbnb-scraper
require('dotenv').config({ path: '.env.local' });
const { ApifyClient } = require('apify-client');

async function testDifferentInputs() {
  console.log('🔍 Testing different input formats for tri_angle/new-fast-airbnb-scraper...\n');
  
  const client = new ApifyClient({
    token: process.env.AIRBNB_SCRAPER_API_KEY
  });
  
  const inputFormats = [
    {
      name: "Direct search URL",
      input: {
        startUrls: ["https://www.airbnb.com/s/Toronto--Ontario--Canada/homes?adults=2&children=0&infants=0&pets=0"],
        maxItems: 5,
        currency: "CAD"
      }
    },
    {
      name: "Location string", 
      input: {
        location: "Toronto, Ontario, Canada",
        maxItems: 5,
        currency: "CAD"
      }
    },
    {
      name: "Simple location",
      input: {
        location: "Toronto",
        maxListings: 5,
        currency: "CAD"
      }
    },
    {
      name: "Multiple start URLs",
      input: {
        startUrls: [
          "https://www.airbnb.com/s/Toronto--ON--Canada",
          "https://www.airbnb.com/s/Toronto--Ontario--Canada"
        ],
        maxItems: 5
      }
    }
  ];
  
  for (let i = 0; i < inputFormats.length; i++) {
    const format = inputFormats[i];
    console.log(`\n=== Testing ${format.name} ===`);
    console.log('Input:', JSON.stringify(format.input, null, 2));
    
    try {
      const run = await client.actor('tri_angle/new-fast-airbnb-scraper').call(format.input, {
        timeout: 45000 // 45 seconds
      });
      
      console.log(`Status: ${run.status}`);
      
      if (run.status === 'SUCCEEDED') {
        const { items } = await client.dataset(run.defaultDatasetId).listItems({ limit: 2 });
        console.log(`Results: ${items.length} items found`);
        
        if (items.length > 0) {
          console.log('\n🎯 SUCCESS! Found data with this format:');
          const item = items[0];
          console.log('Sample item fields:', Object.keys(item));
          console.log('Title:', item.name || item.title);
          console.log('Price fields:', Object.keys(item).filter(k => k.toLowerCase().includes('price')));
          console.log('Room fields:', Object.keys(item).filter(k => k.toLowerCase().includes('bed') || k.toLowerCase().includes('room')));
          
          // Show first item structure
          console.log('\nFirst item sample:');
          console.log(JSON.stringify(item, null, 2));
          break; // Stop on first success
        }
      }
      
    } catch (error) {
      console.log(`Error: ${error.message}`);
    }
    
    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  console.log('\n🏁 Testing complete');
}

testDifferentInputs();