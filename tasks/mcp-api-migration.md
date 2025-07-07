# MCP Task: API Migration to Railway

## Objective
Migrate heavy processing APIs from Vercel Functions to Railway Express server.

## APIs to Migrate

### Priority 1 (Heavy Processing)
1. `/api/analyze-property.js` → `/analysis/property`
2. `/api/str-analysis/analyze.js` → `/analysis/str`
3. `/api/str-analysis/comparables.js` → `/analysis/comparables`
4. `/api/reports/generate.js` → `/reports/generate`

### Keep on Vercel (Light Operations)
- `/api/user-management.js`
- `/api/stripe-webhook.js`
- `/api/stripe-create-checkout.js`

## Migration Steps for Each API

### 1. Convert Function Structure

**From (Vercel Function):**
```javascript
export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  // API logic
}
```

**To (Express Route):**
```javascript
const express = require('express');
const router = express.Router();

router.post('/property', async (req, res) => {
  try {
    // API logic (unchanged)
  } catch (error) {
    next(error); // Use error middleware
  }
});

module.exports = router;
```

### 2. Update Import/Export Syntax

**Change all imports from ES6 to CommonJS:**
```javascript
// From
import { initializeAdmin } from '../utils/firebase.js';

// To
const { initializeAdmin } = require('../../services/firebase.service');
```

### 3. Add Progress Tracking

For long-running operations, implement Redis pub/sub:

```javascript
const { redis, publisher } = require('../../services/cache.service');

// In the API handler
const analysisId = generateId();

// Publish progress updates
await publisher.publish('analysis-progress', JSON.stringify({
  analysisId,
  status: 'starting',
  progress: 0
}));

// During processing
await publisher.publish('analysis-progress', JSON.stringify({
  analysisId,
  status: 'fetching-ai-data',
  progress: 30
}));
```

### 4. Implement Job Queue for Heavy Tasks

Convert direct processing to job queue:

```javascript
const { analysisQueue } = require('../../services/queue.service');

router.post('/property', async (req, res) => {
  // Validate input
  const { propertyData, userId } = req.body;
  
  // Add to queue instead of processing directly
  const job = await analysisQueue.add('analyze-property', {
    propertyData,
    userId,
    timestamp: new Date().toISOString()
  });
  
  // Return job ID for status checking
  res.json({
    success: true,
    jobId: job.id,
    statusUrl: `/api/jobs/${job.id}/status`
  });
});
```

### 5. Create Job Status Endpoint

```javascript
router.get('/jobs/:jobId/status', async (req, res) => {
  const job = await analysisQueue.getJob(req.params.jobId);
  
  if (!job) {
    return res.status(404).json({ error: 'Job not found' });
  }
  
  const state = await job.getState();
  const progress = job.progress();
  
  res.json({
    jobId: job.id,
    state,
    progress,
    result: state === 'completed' ? job.returnvalue : null,
    error: state === 'failed' ? job.failedReason : null
  });
});
```

### 6. Update Frontend API Calls

Create `utils/api-client.js`:

```javascript
class APIClient {
  constructor() {
    this.railwayBaseUrl = process.env.RAILWAY_API_URL || 'https://starterpack-api.railway.app';
    this.vercelBaseUrl = '/api';
  }
  
  async analyzeProperty(propertyData) {
    // Submit job
    const response = await fetch(`${this.railwayBaseUrl}/analysis/property`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${await this.getAuthToken()}`
      },
      body: JSON.stringify({ propertyData })
    });
    
    const { jobId } = await response.json();
    
    // Poll for completion
    return this.pollJobStatus(jobId);
  }
  
  async pollJobStatus(jobId, maxAttempts = 60) {
    for (let i = 0; i < maxAttempts; i++) {
      const status = await fetch(`${this.railwayBaseUrl}/jobs/${jobId}/status`);
      const data = await status.json();
      
      if (data.state === 'completed') {
        return data.result;
      }
      
      if (data.state === 'failed') {
        throw new Error(data.error);
      }
      
      // Update UI with progress
      this.onProgress?.(data.progress);
      
      // Wait 1 second before next poll
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    throw new Error('Analysis timeout');
  }
}
```

### 7. Error Handling Updates

Implement comprehensive error handling:

```javascript
// In Railway API
class APIError extends Error {
  constructor(message, statusCode, details) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
  }
}

// Error middleware
app.use((err, req, res, next) => {
  logger.error('API Error:', err);
  
  if (err instanceof APIError) {
    return res.status(err.statusCode).json({
      error: err.message,
      details: err.details
    });
  }
  
  res.status(500).json({
    error: 'Internal server error',
    requestId: req.id
  });
});
```

## Testing Each Migration

### 1. Unit Tests
Create tests for each migrated endpoint:
```javascript
describe('Property Analysis API', () => {
  it('should queue analysis job', async () => {
    const response = await request(app)
      .post('/analysis/property')
      .send({ propertyData: mockData });
      
    expect(response.status).toBe(200);
    expect(response.body.jobId).toBeDefined();
  });
});
```

### 2. Integration Tests
Test the full flow from frontend to Railway:
- Submit analysis request
- Poll for status
- Verify results match Vercel output

### 3. Load Tests
Simulate 100 concurrent users:
```bash
artillery quick -n 100 -c 10 https://api.railway.app/analysis/property
```

## Migration Checklist

For each API endpoint:
- [ ] Convert to Express route format
- [ ] Update imports to CommonJS
- [ ] Add to job queue if > 5s processing
- [ ] Implement progress tracking
- [ ] Create status endpoint
- [ ] Update frontend calls
- [ ] Add error handling
- [ ] Write tests
- [ ] Deploy to staging
- [ ] Verify functionality
- [ ] Update documentation

## Rollback Plan

If issues arise:
1. Keep Vercel functions active during migration
2. Use feature flags to switch between Vercel/Railway
3. Monitor error rates
4. Quick rollback via environment variable change

## Success Metrics

- Response time < 30s for all analyses
- Zero timeout errors
- Job completion rate > 99%
- Error rate < 0.1%