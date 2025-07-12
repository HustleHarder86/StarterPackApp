const { getRailwayRedisConfig } = require('./railway-redis');

// Get Redis URL with enhanced Railway support
function getRedisUrl() {
  // First try Railway-specific configuration
  const railwayUrl = getRailwayRedisConfig();
  if (railwayUrl) {
    return railwayUrl;
  }
  
  // Fallback to localhost if no Redis URL found
  console.error('WARNING: No Redis URL found in environment, using localhost');
  console.log('Available environment variables:', Object.keys(process.env).filter(k => 
    k.includes('REDIS') || k.includes('redis') || k.includes('RAILWAY')
  ));
  
  // For now, return null to force fallback mode instead of trying localhost
  return null;
}

// Export the Redis URL
module.exports = {
  redisUrl: getRedisUrl(),
  redisOptions: {
    maxRetriesPerRequest: 3,
    enableReadyCheck: false,
    retryStrategy: (times) => {
      if (times > 3) {
        return null; // Stop retrying
      }
      return Math.min(times * 100, 3000);
    }
  }
};