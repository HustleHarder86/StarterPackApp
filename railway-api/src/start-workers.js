// Start workers for processing background jobs

// Run startup debug FIRST
require('./startup-debug');

// Only load dotenv in development
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

const logger = require('./services/logger.service');

// Import workers
const analysisWorker = require('./workers/analysis.worker');

logger.info('Starting workers...');

// Workers are automatically started when imported
// Add health checks
setInterval(() => {
  logger.info('Worker health check', {
    analysisWorker: analysisWorker.isRunning() ? 'running' : 'stopped'
  });
}, 60000); // Every minute

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('Received SIGTERM, shutting down workers...');
  await analysisWorker.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('Received SIGINT, shutting down workers...');
  await analysisWorker.close();
  process.exit(0);
});

logger.info('Workers started successfully');