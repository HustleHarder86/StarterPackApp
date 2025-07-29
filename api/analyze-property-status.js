/**
 * Property Analysis Status Endpoint
 * Checks the status of an async analysis job
 */

const { applyCorsHeaders } = require('../utils/cors-config.js');

module.exports = async function handler(req, res) {
  // Apply proper CORS headers
  applyCorsHeaders(req, res);

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get job ID from query params
    const jobId = req.query.jobId;
    
    if (!jobId) {
      return res.status(400).json({ error: 'Missing jobId parameter' });
    }
    
    // Import jobs from async handler
    const asyncHandler = require('./analyze-property-async.js');
    const jobs = asyncHandler.jobs;
    
    // Get job status
    const job = jobs.get(jobId);
    
    if (!job) {
      return res.status(404).json({ 
        error: 'Job not found',
        jobId,
        message: 'Job may have expired or does not exist'
      });
    }
    
    // Return job status
    const response = {
      jobId: job.id,
      status: job.status,
      createdAt: job.createdAt,
      startedAt: job.startedAt,
      completedAt: job.completedAt
    };
    
    // Include result or error based on status
    if (job.status === 'completed' && job.result) {
      response.result = job.result;
    } else if (job.status === 'failed' && job.error) {
      response.error = job.error;
    }
    
    // Add progress info if still processing
    if (job.status === 'processing' && job.startedAt) {
      response.elapsedSeconds = Math.floor((Date.now() - job.startedAt) / 1000);
      response.message = 'Analysis in progress. This may take up to 2 minutes for Airbnb data collection.';
    }
    
    console.log(`[Status Check] Job ${jobId}: ${job.status}`);
    
    return res.status(200).json(response);
    
  } catch (error) {
    console.error('[Status Check] Error checking job status:', error);
    return res.status(500).json({ 
      error: 'Failed to check analysis status',
      details: error.message 
    });
  }
};