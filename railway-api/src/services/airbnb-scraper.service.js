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
    this.timeout = 300000; // 5 minute timeout for debug mode
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
    const maxAttempts = 50; // 50 attempts * 6 seconds = 5 minutes max
    const delayMs = 6000; // 6 second delay between checks

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
      
      // Log progress every 3 attempts (18 seconds) or when getting close to timeout
      if (attempt % 3 === 0 || attempt > 40) {
        const elapsed = ((attempt + 1) * delayMs / 1000).toFixed(0);
        const remaining = ((maxAttempts - attempt - 1) * delayMs / 1000).toFixed(0);
        logger.info(`Apify actor status: ${status.data.status} | Elapsed: ${elapsed}s | Remaining: ${remaining}s | Attempt: ${attempt + 1}/${maxAttempts}`);
      }

      if (status.data.status === 'SUCCEEDED') {
        // Get the results
        const datasetId = status.data.defaultDatasetId;
        const resultsUrl = `${this.apiUrl}/datasets/${datasetId}/items`;
        
        logger.info(`Run succeeded! Fetching results from dataset: ${datasetId}`);
        logger.info(`Results URL: ${resultsUrl}`);
        
        const resultsResponse = await fetch(resultsUrl, {
          headers: { 'Authorization': `Bearer ${this.apiKey}` },
          signal: controller.signal
        });

        logger.info(`Results fetch response status: ${resultsResponse.status}`);

        if (!resultsResponse.ok) {
          const errorText = await resultsResponse.text();
          logger.error(`Failed to fetch results: ${resultsResponse.status} - ${errorText}`);
          throw new Error(`Failed to fetch results: ${resultsResponse.status} - ${errorText}`);
        }

        // Get the raw text first to check for corruption
        const rawText = await resultsResponse.text();
        
        // Check if the response looks corrupted (character-by-character JSON)
        let results;
        try {
          results = JSON.parse(rawText);
          
          // If the first item looks corrupted (has numeric keys), try to reconstruct
          if (results.length > 0 && typeof results[0] === 'object' && results[0]['0'] !== undefined) {
            logger.warn('Detected corrupted Apify response format, attempting to reconstruct...');
            results = results.map(item => {
              // Reconstruct the JSON string from the character array
              const chars = [];
              let i = 0;
              while (item[i] !== undefined) {
                chars.push(item[i]);
                i++;
              }
              const jsonString = chars.join('');
              try {
                return JSON.parse(jsonString);
              } catch (e) {
                logger.error('Failed to parse reconstructed JSON:', e.message);
                return null;
              }
            }).filter(item => item !== null);
            logger.info(`Successfully reconstructed ${results.length} listings from corrupted response`);
          }
        } catch (e) {
          logger.error('Failed to parse Apify response:', e.message);
          throw new Error('Invalid JSON response from Apify');
        }
        
        logger.info(`Successfully fetched ${Array.isArray(results) ? results.length : 'unknown'} results`);
        return results;
      }

      if (status.data.status === 'FAILED' || status.data.status === 'ABORTED') {
        logger.error(`Actor run failed with status: ${status.data.status}`, status.data);
        throw new Error(`Actor run ${status.data.status}`);
      }
      
      // Log other statuses we're seeing
      if (attempt > 10) {
        logger.info(`Still waiting... Current status: ${status.data.status}, startedAt: ${status.data.startedAt}, finishedAt: ${status.data.finishedAt}`);
      }
    }

    throw new Error('Timeout waiting for results');
  }

  /**
   * Normalize Airbnb listing data to consistent format
   */
  normalizeListings(results) {
    if (!Array.isArray(results)) return [];
    
    // Log first item structure for debugging
    if (results.length > 0) {
      logger.info('Sample listing structure:', {
        hasPrice: !!results[0].price,
        hasPricing: !!results[0].pricing,
        hasPricingRate: !!results[0].pricing?.rate,
        hasPricingRateAmount: !!results[0].pricing?.rate?.amount,
        priceValue: results[0].price,
        pricingValue: results[0].pricing?.price || results[0].pricing?.rate?.amount || results[0].pricing?.label,
        keys: Object.keys(results[0]).slice(0, 15)
      });
    }

    return results.map(item => {
      // Extract price from various possible locations
      let nightlyPrice = 0;
      
      // Try multiple price extraction methods based on Apify's tri_angle actor format
      if (item.pricing) {
        // The pricing.label often contains the TOTAL price for the stay
        // We need to divide by number of nights (7 in our case)
        const checkInDate = new Date(item.checkIn || this.getCheckInDate());
        const checkOutDate = new Date(item.checkOut || this.getCheckOutDate());
        const nights = Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24)) || 7;
        
        // First try the label field which often contains the total price
        if (item.pricing.label) {
          const labelMatch = item.pricing.label.match(/\$?([\d,]+(?:\.\d{2})?)/);
          if (labelMatch) {
            const totalPrice = parseFloat(labelMatch[1].replace(/,/g, ''));
            // Convert total to nightly rate
            nightlyPrice = Math.round(totalPrice / nights);
          }
        }
        // Then try the price field
        if (!nightlyPrice && item.pricing.price) {
          const priceMatch = item.pricing.price.match(/\$?([\d,]+(?:\.\d{2})?)/);
          if (priceMatch) {
            const totalPrice = parseFloat(priceMatch[1].replace(/,/g, ''));
            // Convert total to nightly rate
            nightlyPrice = Math.round(totalPrice / nights);
          }
        }
        // Try rate.amount (this might already be nightly)
        if (!nightlyPrice && item.pricing.rate?.amount) {
          nightlyPrice = item.pricing.rate.amount;
        }
        // Check for qualifier that indicates "per night"
        if (item.pricing.qualifier && item.pricing.qualifier.includes('night')) {
          // If qualifier says "per night", the price might already be nightly
          // Re-extract if needed
          if (item.pricing.price) {
            const priceMatch = item.pricing.price.match(/\$?([\d,]+(?:\.\d{2})?)/);
            if (priceMatch) {
              nightlyPrice = parseFloat(priceMatch[1].replace(/,/g, ''));
            }
          }
        }
      }
      
      // Fallback to top-level price field
      if (!nightlyPrice && item.price) {
        if (typeof item.price === 'number') {
          nightlyPrice = item.price;
        } else if (typeof item.price === 'string') {
          const priceMatch = item.price.match(/\$?([\d,]+(?:\.\d{2})?)/);
          nightlyPrice = priceMatch ? parseFloat(priceMatch[1].replace(/,/g, '')) : 0;
        }
      }

      // Extract bedroom count from subtitles if not in main fields
      let bedrooms = item.bedrooms || 0;
      if (!bedrooms && item.subtitles) {
        // Look for "2 bedrooms" or "4 beds" in subtitles array
        const bedroomSubtitle = item.subtitles.find(s => s && s.includes('bedroom'));
        if (bedroomSubtitle) {
          const match = bedroomSubtitle.match(/(\d+)\s*bedroom/);
          if (match) bedrooms = parseInt(match[1]);
        }
        // If no bedrooms found, try beds
        if (!bedrooms) {
          const bedSubtitle = item.subtitles.find(s => s && s.includes('bed'));
          if (bedSubtitle) {
            const match = bedSubtitle.match(/(\d+)\s*bed/);
            if (match) bedrooms = Math.max(1, Math.ceil(parseInt(match[1]) / 2)); // Estimate bedrooms from beds
          }
        }
      }

      // Extract bathroom count
      let bathrooms = item.bathrooms || 1;
      if (!bathrooms && item.subtitles) {
        const bathSubtitle = item.subtitles.find(s => s && s.includes('bath'));
        if (bathSubtitle) {
          const match = bathSubtitle.match(/([\d.]+)\s*bath/);
          if (match) bathrooms = parseFloat(match[1]);
        }
      }

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
        rating: item.rating?.average || parseFloat(item.rating?.value || item.rating) || 4.5,
        reviewsCount: item.rating?.reviewsCount || parseInt(item.reviews_count || item.number_of_reviews) || 0,
        occupancy_rate: 0.70, // Default occupancy
        image_url: item.images?.[0]?.url || item.images?.[0] || item.picture_url || item.thumbnail_url || '',
        url: item.url || `https://www.airbnb.ca/rooms/${item.id}`,
        location: {
          lat: item.coordinates?.latitude || item.coordinates?.lat || item.lat || item.latitude,
          lng: item.coordinates?.longitude || item.coordinates?.lng || item.lng || item.longitude
        },
        amenities: item.amenities || [],
        host: {
          name: item.host?.name || 'Host',
          isSuperhost: item.host?.is_superhost || false
        }
      };
    })
    .filter(listing => {
      // More lenient filtering but still remove clearly invalid listings
      const valid = listing.price >= 30 && listing.price <= 5000;
      if (!valid) {
        logger.debug(`Filtered out listing with price: $${listing.price}`);
      }
      return valid;
    });
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
  
  /**
   * Get mock data for development
   * TEMPORARY: Remove when Apify performance improves
   */
  getMockData(propertyData) {
    const { address, bedrooms = 2, bathrooms = 2 } = propertyData;
    const city = address?.city || 'Toronto';
    
    logger.info('Returning mock Airbnb data for development', { city, bedrooms });
    
    // Generate realistic mock listings based on property
    const basePrice = bedrooms === 1 ? 120 : bedrooms === 2 ? 180 : 250;
    const listings = [];
    
    for (let i = 0; i < 10; i++) {
      const priceVariation = Math.random() * 60 - 30; // ±$30 variation
      const nightlyPrice = Math.round(basePrice + priceVariation);
      
      listings.push({
        id: `mock_${i + 1}`,
        title: `${bedrooms}BR ${['Condo', 'Apartment', 'House'][i % 3]} in ${city}`,
        name: `Modern ${bedrooms} Bedroom in ${city}`,
        price: nightlyPrice,
        nightly_rate: nightlyPrice,
        bedrooms: bedrooms + (i % 3 === 0 ? -1 : i % 3 === 2 ? 1 : 0), // Vary bedrooms slightly
        bathrooms: bathrooms,
        propertyType: ['Entire rental unit', 'Entire condo', 'Entire home'][i % 3],
        roomType: 'Entire place',
        rating: (4.5 + Math.random() * 0.5).toFixed(2),
        reviewsCount: Math.floor(10 + Math.random() * 100),
        occupancy: 0.65 + Math.random() * 0.2, // 65-85% occupancy
        distance: (Math.random() * 2).toFixed(1),
        url: `https://www.airbnb.ca/rooms/mock_${i + 1}`,
        images: [`https://picsum.photos/300/200?random=${i}`]
      });
    }
    
    return {
      listings,
      metadata: {
        location: `${city}, Ontario`,
        searchParams: { bedrooms, bathrooms },
        resultCount: listings.length,
        dataSource: 'mock_data_development'
      }
    };
  }
}

// Export singleton instance
module.exports = {
  airbnbScraper: new AirbnbScraperService()
};