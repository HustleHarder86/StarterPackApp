# Railway API Tests

## Airbnb Bedroom Filter Test

This test verifies that the `maxBedrooms` parameter in the Airbnb scraper service works correctly.

### Purpose
The test ensures that when we set both `minBedrooms=3` and `maxBedrooms=3`, the API returns only properties with exactly 3 bedrooms.

### Running the Test

```bash
# From railway-api directory
npm run test:airbnb-bedrooms

# Or directly
node tests/test-airbnb-bedroom-filter.js
```

### What the Test Does

1. Makes an API call to Airbnb scraper with:
   - Location: Toronto, Ontario
   - minBedrooms: 3
   - maxBedrooms: 3
   - Price range: $50-$500/night

2. Analyzes all returned listings to verify:
   - All properties have exactly 3 bedrooms
   - No properties have more or less than 3 bedrooms

3. Reports:
   - Total number of listings found
   - Bedroom distribution
   - Any listings with incorrect bedroom counts
   - Sample of correct listings

### Expected Output

If the test passes, you should see:
- All listings have exactly 3 bedrooms
- Green checkmarks indicating success

If the test fails, you will see:
- Red error messages
- Details of listings with incorrect bedroom counts
- The test will exit with code 1

### Requirements

- Valid `AIRBNB_SCRAPER_API_KEY` in environment variables
- Network connection to Apify API
- Node.js 18+ installed

### Cost Considerations

This test makes a real API call to the Airbnb scraper, which incurs a small cost (approximately $0.01 per run).