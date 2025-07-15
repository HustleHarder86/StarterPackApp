# StarterPackApp Architecture Guide

## 🚨 CRITICAL: DUAL-DEPLOYMENT ARCHITECTURE 🚨

**READ THIS BEFORE ADDING ANY FEATURE OR DEBUGGING**

This project uses a **DUAL-DEPLOYMENT ARCHITECTURE** that MUST be followed:

⚠️ **UPDATE (January 15, 2025)**: Redis and job queues have been removed. See "Simplified Architecture" section below.

## Deployment Separation

### 1. Railway API (`/railway-api/`) - Heavy Processing Backend

**PURPOSE**: Handles ALL computationally expensive operations

**WHAT GOES HERE**:
- ✅ External API calls (Perplexity, OpenAI, Airbnb, etc.)
- ✅ Database operations (complex queries, aggregations)
- ✅ Background jobs (using BullMQ job queue)
- ✅ PDF generation and file processing
- ✅ Any operation taking >1 second
- ✅ Rate-limited operations
- ✅ Expensive computations
- ✅ Webhook processing
- ✅ Scheduled tasks/cron jobs

**ENDPOINTS**: `https://real-estate-app-production-ba5c.up.railway.app/api/*`

**TECH STACK**:
- Express.js server
- ~~BullMQ for job queues~~ (Removed Jan 15, 2025)
- ~~Redis for caching~~ (Replaced with in-memory cache)
- ~~Workers for background processing~~ (Direct processing now)

### 2. Vercel (`/api/`) - Simple Frontend Functions

**PURPOSE**: Serves static files and handles ONLY simple, fast operations

**WHAT GOES HERE**:
- ✅ Static file serving (HTML, CSS, JS)
- ✅ Simple form submissions (contact, lead capture)
- ✅ Basic data validation (<100ms operations)
- ✅ Simple redirects
- ❌ NO external API calls
- ❌ NO heavy processing
- ❌ NO complex calculations
- ❌ NO file generation

**ENDPOINTS**: `https://starterpackapp.vercel.app/api/*`

