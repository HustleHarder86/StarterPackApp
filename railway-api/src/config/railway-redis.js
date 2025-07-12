// Railway-specific Redis configuration
function getRailwayRedisConfig() {
  // Railway provides Redis connection details as separate environment variables
  if (process.env.RAILWAY_ENVIRONMENT) {
    console.log('Running in Railway environment');
    
    // Check for Railway's Redis variables
    const redisVars = {
      REDIS_HOST: process.env.REDIS_HOST,
      REDIS_PORT: process.env.REDIS_PORT,
      REDIS_PASSWORD: process.env.REDIS_PASSWORD,
      REDIS_USERNAME: process.env.REDIS_USERNAME || 'default'
    };
    
    console.log('Railway Redis variables:');
    Object.entries(redisVars).forEach(([key, value]) => {
      console.log(`  ${key}: ${value ? '✓ Found' : '✗ Not found'}`);
    });
    
    // If we have the individual components, build the URL
    if (redisVars.REDIS_HOST && redisVars.REDIS_PORT) {
      let redisUrl = 'redis://';
      
      // Add auth if available
      if (redisVars.REDIS_PASSWORD) {
        redisUrl += `${redisVars.REDIS_USERNAME}:${redisVars.REDIS_PASSWORD}@`;
      }
      
      // Add host and port
      redisUrl += `${redisVars.REDIS_HOST}:${redisVars.REDIS_PORT}`;
      
      console.log('Built Railway Redis URL from components');
      return redisUrl;
    }
  }
  
  // Check for standard REDIS_URL
  if (process.env.REDIS_URL) {
    console.log('Using REDIS_URL environment variable');
    return process.env.REDIS_URL;
  }
  
  // Check for other common Redis URL variables
  const urlVars = [
    'REDIS_PRIVATE_URL',
    'REDIS_PUBLIC_URL', 
    'REDISCLOUD_URL',
    'REDISTOGO_URL'
  ];
  
  for (const varName of urlVars) {
    if (process.env[varName]) {
      console.log(`Using ${varName} environment variable`);
      return process.env[varName];
    }
  }
  
  return null;
}

module.exports = {
  getRailwayRedisConfig
};