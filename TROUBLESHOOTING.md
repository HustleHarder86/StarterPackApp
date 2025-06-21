# Troubleshooting "Data Not Available" Issues

## Quick Diagnosis Checklist

### 1. **Check API Response in Vercel Logs**
```bash
vercel logs --follow
```

Look for:
- "Fresh research completed, content sample:" - Is there actual content?
- "Extraction successful, sample:" - Are values being extracted?
- Any error messages during extraction

### 2. **Common Causes & Solutions**

#### A. **Property Not Found in Databases**
**Symptoms:**
- Research returns generic area information
- No specific property details

**Solutions:**
1. Use a more well-known address for testing:
   ```
   123 King Street West, Toronto, ON, Canada, M5V 3A8
   1 Yonge Street, Toronto, ON, Canada, M5E 1W7
   ```

2. Modify the prompt to be more flexible:
   ```javascript
   // In analyze-property.js, update the prompt:
   "If exact property not found, use average values for similar properties on the same street"
   ```

#### B. **Data Format Mismatch**
**Symptoms:**
- Research contains data but extraction fails
- "Data Not Available" despite good research

**Solutions:**
1. Check the research content format in logs
2. Update extraction patterns in `fallbackDataExtraction()`

#### C. **API Rate Limits**
**Symptoms:**
- Works sometimes, fails others
- 429 errors in logs

**Solutions:**
1. Add rate limiting:
   ```javascript
   // Add delay between requests
   await new Promise(resolve => setTimeout(resolve, 1000));
   ```

2. Reduce search depth:
   ```javascript
   search_depth: "basic", // Instead of "advanced"
   ```

## Testing Strategy

### 1. **Test with Known Properties**
Use properties that are likely to have data:
- Major commercial buildings
- Recently sold properties
- Properties currently for sale

### 2. **Enable Debug Logging**
Add to your analyze-property.js:
```javascript
// After research completes
console.log('=== RESEARCH CONTENT ===');
console.log(researchContent);
console.log('=== END RESEARCH ===');

// After extraction
console.log('=== EXTRACTED DATA ===');
console.log(JSON.stringify(structuredData, null, 2));
console.log('=== END EXTRACTED ===');
```

### 3. **Test Extraction Logic Locally**
Create test-extraction.js:
```javascript
const sampleResearch = `
Recent sales on Clarkson Gate show properties selling between $1,400,000 and $1,500,000.
The average home has 4 bedrooms and 3 bathrooms.
Rental rates in Milton average $3,500 per month for similar properties.
`;

// Test your extraction functions
const extracted = fallbackDataExtraction(sampleResearch, ...);
console.log(extracted);
```

## Fallback Strategies

### 1. **Use Area Averages**
If specific property data isn't available:
```javascript
// Get city averages based on postal code
const cityAverages = {
  'L9E': { value: 950000, rent: 3200 }, // Milton
  'M5V': { value: 850000, rent: 3500 }, // Toronto Downtown
  // Add more postal codes
};
```

### 2. **Progressive Enhancement**
Start with defaults, then enhance with found data:
```javascript
let propertyData = getDefaultsForCity(address.city);
propertyData = enhanceWithResearch(propertyData, researchContent);
```

### 3. **Confidence Scoring**
Add data quality indicators:
```javascript
structuredData.data_quality = {
  confidence: hasSpecificData ? 'high' : 'medium',
  data_source: hasSpecificData ? 'property-specific' : 'area-average',
  notes: 'Using comparable properties for estimation'
};
```

## Monitoring Data Quality

### 1. **Track Success Rate**
Add to your analysis:
```javascript
const hasCompleteData = 
  structuredData.property_details.estimated_value !== "Data Not Available" &&
  structuredData.long_term_rental.monthly_rent !== "Data Not Available";

// Log to Firebase
analysisData.data_completeness = hasCompleteData ? 'complete' : 'partial';
```

### 2. **A/B Test Prompts**
Try different research prompts:
- Version A: Specific property focus
- Version B: Area averages focus
- Track which performs better

### 3. **Implement Retry Logic**
If extraction fails:
```javascript
let attempts = 0;
while (attempts < 3 && !hasValidData(structuredData)) {
  attempts++;
  // Retry with modified prompt
  structuredData = await retryExtraction(researchContent, attempts);
}
```

## Emergency Fixes

If nothing else works:

### 1. **Force Reasonable Defaults**
```javascript
// In ensureCalculations()
if (!data.property_details.estimated_value || 
    data.property_details.estimated_value === "Data Not Available") {
  // Use postal code to estimate
  data.property_details.estimated_value = estimateByPostalCode(address.postal);
}
```

### 2. **Add Manual Override**
Allow users to input known values:
```javascript
// In property form
<input type="number" placeholder="Property value (optional)" />
<input type="number" placeholder="Expected rent (optional)" />
```

### 3. **Show Partial Results**
Better to show something than nothing:
```javascript
if (hasPartialData) {
  data.recommendation = "Analysis based on area averages. Some property-specific data was not available.";
}
```

## Next Steps

1. **Deploy the improved analyze-property.js**
2. **Monitor with the dashboard** (`/monitor-dashboard.html`)
3. **Test with various addresses** to find patterns
4. **Adjust prompts** based on what works
5. **Document successful addresses** for testing

Remember: The goal is to provide value even when perfect data isn't available!
