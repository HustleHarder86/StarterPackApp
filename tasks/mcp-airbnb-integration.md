# MCP: Airbnb Scraper Integration

## Feature Overview
Integrate Apify's Airbnb Scraper API to provide real short-term rental (STR) market data instead of estimates.

## Objectives
1. Replace STR estimates with real Airbnb market data
2. Reduce API costs by 80-90% through smart filtering
3. Provide accurate, comparable-based STR analysis
4. Maintain <$0.03 cost per analysis

## Technical Architecture

### Data Flow
```
Property Analysis Request
    ↓
Extract & Format Location
    ↓
Build Filtered Apify Query
    ↓
Call Airbnb Scraper API
    ↓
Process 20-40 Comparables
    ↓
Calculate STR Metrics
    ↓
Cache & Return Results
```

## Implementation Tasks

### Phase 1: Core Infrastructure
- [ ] Add Apify environment variables to Vercel
- [ ] Create /api/str-analysis directory structure
- [ ] Set up error handling and logging
- [ ] Create usage tracking in Firebase

### Phase 2: API Integration
- [ ] Create utils/airbnb-scraper.js for Apify client
- [ ] Implement location formatting (address → query)
- [ ] Build dynamic filter strategy
- [ ] Add request/response logging

### Phase 3: Comparable Processing
- [ ] Create utils/str-calculations.js
- [ ] Implement comparable matching logic
- [ ] Calculate average/median nightly rates
- [ ] Extract occupancy indicators

### Phase 4: Caching Layer
- [ ] Implement 24-hour cache for STR data
- [ ] Create cache key strategy
- [ ] Add cache invalidation logic

### Phase 5: Frontend Integration
- [ ] Update STR analysis display
- [ ] Show comparable properties
- [ ] Add confidence scores
- [ ] Display data sources

### Phase 6: Testing & Optimization
- [ ] Test with various property types
- [ ] Verify cost tracking
- [ ] Optimize filter strategies
- [ ] Add monitoring

## API Configuration

### Required Environment Variables
```
APIFY_API_TOKEN=<token>
AIRBNB_SCRAPER_ACTOR_ID=NDa1latMI7JHJzSYU
STR_ANALYSIS_ENABLED=true
```

### Query Strategy
```javascript
// Tight filters first
{
  locationQueries: ["Milton, Ontario"],
  minBedrooms: 3,
  minBathrooms: 2,
  adults: 6,
  priceMin: 100,
  priceMax: 500,
  currency: "CAD"
}

// If <15 results, relax filters
{
  minBedrooms: 2,  // -1
  priceMax: 600    // +100
}
```

## Cost Management
- Target: $0.02-0.03 per analysis
- Free tier: 20 analyses (was 5)
- Pro tier: Unlimited
- Track usage in Firebase

## Success Metrics
- [ ] Real STR data replaces estimates
- [ ] <$0.03 average cost per analysis
- [ ] 15+ comparables per analysis
- [ ] <3 second response time
- [ ] 95% cache hit rate for popular areas

## Risk Mitigation
- Fallback to estimates if API fails
- Rate limiting to prevent abuse
- Cost alerts at 80% of budget
- Graceful degradation

## Subagent Deployment Plan

### Agent 1: Infrastructure Setup
- Set up API environment
- Create directory structure
- Initialize logging

### Agent 2: API Integration
- Implement Apify client
- Build query formatter
- Add error handling

### Agent 3: Data Processing
- Create comparable matcher
- Calculate STR metrics
- Build response format

### Agent 4: Caching & Optimization
- Implement cache layer
- Add usage tracking
- Optimize queries

### Agent 5: Frontend Integration
- Update UI components
- Add data displays
- Test end-to-end