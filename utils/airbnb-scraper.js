// Airbnb Scraper API integration - supports both Apify and custom scraper APIs
const { ApifyClient } = require('apify-client');
const https = require('https');

/**
 * Get date string for future dates (YYYY-MM-DD format)
 * @param {number} daysFromNow - Number of days from today
 * @returns {string} Date in YYYY-MM-DD format
 */
function getDateString(daysFromNow) {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  return date.toISOString().split('T')[0];
}

class AirbnbScraper {
  constructor(apiToken, actorId, customApiUrl, customApiKey) {
    // Apify setup
    this.apiToken = apiToken;
    this.actorId = actorId || 'tri_angle/new-fast-airbnb-scraper'; // Fast actor with comprehensive parameters
    this.baseUrl = 'https://api.apify.com/v2';
    
    // Custom API setup (alternative to Apify)
    this.customApiUrl = customApiUrl;
    this.customApiKey = customApiKey;
    
    // Determine which API to use
    // If customApiUrl is set and it's NOT apify.com, use custom API
    const isApifyUrl = this.customApiUrl && this.customApiUrl.includes('apify.com');
    this.useCustomApi = !!(this.customApiUrl && this.customApiKey && !isApifyUrl);
    
    // Initialize Apify client if we have a token and we're using Apify (default or explicit)
    if (this.apiToken && (!this.customApiUrl || isApifyUrl)) {
      this.client = new ApifyClient({
        token: this.apiToken
      });
    }
    
    console.log(`AirbnbScraper initialized:`, {
      useCustomApi: this.useCustomApi,
      hasApifyToken: !!this.apiToken,
      customApiUrl: this.customApiUrl ? 'SET' : 'NOT_SET'
    });
  }

  /**
   * Format location from full address to city/province format
   * @param {Object} address - Address object with street, city, province
   * @returns {string} Formatted location (e.g., "Milton, Ontario")
   */
  formatLocation(address) {
    if (typeof address === 'string') {
      // Extract city and province from full address string
      const parts = address.split(',').map(p => p.trim());
      if (parts.length >= 3) {
        // Assume format: "Street, City, Province"
        return `${parts[1]}, ${parts[2].split(' ')[0]}`; // Remove postal code
      }
      return address;
    }
    
    // If address is an object
    const { city, province } = address;
    if (!city || !province) {
      throw new Error('City and province are required for location formatting');
    }
    
    return `${city}, ${province}`;
  }

  /**
   * Build query parameters for Apify Airbnb Scraper
   * @param {Object} property - Property details
   * @returns {Object} Apify input parameters
   */
  buildQuery(property) {
    const location = this.formatLocation(property.address || property);
    
    // Build comprehensive query for tri_angle/new-fast-airbnb-scraper
    const query = {
      locationQueries: [location],
      locale: 'en-CA',
      currency: 'CAD',
      adults: property.bedrooms ? property.bedrooms * 2 : 2, // 2 adults per bedroom
      children: 0,
      infants: 0, 
      pets: 0,
      // Set date range (default to 30 days from now)
      checkIn: getDateString(30), 
      checkOut: getDateString(33), // 3-night stay
      // Filtering parameters to control costs and relevance
      priceMin: 50,
      priceMax: 500,
      minBedrooms: property.bedrooms ? Math.max(1, property.bedrooms - 1) : 1,
      minBathrooms: property.bathrooms ? Math.max(1, property.bathrooms - 1) : 1,
      minBeds: property.bedrooms || 1
    };

    console.log('Built comprehensive Apify query:', JSON.stringify(query, null, 2));
    
    return query;
  }

  /**
   * Execute Airbnb search via configured API (Apify or custom)
   * @param {Object} property - Property to find comparables for
   * @returns {Promise<Object>} Search results
   */
  async searchComparables(property) {
    if (this.useCustomApi) {
      return this.searchViaCustomApi(property);
    } else {
      return this.searchViaApify(property);
    }
  }

