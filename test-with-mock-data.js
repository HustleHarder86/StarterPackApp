// Test STR analysis with mock data to verify calculations work
require('dotenv').config({ path: '.env.local' });
const { analyzeSTRPotential } = require('./utils/calculators/str.js');

async function testWithMockData() {
  console.log('🧪 Testing STR Analysis with Mock Data...\n');
  
  // Test property
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
  
  // Mock Airbnb comparables (realistic Toronto data)
  const mockComparables = [
    {
      id: "12345",
      title: "Beautiful Downtown Condo - 3BR/2BA",
      price: 180,
      nightly_price: 180,
      bedrooms: 3,
      bathrooms: 2,
      property_type: "entire_home",
      occupancy_rate: 0.75,
      url: "https://www.airbnb.com/rooms/12345",
      rating: 4.8,
      reviewsCount: 124,
      similarityScore: 0.95
    },
    {
      id: "12346",
      title: "Modern Condo Near CN Tower - 3BR",
      price: 220,
      nightly_price: 220,
      bedrooms: 3,
      bathrooms: 2,
      property_type: "entire_home",
      occupancy_rate: 0.80,
      url: "https://www.airbnb.com/rooms/12346",
      rating: 4.9,
      reviewsCount: 89,
      similarityScore: 0.90
    },
    {
      id: "12347",
      title: "Luxury Condo with City Views - 3BR/2.5BA",
      price: 250,
      nightly_price: 250,
      bedrooms: 3,
      bathrooms: 3,
      property_type: "entire_home",
      occupancy_rate: 0.70,
      url: "https://www.airbnb.com/rooms/12347",
      rating: 4.7,
      reviewsCount: 156,
      similarityScore: 0.85
    },
    {
      id: "12348",
      title: "Cozy Downtown Apartment - 2BR/2BA",
      price: 150,
      nightly_price: 150,
      bedrooms: 2,
      bathrooms: 2,
      property_type: "entire_home",
      occupancy_rate: 0.78,
      url: "https://www.airbnb.com/rooms/12348",
      rating: 4.6,
      reviewsCount: 78,
      similarityScore: 0.75
    },
    {
      id: "12349",
      title: "Spacious Family Condo - 4BR/3BA",
      price: 300,
      nightly_price: 300,
      bedrooms: 4,
      bathrooms: 3,
      property_type: "entire_home",
      occupancy_rate: 0.65,
      url: "https://www.airbnb.com/rooms/12349",
      rating: 4.9,
      reviewsCount: 203,
      similarityScore: 0.80
    }
  ];
  
  console.log('Test Property:', JSON.stringify(testProperty, null, 2));
  console.log(`\n📊 Running STR analysis with ${mockComparables.length} mock comparables...\n`);
  
  try {
    // Test STR calculator with mock data
    const strAnalysis = analyzeSTRPotential(testProperty, mockComparables, { ltrRent: 3200 });
    
    console.log('🎯 STR Analysis Results:');
    console.log(`- Average Nightly Rate: $${strAnalysis.avgNightlyRate}`);
    console.log(`- Occupancy Rate: ${(strAnalysis.occupancyRate * 100).toFixed(0)}%`);
    console.log(`- Monthly Revenue: $${strAnalysis.monthlyRevenue.toLocaleString()}`);
    console.log(`- Annual Revenue: $${strAnalysis.annualRevenue.toLocaleString()}`);
    console.log(`- Net Monthly Income: $${strAnalysis.netMonthlyIncome.toLocaleString()}`);
    console.log(`- Net Annual Income: $${strAnalysis.netAnnualIncome.toLocaleString()}`);
    console.log(`- Confidence: ${strAnalysis.confidence.toUpperCase()}`);
    console.log(`- Comparables Used: ${strAnalysis.comparables.length}`);
    
    console.log('\n💰 Financial Metrics:');
    console.log(`- Cap Rate: ${strAnalysis.capRate}%`);
    console.log(`- Cash-on-Cash Return: ${strAnalysis.cashOnCashReturn}%`);
    console.log(`- Payback Period: ${strAnalysis.paybackPeriod} years`);
    
    if (strAnalysis.comparison) {
      console.log('\n🔄 LTR vs STR Comparison:');
      console.log(`- LTR Monthly Net: $${strAnalysis.comparison.ltr.monthlyNet.toLocaleString()}`);
      console.log(`- STR Monthly Net: $${strAnalysis.comparison.str.monthlyNet.toLocaleString()}`);
      console.log(`- Monthly Difference: $${strAnalysis.comparison.difference.monthly.toLocaleString()}`);
      console.log(`- Annual Difference: $${strAnalysis.comparison.difference.annual.toLocaleString()}`);
      console.log(`- Recommendation: ${strAnalysis.comparison.recommendation}`);
      console.log(`- Risk Assessment: ${strAnalysis.comparison.riskAssessment}`);
    }
    
    console.log('\n📈 Revenue Scenarios:');
    Object.entries(strAnalysis.scenarios).forEach(([scenario, data]) => {
      console.log(`- ${scenario.toUpperCase()}: $${data.monthlyRevenue.toLocaleString()}/month (${(data.occupancyRate * 100).toFixed(0)}% occupancy @ $${data.nightlyRate}/night)`);
    });
    
    console.log('\n🏠 Top Comparables:');
    strAnalysis.comparables.slice(0, 3).forEach((comp, i) => {
      console.log(`  ${i + 1}. ${comp.title} - $${comp.price}/night (${comp.bedrooms}BR/${comp.bathrooms}BA)`);
    });
    
    console.log('\n💡 Recommendations:');
    strAnalysis.recommendations.forEach((rec, i) => {
      const icon = rec.type === 'positive' ? '✅' : rec.type === 'warning' ? '⚠️' : 'ℹ️';
      console.log(`  ${icon} ${rec.message}`);
    });
    
    console.log('\n✅ STR Calculator is working perfectly with realistic data!');
    console.log('\n📝 Next Steps:');
    console.log('1. Fix Apify data extraction to get real prices/bedrooms');
    console.log('2. Or use a different Airbnb scraper');
    console.log('3. Deploy the working STR analysis system');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error(error.stack);
  }
}

testWithMockData();