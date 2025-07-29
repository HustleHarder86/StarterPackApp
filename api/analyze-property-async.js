/**
 * Async Property Analysis Endpoint
 * Initiates analysis on Railway and returns a job ID for polling
 */

const { applyCorsHeaders } = require('../utils/cors-config.js');
const crypto = require('crypto');

// In-memory job storage (use Redis or Firebase for production)
const jobs = new Map();

// Clean up old jobs after 10 minutes
setInterval(() => {
  const tenMinutesAgo = Date.now() - 10 * 60 * 1000;
  for (const [jobId, job] of jobs.entries()) {
    if (job.createdAt < tenMinutesAgo) {
      jobs.delete(jobId);
    }
  }
}, 60000); // Run every minute

module.exports = async function handler(req, res) {
  // Apply proper CORS headers
  applyCorsHeaders(req, res);

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Generate a unique job ID
    const jobId = crypto.randomUUID();
    
    console.log('[Async Proxy] Starting async analysis with job ID:', jobId);
    
    // Store job metadata
    jobs.set(jobId, {
      id: jobId,
      status: 'pending',
      createdAt: Date.now(),
      requestData: req.body,
      userId: req.headers.authorization?.split(' ')[1] || 'anonymous'
    });
    
    // Get Railway API URL from environment
    const railwayUrl = process.env.RAILWAY_API_URL || 'https://real-estate-app-production-ba5c.up.railway.app';
    const endpoint = `${railwayUrl}/api/analysis/property`;
    
    // Start the analysis in the background (don't await)
    processAnalysisAsync(jobId, endpoint, req.headers, req.body);
    
    // Immediately return the job ID
    return res.status(202).json({
      jobId,
      status: 'processing',
      message: 'Analysis started. Poll /api/analyze-property-status?jobId=' + jobId
    });
    
  } catch (error) {
    console.error('[Async Proxy] Error initiating analysis:', error);
    return res.status(500).json({ 
      error: 'Failed to start property analysis',
      details: error.message 
    });
  }
};

async function processAnalysisAsync(jobId, endpoint, headers, body) {
  const job = jobs.get(jobId);
  if (!job) return;
  
  try {
    console.log('[Async Processor] Starting Railway API call for job:', jobId);
    job.status = 'processing';
    job.startedAt = Date.now();
    
    // Call Railway API with a longer timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 300000); // 5 minute timeout
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': headers.authorization || '',
        'X-Internal-API-Key': process.env.INTERNAL_API_KEY || '',
        'X-Service': 'vercel-async',
        'X-Request-ID': jobId,
        'X-Job-ID': jobId
      },
      body: JSON.stringify(body),
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    const data = await response.json();
    
    if (!response.ok) {
      console.error('[Async Processor] Railway API error for job:', jobId, response.status, data);
      job.status = 'failed';
      job.error = data;
      job.completedAt = Date.now();
      return;
    }
    
    console.log('[Async Processor] Successfully completed job:', jobId);
    job.status = 'completed';
    job.result = data;
    job.completedAt = Date.now();
    
  } catch (error) {
    console.error('[Async Processor] Error processing job:', jobId, error);
    job.status = 'failed';
    job.error = {
      error: 'Analysis failed',
      details: error.message,
      type: error.name
    };
    job.completedAt = Date.now();
  }
}

// Export jobs for status endpoint
module.exports.jobs = jobs;