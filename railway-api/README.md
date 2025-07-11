# StarterPackApp Railway API

## 🚨 ARCHITECTURE REMINDER 🚨

**This Railway API handles ALL heavy processing for StarterPackApp:**
- ✅ External API calls (Perplexity, Airbnb, OpenAI)
- ✅ Background jobs and queues
- ✅ PDF generation
- ✅ Complex calculations
- ✅ Any operation >1 second

**Vercel handles ONLY:**
- Static files (HTML/CSS/JS)
- Simple form submissions
- NO external APIs!

---

This is the Railway-hosted backend API for StarterPackApp, handling heavy processing tasks like property analysis, STR calculations, and PDF report generation.

## Architecture

This API server handles:
- Property analysis with AI integration
- Short-term rental (STR) analysis
- PDF report generation
- Background job processing
- Caching and rate limiting

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment variables:**
   Copy `.env.example` to `.env` and fill in all required values.

3. **Run locally:**
   ```bash
   npm run dev
   ```

## Deployment

This project is configured for Railway deployment:

1. Connect your GitHub repository to Railway
2. Set all environment variables in Railway dashboard
3. Deploy with `railway up` or push to main branch

## API Endpoints

### Health Check
- `GET /health` - Server health status

### Analysis Endpoints
- `POST /api/analysis/property` - Analyze property investment
- `POST /api/analysis/str` - Analyze short-term rental potential
- `POST /api/analysis/comparables` - Get comparable properties

### Report Endpoints
- `POST /api/reports/generate` - Generate PDF report
- `GET /api/reports/download/:id` - Download report

### Job Status
- `GET /api/jobs/:jobId/status` - Check job progress

## Environment Variables

See `.env.example` for all required environment variables.

## Development

```bash
# Run with auto-reload
npm run dev

# Run tests
npm test

# Run tests in watch mode
npm run test:watch
```

## Production Considerations

- Redis is required for caching and job queues
- Minimum 512MB RAM recommended
- Auto-scaling configured in Railway
- Logs available in Railway dashboard