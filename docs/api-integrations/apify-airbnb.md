# Apify Airbnb Scraper Integration Guide

## Overview

Apify provides web scraping capabilities for collecting Airbnb data to support short-term rental (STR) analysis in the StarterPackApp. The integration uses the `tri_angle~new-fast-airbnb-scraper` Actor for cost-effective data collection.

## Configuration

### Environment Variables
```bash
AIRBNB_SCRAPER_API_KEY=apify_api_your-token-here
AIRBNB_SCRAPER_API_URL=https://api.apify.com/v2
```

### Actor Information
- **Actor ID**: `tri_angle~new-fast-airbnb-scraper`
- **Purpose**: Fast Airbnb listing data collection
- **Cost**: ~$0.01 per search (20 results max for cost control)

## Integration Architecture

**Location**: `railway-api/src/services/airbnb-scraper.service.js`
**Usage**: STR market analysis, comparable property research

## Service Implementation

```javascript
class AirbnbScraperService {
  constructor() {
    this.apiKey = process.env.AIRBNB_SCRAPER_API_KEY;
    this.apiUrl = (process.env.AIRBNB_SCRAPER_API_URL || 'https://api.apify.com/v2').replace(/\/$/, '');
    this.actorId = 'tri_angle~new-fast-airbnb-scraper';
    this.maxResults = 20; // Cost control
    this.timeout = 300000; // 5 minute timeout
  }

  async searchComparables(propertyData, options = {}) {
    if (!this.apiKey) {
      throw new Error('STR analysis requires Airbnb API credentials. Please add AIRBNB_SCRAPER_API_KEY to Railway environment variables.');
    }

    const { address, bedrooms = 3, bathrooms = 2, propertyType = 'House' } = propertyData;
    const city = address?.city || 'Toronto';
    const province = address?.province || 'Ontario';
    const location = `${city}, ${province}`;

    const input = {
      locationQueries: [location],
      locale: 'en-US',
      currency: 'CAD',
      minBedrooms: Math.max(1, bedrooms - 1),
      minBathrooms: Math.max(1, Math.floor(bathrooms - 0.5)),
      checkIn: options.checkIn || this.getCheckInDate(),
      checkOut: options.checkOut || this.getCheckOutDate(),
      priceMin: options.priceMin || 50
    };

    // Start the actor run
    const runUrl = `${this.apiUrl}/acts/${this.actorId}/runs?maxItems=${this.maxResults}`;
    
    const runResponse = await fetch(runUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify(input)
    });

    if (!runResponse.ok) {
      const error = await runResponse.text();
      throw new Error(`Apify API error: ${runResponse.status} - ${error}`);
    }

    const runData = await runResponse.json();
    const runId = runData.data.id;

    // Wait for results
    const results = await this.waitForResults(runId);
    
    // Process and normalize results
    const listings = this.normalizeListings(results).slice(0, this.maxResults);
    
    return {
      listings,
      metadata: {
        location,
        searchParams: input,
        resultCount: listings.length,
        dataSource: 'apify_airbnb_scraper'
      }
    };
  }
}
```

## API Endpoints

### Run Actor
```
POST https://api.apify.com/v2/acts/{actorId}/runs
Authorization: Bearer {apiKey}
Content-Type: application/json

Parameters:
- maxItems: Limit results for cost control
```

### Check Run Status
```
GET https://api.apify.com/v2/acts/{actorId}/runs/{runId}
Authorization: Bearer {apiKey}
```

### Get Results
```
GET https://api.apify.com/v2/datasets/{datasetId}/items
Authorization: Bearer {apiKey}
```

## Input Parameters

### Basic Search Parameters
```javascript
{
  locationQueries: ["Toronto, Ontario"],  // Target locations
  locale: "en-US",                       // Locale for results
  currency: "CAD",                       // Currency preference
  checkIn: "2025-09-01",                // Check-in date (YYYY-MM-DD)
  checkOut: "2025-09-08",               // Check-out date (YYYY-MM-DD)
  priceMin: 50,                         // Minimum price per night
  priceMax: 500                         // Maximum price per night (optional)
}
```

### Property Filtering
```javascript
{
  minBedrooms: 2,      // Minimum bedrooms
  minBathrooms: 1,     // Minimum bathrooms
  propertyType: [      // Property types to include
    "House",
    "Apartment", 
    "Condo"
  ]
}
```

### Advanced Options
```javascript
{
  children: 0,         // Number of children
  infants: 0,          // Number of infants
  pets: false,         // Allow pets
  startUrls: [...],    // Direct URLs to scrape
  maxConcurrency: 2    // Concurrent requests
}
```

