const { chromium } = require('@playwright/test');

// Define 10 test personas
const personas = [
  {
    name: 'John Smith',
    company: 'Premier Realty Group',
    phone: '416-555-0100',
    email: 'john.smith@premierrealty.ca',
    notes: 'This property shows excellent potential for long-term investment.',
    sections: {
      executiveSummary: true,
      propertyDetails: true,
      financialAnalysis: true,
      longTermRental: true,
      shortTermRental: false,
      marketComparables: true,
      comparison: true,
      recommendations: true
    },
    format: 'detailed'
  },
  {
    name: 'Sarah Johnson',
    company: 'Toronto Investments Inc',
    phone: '647-555-0200',
    email: 'sarah@torontoinvest.com',
    notes: 'Given the regulatory restrictions, LTR is the optimal strategy.',
    sections: {
      executiveSummary: true,
      propertyDetails: true,
      financialAnalysis: true,
      longTermRental: true,
      shortTermRental: true,
      marketComparables: false,
      comparison: true,
      recommendations: true
    },
    format: 'summary'
  },
  {
    name: 'Michael Chen',
    company: 'Liberty Street Properties',
    phone: '905-555-0300',
    email: 'mchen@libertyproperties.ca',
    notes: 'Premium location with strong rental demand in the area.',
    sections: {
      executiveSummary: true,
      propertyDetails: false,
      financialAnalysis: true,
      longTermRental: true,
      shortTermRental: false,
      marketComparables: true,
      comparison: false,
      recommendations: true
    },
    format: 'detailed'
  },
  {
    name: 'Emily Davis',
    company: 'StarterPack Realty',
    phone: '416-555-0400',
    email: 'emily@starterpack.com',
    notes: '',
    sections: {
      executiveSummary: true,
      propertyDetails: true,
      financialAnalysis: true,
      longTermRental: true,
      shortTermRental: true,
      marketComparables: true,
      comparison: true,
      recommendations: true
    },
    format: 'detailed'
  },
  {
    name: 'Robert Wilson',
    company: '',
    phone: '',
    email: 'rwilson@gmail.com',
    notes: 'Cash flow positive from day one with minimal management required.',
    sections: {
      executiveSummary: true,
      propertyDetails: true,
      financialAnalysis: true,
      longTermRental: true,
      shortTermRental: false,
      marketComparables: false,
      comparison: false,
      recommendations: true
    },
    format: 'summary'
  },
  {
    name: 'Lisa Martinez',
    company: 'Martinez & Associates',
    phone: '647-555-0500',
    email: 'lisa@martinezassoc.ca',
    notes: 'Property appreciation expected at 3.2% annually based on market trends.',
    sections: {
      executiveSummary: false,
      propertyDetails: true,
      financialAnalysis: true,
      longTermRental: true,
      shortTermRental: false,
      marketComparables: true,
      comparison: true,
      recommendations: false
    },
    format: 'detailed'
  },
  {
    name: 'David Thompson',
    company: 'Thompson Real Estate',
    phone: '905-555-0600',
    email: '',
    notes: 'Recommend immediate action as similar properties are selling quickly.',
    sections: {
      executiveSummary: true,
      propertyDetails: true,
      financialAnalysis: false,
      longTermRental: true,
      shortTermRental: true,
      marketComparables: true,
      comparison: true,
      recommendations: true
    },
    format: 'summary'
  },
  {
    name: 'Jennifer Brown',
    company: 'Brown Investment Group',
    phone: '416-555-0700',
    email: 'jbrown@bigroup.ca',
    notes: 'Strong investment opportunity with 11.7% annual ROI.',
    sections: {
      executiveSummary: true,
      propertyDetails: true,
      financialAnalysis: true,
      longTermRental: true,
      shortTermRental: true,
      marketComparables: true,
      comparison: true,
      recommendations: true
    },
    format: 'detailed'
  },
  {
    name: 'Kevin Lee',
    company: '',
    phone: '647-555-0800',
    email: '',
    notes: '',
    sections: {
      executiveSummary: true,
      propertyDetails: false,
      financialAnalysis: true,
      longTermRental: true,
      shortTermRental: false,
      marketComparables: false,
      comparison: true,
      recommendations: true
    },
    format: 'summary'
  },
  {
    name: 'Amanda White',
    company: 'White & Partners Realty',
    phone: '905-555-0900',
    email: 'amanda@whitepartners.ca',
    notes: 'Building amenities include gym, concierge, and rooftop terrace. Premium positioning recommended.',
    sections: {
      executiveSummary: true,
      propertyDetails: true,
      financialAnalysis: true,
      longTermRental: true,
      shortTermRental: false,
      marketComparables: true,
      comparison: false,
      recommendations: true
    },
    format: 'detailed'
  }
];

