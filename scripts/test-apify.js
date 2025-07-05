#!/usr/bin/env node

/**
 * Test script for Apify Airbnb Scraper integration
 * Usage: node scripts/test-apify.js
 */

require('dotenv').config();
const { AirbnbScraper } = require('../utils/airbnb-scraper');

async function testApifyIntegration() {
  console.log('Testing Apify Airbnb Scraper Integration...\n');
  
  // Check if API token is configured
  if (!process.env.APIFY_API_TOKEN) {
    console.error('❌ ERROR: APIFY_API_TOKEN is not set in environment variables');
    console.log('\nPlease set the following in your .env file or Vercel environment:');
    console.log('APIFY_API_TOKEN=your-apify-api-token');
    process.exit(1);
  }
  
  console.log('✅ Apify API token found');
  
  // Test property data (Milton, Ontario example)
  const testProperty = {
    address: {
      street: '123 Main St',
      city: 'Milton',
      province: 'Ontario',
      postalCode: 'L9T 1A1'
    },
    bedrooms: 3,
    bathrooms: 2.5,
    propertyType: 'Single Family',
    sqft: 2000,
    price: 850000
  };
  
  console.log('\nTest Property:', JSON.stringify(testProperty, null, 2));
  
  try {
    // Initialize scraper
    const scraper = new AirbnbScraper(
      process.env.APIFY_API_TOKEN,
      process.env.AIRBNB_SCRAPER_ACTOR_ID
    );
    
    console.log('\n🔍 Searching for Airbnb comparables...');
    const startTime = Date.now();
    
    // Execute search
    const results = await scraper.searchComparables(testProperty);
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`\n✅ Search completed in ${duration} seconds`);
    
    // Display results
    console.log('\n📊 Results Summary:');
    console.log(`- Total listings found: ${results.listings.length}`);
    console.log(`- Location searched: ${results.metadata.location}`);
    console.log(`- Actor run ID: ${results.metadata.runId}`);
    console.log(`- Run URL: ${results.metadata.actorRunUrl}`);
    
    if (results.listings.length > 0) {
      console.log('\n🏠 Sample Listings:');
      results.listings.slice(0, 3).forEach((listing, index) => {
        console.log(`\n${index + 1}. ${listing.title || 'Untitled'}`);
        console.log(`   - Price: $${listing.price}/night`);
        console.log(`   - Bedrooms: ${listing.bedrooms}`);
        console.log(`   - Property Type: ${listing.property_type}`);
        console.log(`   - Rating: ${listing.rating || 'N/A'}`);
        console.log(`   - URL: ${listing.url}`);
      });
    } else {
      console.log('\n⚠️  No listings found. This might be due to:');
      console.log('   - Location not having Airbnb listings');
      console.log('   - API rate limits');
      console.log('   - Incorrect actor configuration');
    }
    
    // Test STR calculations
    if (results.listings.length > 0) {
      console.log('\n💰 Testing STR Calculations...');
      const { calculateSTRMetrics } = require('../utils/str-calculations');
      
      const metrics = calculateSTRMetrics(results.listings, testProperty);
      console.log('\nCalculated Metrics:');
      console.log(`- Average Nightly Rate: $${metrics.avgNightlyRate}`);
      console.log(`- Median Nightly Rate: $${metrics.medianNightlyRate}`);
      console.log(`- Occupancy Rate: ${(metrics.occupancyRate * 100).toFixed(1)}%`);
      console.log(`- Monthly Revenue: $${metrics.monthlyRevenue}`);
      console.log(`- Annual Revenue: $${metrics.annualRevenue}`);
      console.log(`- Net Annual Revenue: $${metrics.netAnnualRevenue} (after costs)`);
      console.log(`- Confidence: ${metrics.confidence}`);
      console.log(`- Data Points: ${metrics.dataPoints}`);
    }
    
    console.log('\n✅ All tests completed successfully!');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error('\nFull error:', error);
    
    if (error.message.includes('401') || error.message.includes('403')) {
      console.log('\n⚠️  Authentication error. Please check your APIFY_API_TOKEN.');
    } else if (error.message.includes('404')) {
      console.log('\n⚠️  Actor not found. Please check AIRBNB_SCRAPER_ACTOR_ID.');
    }
    
    process.exit(1);
  }
}

// Run the test
testApifyIntegration().catch(console.error);