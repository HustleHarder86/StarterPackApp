# Internal Authentication Setup Guide

## Overview

Internal authentication has been implemented to secure communication between Vercel and Railway deployments. This prevents unauthorized access to the Railway API endpoints.

## Setup Instructions

### 1. Generate Internal API Key

Generate a secure internal API key:

```bash
node -e "console.log('internal_' + require('crypto').randomBytes(32).toString('hex'))"
```

### 2. Configure Environment Variables

Add the same key to both deployments:

#### Vercel (.env.local or Vercel Dashboard)
```
INTERNAL_API_KEY=internal_[your-generated-key]
RAILWAY_API_URL=https://your-railway-app.up.railway.app
```

#### Railway (Railway Dashboard)
```
INTERNAL_API_KEY=internal_[your-generated-key]
```

### 3. Update Railway API

Add the internal auth middleware to your Railway API routes:

```javascript
// railway-api/src/routes/analysis.js
import { requireInternalAuth } from '../middleware/internal-auth.js';

// Protect the route
router.post('/property', requireInternalAuth, async (req, res) => {
  // Your endpoint logic
});
```

### 4. Testing

Test the authentication:

```bash
# Without auth (should fail)
curl -X POST https://your-railway-api/api/analysis/property \
  -H "Content-Type: application/json" \
  -d '{"test": true}'

# With auth (should succeed)
curl -X POST https://your-railway-api/api/analysis/property \
  -H "Content-Type: application/json" \
  -H "X-Internal-API-Key: internal_your_key" \
  -d '{"test": true}'
```

## Security Benefits

1. **Service Isolation**: Only authenticated services can access Railway API
2. **Request Tracking**: Each request includes service name and request ID
3. **Timing-Safe Comparison**: Prevents timing attacks on API key
4. **No Public Access**: Railway API is not accessible without proper authentication

## Monitoring

Monitor authentication failures in logs:

```
[Internal Auth] Failed authentication from [IP]
[Internal Auth] Authenticated request from vercel
```

## Key Rotation

To rotate keys:

1. Generate new key
2. Add new key to both environments
3. Deploy both services
4. Remove old key from environments
5. Deploy again

## Troubleshooting

### "Unauthorized" errors
- Verify INTERNAL_API_KEY is set in both environments
- Check keys match exactly (no extra spaces)
- Ensure header name is correct: `X-Internal-API-Key`

### Missing service info
- Check Vercel is sending `X-Service: vercel` header
- Verify request ID is being generated

### Health checks failing
- Health endpoints bypass auth by default
- Check `/health` or `/api/health` paths