// Production start script that ensures proper environment propagation
const { spawn } = require('child_process');
const logger = require('./src/services/logger.service');
const { redisUrl } = require('./src/config/redis');

// Log environment for debugging
logger.info('Starting production services with environment:', {
  NODE_ENV: process.env.NODE_ENV,
  RAILWAY_ENVIRONMENT: process.env.RAILWAY_ENVIRONMENT,
  HAS_REDIS_URL: !!process.env.REDIS_URL,
  REDIS_URL_PREFIX: process.env.REDIS_URL ? process.env.REDIS_URL.substring(0, 30) + '...' : 'NOT SET',
  REDIS_CONFIG_URL: redisUrl ? 'Configured' : 'Not configured'
});

// Start the main server
logger.info('Starting main server...');
const server = spawn('node', ['src/server.js'], {
  stdio: 'inherit',
  env: process.env // Explicitly pass environment
});

// Variable to hold workers process
let workers = null;

// Only start workers if Redis is configured
if (redisUrl) {
  // Wait a bit for server to initialize
  setTimeout(() => {
    logger.info('Starting workers (Redis available)...');
    workers = spawn('node', ['src/start-workers.js'], {
      stdio: 'inherit',
      env: process.env // Explicitly pass environment
    });
    
    workers.on('exit', (code) => {
      logger.error('Workers exited with code:', code);
      // Don't exit the main process if workers fail
      // This allows the API to continue running without background jobs
    });
  }, 5000); // Wait 5 seconds
} else {
  logger.warn('NOT starting workers - Redis not configured');
  logger.info('API will run without background job processing');
  logger.info('To enable background jobs, set REDIS_URL in Railway environment variables');
}

server.on('exit', (code) => {
  logger.error('Server exited with code:', code);
  process.exit(code);
});

// Handle shutdown
process.on('SIGTERM', () => {
  logger.info('Received SIGTERM, shutting down...');
  server.kill();
  if (workers) {
    workers.kill();
  }
});