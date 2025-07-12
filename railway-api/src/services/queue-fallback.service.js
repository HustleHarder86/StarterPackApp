const logger = require('./logger.service');

/**
 * Fallback service for when Redis is not available
 * Processes jobs synchronously instead of using queues
 */
class QueueFallbackService {
  constructor() {
    this.jobs = new Map();
    this.jobCounter = 0;
  }

  /**
   * Create a fake job that processes synchronously
   */
  async addJob(queueName, jobName, data, processor) {
    const jobId = `fallback-${++this.jobCounter}`;
    
    const job = {
      id: jobId,
      queueName,
      jobName,
      data,
      state: 'active',
      progress: { percentage: 0, message: 'Starting...' },
      createdAt: new Date().toISOString(),
      result: null,
      error: null
    };
    
    this.jobs.set(jobId, job);
    
    logger.info(`Fallback job created`, { jobId, queueName, jobName });
    
    // Process asynchronously
    this.processJob(job, processor).catch(error => {
      logger.error('Fallback job processing error', { jobId, error: error.message });
    });
    
    return {
      id: jobId,
      updateProgress: async (progress) => {
        job.progress = progress;
      }
    };
  }

  /**
   * Process the job
   */
  async processJob(job, processor) {
    try {
      // Simulate job processing
      job.state = 'active';
      job.progress = { percentage: 10, message: 'Processing...' };
      
      // Run the processor
      const result = await processor({
        ...job,
        updateProgress: async (progress) => {
          job.progress = progress;
        }
      });
      
      // Mark as completed
      job.state = 'completed';
      job.result = result;
      job.finishedAt = new Date().toISOString();
      
      logger.info(`Fallback job completed`, { jobId: job.id });
      
    } catch (error) {
      job.state = 'failed';
      job.error = error.message;
      job.stacktrace = error.stack;
      job.finishedAt = new Date().toISOString();
      
      logger.error(`Fallback job failed`, { 
        jobId: job.id, 
        error: error.message 
      });
      
      throw error;
    }
  }

  /**
   * Get job status
   */
  async getJobStatus(jobId) {
    const job = this.jobs.get(jobId);
    if (!job) return null;
    
    return {
      jobId: job.id,
      state: job.state,
      progress: job.progress,
      createdAt: job.createdAt,
      processedAt: job.createdAt, // Same as created for fallback
      finishedAt: job.finishedAt,
      result: job.result,
      error: job.error,
      stacktrace: job.stacktrace
    };
  }

  /**
   * Check if Redis is available
   */
  static isRedisAvailable() {
    return !!(
      process.env.REDIS_URL || 
      process.env.REDIS_PRIVATE_URL || 
      process.env.RAILWAY_REDIS_URL
    );
  }
}

module.exports = new QueueFallbackService();