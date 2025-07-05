# STR (Short-Term Rental) Analysis Integration

## Overview

This document describes the Apify-based Airbnb Scraper integration for Short-Term Rental (STR) analysis in the StarterPackApp.

## Architecture

### Key Components

1. **Airbnb Scraper** (`/utils/airbnb-scraper.js`)
   - Wrapper around Apify client
   - Formats property data into Apify query parameters
   - Handles API communication and error handling
   - Processes raw Apify results into standardized format

2. **STR Calculations** (`/utils/str-calculations.js`)
   - `calculateSTRMetrics`: Calculates revenue projections from comparables
   - `filterComparables`: Smart filtering with similarity scoring
   - `calculateSTRCosts`: STR-specific operating costs (47% of revenue)
   - `calculateSeasonalAdjustments`: Future enhancement for seasonal pricing

3. **STR Analysis API** (`/api/str-analysis/analyze.js`)
   - Main endpoint for STR analysis
   - Handles user authentication and subscription checks
   - Manages trial usage for free tier users
   - Provides fallback calculations if API fails

### Data Flow

1. Browser Extension → Extracts property data from Realtor.ca
2. Frontend → Sends property data to STR analysis endpoint
3. API → Validates user subscription/trial status
4. Apify Integration → Searches for Airbnb comparables
5. Calculations → Processes comparables into revenue projections
6. Response → Returns comprehensive STR metrics

## API Configuration

### Required Environment Variables

```bash
# Apify Configuration (Required)
APIFY_API_TOKEN=apify_api_xxxxx              # Your Apify API token
AIRBNB_SCRAPER_ACTOR_ID=NDa1latMI7JHJzSYU   # Airbnb Scraper actor ID (default provided)

# Firebase (Already configured)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@...
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----..."
```

### Apify Actor Configuration

The integration uses the public Airbnb Scraper actor with these parameters:
- **Location**: City, Province format (e.g., "Toronto, Ontario")
- **Max Listings**: 20 (to control costs)
- **Currency**: CAD
- **Filters**: Bedrooms (±1), property type matching
- **Proxy**: Residential proxies for reliability

## Subscription Tiers & Usage Limits

### Free Tier
- 5 lifetime STR analyses (trial)
- Tracked in Firebase: `users.strTrialUsed`
- Shows upgrade prompt after trial exhausted

### Pro Tier
- Unlimited STR analyses
- Full access to all comparables
- Priority support

### Usage Tracking
```javascript
// Check if user can use STR
const canUseSTR = userData.subscriptionTier === 'pro' || 
                  userData.subscriptionTier === 'enterprise' ||
                  (userData.strTrialUsed || 0) < 5;

// Update trial usage (free users only)
if (userData.subscriptionTier === 'free') {
  await db.collection('users').doc(user.uid).update({
    strTrialUsed: (userData.strTrialUsed || 0) + 1
  });
}
```

## Cost Analysis

### Apify Costs
- **Per Run**: ~100 Apify points
- **Cost**: Approximately $0.05 per analysis
- **Monthly Estimate**: 
  - 1000 analyses = $50
  - 10,000 analyses = $500

### STR Operating Costs (Built into calculations)
- Management: 20% of revenue
- Cleaning: 10% of revenue
- Supplies: 3% of revenue
- Utilities: 5% of revenue
- Maintenance: 5% of revenue
- Insurance: 2% of revenue
- Marketing: 2% of revenue
- **Total**: 47% of gross revenue

## Response Format

```json
{
  "success": true,
  "data": {
    "avgNightlyRate": 189,
    "medianNightlyRate": 185,
    "occupancyRate": 0.75,
    "monthlyRevenue": 4306,
    "annualRevenue": 51675,
    "netMonthlyRevenue": 3445,
    "netAnnualRevenue": 41340,
    "managementFeeRate": 0.20,
    "priceRange": {
      "min": 125,
      "max": 275
    },
    "comparables": [
      {
        "id": "12345",
        "title": "Cozy 2BR Condo in Downtown Toronto",
        "price": 189,
        "bedrooms": 2,
        "propertyType": "Apartment",
        "url": "https://www.airbnb.com/rooms/12345",
        "rating": 4.8,
        "reviewsCount": 127
      }
    ],
    "comparableCount": 15,
    "confidence": "high",
    "dataSource": "airbnb_scraper",
    "timestamp": "2024-01-15T10:30:00Z"
  },
  "trialsRemaining": 4
}
```

## Testing

### Development Testing

1. **Unit Test Script**: `node scripts/test-apify.js`
   - Tests Apify connection
   - Validates data extraction
   - Checks calculations

2. **API Test Endpoint**: `/api/test-str`
   - GET endpoint for quick testing
   - Uses default Toronto property
   - Returns full debug information

3. **UI Test Page**: `/test-str-api.html`
   - Visual interface for testing
   - Shows metrics and comparables
   - Displays raw API responses

### Integration Testing

```bash
# Test with actual property data
curl -X POST http://localhost:3000/api/str-analysis/analyze \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "propertyId": "test-123",
    "propertyData": {
      "address": {
        "city": "Toronto",
        "province": "Ontario"
      },
      "bedrooms": 2,
      "bathrooms": 2,
      "propertyType": "Condo",
      "price": 650000
    }
  }'
```

## Error Handling

### API Failures
- Provides fallback calculations based on property value
- Uses conservative 70% occupancy rate
- Estimates nightly rate as 0.1% of property value
- Marks data source as "estimated"

### Common Issues

1. **No Comparables Found**
   - Usually due to remote location
   - Falls back to estimate-based calculations
   - Suggests expanding search radius

2. **API Token Invalid**
   - Returns 401 error
   - Clear error message in logs
   - Prompts to check environment variables

3. **Rate Limiting**
   - Apify has generous limits
   - Implements exponential backoff
   - Caches results for 24 hours

## Security Considerations

1. **API Keys**: Never exposed to client
2. **User Authentication**: Required for all STR endpoints
3. **Input Validation**: Sanitizes location data
4. **Rate Limiting**: Per-user limits enforced
5. **Data Privacy**: No PII stored in comparables

## Future Enhancements

1. **Seasonal Pricing**: Adjust rates by season
2. **Market Trends**: Historical pricing data
3. **Competition Analysis**: Detailed competitor insights
4. **Revenue Optimization**: Dynamic pricing suggestions
5. **Booking Calendar**: Availability predictions

## Deployment Checklist

- [ ] Set APIFY_API_TOKEN in Vercel environment
- [ ] Remove test endpoints (`/api/test-str.js`)
- [ ] Remove test HTML page (`test-str-api.html`)
- [ ] Configure production rate limits
- [ ] Set up monitoring for API usage
- [ ] Enable caching for production
- [ ] Test subscription tier enforcement
- [ ] Verify trial tracking works correctly