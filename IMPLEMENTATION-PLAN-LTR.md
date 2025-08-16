# Implementation Plan: Enhanced LTR with Clickable Sources

## Overview
Upgrade the LTR (Long-Term Rental) analysis to use enhanced Perplexity prompting that returns real comparable listings with source URLs.

## Benefits
- **From**: Fallback calculation returning 0.32% yield estimate
- **To**: Real rental comparables with actual listing prices
- **Bonus**: Clickable source links for user verification

## Implementation Steps

### Phase 1: Backend Updates (Railway API)

#### 1.1 Update Perplexity Service
**File**: `/railway-api/src/services/property-analysis.service.js`

```javascript
// Enhanced prompt for LTR comparables
const enhancedLTRPrompt = `Find rental comparables for investment property analysis:

TARGET PROPERTY:
${propertyAddress}
${bedrooms} bed, ${bathrooms} bath, ${sqft} sqft ${propertyType}

REQUIREMENTS:
1. Find 8-10 current rental listings (active or recently rented)
2. Prioritize properties within 1km of target address
3. Match bedroom count exactly or ±1 bedroom
4. Match square footage within ±30%
5. Include listings from last 60 days only

Return in this EXACT markdown table format:
[... full prompt from test ...]`;

// Add citation extraction
const response = await perplexityAPI(enhancedLTRPrompt);
const content = response.choices[0].message.content;
const citations = response.citations || [];
```

#### 1.2 Create LTR Parser
**New File**: `/railway-api/src/utils/ltr-parser.js`

```javascript
function parseLTRResponse(content, citations) {
  // Extract averages, median, comparables
  // Map citations to comparables
  // Filter by relevance
  // Return structured data with URLs
}
```

#### 1.3 Update Response Structure
Add to API response:
```javascript
long_term_rental: {
  monthly_rent: 3225,  // Average from comparables
  median_rent: 3050,
  confidence: 'high',
  comparables: [
    {
      address: "839 Queen Street W",
      monthly_rent: 2600,
      bedrooms: 3,
      bathrooms: 2,
      sqft: 1650,
      distance_km: 0.3,
      match_score: 92,
      source: "PadMapper",
      source_url: "https://padmapper.com/...",
      days_on_market: 5
    }
  ],
  market_insights: "Strong rental demand in this area..."
}
```

### Phase 2: Frontend Updates

#### 2.1 Update Mockup Display
**File**: `/mockups/mockup-iterations/api-integration.js`

```javascript
function updateLTRSection(ltrData) {
  // Display average/median prominently
  // Show top 3-5 comparables with:
  //   - Address & specs
  //   - Match percentage
  //   - Clickable source link
  // Add confidence indicator
}
```

#### 2.2 Add Comparable Cards
```html
<div class="ltr-comparable-card">
  <div class="comparable-header">
    <h4>839 Queen Street W</h4>
    <span class="match-badge">92% Match</span>
  </div>
  <div class="comparable-details">
    <span>$2,600/mo</span>
    <span>3 bed, 2 bath</span>
    <span>0.3 km away</span>
  </div>
  <a href="[source_url]" target="_blank" class="view-listing-btn">
    View on PadMapper →
  </a>
</div>
```

### Phase 3: Testing & Validation

#### 3.1 Test Coverage
- [ ] Test with 10+ different addresses
- [ ] Verify citation URLs work
- [ ] Check filtering logic
- [ ] Validate match scores
- [ ] Test error handling

#### 3.2 Performance Monitoring
- Response time target: < 10 seconds
- Success rate target: > 90%
- Comparables found target: 5+ per property

### Phase 4: Rollout

#### 4.1 Gradual Rollout
1. Deploy to Railway staging
2. Test with internal team
3. Enable for test users (`@test.com`)
4. Full production release

#### 4.2 Fallback Strategy
Keep existing calculation as fallback:
```javascript
if (!comparables || comparables.length < 3) {
  // Use existing 0.32% yield calculation
  return estimateRentalRate(propertyValue);
}
```

## Cost Impact
- **Per Analysis**: ~$0.002 (same as current)
- **Monthly (1000 analyses)**: $2.00
- **ROI**: Massive - real data vs estimates

## Timeline
- Phase 1 (Backend): 2 hours
- Phase 2 (Frontend): 2 hours  
- Phase 3 (Testing): 1 hour
- Phase 4 (Rollout): 1 hour
- **Total**: ~6 hours

## Success Metrics
- LTR estimates within 10% of actual market
- User confidence score > 4.5/5
- Support tickets reduced by 50%
- Conversion rate increase 20%

## Risk Mitigation
- Keep fallback calculation
- Cache successful responses
- Monitor API costs daily
- A/B test with user subset first