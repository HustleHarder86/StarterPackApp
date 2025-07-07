# Railway Migration Plan

## Overview
Migrating from Vercel-only architecture to Vercel (frontend) + Railway (backend API) hybrid approach to handle scaling to 100+ paying users.

## Architecture Overview

### Current State (All Vercel)
```
Client → Vercel Functions → External APIs
```

### Target State (Hybrid)
```
Client → Vercel (Static) → 
  ├── Vercel Functions (Light APIs)
  │   ├── /api/user-management
  │   ├── /api/stripe-webhook
  │   └── /api/auth-check
  └── Railway API (Heavy Processing)
      ├── /api/analyze-property
      ├── /api/str-analysis/*
      ├── /api/reports/*
      └── Background Jobs (BullMQ)
```

## Phase 1: Railway Setup (Day 1-2)

### Task 1: Create Railway Project
**MCP Agent Instructions:**
```
1. Create new Railway project
2. Set up PostgreSQL database (for job queue)
3. Set up Redis instance (for caching)
4. Configure environment variables:
   - All Firebase admin SDK vars
   - All AI API keys (Perplexity, OpenAI, Airbnb)
   - Database connection strings
   - CORS allowed origins
```

### Task 2: Express.js API Server
**MCP Agent Instructions:**
```
1. Create railway-api/ directory in project root
2. Initialize Node.js project with Express
3. Set up middleware:
   - CORS (allow Vercel frontend)
   - Body parser
   - Request logging
   - Error handling
4. Create health check endpoint
5. Set up port configuration for Railway
```

**Files to create:**
- `railway-api/package.json`
- `railway-api/server.js`
- `railway-api/middleware/cors.js`
- `railway-api/middleware/auth.js`
- `railway-api/config/index.js`

## Phase 2: API Migration (Day 3-4)

### Task 3: Migrate Heavy Processing APIs
**MCP Agent Instructions:**
```
1. Copy these APIs to railway-api/routes/:
   - analyze-property.js → routes/analysis/property.js
   - str-analysis/analyze.js → routes/analysis/str.js
   - str-analysis/comparables.js → routes/analysis/comparables.js
   - reports/generate.js → routes/reports/generate.js
2. Convert from Vercel function format to Express routes
3. Update imports and module structure
4. Add progress tracking via Redis pub/sub
5. Implement proper error handling for long-running tasks
```

### Task 4: Implement Job Queue
**MCP Agent Instructions:**
```
1. Install BullMQ and dependencies
2. Create job processors for:
   - Property analysis jobs
   - PDF generation jobs
   - Batch analysis jobs
3. Implement job status endpoints
4. Add retry logic for failed jobs
5. Set up job cleanup (remove completed after 24h)
```

**Files to create:**
- `railway-api/queues/analysis.queue.js`
- `railway-api/workers/analysis.worker.js`
- `railway-api/workers/pdf.worker.js`

## Phase 3: Frontend Updates (Day 5)

### Task 5: Update API Calls
**MCP Agent Instructions:**
```
1. Create API configuration file
2. Update all heavy processing API calls to use Railway URL:
   - roi-finder.html
   - portfolio.html
   - reports.html
3. Add environment detection (dev/staging/prod)
4. Implement progress polling for long-running tasks
5. Add fallback error handling
```

**Files to update:**
- `utils/api-config.js` (new)
- `roi-finder.html`
- `portfolio.html`
- `reports.html`

### Task 6: Environment Variable Updates
**MCP Agent Instructions:**
```
1. Add to Vercel env vars:
   - RAILWAY_API_URL
   - RAILWAY_API_KEY (for internal auth)
2. Update build scripts
3. Create .env.example files
```

## Phase 4: Infrastructure (Day 6-7)

### Task 7: Caching Layer
**MCP Agent Instructions:**
```
1. Implement Redis caching for:
   - AI API responses (24h TTL)
   - Property comparables (24h TTL)
   - User rate limits (rolling window)
2. Create cache invalidation strategy
3. Add cache warming for popular queries
```

**Files to create:**
- `railway-api/services/cache.service.js`
- `railway-api/middleware/cache.js`

### Task 8: Monitoring & Logging
**MCP Agent Instructions:**
```
1. Set up structured logging with Winston
2. Implement APM with Railway metrics
3. Create custom dashboards for:
   - API response times
   - Job queue status
   - Error rates
   - AI API usage
4. Set up alerts for failures
```

**Files to create:**
- `railway-api/services/logger.js`
- `railway-api/monitoring/metrics.js`

## Phase 5: Deployment (Day 8-9)

### Task 9: CI/CD Pipeline
**MCP Agent Instructions:**
```
1. Create GitHub Actions workflow for Railway
2. Set up staging environment on Railway
3. Implement blue-green deployment
4. Create deployment scripts
5. Set up automatic rollback on failures
```

**Files to create:**
- `.github/workflows/railway-deploy.yml`
- `scripts/deploy-railway.sh`
- `scripts/health-check.js`

### Task 10: Testing & Validation
**MCP Agent Instructions:**
```
1. Create integration tests for Railway API
2. Load test with 100 concurrent users
3. Test failover scenarios
4. Validate all user workflows
5. Check monitoring and alerts
```

**Files to create:**
- `railway-api/tests/integration/`
- `railway-api/tests/load/`

## Phase 6: Documentation & Cleanup (Day 10)

### Task 11: Update Documentation
**MCP Agent Instructions:**
```
1. Update CLAUDE.md with new architecture
2. Create Railway deployment guide
3. Document new environment variables
4. Update API endpoint documentation
5. Create troubleshooting guide
```

### Task 12: Migration Rollback Plan
**MCP Agent Instructions:**
```
1. Document rollback procedures
2. Create rollback scripts
3. Test rollback in staging
4. Prepare communication templates
```

## Success Metrics

- [ ] All heavy processing APIs respond < 30s
- [ ] Zero timeout errors
- [ ] 99.9% uptime
- [ ] Cost per user < $0.50/month
- [ ] Page load time < 2s
- [ ] Concurrent user support: 100+

## Risk Mitigation

1. **Data Consistency**: Use database transactions
2. **API Failures**: Implement circuit breakers
3. **Cost Overruns**: Set up spending alerts
4. **Security**: API key rotation strategy
5. **Performance**: Auto-scaling configuration

## Timeline

- **Week 1**: Phase 1-3 (Core migration)
- **Week 2**: Phase 4-6 (Polish and deploy)
- **Buffer**: 3 days for unexpected issues

## Next Steps

1. Get Railway account and project set up
2. Begin with Task 1: Railway project creation
3. Daily progress check-ins
4. Staging deployment after Phase 3