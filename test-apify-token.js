// Test if Apify token is valid
require('dotenv').config({ path: '.env.local' });
const { ApifyClient } = require('apify-client');

async function testApifyToken() {
  const token = process.env.AIRBNB_SCRAPER_API_KEY;
  
  console.log('Testing Apify token...');
  console.log('Token:', token ? `${token.substring(0, 10)}...` : 'NOT SET');
  
  if (!token) {
    console.log('❌ No token found in .env.local');
    return;
  }
  
  try {
    const client = new ApifyClient({ token });
    
    // Test with a simple API call
    const user = await client.user().get();
    console.log('✅ Token is valid!');
    console.log('User:', user.username);
    
    // Test listing actors
    const actors = await client.actors().list({ limit: 5 });
    console.log(`✅ Can access actors (found ${actors.items.length})`);
    
  } catch (error) {
    console.log('❌ Token test failed:', error.message);
    
    if (error.type === 'user-or-token-not-found') {
      console.log('\n💡 Solutions:');
      console.log('1. Check your Apify console for the correct Personal API token');
      console.log('2. Make sure token starts with "apify_api_"');
      console.log('3. Verify the token has not expired');
    }
  }
}

testApifyToken();