const fetch = require('node-fetch');
const logger = require('./logger.service');

class AirbnbScraperService {
  constructor() {
    this.apiKey = process.env.AIRBNB_SCRAPER_API_KEY;
    // Ensure base URL doesn't have trailing slash and is just the base API
    this.apiUrl = (process.env.AIRBNB_SCRAPER_API_URL || 'https://api.apify.com/v2').replace(/\/$/, '');
    // The actor you're using
    this.actorId = 'tri_angle/new-fast-airbnb-scraper';
    this.maxResults = 50; // Cost control
    this.timeout = 15000; // 15 second timeout
  }

  /**
   * Search for comparable Airbnb listings
   * @param {Object} propertyData - Property details for matching
   * @returns {Promise<Object>} Search results with listings and metadata
   */
  async searchComparables(propertyData) {
    if (!this.apiKey) {
      logger.error('Airbnb scraper API key not configured', {
        hasKey: !!process.env.AIRBNB_SCRAPER_API_KEY,
        keyLength: process.env.AIRBNB_SCRAPER_API_KEY?.length || 0
      });
      throw new Error('STR analysis requires Airbnb API credentials. Please add AIRBNB_SCRAPER_API_KEY to Railway environment variables.');
    }

    const { address, bedrooms = 2, bathrooms = 1, propertyType = 'House' } = propertyData;
    const location = address?.city || 'Toronto';

    logger.info('Searching Airbnb comparables', {
      location,
      bedrooms,
      propertyType,
      maxResults: this.maxResults
    });

    // Build input parameters - format varies by actor
    // Most actors use locationQuery instead of location
    const input = {
      locationQuery: `${location}, Canada`, // More explicit location
      location: location,
      minBedrooms: Math.max(1, bedrooms - 1),
      maxBedrooms: bedrooms + 1,
      minBathrooms: Math.max(1, bathrooms - 0.5),
      maxBathrooms: bathrooms + 0.5,
      minBeds: Math.max(1, bedrooms - 1),
      maxBeds: bedrooms + 1,
      adults: bedrooms * 2,
      children: 0,
      infants: 0,
      pets: 0,
      propertyType: this.getPropertyTypes(propertyType),
      propertyTypes: this.getPropertyTypes(propertyType),
      currency: 'CAD',
      includeDataFromHosts: true,
      maxListings: this.maxResults,
      maxResults: this.maxResults,
      checkIn: this.getCheckInDate(),
      checkOut: this.getCheckOutDate(),
      startUrls: [] // Some actors use this instead
    };
    
    logger.info('Apify input parameters', {
      location: input.locationQuery,
      bedrooms: `${input.minBedrooms}-${input.maxBedrooms}`,
      actor: this.actorId
    });

    try {
      // Create abort controller for timeout
      const AbortController = require('abort-controller');
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      // Start the actor run
      const runUrl = `${this.apiUrl}/acts/${this.actorId}/runs`;
      
      logger.info('Calling Apify API', {
        url: runUrl,
        hasApiKey: !!this.apiKey,
        apiKeyLength: this.apiKey?.length || 0,
        apiUrl: this.apiUrl,
        actorId: this.actorId
      });
      
      const runResponse = await fetch(runUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({ input }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!runResponse.ok) {
        const error = await runResponse.text();
        throw new Error(`Apify API error: ${runResponse.status} - ${error}`);
      }

      const runData = await runResponse.json();
      const runId = runData.data.id;

      logger.info('Apify actor run started', { runId });

      // Wait for results with timeout
      const results = await this.waitForResults(runId, controller);
      
      // Process and normalize results
      const listings = this.normalizeListings(results);
      
      logger.info(`Found ${listings.length} Airbnb listings`);

      return {
        listings,
        metadata: {
          location,
          searchParams: input,
          resultCount: listings.length,
          dataSource: 'apify_airbnb_scraper'
        }
      };

    } catch (error) {
      if (error.name === 'AbortError') {
        logger.error('Airbnb search timeout', { location });
        throw new Error('Search timeout - please try again');
      }
      
      logger.error('Airbnb scraper error', {
        error: error.message,
        location
      });
      
      throw error;
    }
  }

  /**
   * Wait for actor run to complete and return results
   */
  async waitForResults(runId, controller) {
    const maxAttempts = 10;
    const delayMs = 1500;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      await new Promise(resolve => setTimeout(resolve, delayMs));

      const statusUrl = `${this.apiUrl}/acts/${this.actorId}/runs/${runId}`;
      const statusResponse = await fetch(statusUrl, {
        headers: { 'Authorization': `Bearer ${this.apiKey}` },
        signal: controller.signal
      });

      if (!statusResponse.ok) {
        throw new Error(`Failed to check run status: ${statusResponse.status}`);
      }

      const status = await statusResponse.json();

      if (status.data.status === 'SUCCEEDED') {
        // Get the results
        const datasetId = status.data.defaultDatasetId;
        const resultsUrl = `${this.apiUrl}/datasets/${datasetId}/items`;
        
        const resultsResponse = await fetch(resultsUrl, {
          headers: { 'Authorization': `Bearer ${this.apiKey}` },
          signal: controller.signal
        });

        if (!resultsResponse.ok) {
          throw new Error(`Failed to fetch results: ${resultsResponse.status}`);
        }

        return await resultsResponse.json();
      }

      if (status.data.status === 'FAILED' || status.data.status === 'ABORTED') {
        throw new Error(`Actor run ${status.data.status}`);
      }
    }

    throw new Error('Timeout waiting for results');
  }

  /**
   * Normalize Airbnb listing data to consistent format
   */
  normalizeListings(results) {
    if (!Array.isArray(results)) return [];

    return results.map(item => {
      // Extract price from various possible locations
      let nightlyPrice = 0;
      if (item.pricing?.price) {
        const priceMatch = item.pricing.price.match(/\$(\d+(?:\.\d{2})?)/);
        nightlyPrice = priceMatch ? parseFloat(priceMatch[1]) : 0;
      } else if (item.price) {
        nightlyPrice = typeof item.price === 'number' ? item.price : 
                      parseFloat(item.price.toString().replace(/[^\d.]/g, ''));
      }

      // Extract bedrooms and bathrooms
      const bedrooms = item.bedrooms || item.beds || 
                      this.extractNumber(item.name, /(\d+)\s*(?:bedroom|bd|br)/i) || 1;
      
      const bathrooms = item.bathrooms || 
                       this.extractNumber(item.name, /(\d+(?:\.\d)?)\s*(?:bathroom|bath|ba)/i) || 1;

      return {
        id: item.id || item.listing_id || Math.random().toString(36).substr(2, 9),
        title: item.name || item.title || 'Airbnb Listing',
        price: nightlyPrice,
        nightly_price: nightlyPrice,
        bedrooms: bedrooms,
        bathrooms: bathrooms,
        propertyType: item.room_type || item.property_type || 'Entire place',
        rating: item.star_rating || item.rating || 4.5,
        reviewsCount: item.reviews_count || item.number_of_reviews || 0,
        occupancy_rate: 0.70, // Default occupancy
        image_url: item.picture_url || item.thumbnail_url || item.images?.[0] || '',
        url: item.url || `https://www.airbnb.ca/rooms/${item.id}`,
        location: {
          lat: item.lat || item.latitude,
          lng: item.lng || item.longitude
        },
        amenities: item.amenities || [],
        host: {
          name: item.host?.name || 'Host',
          isSuperhost: item.host?.is_superhost || false
        }
      };
    }).filter(listing => listing.price > 0); // Filter out listings with no price
  }

  /**
   * Get property types based on input
   */
  getPropertyTypes(propertyType) {
    const typeMap = {
      'House': ['House', 'Townhouse', 'Villa', 'Cottage'],
      'Condo': ['Apartment', 'Condo', 'Loft', 'Serviced apartment'],
      'Townhouse': ['Townhouse', 'House', 'Row house'],
      'Apartment': ['Apartment', 'Condo', 'Flat', 'Serviced apartment']
    };

    return typeMap[propertyType] || ['House', 'Apartment', 'Condo'];
  }

  /**
   * Get check-in date (30 days from now)
   */
  getCheckInDate() {
    const date = new Date();
    date.setDate(date.getDate() + 30);
    return date.toISOString().split('T')[0];
  }

  /**
   * Get check-out date (33 days from now)
   */
  getCheckOutDate() {
    const date = new Date();
    date.setDate(date.getDate() + 33);
    return date.toISOString().split('T')[0];
  }

  /**
   * Extract number from text
   */
  extractNumber(text, pattern) {
    if (!text) return null;
    const match = text.match(pattern);
    return match ? parseFloat(match[1]) : null;
  }
}

// Export singleton instance
module.exports = {
  airbnbScraper: new AirbnbScraperService()
};