  /**
   * Search via custom Airbnb scraper API
   * @param {Object} property - Property to find comparables for
   * @returns {Promise<Object>} Search results
   */
  async searchViaCustomApi(property) {
    if (!this.customApiUrl || !this.customApiKey) {
      throw new Error('AIRBNB_SCRAPER_API_URL and AIRBNB_SCRAPER_API_KEY are not configured');
    }

    try {
      const location = this.formatLocation(property.address || property);
      
      // Build request payload for custom API
      const payload = {
        location: location,
        bedrooms: property.bedrooms,
        bathrooms: property.bathrooms,
        propertyType: property.propertyType,
        currency: 'CAD',
        minPrice: 50,
        maxPrice: 500,
        limit: 50, // LIMIT TO 50 RESULTS TO CONTROL API COSTS
        timeout: 30000
      };
      
      console.log(`Searching custom API for ${location}...`);
      console.log('Custom API payload:', JSON.stringify(payload, null, 2));
      
      // Make HTTP request to custom API
      const response = await this.makeHttpRequest(this.customApiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.customApiKey}`,
          'X-API-Key': this.customApiKey
        },
        body: JSON.stringify(payload)
      });
      
      console.log(`Retrieved ${response.listings?.length || 0} listings from custom API`);
      
      // Process and standardize the results
      const processedListings = (response.listings || response.data || []).map(item => ({
        id: item.id || item.listing_id || item.airbnb_id,
        title: item.title || item.name,
        price: item.price || item.nightly_rate || item.base_price || 0,
        nightly_price: item.price || item.nightly_rate || item.base_price || 0,
        bedrooms: item.bedrooms || item.bedroom_count || 0,
        bathrooms: item.bathrooms || item.bathroom_count || 0,
        property_type: item.property_type || item.room_type || 'Unknown',
        occupancy_rate: item.occupancy_rate || item.occupancy || 0.70, // Default 70%
        url: item.url || item.airbnb_url || `https://www.airbnb.com/rooms/${item.id}`,
        location: {
          latitude: item.latitude || item.lat,
          longitude: item.longitude || item.lng,
          address: item.address
        },
        amenities: item.amenities || [],
        rating: item.rating || item.star_rating,
        reviewsCount: item.reviews_count || item.review_count || 0,
        image_url: item.image_url || item.thumbnail,
        distance: item.distance
      }));
      
      return {
        success: true,
        listings: processedListings,
        metadata: {
          location: location,
          totalResults: processedListings.length,
          searchParams: payload,
          source: 'custom_api',
          apiUrl: this.customApiUrl
        }
      };

    } catch (error) {
      console.error('Custom API Scraper Error:', error);
      throw new Error(`Failed to search via custom API: ${error.message}`);
    }
  }

  /**
   * Search via Apify
   * @param {Object} property - Property to find comparables for
   * @returns {Promise<Object>} Search results
   */
  async searchViaApify(property) {
    if (!this.apiToken) {
      throw new Error('APIFY_API_TOKEN is not configured');
    }

    if (!this.client) {
      throw new Error('Apify client not initialized');
    }

    try {
      const input = this.buildQuery(property);
      
      console.log(`Starting Apify actor run for ${input.locationQueries[0]}...`);
      console.log('Full Apify input:', JSON.stringify(input, null, 2));
      
      // Run the Airbnb Scraper actor
      const run = await this.client.actor(this.actorId).call(input);
      
      console.log(`Actor run completed. Run ID: ${run.id}, Status: ${run.status}`);
      
      // Fetch results from the dataset
      const { items } = await this.client.dataset(run.defaultDatasetId).listItems();
      
      console.log(`Retrieved ${items.length} listings from Apify`);
      
      // Process and format the results from tri_angle/new-fast-airbnb-scraper
      const processedListings = items.map(item => {
        // Extract price from pricing object
        let nightlyPrice = 0;
        if (item.pricing?.price) {
          // Parse "$387 CAD" to get numeric value
          const priceMatch = item.pricing.price.match(/\$(\d+(?:\.\d{2})?)/);
          nightlyPrice = priceMatch ? parseFloat(priceMatch[1]) : 0;
        }
        
        // Extract bedroom/bathroom info from subtitles and image captions
        let bedrooms = 0;
        let bathrooms = 0;
        
        // Check subtitles first
        if (item.subtitles) {
          item.subtitles.forEach(subtitle => {
            if (subtitle.includes('bedroom')) {
              const bedroomMatch = subtitle.match(/(\d+)\s*bedroom/);
              bedrooms = bedroomMatch ? parseInt(bedroomMatch[1]) : 0;
            }
            if (subtitle.includes('bath')) {
              const bathMatch = subtitle.match(/(\d+(?:\.\d+)?)\s*bath/);
              bathrooms = bathMatch ? parseFloat(bathMatch[1]) : 0;
            }
          });
        }
        
        // Also check image captions for room info
        if (item.images && bedrooms === 0) {
          item.images.forEach(image => {
            if (image.captions) {
              image.captions.forEach(caption => {
                if (caption.includes('bedroom') && bedrooms === 0) {
                  const bedroomMatch = caption.match(/(\d+)\s*bedroom/);
                  bedrooms = bedroomMatch ? parseInt(bedroomMatch[1]) : 0;
                }
                if (caption.includes('bath') && bathrooms === 0) {
                  const bathMatch = caption.match(/(\d+(?:\.\d+)?)\s*bath/);
                  bathrooms = bathMatch ? parseFloat(bathMatch[1]) : 0;
                }
              });
            }
          });
        }
        
        return {
          id: item.id,
          title: item.name || item.title || 'Untitled Property',
          price: nightlyPrice,
          nightly_price: nightlyPrice,
          bedrooms: bedrooms,
          bathrooms: bathrooms,
          property_type: item.roomType || 'Unknown',
          occupancy_rate: 0.70, // Default occupancy rate
          url: item.url,
          location: {
            latitude: item.coordinates?.latitude,
            longitude: item.coordinates?.longitude,
            address: `Toronto, Ontario` // Default for Toronto searches
          },
          amenities: [], // Not provided in this format
          rating: item.rating?.average || 0,
          reviewsCount: item.rating?.reviewsCount || 0,
          image_url: item.images?.[0]?.url,
          similarityScore: 0.8 // Default similarity score
        };
      });
      
      return {
        success: true,
        listings: processedListings,
        metadata: {
          location: input.locationQueries[0],
          totalResults: items.length,
          searchParams: input,
          runId: run.id,
          actorRunUrl: `https://console.apify.com/actors/${this.actorId}/runs/${run.id}`,
          source: 'apify'
        }
      };

    } catch (error) {
      console.error('Apify Scraper Error:', error);
      
      // Log more details for debugging
      if (error.response) {
        console.error('Response data:', error.response.data);
        console.error('Response status:', error.response.status);
      }
      
      throw new Error(`Failed to search Airbnb listings via Apify: ${error.message}`);
    }
  }

  /**
   * Make HTTP request helper
   * @param {string} url - Request URL
   * @param {Object} options - Request options
   * @returns {Promise<Object>} Response data
   */
  async makeHttpRequest(url, options) {
    return new Promise((resolve, reject) => {
      const urlObj = new URL(url);
      const requestOptions = {
        hostname: urlObj.hostname,
        port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
        path: urlObj.pathname + urlObj.search,
        method: options.method || 'GET',
        headers: options.headers || {}
      };

      const req = https.request(requestOptions, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          try {
            const jsonData = JSON.parse(data);
            if (res.statusCode >= 200 && res.statusCode < 300) {
              resolve(jsonData);
            } else {
              reject(new Error(`HTTP ${res.statusCode}: ${jsonData.error || data}`));
            }
          } catch (error) {
            reject(new Error(`Failed to parse response: ${error.message}`));
          }
        });
      });
      
      req.on('error', (error) => {
        reject(error);
      });
      
      if (options.body) {
        req.write(options.body);
      }
      
      req.end();
    });
  }
}

// Export singleton instance - support multiple env variable naming conventions
const airbnbScraper = new AirbnbScraper(
  process.env.APIFY_API_TOKEN || process.env.AIRBNB_SCRAPER_API_KEY, // API key/token
  process.env.AIRBNB_SCRAPER_ACTOR_ID || process.env.APIFY_ACTOR_ID,
  process.env.AIRBNB_SCRAPER_API_URL, // Only for non-Apify custom APIs
  process.env.AIRBNB_SCRAPER_API_KEY  // Only for non-Apify custom APIs
);

module.exports = {
  AirbnbScraper,
  airbnbScraper
};