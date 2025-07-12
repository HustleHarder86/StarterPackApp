const { Queue, Worker, QueueEvents } = require('bullmq');
const config = require('../config');
const { redisUrl } = require('../config/redis');
const logger = require('./logger.service');

// Check if Redis is available
if (!redisUrl) {
  logger.error('Redis URL not configured - queue service will not be available');
  // Export empty module to prevent crashes
  module.exports = {
    queues: {},
    queueEvents: {},
    addJobWithProgress: async () => { throw new Error('Queue service not available - Redis not configured'); },
    getJobStatus: async () => { throw new Error('Queue service not available - Redis not configured'); },
    updateJobProgress: async () => { throw new Error('Queue service not available - Redis not configured'); },
    checkQueueHealth: async () => ({ error: 'Redis not configured' })
  };
  return;
}

// BullMQ Redis configuration
logger.debug('Initializing BullMQ with Redis connection');

// Queue configuration
const queueConfig = {
  connection: {
    url: redisUrl
  },
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000
    },
    removeOnComplete: {
      age: 24 * 3600, // Keep completed jobs for 24 hours
      count: 100      // Keep last 100 completed jobs
    },
    removeOnFail: {
      age: 7 * 24 * 3600 // Keep failed jobs for 7 days
    }
  }
};

// Create queues
const queues = {
  analysis: new Queue('property-analysis', queueConfig),
  str: new Queue('str-analysis', queueConfig),
  report: new Queue('report-generation', queueConfig)
};

// Queue events for monitoring
const queueEvents = {
  analysis: new QueueEvents('property-analysis', { connection: queueConfig.connection }),
  str: new QueueEvents('str-analysis', { connection: queueConfig.connection }),
  report: new QueueEvents('report-generation', { connection: queueConfig.connection })
};

// Monitor queue events
Object.entries(queueEvents).forEach(([name, events]) => {
  events.on('completed', ({ jobId, returnvalue }) => {
    logger.info(`Job completed in ${name} queue`, { jobId });
  });
  
  events.on('failed', ({ jobId, failedReason }) => {
    logger.error(`Job failed in ${name} queue`, { jobId, reason: failedReason });
  });
  
  events.on('progress', ({ jobId, data }) => {
    logger.debug(`Job progress in ${name} queue`, { jobId, progress: data });
  });
});

// Helper to add jobs with progress tracking
async function addJobWithProgress(queueName, jobName, data, options = {}) {
  const queue = queues[queueName];
  if (!queue) {
    throw new Error(`Unknown queue: ${queueName}`);
  }
  
  const job = await queue.add(jobName, data, {
    ...queueConfig.defaultJobOptions,
    ...options
  });
  
  logger.info(`Job added to ${queueName} queue`, {
    jobId: job.id,
    jobName,
    data: { ...data, propertyData: data.propertyData ? '[REDACTED]' : undefined }
  });
  
  return job;
}

// Helper to get job status
async function getJobStatus(queueName, jobId) {
  const queue = queues[queueName];
  if (!queue) {
    throw new Error(`Unknown queue: ${queueName}`);
  }
  
  const job = await queue.getJob(jobId);
  if (!job) {
    return null;
  }
  
  const state = await job.getState();
  const progress = job.progress || 0;
  
  const status = {
    jobId: job.id,
    state,
    progress,
    createdAt: new Date(parseInt(job.timestamp)).toISOString(),
    processedAt: job.processedOn ? new Date(job.processedOn).toISOString() : null,
    finishedAt: job.finishedOn ? new Date(job.finishedOn).toISOString() : null
  };
  
  if (state === 'completed') {
    status.result = job.returnvalue;
  } else if (state === 'failed') {
    status.error = job.failedReason;
    status.stacktrace = job.stacktrace;
  }
  
  return status;
}

// Helper to update job progress
async function updateJobProgress(job, progress, message) {
  await job.updateProgress({
    percentage: progress,
    message,
    timestamp: new Date().toISOString()
  });
}

// Clean up old jobs
async function cleanupJobs() {
  try {
    for (const [name, queue] of Object.entries(queues)) {
      const jobs = await queue.clean(
        1000, // grace period
        100,  // limit
        'completed'
      );
      
      if (jobs.length > 0) {
        logger.info(`Cleaned ${jobs.length} completed jobs from ${name} queue`);
      }
    }
  } catch (error) {
    logger.error('Job cleanup error:', error);
  }
}

// Schedule cleanup every hour
setInterval(cleanupJobs, 60 * 60 * 1000);

// Queue health check
async function checkQueueHealth() {
  const health = {};
  
  for (const [name, queue] of Object.entries(queues)) {
    try {
      const counts = await queue.getJobCounts();
      health[name] = {
        status: 'healthy',
        counts
      };
    } catch (error) {
      health[name] = {
        status: 'error',
        error: error.message
      };
    }
  }
  
  return health;
}

module.exports = {
  queues,
  queueEvents,
  addJobWithProgress,
  getJobStatus,
  updateJobProgress,
  checkQueueHealth
};