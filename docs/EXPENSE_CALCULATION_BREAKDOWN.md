# Financial Calculator - Expense Calculation Breakdown

## Current Issues Identified

1. **Property Taxes**: Not using actual data from Realtor.ca extension
2. **HOA/Condo Fees**: Not properly pulling from extension data
3. **STR-specific expenses**: Using generic percentages instead of market data
4. **Insurance**: Using generic calculations instead of property-specific data

## Expense Breakdown & Data Sources

### 1. Property Tax
**Current Issue**: Calculator shows default value of $708/month instead of actual tax from listing

**Correct Data Flow**:
```javascript
// FROM: Browser Extension (propertyData.propertyTaxes)
// Example: Extension provides $2,068/year from Realtor.ca
// TO: Analysis API
propertyTaxAnnual = propertyData.propertyTaxes || calculated_fallback

// TO: Financial Calculator
propertyTaxMonthly = Math.round(propertyTaxAnnual / 12)
```

**Data Source Priority**:
1. **Actual listing data** (propertyData.propertyTaxes) - ALWAYS use if available
2. **Comparable properties** from Perplexity search
3. **Municipal tax rate calculation** (property value × tax rate)

### 2. Insurance
**Current**: Fixed at $250/month (generic)

**Correct Calculation**:
```javascript
// Base calculation: 0.3-0.5% of property value annually
baseInsurance = propertyValue * 0.004 // 0.4% average

// STR adjustment: Additional 20-30% for short-term rental
strInsurance = baseInsurance * 1.25

// Monthly amount
insuranceMonthly = Math.round(strInsurance / 12)
```

**Data Sources**:
- Property value from listing or AI estimate
- STR insurance rates from market research
- Local insurance provider averages

### 3. HOA/Condo Fees
**Current Issue**: Shows $450 default instead of actual from listing

**Correct Data Flow**:
```javascript
// FROM: Browser Extension (propertyData.condoFees)
// Example: Extension provides $419/month
hoaMonthly = propertyData.condoFees || 0 // Use 0 for houses

// Only estimate if property is condo but no data provided
if (propertyType === 'Condo' && !propertyData.condoFees) {
  hoaMonthly = estimateCondoFees(propertyValue, location)
}
```

### 4. Property Management
**Current**: 10% of revenue (standard)

**Enhanced Calculation**:
```javascript
// Base rate varies by service level
const mgmtRates = {
  'self-managed': 0,
  'basic': 0.10,      // Key management only
  'full-service': 0.20 // Full property management
};

propertyMgmt = strRevenue * selectedRate
```

### 5. Utilities
**Current**: Fixed $200/month

**Market-Based Calculation**:
```javascript
// Base utilities (owner-occupied)
baseUtilities = {
  'Studio/1BR': 150,
  '2BR': 200,
  '3BR': 250,
  '4BR+': 300
};

// STR adjustment (higher usage)
strUtilities = baseUtilities[propertySize] * 1.4
```

### 6. Cleaning & Turnover
**Current**: Fixed $400/month

**Data-Driven Calculation**:
```javascript
// From Airbnb market data
avgCleaningFee = comparables.map(c => c.cleaning_fee).average()
avgOccupancy = comparables.map(c => c.occupancy_rate).average()
turnoversPerMonth = 30 * avgOccupancy / avgStayLength

cleaningMonthly = avgCleaningFee * turnoversPerMonth
```

**Data Sources**:
- Actual cleaning fees from Airbnb comparables
- Local cleaning service rates
- Average length of stay data

### 7. Maintenance & Repairs
**Current**: $300/month (generic)

**Property-Based Calculation**:
```javascript
// Base: 1% of property value annually
baseMaintenance = propertyValue * 0.01 / 12

// STR adjustment: 50% higher wear
strMaintenance = baseMaintenance * 1.5

// Age adjustment
if (yearBuilt < 2000) strMaintenance *= 1.3
if (yearBuilt < 1980) strMaintenance *= 1.5
```

### 8. Supplies & Amenities
**Current**: $150/month

**Revenue-Based Calculation**:
```javascript
// 3-5% of revenue for consumables
supplies = strRevenue * 0.04

// Minimum threshold
suppliesMonthly = Math.max(supplies, 100)
```

### 9. Platform Fees
**Current**: 3% of revenue

**Accurate Breakdown**:
```javascript
// Airbnb host fee: 3%
// VRBO fee: 5% (if applicable)
// Payment processing: 2.9% + $0.30

platformFees = strRevenue * 0.03 // Airbnb only
// OR
platformFees = strRevenue * 0.08 // Multiple platforms
```

### 10. Other Expenses
**Categories to Include**:
- Internet/Cable: $100-150/month
- Professional photography: $50/month amortized
- Guest insurance: $50/month
- Licensing/permits: Varies by city

## Implementation Requirements

### 1. Update EnhancedFinancialSummary.js
```javascript
const expenses = {
  propertyTax: Math.round((analysis.costs?.property_tax_annual || propertyData?.propertyTaxes || 8496) / 12),
  insurance: calculateSTRInsurance(propertyPrice, propertyType),
  hoaFees: propertyData?.condoFees || analysis.costs?.hoa_monthly || 0,
  propertyMgmt: Math.round(strRevenue * 0.10),
  utilities: calculateSTRUtilities(bedrooms, location),
  cleaning: calculateCleaningCosts(comparables, occupancyRate),
  maintenance: calculateMaintenance(propertyPrice, yearBuilt),
  supplies: Math.round(strRevenue * 0.04),
  platformFees: Math.round(strRevenue * 0.03),
  otherExpenses: calculateOtherExpenses(location)
};
```

### 2. Data Source Indicators
Each expense should show its source:
- 🏠 **Actual** - From property listing
- 📊 **Market** - From Airbnb comparables
- 🤖 **AI Estimate** - From Perplexity research
- 📐 **Calculated** - Formula-based
- 👤 **User Input** - Manually adjusted

### 3. Validation Rules
- Property tax: Should be 0.5-2% of property value annually
- Insurance: Should be 0.3-0.6% of property value annually
- Total expenses: Should be 40-60% of STR revenue
- Cleaning: Should align with local service rates ($75-150 per turnover)

## Testing Checklist

1. ✅ Property tax pulls from extension data when available
2. ✅ Condo fees show actual amount from listing
3. ✅ Cleaning costs based on Airbnb market data
4. ✅ Insurance reflects STR-specific coverage
5. ✅ Utilities account for higher STR usage
6. ✅ Maintenance factors in property age
7. ✅ Platform fees accurate to service used
8. ✅ All expenses show data source indicators
9. ✅ User can edit any expense value
10. ✅ Totals recalculate on changes

## Summary

The financial calculator should prioritize:
1. **Actual data** from property listings (via browser extension)
2. **Market data** from Airbnb comparables
3. **AI research** from Perplexity for local rates
4. **Calculated fallbacks** only when no data available

This ensures accurate, transparent expense calculations that users can trust and verify.