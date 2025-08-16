// Firebase Test Factory - Creates test users and data
const { v4: uuidv4 } = require('uuid');

class FirebaseTestFactory {
  constructor() {
    this.testRunId = `test-run-${Date.now()}-${uuidv4().substring(0, 8)}`;
    this.createdUsers = [];
    this.createdProperties = [];
    this.createdAnalyses = [];
    this.createdReports = [];
  }

  // Generate unique test email
  generateTestEmail(persona) {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `test-${persona}-${timestamp}-${random}@e2e.com`;
  }

  // Create test user with specific subscription tier
  async createTestUser(persona, tier = 'trial') {
    const email = this.generateTestEmail(persona);
    const userId = `test-user-${persona}-${Date.now()}`;
    
    const userData = {
      id: userId,
      email: email,
      displayName: `Test ${persona.charAt(0).toUpperCase() + persona.slice(1)}`,
      subscriptionTier: tier,
      subscriptionStatus: tier === 'trial' ? 'trial' : 'active',
      strTrialUsed: 0,
      monthlyAnalysisCount: 0,
      isTester: true, // Mark as tester for unlimited access
      testRunId: this.testRunId,
      createdAt: new Date().toISOString(),
      
      // Add realtor profile for some personas
      realtorProfile: this.generateRealtorProfile(persona)
    };

    // Note: In actual implementation, this would use Firebase Admin SDK
    // For now, we'll simulate the creation
    console.log(`Created test user: ${email} (${tier} tier)`);
    
    this.createdUsers.push(userData);
    return userData;
  }

  // Generate realtor profile based on persona
  generateRealtorProfile(persona) {
    const profiles = {
      professional: {
        name: 'John Professional',
        company: 'Elite Realty Group',
        phone: '(555) 100-2000',
        email: 'john@eliterealty.com',
        licenseNumber: 'DRE#12345678',
        address: '123 Business Blvd, Suite 100, Toronto, ON M5V 3A8',
        website: 'https://www.eliterealty.com',
        bio: '15+ years of experience in luxury real estate investment'
      },
      beginner: {
        name: 'Sarah Starter',
        company: 'New Horizons Realty',
        phone: '(555) 200-3000',
        email: 'sarah@newhorizons.com',
        licenseNumber: 'DRE#98765432',
        bio: 'Passionate about helping first-time investors'
      },
      premium: {
        name: 'Michael Premium',
        company: 'Platinum Properties International',
        phone: '(555) 300-4000',
        email: 'michael@platinumprops.com',
        licenseNumber: 'DRE#11223344',
        address: '456 Luxury Lane, Penthouse, Toronto, ON M5V 1A1',
        website: 'https://www.platinumprops.com',
        bio: 'Specializing in high-value investment properties and international clients'
      },
      mobile: {
        name: 'Mobile Mike',
        company: 'On-The-Go Realty',
        phone: '(555) 400-5000',
        email: 'mike@onthego.com',
        bio: 'Always available, always connected'
      },
      default: null
    };

    return profiles[persona] || profiles.default;
  }

