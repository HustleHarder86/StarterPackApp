# MCP Task: Railway Project Setup

## Objective
Set up Railway infrastructure for the StarterPackApp backend API server.

## Prerequisites
- Railway account created
- GitHub repository connected
- Environment variables list from Vercel

## Task Instructions

### 1. Create Railway Project Structure

Create the following directory structure in the project root:

```
railway-api/
├── src/
│   ├── routes/
│   │   ├── analysis/
│   │   │   ├── property.js
│   │   │   ├── str.js
│   │   │   └── comparables.js
│   │   ├── reports/
│   │   │   ├── generate.js
│   │   │   └── download.js
│   │   └── health.js
│   ├── middleware/
│   │   ├── auth.js
│   │   ├── cors.js
│   │   ├── cache.js
│   │   └── errorHandler.js
│   ├── services/
│   │   ├── cache.service.js
│   │   ├── logger.service.js
│   │   ├── firebase.service.js
│   │   └── queue.service.js
│   ├── workers/
│   │   ├── analysis.worker.js
│   │   └── pdf.worker.js
│   ├── config/
│   │   └── index.js
│   └── server.js
├── tests/
├── package.json
├── .env.example
├── railway.json
└── README.md
```

### 2. Initialize Express Server

Create `railway-api/package.json`:
```json
{
  "name": "starterpack-railway-api",
  "version": "1.0.0",
  "description": "Railway API server for StarterPackApp",
  "main": "src/server.js",
  "scripts": {
    "start": "node src/server.js",
    "dev": "nodemon src/server.js",
    "test": "jest"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "helmet": "^7.1.0",
    "compression": "^1.7.4",
    "dotenv": "^16.3.1",
    "firebase-admin": "^11.11.0",
    "redis": "^4.6.10",
    "bullmq": "^4.12.0",
    "winston": "^3.11.0",
    "axios": "^1.6.0",
    "@pdf-lib/pdf-lib": "^1.17.1"
  }
}
```

### 3. Create Base Server Configuration

Create `railway-api/src/server.js` with:
- Express setup
- Middleware configuration
- Route mounting
- Error handling
- Graceful shutdown

### 4. Environment Variables

Create `railway-api/.env.example`:
```env
# Server
PORT=3000
NODE_ENV=production

# Firebase Admin
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=

# AI APIs
PERPLEXITY_API_KEY=
OPENAI_API_KEY=
AIRBNB_SCRAPER_API_KEY=
AIRBNB_SCRAPER_API_URL=

# Redis
REDIS_URL=

# CORS
ALLOWED_ORIGINS=https://starterpackapp.vercel.app,http://localhost:3000

# Internal Auth
INTERNAL_API_KEY=
```

### 5. CORS Configuration

Configure CORS to allow:
- Vercel frontend domain
- Local development
- Preflight requests
- Credentials

### 6. Railway Configuration

Create `railway.json`:
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "healthcheckPath": "/health",
    "healthcheckTimeout": 30,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 3
  }
}
```

### 7. Health Check Endpoint

Implement `/health` endpoint that checks:
- Server status
- Redis connection
- Firebase connection
- Memory usage
- Response time

### 8. Deployment Script

Create deployment verification script that:
- Checks all services are running
- Validates environment variables
- Tests critical endpoints
- Reports deployment status

## Success Criteria

- [ ] Railway project created and deployed
- [ ] Express server running on Railway
- [ ] All environment variables configured
- [ ] Health endpoint responding 200 OK
- [ ] CORS properly configured
- [ ] Redis and PostgreSQL connected
- [ ] Logs visible in Railway dashboard

## Common Issues & Solutions

1. **Port binding**: Railway assigns dynamic ports via PORT env var
2. **Build failures**: Check Node version in package.json
3. **Memory issues**: Set proper limits in railway.json
4. **SSL/TLS**: Railway provides automatic HTTPS

## Next Steps

After setup is complete:
1. Test health endpoint from Vercel frontend
2. Begin migrating first API endpoint
3. Set up monitoring dashboards
4. Configure auto-scaling rules