## Response Format

### Normalized Listing Structure
```javascript
{
  id: "listing_123",
  title: "Beautiful Downtown Condo",
  price: 150,                    // Per night in CAD
  nightly_price: 150,
  bedrooms: 2,
  bathrooms: 1,
  propertyType: "Entire place",
  rating: 4.8,
  reviewsCount: 45,
  occupancy_rate: 0.70,         // Default assumption
  image_url: "https://...",
  url: "https://www.airbnb.ca/rooms/...",
  location: {
    lat: 43.6532,
    lng: -79.3832
  },
  amenities: ["WiFi", "Kitchen", "Parking"],
  host: {
    name: "John Doe",
    isSuperhost: true
  }
}
```

## Data Processing Pipeline

### 1. Search Execution
```javascript
async executeSearch(propertyData) {
  // Configure search parameters
  const searchParams = this.buildSearchParams(propertyData);
  
  // Start actor run
  const runId = await this.startActorRun(searchParams);
  
  // Wait for completion (with timeout)
  const rawResults = await this.waitForResults(runId);
  
  // Normalize and filter results
  const listings = this.normalizeListings(rawResults);
  
  return listings;
}
```

### 2. Data Normalization
```javascript
normalizeListings(results) {
  if (!Array.isArray(results)) return [];

  return results.map(item => {
    // Extract price from various possible formats
    let nightlyPrice = 0;
    if (item.pricing?.price) {
      const priceMatch = item.pricing.price.match(/\$(\d+(?:\.\d{2})?)/);
      nightlyPrice = priceMatch ? parseFloat(priceMatch[1]) : 0;
    } else if (item.price) {
      nightlyPrice = typeof item.price === 'number' ? item.price : 
                    parseFloat(item.price.toString().replace(/[^\d.]/g, ''));
    }

    return {
      id: item.id || item.listing_id || Math.random().toString(36).substr(2, 9),
      title: item.name || item.title || 'Airbnb Listing',
      price: nightlyPrice,
      bedrooms: item.bedrooms || item.beds || 0,
      bathrooms: item.bathrooms || 1,
      propertyType: item.roomType || item.room_type || 'Entire place',
      rating: parseFloat(item.star_rating || item.rating) || 4.5,
      reviewsCount: parseInt(item.reviews_count || item.number_of_reviews) || 0,
      occupancy_rate: 0.70, // Default occupancy assumption
      image_url: item.images?.[0] || item.picture_url || '',
      url: item.url || `https://www.airbnb.ca/rooms/${item.id}`,
      location: {
        lat: item.coordinates?.lat || item.lat,
        lng: item.coordinates?.lng || item.lng
      },
      amenities: item.amenities || [],
      host: {
        name: item.host?.name || 'Host',
        isSuperhost: item.host?.is_superhost || false
      }
    };
  }).filter(listing => listing.price >= 50); // Filter unrealistic prices
}
```

## Cost Management

### Usage Optimization
```javascript
// Limit results for cost control
const COST_EFFECTIVE_LIMITS = {
  maxResults: 20,        // ~$0.01 per search
  maxConcurrency: 2,     // Prevent rate limiting
  timeout: 300000        // 5-minute timeout
};

