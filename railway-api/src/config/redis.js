const { getRailwayRedisConfig } = require('./railway-redis');

// Get Redis URL with enhanced Railway support
function getRedisUrl() {
  // Check if Redis is explicitly disabled
  if (process.env.DISABLE_REDIS === 'true') {
    console.log('Redis explicitly disabled via DISABLE_REDIS=true');
    return null;
  }
  
  // First try Railway-specific configuration
  const railwayUrl = getRailwayRedisConfig();
  if (railwayUrl) {
    return railwayUrl;
  }
  
  // Log warning about missing Redis
  console.error('WARNING: No Redis URL found in environment');
  console.log('Available environment variables:', Object.keys(process.env).filter(k => 
    k.includes('REDIS') || k.includes('redis') || k.includes('RAILWAY')
  ));
  console.log('System will run without background job processing');
  console.log('To enable Redis, set REDIS_URL in Railway environment variables');
  
  // Return null to disable Redis completely
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