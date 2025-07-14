const { Worker } = require('bullmq');
const config = require('../config');
const logger = require('../services/logger.service');

// Delay worker creation to ensure Redis config is loaded
let analysisWorker = null;

function createWorker() {
  const { redisUrl } = require('../config/redis');
  
  if (!redisUrl) {
    logger.error('Cannot create analysis worker - Redis URL not configured');
    return null;
  }
  
  logger.info('Creating analysis worker with Redis URL:', redisUrl.substring(0, 20) + '...');
  
  const { updateJobProgress } = require('../services/queue.service');
  const { cache } = require('../services/cache.service');
  const { trackAPIUsage } = require('../services/firebase.service');
  const { analyzePropertyLogic } = require('../services/property-analysis.service');

  // Create the worker
  return new Worker(
  'property-analysis',
  async (job) => {
    const { propertyData, userId, userEmail, userName, requestType, propertyAddress } = job.data;
    
    logger.info('Processing property analysis job', {
      jobId: job.id,
      propertyAddress,
      userId
    });
    
    try {
      // Update progress: Starting
      await updateJobProgress(job, 0, 'Starting property analysis...');
      
      // Check cache first
      const cacheKey = `analysis:${propertyAddress}:${JSON.stringify(propertyData)}`;
      const cachedResult = await cache.get(cacheKey);
      
      if (cachedResult && !requestType?.includes('fresh')) {
        logger.info('Returning cached analysis', { jobId: job.id });
        await updateJobProgress(job, 100, 'Analysis complete (cached)');
        return cachedResult;
      }
      
      // Update progress: Validating
      await updateJobProgress(job, 10, 'Validating property data...');
      
      // Run the actual analysis
      const result = await analyzePropertyLogic({
        propertyAddress,
        propertyData,
        userId,
        userEmail,
        userName,
        requestType,
        onProgress: async (progress, message) => {
          await updateJobProgress(job, progress, message);
        }
      });
      
      // Cache the result
      await cache.set(cacheKey, result, 24 * 3600); // Cache for 24 hours
      
      // Track API usage
      if (userId) {
        await trackAPIUsage(userId, 'property-analysis', result.apiCosts?.totalTokens || 0);
      }
      
      // Update progress: Complete
      await updateJobProgress(job, 100, 'Analysis complete!');
      
      logger.info('Property analysis completed', {
        jobId: job.id,
        propertyAddress,
        success: true
      });
      
      return result;
      
    } catch (error) {
      logger.error('Property analysis failed', {
        jobId: job.id,
        error: error.message,
        stack: error.stack
      });
      
      // Update progress with error
      await updateJobProgress(job, -1, `Analysis failed: ${error.message}`);
      
      throw error;
    }
  },
  {
    connection: {
      url: redisUrl
    },
    concurrency: 5, // Process up to 5 jobs concurrently
    limiter: {
      max: 10,
      duration: 60000 // Max 10 jobs per minute
    }
  }
  );
  
  // Worker event handlers
  worker.on('completed', (job) => {
    logger.info('Analysis job completed', { jobId: job.id });
  });

  worker.on('failed', (job, err) => {
    logger.error('Analysis job failed', {
      jobId: job.id,
      error: err.message
    });
  });

  worker.on('error', (err) => {
    logger.error('Analysis worker error', { error: err.message });
  });
  
  return worker;
}

// Initialize worker with delay
setTimeout(() => {
  analysisWorker = createWorker();
  if (analysisWorker) {
    logger.info('Analysis worker created successfully');
  }
}, 1000); // Wait 1 second for Redis config to load

// Graceful shutdown
process.on('SIGTERM', async () => {
  if (analysisWorker) {
    logger.info('Shutting down analysis worker...');
    await analysisWorker.close();
  }
});

// Export a getter function instead of the worker directly
module.exports = {
  get worker() { return analysisWorker; },
  isRunning: () => analysisWorker && analysisWorker.isRunning()
};