// This file runs before anything else to debug environment variables
console.log('\n\n=== STARTUP DEBUG - ENVIRONMENT VARIABLES ===');
console.log('Current time:', new Date().toISOString());
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('PORT:', process.env.PORT);

// Check for Redis-related variables
const redisVars = Object.keys(process.env).filter(key => 
  key.toLowerCase().includes('redis') || 
  key.toLowerCase().includes('railway')
);

console.log('\nRedis/Railway related env vars found:', redisVars.length > 0 ? redisVars : 'NONE');

// Check specific Redis variables
const checkVars = [
  'REDIS_URL',
  'REDIS_PRIVATE_URL',
  'REDIS_PUBLIC_URL', 
  'RAILWAY_REDIS_URL',
  'RAILWAY_PRIVATE_REDIS_URL',
  'REDISCLOUD_URL',
  'DATABASE_URL'
];

console.log('\nChecking specific Redis variables:');
checkVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    console.log(`${varName}: ${value.substring(0, 50)}...`);
  } else {
    console.log(`${varName}: NOT SET`);
  }
});

// Show all env vars (be careful with secrets)
console.log('\nALL environment variables:');
Object.keys(process.env).sort().forEach(key => {
  // Hide sensitive values
  if (key.includes('KEY') || key.includes('SECRET') || key.includes('PASSWORD')) {
    console.log(`${key}: [HIDDEN]`);
  } else {
    const value = process.env[key];
    if (value && value.length > 100) {
      console.log(`${key}: ${value.substring(0, 50)}... (truncated)`);
    } else {
      console.log(`${key}: ${value}`);
    }
  }
});

console.log('\n=== END STARTUP DEBUG ===\n\n');