  // Create test property data
  createTestProperty(scenario = 'standard') {
    const properties = {
      standard: {
        address: '123 Test Street, Toronto, ON M5V 3A8',
        price: 750000,
        bedrooms: 2,
        bathrooms: 2,
        sqft: 850,
        propertyType: 'Condo',
        propertyTax: 4500,
        hoaFees: 650,
        yearBuilt: 2018,
        lotSize: 'N/A'
      },
      luxury: {
        address: '456 Luxury Lane, Toronto, ON M5V 1A1',
        price: 2500000,
        bedrooms: 5,
        bathrooms: 4,
        sqft: 3500,
        propertyType: 'Detached',
        propertyTax: 18000,
        hoaFees: 0,
        yearBuilt: 2020,
        lotSize: '8000 sq ft'
      },
      investment: {
        address: '789 Rental Road, Toronto, ON M6K 2B5',
        price: 450000,
        bedrooms: 1,
        bathrooms: 1,
        sqft: 600,
        propertyType: 'Condo',
        propertyTax: 3200,
        hoaFees: 450,
        yearBuilt: 2015,
        lotSize: 'N/A'
      },
      fixer: {
        address: '321 Renovation Ave, Toronto, ON M4E 1C3',
        price: 550000,
        bedrooms: 3,
        bathrooms: 2,
        sqft: 1200,
        propertyType: 'Semi-Detached',
        propertyTax: 5500,
        hoaFees: 0,
        yearBuilt: 1965,
        lotSize: '3500 sq ft',
        needsRepairs: true
      },
      str: {
        address: '555 Airbnb Blvd, Toronto, ON M5J 2N8',
        price: 850000,
        bedrooms: 2,
        bathrooms: 2,
        sqft: 950,
        propertyType: 'Condo',
        propertyTax: 6000,
        hoaFees: 700,
        yearBuilt: 2019,
        lotSize: 'N/A',
        nearTouristArea: true
      }
    };

    const property = properties[scenario] || properties.standard;
    property.id = `property-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    property.testRunId = this.testRunId;
    property.createdAt = new Date().toISOString();
    
    this.createdProperties.push(property);
    return property;
  }

  // Create test analysis data
  createTestAnalysis(propertyData, includeSTR = false) {
    const analysis = {
      id: `analysis-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
      propertyId: propertyData.id,
      propertyAddress: propertyData.address,
      testRunId: this.testRunId,
      createdAt: new Date().toISOString(),
      status: 'completed',
      
      propertyDetails: propertyData,
      
      costs: {
        purchasePrice: propertyData.price,
        downPayment: propertyData.price * 0.2,
        closingCosts: propertyData.price * 0.015,
        initialRepairs: propertyData.needsRepairs ? 25000 : 5000,
        totalCashRequired: (propertyData.price * 0.2) + (propertyData.price * 0.015) + (propertyData.needsRepairs ? 25000 : 5000)
      },
      
      longTermRental: this.generateLTRAnalysis(propertyData),
      
      strAnalysis: includeSTR ? this.generateSTRAnalysis(propertyData) : null,
      
      comparables: this.generateComparables(propertyData),
      
      insights: [
        { type: 'positive', text: 'Strong rental demand in this area' },
        { type: 'neutral', text: 'Property tax rates are average for the neighborhood' }
      ]
    };
    
