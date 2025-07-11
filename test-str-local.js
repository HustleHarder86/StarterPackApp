// Local test script for STR analysis
require('dotenv').config({ path: '.env.local' });

const { airbnbScraper } = require('./utils/airbnb-scraper.js');
const { analyzeSTRPotential } = require('./utils/calculators/str.js');

async function testSTRAnalysisLocal() {
  console.log('🧪 Testing STR Analysis Locally...\n');
  
  // Check environment variables
  console.log('Environment Check:');
  console.log('- AIRBNB_SCRAPER_API_KEY:', process.env.AIRBNB_SCRAPER_API_KEY ? 'SET ✅' : 'MISSING ❌');
  console.log('- AIRBNB_SCRAPER_API_URL:', process.env.AIRBNB_SCRAPER_API_URL || 'MISSING ❌');
  console.log('- FIREBASE_PROJECT_ID:', process.env.FIREBASE_PROJECT_ID ? 'SET ✅' : 'MISSING ❌');
  console.log('');
  
  // Test property data
  const testProperty = {
    address: {
      street: "123 Main Street",
      city: "Toronto",
      province: "Ontario",
      postalCode: "M5V 3A8"
    },
    price: 850000,
    propertyTaxes: 8500,
    bedrooms: 3,
    bathrooms: 2,
    sqft: 1800,
    propertyType: "Condo",
    listingPrice: 850000
  };
  
  console.log('Test Property:', JSON.stringify(testProperty, null, 2));
  console.log('\n🔍 Searching for Airbnb comparables (max 50 results to control costs)...');
  
  try {
    // Test Airbnb scraper
    const searchResults = await airbnbScraper.searchComparables(testProperty);
    
    console.log(`\n✅ Found ${searchResults.listings.length} listings`);
    console.log('Sample listings:');
    
    searchResults.listings.slice(0, 3).forEach((listing, i) => {
      console.log(`  ${i + 1}. ${listing.title} - $${listing.price}/night (${listing.bedrooms} bed)`);
    });
    
    // Test STR calculator
    console.log('\n📊 Running STR analysis...');
    const strAnalysis = analyzeSTRPotential(testProperty, searchResults.listings);
    
    console.log('\n🎯 STR Analysis Results:');
    console.log(`- Average Nightly Rate: $${strAnalysis.avgNightlyRate}`);
    console.log(`- Occupancy Rate: ${(strAnalysis.occupancyRate * 100).toFixed(0)}%`);
    console.log(`- Monthly Revenue: $${strAnalysis.monthlyRevenue.toLocaleString()}`);
    console.log(`- Annual Revenue: $${strAnalysis.annualRevenue.toLocaleString()}`);
    console.log(`- Net Monthly Income: $${strAnalysis.netMonthlyIncome.toLocaleString()}`);
    console.log(`- Confidence: ${strAnalysis.confidence.toUpperCase()}`);
    console.log(`- Comparables Used: ${strAnalysis.comparables.length}`);
    
    if (strAnalysis.comparison) {
      console.log('\n🔄 LTR vs STR Comparison:');
      console.log(`- Recommendation: ${strAnalysis.comparison.recommendation}`);
      console.log(`- Monthly Difference: $${strAnalysis.comparison.difference.monthly}`);
    }
    
    console.log('\n✅ Local STR test completed successfully!');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    
    if (error.message.includes('AIRBNB_SCRAPER_API_KEY')) {
      console.log('\n💡 Fix: Add your Apify API token to .env.local');
    } else if (error.message.includes('Firebase')) {
      console.log('\n💡 Fix: Add Firebase credentials to .env.local');
    }
  }
}

// Run the test
if (require.main === module) {
  testSTRAnalysisLocal();
}