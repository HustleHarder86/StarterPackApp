// Start workers for processing background jobs

// Only load dotenv in development
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

const logger = require('./services/logger.service');

logger.info('Starting workers...');

// Import workers after a delay to ensure config is loaded
setTimeout(() => {
  const analysisWorker = require('./workers/analysis.worker');
  const strAnalysisWorker = require('./workers/str-analysis.worker');
  
  logger.info('Workers loaded');
  
  // Add health checks
  setInterval(() => {
    logger.info('Worker health check', {
      analysisWorker: analysisWorker.isRunning() ? 'running' : 'stopped',
      strAnalysisWorker: strAnalysisWorker.isRunning() ? 'running' : 'stopped'
    });
  }, 60000); // Every minute
}, 2000); // Wait 2 seconds for config to load

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('Received SIGTERM, shutting down workers...');
  await analysisWorker.close();
  await strAnalysisWorker.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('Received SIGINT, shutting down workers...');
  await analysisWorker.close();
  await strAnalysisWorker.close();
  process.exit(0);
});

logger.info('Workers started successfully');