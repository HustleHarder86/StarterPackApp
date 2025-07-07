// This file runs before anything else to debug environment variables
console.log('STARTUP_DEBUG: Checking Redis environment variables...');

// Only check Redis-related variables to avoid truncation
const allEnvVars = Object.keys(process.env);
console.log(`STARTUP_DEBUG: Total env vars: ${allEnvVars.length}`);

// Find any Redis-related variables
const redisRelated = allEnvVars.filter(key => 
  key.toUpperCase().includes('REDIS') || 
  key === 'DATABASE_URL' ||
  (key.includes('RAILWAY') && process.env[key]?.includes('redis'))
);

console.log(`STARTUP_DEBUG: Found ${redisRelated.length} Redis-related vars:`, redisRelated.join(', '));

// Show Redis values
redisRelated.forEach(key => {
  const value = process.env[key];
  if (value && value.includes('redis')) {
    console.log(`STARTUP_DEBUG: ${key}=${value.substring(0, 60)}...`);
  }
});

// Explicitly check common Redis env vars
['REDIS_URL', 'REDIS_PRIVATE_URL', 'REDIS_PUBLIC_URL', 'RAILWAY_REDIS_URL'].forEach(key => {
  if (!redisRelated.includes(key)) {
    console.log(`STARTUP_DEBUG: ${key}=NOT_SET`);
  }
});

// Also check if there's a Railway service variable pattern
const railwayServiceVars = allEnvVars.filter(key => 
  key.startsWith('RAILWAY_SERVICE_') && key.includes('REDIS')
);
if (railwayServiceVars.length > 0) {
  console.log('STARTUP_DEBUG: Railway service vars:', railwayServiceVars);
}

console.log('STARTUP_DEBUG: Complete');