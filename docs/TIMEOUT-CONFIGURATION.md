# Timeout Configuration Guide

## Overview
The StarterPackApp is configured to handle long-running STR (Short-Term Rental) analysis that can take up to 5 minutes due to real-time Airbnb data scraping.

## Configuration Details

### 1. Railway API Server Timeouts
**Location:** `/railway-api/src/server.js:154-162`

```javascript
server.keepAliveTimeout = 310000; // 310 seconds
server.headersTimeout = 320000;   // 320 seconds  
server.timeout = 330000;          // 330 seconds (5.5 minutes total)
```

- **keepAliveTimeout**: Time to keep sockets alive after last response
- **headersTimeout**: Time to receive complete HTTP headers
- **timeout**: Total request timeout

### 2. Vercel Function Timeout
**Location:** `/vercel.json:9-11`

```json
"api/analyze-property.js": {
  "maxDuration": 300
}
```

- Configured for 300 seconds (5 minutes) maximum execution time
- This is the maximum allowed on Vercel Pro plan

### 3. Frontend Request Timeout
**Location:** `/roi-finder.html:1483-1485`

```javascript
const analysisTimeout = window.TIMEOUTS?.ANALYSIS_REQUEST || 300000; // 5 minutes
const timeoutId = setTimeout(() => {
    window.appState.currentAnalysisController.abort();
}, analysisTimeout);
```

### 4. Airbnb Scraper Service Timeout
**Location:** `/railway-api/src/services/airbnb-scraper.service.js:12`

```javascript
this.timeout = 300000; // 5 minute timeout for Apify API calls
```

## User Experience Features

### Progress Indicators
- **Warning Banner**: Informs users about the 5-minute duration
- **Real-time Timer**: Shows elapsed time and current stage
- **Stage Messages**: Updates based on elapsed time:
  - 0-30s: "Searching properties..."
  - 30-90s: "Analyzing comparables..."
  - 90-180s: "Calculating revenue metrics..."
  - 180-240s: "Generating recommendations..."
  - 240s+: "Finalizing analysis..."

### User Controls
- **Cancel Button**: Allows users to abort long-running analysis
- **Retry Button**: Appears on errors with one-click retry
- **Automatic Cleanup**: Removes progress indicators on completion/cancel

## Testing

### Manual Test Script
Run the timeout test script:
```bash
./test-5min-timeout.sh
```

### Visual Test
Test the progress indicators:
```bash
npx playwright test tests/e2e/visual-progress-test.spec.js
```

### API Test
Direct Railway API test:
```bash
curl -X POST http://localhost:3001/api/analysis/property \
  -H "Content-Type: application/json" \
  -H "X-E2E-Test-Mode: true" \
  -d '{"propertyAddress": "123 Main St", "analysisType": "both"}' \
  -m 310
```

## Troubleshooting

### Common Issues

1. **Timeout Too Short**
   - Symptom: Analysis fails with timeout error
   - Solution: Verify all timeout values are set to 300+ seconds

2. **Port Conflicts**
   - Symptom: Railway API fails to start
   - Solution: Kill existing processes: `pkill -f "node src/server.js"`

3. **Progress Indicator Not Showing**
   - Symptom: No visual feedback during analysis
   - Solution: Check browser console for JavaScript errors

### Debug Commands

Check Railway API health:
```bash
curl http://localhost:3001/health
```

View Railway API logs:
```bash
tail -f railway-api.log
```

Monitor active connections:
```bash
lsof -i :3001
```

## Performance Considerations

- Average STR analysis time: 20-30 seconds
- Maximum configured timeout: 5 minutes
- Recommended user notification: After 30 seconds
- Cancel option: Always available during analysis

## Environment Variables

No additional environment variables needed for timeout configuration. All timeouts are hardcoded for consistency.

## Deployment Notes

When deploying:
1. Ensure Vercel plan supports 300-second functions
2. Railway deployment automatically uses configured timeouts
3. No frontend build required for timeout changes
4. Test in production after deployment

## Related Documentation

- [TESTING.md](../TESTING.md) - Testing procedures
- [DEVELOPMENT.md](../DEVELOPMENT.md) - Development workflow
- [CLAUDE.md](../CLAUDE.md) - Main development guide