    this.createdAnalyses.push(analysis);
    return analysis;
  }

  // Generate LTR analysis
  generateLTRAnalysis(property) {
    const monthlyRent = property.price * 0.004; // 0.4% of purchase price
    const mortgagePayment = (property.price * 0.8) * 0.005; // Rough mortgage calc
    const propertyTax = property.propertyTax / 12;
    const insurance = property.price * 0.003 / 12;
    const maintenance = monthlyRent * 0.1;
    const propertyManagement = monthlyRent * 0.08;
    const utilities = property.propertyType === 'Condo' ? 0 : 150;
    const hoaFees = property.hoaFees || 0;
    
    const totalExpenses = mortgagePayment + propertyTax + insurance + maintenance + propertyManagement + utilities + hoaFees;
    const vacancyRate = 0.05;
    const effectiveIncome = monthlyRent * (1 - vacancyRate);
    const monthlyCashFlow = effectiveIncome - totalExpenses;
    
    return {
      monthlyRent: monthlyRent,
      vacancyRate: vacancyRate,
      effectiveIncome: effectiveIncome,
      mortgagePayment: mortgagePayment,
      propertyTax: propertyTax,
      insurance: insurance,
      maintenance: maintenance,
      propertyManagement: propertyManagement,
      utilities: utilities,
      hoaFees: hoaFees,
      totalExpenses: totalExpenses,
      monthlyCashFlow: monthlyCashFlow,
      annualCashFlow: monthlyCashFlow * 12,
      cashOnCashReturn: (monthlyCashFlow * 12) / (property.price * 0.2) * 100,
      capRate: (effectiveIncome * 12 - (totalExpenses - mortgagePayment) * 12) / property.price * 100,
      annualROI: (monthlyCashFlow * 12) / (property.price * 0.2) * 100,
      breakEvenMonths: monthlyCashFlow > 0 ? Math.ceil((property.price * 0.2) / monthlyCashFlow) : null
    };
  }

  // Generate STR analysis
  generateSTRAnalysis(property) {
    const baseRate = property.nearTouristArea ? 200 : 150;
    const averageDailyRate = baseRate + (property.bedrooms * 25);
    const occupancyRate = property.nearTouristArea ? 0.75 : 0.65;
    const monthlyRevenue = averageDailyRate * 30 * occupancyRate;
    
    const cleaningFees = 300 * (30 * occupancyRate / 3); // Cleaning every 3 days
    const supplies = 200;
    const platformFees = monthlyRevenue * 0.03;
    const additionalInsurance = 150;
    const utilities = 250; // Higher for STR
    
    const baseExpenses = this.generateLTRAnalysis(property).totalExpenses;
    const strExpenses = baseExpenses + cleaningFees + supplies + platformFees + additionalInsurance + utilities;
    
    return {
      averageDailyRate: averageDailyRate,
      occupancyRate: occupancyRate,
      monthlyRevenue: monthlyRevenue,
      annualRevenue: monthlyRevenue * 12,
      cleaningFees: cleaningFees,
      supplies: supplies,
      platformFees: platformFees,
      additionalInsurance: additionalInsurance,
      totalExpenses: strExpenses,
      monthlyCashFlow: monthlyRevenue - strExpenses,
      annualCashFlow: (monthlyRevenue - strExpenses) * 12,
      annualROI: ((monthlyRevenue - strExpenses) * 12) / (property.price * 0.2) * 100
    };
  }

  // Generate comparable properties
  generateComparables(property) {
    const comparables = [];
    for (let i = 0; i < 5; i++) {
      const priceVariation = (Math.random() - 0.5) * 0.2; // ±10% variation
      const sqftVariation = (Math.random() - 0.5) * 0.3; // ±15% variation
      
      comparables.push({
        address: `${100 + i * 10} Comparable Street, Toronto, ON`,
        price: Math.round(property.price * (1 + priceVariation)),
        bedrooms: property.bedrooms + Math.floor(Math.random() * 2 - 1),
        bathrooms: property.bathrooms,
        sqft: Math.round(property.sqft * (1 + sqftVariation)),
        pricePerSqft: Math.round((property.price * (1 + priceVariation)) / (property.sqft * (1 + sqftVariation)))
      });
    }
    return comparables;
  }

  // Clean up test data
  async cleanup() {
    console.log(`Cleaning up test run: ${this.testRunId}`);
    console.log(`- Users created: ${this.createdUsers.length}`);
    console.log(`- Properties created: ${this.createdProperties.length}`);
    console.log(`- Analyses created: ${this.createdAnalyses.length}`);
    console.log(`- Reports created: ${this.createdReports.length}`);
    
    // In production, this would delete all test data from Firebase
    // For now, we'll just log the cleanup
    return {
      testRunId: this.testRunId,
      cleaned: {
        users: this.createdUsers.length,
        properties: this.createdProperties.length,
        analyses: this.createdAnalyses.length,
        reports: this.createdReports.length
      }
    };
  }

  // Get summary of all test data
  getSummary() {
    return {
      testRunId: this.testRunId,
      created: {
        users: this.createdUsers,
        properties: this.createdProperties,
        analyses: this.createdAnalyses,
        reports: this.createdReports
      },
      totals: {
        users: this.createdUsers.length,
        properties: this.createdProperties.length,
        analyses: this.createdAnalyses.length,
        reports: this.createdReports.length
      }
    };
  }
}

module.exports = FirebaseTestFactory;