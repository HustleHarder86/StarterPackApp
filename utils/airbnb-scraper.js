// Apify client wrapper for Airbnb Scraper integration
const { ApifyClient } = require('apify-client');

class AirbnbScraper {
  constructor(apiToken, actorId) {
    this.apiToken = apiToken;
    this.actorId = actorId || 'NDa1latMI7JHJzSYU'; // Default Airbnb Scraper actor ID
    this.baseUrl = 'https://api.apify.com/v2';
    
    // Initialize Apify client if token is provided
    if (this.apiToken) {
      this.client = new ApifyClient({
        token: this.apiToken
      });
    }
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
    
    // Build query with correct parameters for Apify Airbnb Scraper
    const query = {
      locationQueries: [location], // Changed from 'location' to 'locationQueries' array
      currency: 'CAD',
      locale: 'en-US',
      // Add price limits to control costs and reduce result count
      priceMin: 50,    // Minimum $50 CAD per night
      priceMax: 500    // Maximum $500 CAD per night
    };

    // Add filters based on property characteristics
    if (property.bedrooms) {
      query.minBedrooms = Math.max(1, property.bedrooms - 1);
      // Note: maxBedrooms is not supported by the actor
    }
    
    if (property.bathrooms) {
      query.minBathrooms = Math.max(1, property.bathrooms - 1);
    }
    
    // Set reasonable number of adults based on bedrooms
    query.adults = property.bedrooms ? property.bedrooms * 2 : 4;

    console.log('Built Apify query:', JSON.stringify(query, null, 2));
    
    return query;
  }

  /**
   * Execute Airbnb search via Apify
   * @param {Object} property - Property to find comparables for
   * @returns {Promise<Object>} Search results
   */
  async searchComparables(property) {
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
      
      // Process and format the results
      const processedListings = items.map(item => ({
        id: item.id || item.listingId,
        title: item.name || item.title,
        price: item.price || item.pricing?.basePrice || 0,
        nightly_price: item.price || item.pricing?.basePrice || 0,
        bedrooms: item.bedrooms || 0,
        bathrooms: item.bathrooms || 0,
        property_type: item.propertyType || item.roomType || 'Unknown',
        occupancy_rate: item.occupancyRate || null,
        url: item.url || `https://www.airbnb.com/rooms/${item.id}`,
        location: {
          latitude: item.location?.lat || item.latitude,
          longitude: item.location?.lng || item.longitude,
          address: item.address
        },
        amenities: item.amenities || [],
        rating: item.rating || item.starRating,
        reviewsCount: item.reviewsCount || item.numberOfGuests || 0
      }));
      
      return {
        success: true,
        listings: processedListings,
        metadata: {
          location: input.location,
          totalResults: items.length,
          searchParams: input,
          runId: run.id,
          actorRunUrl: `https://console.apify.com/actors/${this.actorId}/runs/${run.id}`
        }
      };

    } catch (error) {
      console.error('Airbnb Scraper Error:', error);
      
      // Log more details for debugging
      if (error.response) {
        console.error('Response data:', error.response.data);
        console.error('Response status:', error.response.status);
      }
      
      throw new Error(`Failed to search Airbnb listings: ${error.message}`);
    }
  }
}

// Export singleton instance
const airbnbScraper = new AirbnbScraper(
  process.env.APIFY_API_TOKEN,
  process.env.AIRBNB_SCRAPER_ACTOR_ID
);

module.exports = {
  AirbnbScraper,
  airbnbScraper
};