**LIMITATIONS**:
- 10 second timeout (can't handle long operations)
- Limited compute resources
- No background processing

## Common Mistakes to Avoid

### ❌ NEVER Do This:
1. **Put API integrations in `/api/` (Vercel)**
   ```javascript
   // ❌ WRONG - This belongs in Railway!
   // File: /api/analyze-with-ai.js
   const result = await openai.complete(...);
   ```

2. **Put heavy processing in Vercel functions**
   ```javascript
   // ❌ WRONG - This will timeout!
   // File: /api/generate-report.js
   const pdf = await generatePDF(data);
   ```

3. **~~Bypass the job queue for long operations~~** (Job queues removed)
   ```javascript
   // ✅ NOW CORRECT - Direct processing
   // File: /railway-api/routes/analysis.js
   const analysis = await runComplexAnalysis(data); // Railway has 5min timeout
   ```

### ✅ CORRECT Approach:
1. **External APIs go in Railway**
   ```javascript
   // ✅ CORRECT (Updated - no queues)
   // File: /railway-api/src/routes/analysis/str-direct.js
   const result = await airbnbScraper.searchComparables(data);
   return res.json({ success: true, data: result });
   ```

2. **~~Use job queue for heavy processing~~** (Direct processing now)
   ```javascript
   // ✅ CORRECT (Updated)
   // File: /railway-api/src/routes/reports.js
   const pdf = await generatePDF(data); // Direct, no queues
   ```

3. **Simple forms can use Vercel**
   ```javascript
   // ✅ CORRECT
   // File: /api/submit-lead.js
   await saveToFirebase(leadData); // Simple, fast operation
   ```

## Architecture Decision Tree

**When adding a new feature, ask:**

1. **Does it call external APIs?**
   → YES: Put it in Railway (`/railway-api/`)
   → NO: Continue to #2

2. **Does it process/transform data?**
   → YES: Put it in Railway (`/railway-api/`)
   → NO: Continue to #3

3. **Does it take >1 second?**
   → YES: Put it in Railway (`/railway-api/`)
   → NO: Continue to #4

4. **Is it just serving files or simple validation?**
   → YES: Can go in Vercel (`/api/`)
   → NO: Put it in Railway to be safe

## File Structure

```
StarterPackApp/
├── railway-api/              # ← ALL HEAVY PROCESSING
│   ├── src/
│   │   ├── routes/          # API endpoints
│   │   │   ├── analysis/    # Property & STR analysis
│   │   │   ├── reports/     # PDF generation
│   │   │   └── ...
│   │   ├── ~~workers/~~     # (Removed - direct processing now)
│   │   ├── services/        # Business logic & integrations
│   │   └── utils/           # Helpers & calculators
│   └── package.json
│
├── api/                     # ← SIMPLE OPERATIONS ONLY
│   ├── submit-lead.js       # Simple form submission
│   ├── submit-contact.js    # Simple form submission
│   └── (NO OTHER FILES!)    # Everything else goes to Railway!
│
├── components/              # React components (CDN)
├── js/                      # Frontend JavaScript
│   ├── config.js           # API endpoint configuration
│   └── ...
└── *.html                  # Static pages
```

## API Communication Flow

### Current (Simplified - Jan 2025)
```
User Browser
    ↓
Vercel (Static Files)
    ↓
JavaScript (config.js)
    ↓
Railway API (Heavy Processing)
    ↓
External APIs (Perplexity, Airbnb, etc.)
```

### Previous (With Queues - Removed)
```
~~User Browser~~
    ~~↓~~
~~Job Queue (BullMQ)~~
    ~~↓~~
~~Worker Process~~
```

## Environment Variables

### Railway (Production)
```bash
# External APIs (Railway ONLY!)
PERPLEXITY_API_KEY=
AIRBNB_SCRAPER_API_KEY=
OPENAI_API_KEY=

# Infrastructure
# REDIS_URL= (Removed - using in-memory cache)
FIREBASE_*=
```

### Vercel (Production)
```bash
# Client-side only
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
# NO API KEYS FOR EXTERNAL SERVICES!
```

## Debugging Checklist

When something isn't working:

1. **Check deployment location**
   - Is the endpoint in the right place?
   - Railway for heavy ops, Vercel for simple

2. **Check API configuration**
   - Is `js/config.js` pointing to Railway?
   - Are Railway endpoints using job queues?

3. **Check logs**
   - Railway logs: `railway logs`
   - Vercel logs: Vercel dashboard
   - Job queue: Redis/BullMQ dashboard

4. **Common issues**
   - Timeout? → Move to Railway with job queue
   - 404 error? → Check endpoint location
   - Slow response? → Use Railway background job

## Adding New Features

### Example: Adding a new AI analysis feature

**❌ WRONG WAY**:
```javascript
// /api/new-ai-analysis.js (Vercel)
export default async function handler(req, res) {
  const result = await callOpenAI(req.body);  // ❌ External API!
  res.json(result);
}
```

**✅ RIGHT WAY (Updated - Direct Processing)**:
```javascript
// /railway-api/src/routes/analysis/new-ai.js
router.post('/analyze', async (req, res) => {
  try {
    // Direct processing - Railway has 5 minute timeout
    const result = await callOpenAI(req.body);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

## Simplified Architecture (January 2025)

### What Changed
- **Removed**: Redis, BullMQ, worker processes
- **Added**: Simple in-memory cache, direct API processing
- **Reason**: Redis connection issues, overengineered for current needs

### Current Processing Model
- All API calls are synchronous (no queues)
- Railway has 5-minute timeout (plenty for our APIs)
- In-memory cache for temporary storage
- Direct response to frontend (no job polling)

### Benefits
- Simpler to debug and maintain
- Faster response times (no queue overhead)
- Fewer dependencies and failure points
- Lower operational complexity

## Final Checklist

Before committing ANY code:

- [ ] External API calls are in Railway?
- [ ] ~~Heavy processing uses job queues?~~ (Direct processing now)
- [ ] Vercel only has simple operations?
- [ ] Frontend uses Railway endpoints for analysis?
- [ ] No API keys in Vercel environment?

**Remember**: When in doubt, put it in Railway!

---

*This architecture ensures scalability, prevents timeouts, and keeps costs manageable by using each platform for its strengths.*

*Updated January 15, 2025: Simplified to remove Redis/queues after operational issues.*