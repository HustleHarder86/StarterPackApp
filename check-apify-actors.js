// Check available Airbnb actors on Apify
require('dotenv').config({ path: '.env.local' });
const { ApifyClient } = require('apify-client');

async function checkAvailableActors() {
  console.log('🔍 Checking available Airbnb actors...\n');
  
  const client = new ApifyClient({
    token: process.env.AIRBNB_SCRAPER_API_KEY
  });
  
  try {
    // Search for Airbnb actors
    const actorsResponse = await client.actors().list({
      limit: 20,
      search: 'airbnb'
    });
    
    console.log(`Found ${actorsResponse.items.length} Airbnb-related actors:\n`);
    
    actorsResponse.items.forEach((actor, i) => {
      console.log(`${i + 1}. ${actor.name}`);
      console.log(`   ID: ${actor.id}`);
      console.log(`   Username: ${actor.username}`);
      console.log(`   Stats: ${actor.stats.totalRuns || 0} runs`);
      console.log(`   Modified: ${actor.modifiedAt?.substring(0, 10)}`);
      console.log('');
    });
    
    // Test a simpler actor if available
    const simpleActor = actorsResponse.items.find(actor => 
      actor.name.toLowerCase().includes('simple') || 
      actor.name.toLowerCase().includes('basic') ||
      actor.stats.totalRuns > 1000
    );
    
    if (simpleActor) {
      console.log(`🎯 Suggested actor: ${simpleActor.name} (${simpleActor.id})`);
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkAvailableActors();