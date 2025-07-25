const fetch = require('node-fetch');
const logger = require('./logger.service');

class AirbnbScraperService {
  constructor() {
    this.apiKey = process.env.AIRBNB_SCRAPER_API_KEY;
    // Ensure base URL doesn't have trailing slash and is just the base API
    this.apiUrl = (process.env.AIRBNB_SCRAPER_API_URL || 'https://api.apify.com/v2').replace(/\/$/, '');
    // The actor you're using - use tilde not forward slash!
    this.actorId = 'tri_angle~new-fast-airbnb-scraper';
    this.maxResults = 20; // Cost control - limit to 20 for ~$0.01 per search
    this.timeout = 60000; // 60 second timeout
  }

  /**
   * Search for comparable Airbnb listings
   * @param {Object} propertyData - Property details for matching
   * @param {Object} options - Optional search parameters
   * @returns {Promise<Object>} Search results with listings and metadata
   */
  async searchComparables(propertyData, options = {}) {
    if (!this.apiKey) {
      logger.error('Airbnb scraper API key not configured', {
        hasKey: !!process.env.AIRBNB_SCRAPER_API_KEY,
        keyLength: process.env.AIRBNB_SCRAPER_API_KEY?.length || 0
      });
      throw new Error('STR analysis requires Airbnb API credentials. Please add AIRBNB_SCRAPER_API_KEY to Railway environment variables.');
    }

    // Use better defaults when data is missing
    const { address, bedrooms = 3, bathrooms = 2, propertyType = 'House' } = propertyData;
    // Format location with province as it worked yesterday
    const city = address?.city || 'Toronto';
    const province = address?.province || 'Ontario';
    const location = `${city}, ${province}`;

    logger.info('Searching Airbnb comparables', {
      location,
      bedrooms,
      propertyType,
      maxResults: this.maxResults
    });

    // Build simplified input - exact bedroom match, no guest calculations
    const input = {
      locationQueries: [location],
      locale: 'en-US',
      currency: 'CAD',
      // Property specifications - ±1 bedroom range for better results
      minBedrooms: Math.max(1, bedrooms - 1),  // One less bedroom minimum
      minBathrooms: Math.max(1, Math.floor(bathrooms - 0.5)), // Allow half bathroom difference, ensure integer
      // Date logic - 30 days out for check-in, 7 night stay
      checkIn: options.checkIn || this.getCheckInDate(),
      checkOut: options.checkOut || this.getCheckOutDate()
      // No guest count - let Airbnb handle defaults
    };
    
    // Add price filters - minimum $50 to avoid invalid listings
    input.priceMin = options.priceMin || 50;  // Default minimum $50/night
    if (options.priceMax !== undefined && options.priceMax !== null) {
      input.priceMax = options.priceMax;
    }
    
    // Only add optional parameters if explicitly provided
    if (options.children !== undefined) input.children = options.children;
    if (options.infants !== undefined) input.infants = options.infants;
    if (options.pets !== undefined) input.pets = options.pets;
    
    logger.info('Apify input parameters', {
      location: location,
      locale: input.locale,
      maxItems: this.maxResults,
      actor: this.actorId,
      input: input
    });

    try {
      // Create abort controller for timeout
      const AbortController = require('abort-controller');
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      // Start the actor run
      // Add maxItems as query parameter for cost control
      const runUrl = `${this.apiUrl}/acts/${this.actorId}/runs?maxItems=${this.maxResults}`;
      
      logger.info('Calling Apify API', {
        url: runUrl,
        hasApiKey: !!this.apiKey,
        apiKeyLength: this.apiKey?.length || 0,
        apiUrl: this.apiUrl,
        actorId: this.actorId
      });
      
      // Send input directly - maxItems is in URL query parameter
      logger.info('Apify request payload', {
        payload: JSON.stringify(input, null, 2)
      });
      
      const runResponse = await fetch(runUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify(input),
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
      const allListings = this.normalizeListings(results);
      
      // Log bedroom distribution for debugging
      const bedroomCounts = {};
      allListings.forEach(listing => {
        const br = listing.bedrooms || 'unknown';
        bedroomCounts[br] = (bedroomCounts[br] || 0) + 1;
      });
      logger.info('Bedroom distribution in normalized listings:', bedroomCounts);
      
      // Ensure we respect maxResults limit for cost control
      const listings = allListings.slice(0, this.maxResults);
      
      logger.info(`Found ${allListings.length} total listings, returning ${listings.length} (maxResults: ${this.maxResults})`);

      // Log if no results found (but don't throw error - might just be no listings in area)
      if (listings.length === 0) {
        logger.warn('No Airbnb listings found in area', {
          location,
          input,
          runId
        });
      }

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
    const maxAttempts = 30; // Increase attempts for longer runs
    const delayMs = 3000; // Increase delay to 3 seconds

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

      // Extract bedrooms - prioritize text parsing over potentially incorrect API data
      const combinedText = `${item.name || ''} ${item.title || ''} ${item.additionalInfo || ''}`;
      
      let bedrooms = null;
      
      // First, try to extract from text with comprehensive patterns
      bedrooms = this.extractNumber(combinedText, /(\d+)\s*(?:bedroom|bedrooms|bd|br|BR|bed|beds)/i) ||
                 this.extractNumber(combinedText, /(\d+)BR/i) ||
                 this.extractNumber(combinedText, /(\d+)\s*(?:bdrm|bdr)/i) ||
                 this.extractNumber(combinedText, /(\d+)\s*(?:bed\b)/i);
      
      // If text parsing failed, try API data as backup
      if (!bedrooms) {
        bedrooms = item.bedrooms || item.beds || null;
      }
      
      // Handle special cases
      if (!bedrooms) {
        if (combinedText.match(/studio/i)) {
          bedrooms = 0;
        } else {
          bedrooms = 2; // Conservative default
        }
      }
      
      // Log bedroom extraction for debugging
      if (item.name && bedrooms !== (item.bedrooms || item.beds)) {
        console.log(`Bedroom extraction override: "${item.name}" - API: ${item.bedrooms || item.beds}, Extracted: ${bedrooms}`);
      }
      
      // Try multiple patterns for bathrooms
      const bathrooms = item.bathrooms || 
                       this.extractNumber(combinedText, /(\d+(?:\.\d)?)\s*(?:bathroom|bath|ba|BA)/i) ||
                       this.extractNumber(combinedText, /(\d+(?:\.\d)?)BA/i) || 
                       1; // Default to 1

      // Extract room type
      const roomType = item.roomType || item.room_type || item.property_type || 'Entire place';

      return {
        id: item.id || item.listing_id || Math.random().toString(36).substr(2, 9),
        title: item.name || item.title || 'Airbnb Listing',
        price: nightlyPrice,
        nightly_price: nightlyPrice,
        bedrooms: bedrooms,
        bathrooms: bathrooms,
        propertyType: roomType,
        rating: parseFloat(item.star_rating || item.rating) || 4.5,
        reviewsCount: parseInt(item.reviews_count || item.number_of_reviews) || 0,
        occupancy_rate: 0.70, // Default occupancy
        image_url: item.images?.[0] || item.picture_url || item.thumbnail_url || '',
        url: item.url || `https://www.airbnb.ca/rooms/${item.id}`,
        location: {
          lat: item.coordinates?.lat || item.lat || item.latitude,
          lng: item.coordinates?.lng || item.lng || item.longitude
        },
        amenities: item.amenities || [],
        host: {
          name: item.host?.name || 'Host',
          isSuperhost: item.host?.is_superhost || false
        }
      };
    }).filter(listing => listing.price >= 50); // Filter out listings with no price or unrealistic prices
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
   * Get check-out date (37 days from now - 7 night stay)
   */
  getCheckOutDate() {
    const date = new Date();
    date.setDate(date.getDate() + 37);
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