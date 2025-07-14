// Railway-specific Redis configuration
function getRailwayRedisConfig() {
  console.log('getRailwayRedisConfig - checking for Redis configuration...');
  console.log('Environment check:');
  console.log('  RAILWAY_ENVIRONMENT:', process.env.RAILWAY_ENVIRONMENT || 'not set');
  console.log('  NODE_ENV:', process.env.NODE_ENV || 'not set');
  console.log('  REDIS_URL exists:', !!process.env.REDIS_URL);
  
  // Check for standard REDIS_URL first (Railway's standard pattern)
  if (process.env.REDIS_URL) {
    console.log('Found REDIS_URL environment variable');
    console.log('REDIS_URL prefix:', process.env.REDIS_URL.substring(0, 30) + '...');
    return process.env.REDIS_URL;
  }
  
  // Railway provides Redis connection details as separate environment variables
  if (process.env.RAILWAY_ENVIRONMENT) {
    console.log('Running in Railway environment, checking for individual Redis variables...');
    
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