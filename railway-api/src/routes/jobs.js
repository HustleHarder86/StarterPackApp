const express = require('express');
const router = express.Router();
const { optionalAuth } = require('../middleware/auth');
const { getJobStatus } = require('../services/queue.service');
const { APIError } = require('../middleware/errorHandler');
const logger = require('../services/logger.service');

// Get job status
router.get('/:jobId/status', optionalAuth, async (req, res, next) => {
  try {
    const { jobId } = req.params;
    
    // Determine queue name from job ID prefix or default to analysis
    let queueName = 'analysis';
    if (jobId.includes('-str-')) {
      queueName = 'str';
    } else if (jobId.includes('-report-')) {
      queueName = 'report';
    }
    
    const status = await getJobStatus(queueName, jobId);
    
    if (!status) {
      throw new APIError('Job not found', 404);
    }
    
    // Format response based on job state
    const response = {
      jobId: status.jobId,
      state: status.state,
      progress: status.progress,
      createdAt: status.createdAt,
      processedAt: status.processedAt,
      finishedAt: status.finishedAt
    };
    
    // Add appropriate message based on progress
    if (status.state === 'active') {
      response.message = getProgressMessage(status.progress);
    } else if (status.state === 'completed') {
      response.message = 'Analysis complete!';
      response.result = status.result;
    } else if (status.state === 'failed') {
      response.message = 'Analysis failed';
      response.error = status.error;
    } else if (status.state === 'waiting') {
      response.message = 'Waiting in queue...';
    } else {
      response.message = 'Processing...';
    }
    
    res.json(response);
    
  } catch (error) {
    next(error);
  }
});

// Helper to get human-readable progress messages
function getProgressMessage(progress) {
  if (progress === 0) return 'Starting analysis...';
  if (progress < 20) return 'Validating property data...';
  if (progress < 40) return 'Fetching market data from AI...';
  if (progress < 60) return 'Analyzing rental rates...';
  if (progress < 80) return 'Calculating financial metrics...';
  if (progress < 100) return 'Generating recommendations...';
  return 'Finalizing analysis...';
}

module.exports = router;