async function testPDFGeneration(mockupFile, personaIndex) {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  const persona = personas[personaIndex];
  
  try {
    // Navigate to the mockup
    await page.goto(`http://localhost:8080/mockups/mockup-iterations/${mockupFile}`);
    await page.waitForLoadState('networkidle');
    
    // Click Generate PDF button
    await page.click('button:has-text("Generate PDF Report")');
    await page.waitForTimeout(500);
    
    // Fill in realtor information
    if (persona.name) {
      await page.fill('input[placeholder="Your Name"]', persona.name);
    }
    if (persona.company) {
      await page.fill('input[placeholder="Company Name"]', persona.company);
    }
    if (persona.phone) {
      await page.fill('input[placeholder="Phone Number"]', persona.phone);
    }
    if (persona.email) {
      await page.fill('input[placeholder="Email Address"]', persona.email);
    }
    
    // Set report format
    if (persona.format === 'summary') {
      await page.click('input[value="summary"]');
    }
    
    // Configure sections
    const sectionMap = {
      executiveSummary: 'Executive Summary',
      propertyDetails: 'Property Details',
      financialAnalysis: 'Financial Analysis',
      longTermRental: 'Long-term Rental',
      shortTermRental: 'Short-term Rental',
      marketComparables: 'Market Comparables',
      comparison: 'STR vs LTR Comparison',
      recommendations: 'Investment Recommendations'
    };
    
    for (const [key, label] of Object.entries(sectionMap)) {
      const checkbox = page.locator(`input[type="checkbox"]`).filter({ hasText: label });
      const isChecked = await checkbox.isChecked();
      const shouldBeChecked = persona.sections[key];
      
      if (isChecked !== shouldBeChecked) {
        await checkbox.click();
      }
    }
    
    // Add custom notes
    if (persona.notes) {
      await page.fill('textarea[placeholder*="notes"]', persona.notes);
    }
    
    // Generate PDF
    await page.click('button:has-text("Generate PDF Report"):not(:has-text("📄"))');
    
    // Wait for success message
    await page.waitForSelector('text=PDF Generated Successfully', { timeout: 10000 });
    
    // Take screenshot
    await page.screenshot({
      path: `tests/e2e/screenshots/pdf-test-${mockupFile}-persona-${personaIndex + 1}.png`
    });
    
    console.log(`✅ Test passed for ${mockupFile} - Persona ${personaIndex + 1}: ${persona.name}`);
    
    return { success: true, persona: persona.name, mockup: mockupFile };
    
  } catch (error) {
    console.error(`❌ Test failed for ${mockupFile} - Persona ${personaIndex + 1}: ${error.message}`);
    return { success: false, persona: persona.name, mockup: mockupFile, error: error.message };
  } finally {
    await browser.close();
  }
}

async function runAllTests() {
  console.log('🚀 Starting comprehensive PDF generation tests with 10 personas...\n');
  
  const results = [];
  const mockups = ['base-mockup.html', 'base-mockup2.html'];
  
  for (let i = 0; i < personas.length; i++) {
    for (const mockup of mockups) {
      console.log(`Testing ${mockup} with Persona ${i + 1} (${personas[i].name})...`);
      const result = await testPDFGeneration(mockup, i);
      results.push(result);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Small delay between tests
    }
  }
  
  // Print summary
  console.log('\n📊 Test Summary:');
  console.log('================');
  
  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  
  console.log(`✅ Successful: ${successful}/${results.length}`);
  console.log(`❌ Failed: ${failed}/${results.length}`);
  
  if (failed > 0) {
    console.log('\nFailed tests:');
    results.filter(r => !r.success).forEach(r => {
      console.log(`  - ${r.mockup} / ${r.persona}: ${r.error}`);
    });
  }
  
  // Save results to JSON
  const fs = require('fs');
  fs.writeFileSync('tests/e2e/pdf-test-results.json', JSON.stringify({
    timestamp: new Date().toISOString(),
    totalTests: results.length,
    successful,
    failed,
    results
  }, null, 2));
  
  console.log('\n📄 Results saved to tests/e2e/pdf-test-results.json');
}

// Run tests if this file is executed directly
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = { testPDFGeneration, runAllTests, personas };