// Production start script that ensures proper environment propagation
const { spawn } = require('child_process');
const logger = require('./src/services/logger.service');

// Log environment for debugging
logger.info('Starting production services with environment:', {
  NODE_ENV: process.env.NODE_ENV,
  RAILWAY_ENVIRONMENT: process.env.RAILWAY_ENVIRONMENT,
  HAS_REDIS_URL: !!process.env.REDIS_URL,
  REDIS_URL_PREFIX: process.env.REDIS_URL ? process.env.REDIS_URL.substring(0, 30) + '...' : 'NOT SET'
});

// Start the main server
logger.info('Starting main server...');
const server = spawn('node', ['src/server.js'], {
  stdio: 'inherit',
  env: process.env // Explicitly pass environment
});

// Wait a bit for server to initialize
setTimeout(() => {
  logger.info('Starting workers...');
  const workers = spawn('node', ['src/start-workers.js'], {
    stdio: 'inherit',
    env: process.env // Explicitly pass environment
  });
  
  workers.on('exit', (code) => {
    logger.error('Workers exited with code:', code);
    process.exit(code);
  });
}, 5000); // Wait 5 seconds

server.on('exit', (code) => {
  logger.error('Server exited with code:', code);
  process.exit(code);
});

// Handle shutdown
process.on('SIGTERM', () => {
  logger.info('Received SIGTERM, shutting down...');
  server.kill();
  workers.kill();
});