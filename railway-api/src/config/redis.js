// Get Redis URL with extensive debugging
function getRedisUrl() {
  // Use console.log for debugging to avoid circular dependencies
  console.log('=== REDIS CONFIG INITIALIZATION ===');
  console.log('NODE_ENV:', process.env.NODE_ENV);
  console.log('All env vars:', Object.keys(process.env).sort().join(', '));
  console.log('Redis-related env vars:', Object.keys(process.env).filter(k => k.toLowerCase().includes('redis')));
  
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
      console.log(`Found Redis URL in ${varName}:`, redisUrl.substring(0, 50) + '...');
      break;
    }
  }
  
  // Fallback to localhost if no Redis URL found
  if (!redisUrl) {
    console.warn('No Redis URL found in environment, using localhost');
    redisUrl = 'redis://localhost:6379';
  }
  
  // Parse and validate the URL
  try {
    const url = new URL(redisUrl);
    console.log('Redis connection details:', {
      protocol: url.protocol,
      hostname: url.hostname,
      port: url.port,
      hasAuth: !!url.password
    });
  } catch (error) {
    console.error('Invalid Redis URL format:', error.message);
  }
  
  console.log('Final Redis URL:', redisUrl);
  console.log('===================================');
  
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