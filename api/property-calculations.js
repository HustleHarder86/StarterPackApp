// Property calculation utilities for accurate expense estimation

// Property tax rates by major Canadian cities (2024 rates)
const PROPERTY_TAX_RATES = {
  // Ontario
  'toronto': 0.0061, // 0.61%
  'mississauga': 0.0085, // 0.85%
  'brampton': 0.0112, // 1.12%
  'ottawa': 0.0111, // 1.11%
  'hamilton': 0.0130, // 1.30%
  'london': 0.0138, // 1.38%
  'markham': 0.0074, // 0.74%
  'vaughan': 0.0078, // 0.78%
  'oakville': 0.0076, // 0.76%
  'burlington': 0.0085, // 0.85%
  
  // British Columbia
  'vancouver': 0.0025, // 0.25% (very low due to high property values)
  'burnaby': 0.0033, // 0.33%
  'richmond': 0.0034, // 0.34%
  'surrey': 0.0045, // 0.45%
  'victoria': 0.0050, // 0.50%
  
  // Alberta
  'calgary': 0.0064, // 0.64%
  'edmonton': 0.0087, // 0.87%
  
  // Quebec
  'montreal': 0.0076, // 0.76%
  'quebec': 0.0095, // 0.95%
  'laval': 0.0078, // 0.78%
  
  // Default rates by province
  'ontario_default': 0.0100, // 1.00%
  'bc_default': 0.0045, // 0.45%
  'alberta_default': 0.0075, // 0.75%
  'quebec_default': 0.0085, // 0.85%
  'default': 0.0090 // 0.90% Canadian average
};

// Insurance rates based on property value and location
function calculateInsurance(propertyValue, city, propertyType) {
  // Base rate: 0.35% of property value
  let baseRate = 0.0035;
  
  // Adjust for property type
  if (propertyType === 'Condo' || propertyType === 'Apartment') {
    baseRate = 0.0025; // Lower for condos (building insurance covers structure)
  } else if (propertyType === 'Townhouse') {
    baseRate = 0.0030;
  }
  
  // Adjust for high-risk areas
  const highRiskCities = ['vancouver', 'toronto', 'montreal'];
  if (highRiskCities.includes(city.toLowerCase())) {
    baseRate *= 1.2; // 20% higher in major cities
  }
  
  // Calculate annual insurance
  let annualInsurance = propertyValue * baseRate;
  
  // Apply min/max bounds
  if (propertyType === 'Condo') {
    annualInsurance = Math.max(600, Math.min(2000, annualInsurance));
  } else {
    annualInsurance = Math.max(1000, Math.min(5000, annualInsurance));
  }
  
  return Math.round(annualInsurance);
}

// Calculate maintenance based on property age, type, and size
function calculateMaintenance(propertyValue, propertyType, squareFeet, yearBuilt) {
  const currentYear = new Date().getFullYear();
  const propertyAge = yearBuilt ? currentYear - yearBuilt : 20; // Assume 20 years if unknown
  
  // Base maintenance rate
  let maintenanceRate = 0.01; // 1% of property value
  
  // Adjust for property type
  if (propertyType === 'Condo' || propertyType === 'Apartment') {
    maintenanceRate = 0.005; // 0.5% for condos (exterior maintenance covered by HOA)
  } else if (propertyType === 'Townhouse') {
    maintenanceRate = 0.008; // 0.8% for townhouses
  }
  
  // Adjust for age
  if (propertyAge > 30) {
    maintenanceRate *= 1.5; // 50% more for older properties
  } else if (propertyAge > 20) {
    maintenanceRate *= 1.25; // 25% more
  } else if (propertyAge < 5) {
    maintenanceRate *= 0.5; // 50% less for new properties
  }
  
  // Alternative calculation based on square footage
  const perSqFtMaintenance = squareFeet ? squareFeet * 1.5 : null; // $1.50 per sq ft annually
  
  // Use the lower of the two calculations
  const percentBasedMaintenance = propertyValue * maintenanceRate;
  const annualMaintenance = perSqFtMaintenance 
    ? Math.min(percentBasedMaintenance, perSqFtMaintenance)
    : percentBasedMaintenance;
  
  return Math.round(annualMaintenance);
}

// Get property tax rate for a city
function getPropertyTaxRate(city, province) {
  const cityLower = city.toLowerCase().replace(/[^a-z]/g, '');
  
  // Check for exact city match
  if (PROPERTY_TAX_RATES[cityLower]) {
    return PROPERTY_TAX_RATES[cityLower];
  }
  
  // Check for province default
  const provinceLower = province.toLowerCase();
  if (provinceLower.includes('ontario')) {
    return PROPERTY_TAX_RATES.ontario_default;
  } else if (provinceLower.includes('british columbia') || provinceLower.includes('bc')) {
    return PROPERTY_TAX_RATES.bc_default;
  } else if (provinceLower.includes('alberta')) {
    return PROPERTY_TAX_RATES.alberta_default;
  } else if (provinceLower.includes('quebec')) {
    return PROPERTY_TAX_RATES.quebec_default;
  }
  
  return PROPERTY_TAX_RATES.default;
}

