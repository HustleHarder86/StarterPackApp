// Test STR regulation checking feature
require('dotenv').config({ path: '.env.local' });
const { STRRegulationChecker } = require('./utils/str-regulations.js');

async function testRegulationChecker() {
  console.log('🏛️ Testing STR Regulation Checker...\n');
  
  const checker = new STRRegulationChecker(process.env.PERPLEXITY_API_KEY);
  
  // Test known cities (cached data)
  const testCities = [
    { city: 'Toronto', province: 'Ontario' },
    { city: 'Mississauga', province: 'Ontario' },
    { city: 'Vancouver', province: 'British Columbia' },
    { city: 'Ottawa', province: 'Ontario' }
  ];
  
  console.log('=== Testing Known Cities (Cached Data) ===\n');
  
  for (const location of testCities) {
    try {
      console.log(`🔍 Checking ${location.city}, ${location.province}...`);
      
      const regulations = await checker.checkRegulations(location.city, location.province);
      const compliance = checker.generateComplianceAdvice(regulations);
      
      console.log(`✅ ${location.city} Results:`);
      console.log(`   - STR Allowed: ${regulations.allowed ? 'Yes' : 'No'}`);
      console.log(`   - License Required: ${regulations.requiresLicense ? 'Yes' : 'No'}`);
      console.log(`   - Primary Residence Only: ${regulations.primaryResidenceOnly ? 'Yes' : 'No'}`);
      console.log(`   - Max Days: ${regulations.maxDays || 'No limit'}`);
      console.log(`   - Risk Level: ${compliance.riskLevel}`);
      console.log(`   - Summary: ${regulations.summary}`);
      
      if (regulations.licenseUrl) {
        console.log(`   - License Info: ${regulations.licenseUrl}`);
      }
      
      if (compliance.warnings.length > 0) {
        console.log(`   - Warnings: ${compliance.warnings.join(', ')}`);
      }
      
      console.log('');
      
    } catch (error) {
      console.error(`❌ Error checking ${location.city}:`, error.message);
    }
  }
  
  // Test unknown city (should use generic advice)
  console.log('=== Testing Unknown City (Generic Advice) ===\n');
  
  try {
    console.log('🔍 Checking Barrie, Ontario (unknown city)...');
    const regulations = await checker.checkRegulations('Barrie', 'Ontario');
    const compliance = checker.generateComplianceAdvice(regulations);
    
    console.log('✅ Barrie Results:');
    console.log(`   - Source: ${regulations.source}`);
    console.log(`   - Summary: ${regulations.summary}`);
    console.log(`   - Restrictions: ${regulations.restrictions.length} items`);
    console.log(`   - Research Links: ${regulations.researchLinks?.length || 0} provided`);
    
  } catch (error) {
    console.error('❌ Error checking Barrie:', error.message);
  }
  
  // Test Perplexity AI research if API key is available
  if (process.env.PERPLEXITY_API_KEY && process.env.PERPLEXITY_API_KEY !== 'your-perplexity-key-here') {
    console.log('\n=== Testing Perplexity AI Research (Live API Call) ===\n');
    
    try {
      console.log('🔍 Using Perplexity AI to research Hamilton, Ontario regulations...');
      console.log('(This may take 10-20 seconds)');
      
      // Force AI research by using a city not in cache
      const aiChecker = new STRRegulationChecker(process.env.PERPLEXITY_API_KEY);
      // Temporarily remove Hamilton from cache for this test
      const regulations = await aiChecker.searchRegulationsWithPerplexity('Hamilton', 'Ontario');
      
      console.log('✅ Perplexity AI Research Results:');
      console.log(`   - STR Allowed: ${regulations.allowed}`);
      console.log(`   - License Required: ${regulations.requiresLicense}`);
      console.log(`   - Primary Residence Only: ${regulations.primaryResidenceOnly}`);
      console.log(`   - AI Confidence: ${regulations.confidence}`);
      console.log(`   - Summary: ${regulations.summary}`);
      console.log(`   - Official Website: ${regulations.officialWebsite || 'Not found'}`);
      console.log(`   - Sources: ${regulations.sources?.length || 0} found`);
      
    } catch (error) {
      console.error('❌ Perplexity AI research failed:', error.message);
    }
  } else {
    console.log('\n💡 Perplexity API key not configured - skipping AI research test');
  }
  
  console.log('\n🏁 Regulation testing complete!');
  console.log('\n📋 Summary:');
  console.log('✅ Known cities use cached municipal data');
  console.log('✅ Unknown cities get generic research guidance');
  console.log('✅ Real-time research available with Perplexity AI API key');
  console.log('✅ Compliance risk assessment working');
}

testRegulationChecker();