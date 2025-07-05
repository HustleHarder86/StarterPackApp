const { ApifyClient } = require('apify-client');
require('dotenv').config();

async function testMinimal() {
  const client = new ApifyClient({
    token: process.env.APIFY_API_TOKEN,
  });

  // Exact format from documentation
  const input = {
    locationQueries: ["Toronto"]
  };

  console.log('Testing with minimal input:', input);

  try {
    const run = await client.actor('NDa1latMI7JHJzSYU').call(input);
    console.log('Run started:', run.id);
    
    const { items } = await client.dataset(run.defaultDatasetId).listItems();
    console.log(`Found ${items.length} listings`);
    
    if (items.length > 0) {
      console.log('First listing:', items[0]);
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testMinimal();