// Calculate realistic HOA fees based on property type and amenities
function calculateHOAFees(propertyType, propertyValue, hasAmenities = false) {
  if (propertyType === 'Single Family' || propertyType === 'Detached') {
    return 0; // Most single-family homes don't have HOA
  }
  
  let monthlyHOA = 0;
  
  if (propertyType === 'Condo' || propertyType === 'Apartment') {
    // Base HOA fee: $0.40-0.60 per sq ft per month
    // For average 800 sq ft condo = $320-480/month
    // Use property value as proxy
    if (propertyValue < 400000) {
      monthlyHOA = 250; // Small/older condo
    } else if (propertyValue < 600000) {
      monthlyHOA = 400; // Average condo
    } else if (propertyValue < 1000000) {
      monthlyHOA = 600; // Newer/larger condo
    } else {
      monthlyHOA = 800; // Luxury condo
    }
    
    // Adjust for amenities
    if (hasAmenities) {
      monthlyHOA *= 1.3; // 30% more for buildings with gym, pool, concierge
    }
  } else if (propertyType === 'Townhouse') {
    // Townhouses typically have lower fees
    monthlyHOA = propertyValue < 600000 ? 150 : 250;
  }
  
  return Math.round(monthlyHOA);
}

// Rental rate estimation based on location and property type
export function estimateRentalRate(propertyValue, city, propertyType) {
  // Base rental yield rates by city (monthly rent as % of property value)
  const rentalYields = {
    // Ontario - generally 0.3-0.4% monthly
    'toronto': 0.0032,
    'mississauga': 0.0035,
    'brampton': 0.0038,
    'ottawa': 0.0036,
    'hamilton': 0.0040,
    'london': 0.0042,
    
    // BC - lower yields due to high property values
    'vancouver': 0.0028,
    'burnaby': 0.0030,
    'richmond': 0.0030,
    'surrey': 0.0035,
    
    // Alberta - higher yields
    'calgary': 0.0040,
    'edmonton': 0.0042,
    
    // Default
    'default': 0.0035
  };
  
  const cityLower = city.toLowerCase().replace(/[^a-z]/g, '');
  let yieldRate = rentalYields[cityLower] || rentalYields.default;
  
  // Adjust for property type
  if (propertyType === 'Condo' || propertyType === 'Apartment') {
    yieldRate *= 1.1; // Condos typically have higher rental yields
  } else if (propertyType === 'Townhouse') {
    yieldRate *= 1.05;
  }
  
  return Math.round(propertyValue * yieldRate);
}

// Main calculation function
export function calculateAccurateExpenses(propertyData) {
  const {
    propertyValue,
    city,
    province,
    propertyType,
    squareFeet,
    yearBuilt,
    hasAmenities
  } = propertyData;
  
  // Calculate property tax
  const taxRate = getPropertyTaxRate(city, province || 'Ontario');
  const propertyTaxAnnual = Math.round(propertyValue * taxRate);
  
  // Calculate insurance
  const insuranceAnnual = calculateInsurance(propertyValue, city, propertyType);
  
  // Calculate maintenance
  const maintenanceAnnual = calculateMaintenance(propertyValue, propertyType, squareFeet, yearBuilt);
  
  // Calculate HOA fees
  const hoaMonthly = calculateHOAFees(propertyType, propertyValue, hasAmenities);
  
  // Utilities (varies by property type)
  let utilitiesMonthly = 250; // Default
  if (propertyType === 'Condo' || propertyType === 'Apartment') {
    utilitiesMonthly = 150; // Lower for condos (often includes heat/water in fees)
  } else if (squareFeet) {
    // $0.10-0.15 per sq ft per month
    utilitiesMonthly = Math.round(squareFeet * 0.12);
    utilitiesMonthly = Math.max(150, Math.min(400, utilitiesMonthly));
  }
  
  return {
    property_tax_annual: propertyTaxAnnual,
    property_tax_rate: taxRate,
    insurance_annual: insuranceAnnual,
    maintenance_annual: maintenanceAnnual,
    hoa_monthly: hoaMonthly,
    utilities_monthly: utilitiesMonthly,
    
    // Calculated totals
    total_monthly_expenses: Math.round(
      propertyTaxAnnual / 12 +
      insuranceAnnual / 12 +
      maintenanceAnnual / 12 +
      hoaMonthly +
      utilitiesMonthly
    ),
    total_annual_expenses: Math.round(
      propertyTaxAnnual +
      insuranceAnnual +
      maintenanceAnnual +
      (hoaMonthly * 12) +
      (utilitiesMonthly * 12)
    )
  };
}

// Export individual functions for flexibility
export {
  getPropertyTaxRate,
  calculateInsurance,
  calculateMaintenance,
  calculateHOAFees,
  estimateRentalRate
};