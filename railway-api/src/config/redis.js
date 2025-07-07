// Get Redis URL with minimal logging
function getRedisUrl() {
  
  // Try multiple possible env var names
  const possibleRedisVars = [
    'REDIS_URL',
    'REDIS_PRIVATE_URL', 
    'REDIS_PUBLIC_URL',
    'RAILWAY_REDIS_URL',
    'REDISCLOUD_URL',
    'REDISTOGO_URL'
  ];
  
  let redisUrl = null;
  
  for (const varName of possibleRedisVars) {
    if (process.env[varName]) {
      redisUrl = process.env[varName];
      break;
    }
  }
  
  // Fallback to localhost if no Redis URL found
  if (!redisUrl) {
    console.error('WARNING: No Redis URL found in environment, using localhost');
    redisUrl = 'redis://localhost:6379';
  }
  
  return redisUrl;
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