// Calculate estimated costs
calculateEstimatedCost(searchCount, resultsPerSearch = 20) {
  const costPerResult = 0.0005; // Approximately $0.0005 per result
  const totalResults = searchCount * resultsPerSearch;
  return {
    totalResults,
    estimatedCost: (totalResults * costPerResult).toFixed(4),
    costPerSearch: (resultsPerSearch * costPerResult).toFixed(4)
  };
}
```

### Rate Limiting
```javascript
async waitForResults(runId, maxAttempts = 60) {
  const delayMs = 5000; // 5 second delay between checks
  
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    await new Promise(resolve => setTimeout(resolve, delayMs));
    
    const status = await this.checkRunStatus(runId);
    
    if (status.data.status === 'SUCCEEDED') {
      return await this.fetchResults(status.data.defaultDatasetId);
    }
    
    if (status.data.status === 'FAILED' || status.data.status === 'ABORTED') {
      throw new Error(`Actor run ${status.data.status}`);
    }
    
    // Log progress every 25 seconds
    if (attempt % 5 === 0) {
      console.log(`Waiting for Apify results: attempt ${attempt + 1}/${maxAttempts}, status: ${status.data.status}`);
    }
  }
  
  throw new Error('Timeout waiting for results');
}
```

## Error Handling

### Common Error Scenarios
```javascript
async searchComparables(propertyData, options = {}) {
  try {
    return await this.executeSearch(propertyData, options);
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('Search timeout - please try again');
    }
    
    if (error.message.includes('401')) {
      throw new Error('Invalid Apify API credentials');
    }
    
    if (error.message.includes('429')) {
      throw new Error('API rate limit exceeded - please wait and try again');
    }
    
    if (error.message.includes('quota')) {
      throw new Error('API quota exceeded - please upgrade your plan');
    }
    
    throw new Error(`Airbnb data collection failed: ${error.message}`);
  }
}
```

## Integration Examples

### STR Analysis Integration
```javascript
async analyzeSTRPotential(propertyData) {
  try {
    // Collect comparable Airbnb data
    const airbnbData = await airbnbScraperService.searchComparables(propertyData, {
      priceMin: 75,
      priceMax: 400,
      checkIn: this.getOptimalCheckInDate(),
      checkOut: this.getOptimalCheckOutDate()
    });
    
    // Calculate STR metrics
    const metrics = this.calculateSTRMetrics(airbnbData.listings, propertyData);
    
    return {
      comparables: airbnbData.listings,
      metrics: {
        averageNightlyRate: metrics.avgRate,
        estimatedMonthlyRevenue: metrics.monthlyRevenue,
        occupancyRate: metrics.occupancy,
        competitorCount: airbnbData.listings.length,
        marketPosition: metrics.position
      },
      metadata: airbnbData.metadata
    };
  } catch (error) {
    console.error('STR analysis failed:', error);
    return {
      error: error.message,
      fallbackUsed: true
    };
  }
}
```

### Property Comparison
```javascript
async findComparableProperties(targetProperty) {
  const searchParams = {
    bedrooms: targetProperty.bedrooms,
    bathrooms: targetProperty.bathrooms,
    propertyType: this.mapPropertyType(targetProperty.type),
    priceMin: Math.floor(targetProperty.estimatedRate * 0.7),
    priceMax: Math.ceil(targetProperty.estimatedRate * 1.3)
  };
  
  const results = await airbnbScraperService.searchComparables(
    targetProperty, 
    searchParams
  );
  
  return {
    exactMatches: results.listings.filter(l => 
      l.bedrooms === targetProperty.bedrooms && 
      l.bathrooms === targetProperty.bathrooms
    ),
    similarProperties: results.listings,
    averageRate: this.calculateAverageRate(results.listings),
    priceRange: this.calculatePriceRange(results.listings)
  };
}
```

## Best Practices

### Search Optimization
1. **Location Specificity**: Use "City, Province" format for Canadian properties
2. **Date Selection**: Use dates 30-37 days in future for optimal availability
3. **Result Limiting**: Keep maxResults ≤ 20 for cost control
4. **Property Matching**: Allow ±1 bedroom/bathroom for better results

### Data Quality
1. **Price Validation**: Filter out listings <$50/night (likely errors)
2. **Completeness Check**: Ensure required fields are present
3. **Duplicate Removal**: Check for duplicate listing IDs
4. **Outlier Detection**: Flag listings with extreme prices or ratings

### Performance
1. **Async Processing**: Use async operations for multiple searches
2. **Caching**: Cache results for repeated queries (1-hour TTL)
3. **Retry Logic**: Implement exponential backoff for failures
4. **Monitoring**: Track API usage and costs

## Troubleshooting

### Common Issues

1. **No Results**: Check location format, broaden search criteria
2. **API Timeout**: Increase timeout or use smaller result sets
3. **Rate Limiting**: Implement delay between requests
4. **Invalid Data**: Add data validation and cleaning

### Debug Tools
```javascript
// Enable detailed logging
const debugSearch = async (propertyData) => {
  console.log('Search input:', JSON.stringify(input, null, 2));
  console.log('Actor URL:', runUrl);
  console.log('API Key length:', this.apiKey?.length || 0);
  
  const results = await this.searchComparables(propertyData);
  console.log('Results count:', results.listings.length);
  console.log('Sample result:', results.listings[0]);
  
  return results;
};
```

## Links

- [Apify Documentation](https://docs.apify.com/)
- [Actor Store](https://apify.com/store)
- [Airbnb Scraper Actor](https://apify.com/tri_angle/new-fast-airbnb-scraper)
- [API Reference](https://docs.apify.com/api/v2)
- [Pricing](https://apify.com/pricing)