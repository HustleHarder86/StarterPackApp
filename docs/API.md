# StarterPackApp API Documentation

## Overview

StarterPackApp provides RESTful APIs for real estate investment analysis. All API endpoints require authentication via Firebase ID tokens.

### Base URL
- Production: `https://starterpackapp.vercel.app/api`
- Development: `http://localhost:3000/api`

### Authentication

All API requests must include a Firebase ID token in the Authorization header:

```
Authorization: Bearer <firebase-id-token>
```

### Rate Limiting

API endpoints are rate-limited based on subscription tier:
- **Free**: 10 analyses/hour, 100 requests/15min
- **Pro**: 100 analyses/hour, 1000 requests/15min
- **Enterprise**: 1000 analyses/hour, 10000 requests/15min

## Endpoints

### 1. Property Analysis

#### Enhanced Property Analysis

Analyzes a property with optional STR (short-term rental) comparison.

**Endpoint:** `POST /api/analyze-property-enhanced`

**Headers:**
```
Content-Type: application/json
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "propertyAddress": "123 Main St, Toronto, ON, Canada M5V 3A8",
  "includeStrAnalysis": true,
  "propertyData": {
    "bedrooms": 3,
    "bathrooms": 2,
    "sqft": 1800,
    "propertyType": "House"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "propertyDetails": {
      "address": "123 Main St",
      "estimatedValue": 850000,
      "propertyType": "House",
      "bedrooms": 3,
      "bathrooms": 2,
      "sqft": 1800
    },
    "costs": {
      "mortgage_monthly": 3200,
      "property_tax_annual": 8500,
      "insurance_annual": 1200,
      "hoa_monthly": 0,
      "maintenance_annual": 8500
    },
    "longTermRental": {
      "monthlyRent": 3500,
      "rentRange": { "low": 3200, "high": 3800 },
      "comparables": [...],
      "vacancyRate": 5,
      "annualRevenue": 39900,
      "cashFlow": 450,
      "capRate": 4.2,
      "dataSource": "ai_research"
    },
    "strAnalysis": {
      "avgNightlyRate": 185,
      "occupancyRate": 68,
      "comparables": [...],
      "annualRevenue": 45900,
      "dataSource": "ai_research"
    },
    "comparison": {
      "monthlyIncomeDiff": 525,
      "betterStrategy": "str",
      "breakEvenOccupancy": 56
    }
  }
}
```

**Error Responses:**
- `400` - Invalid request parameters
- `401` - Authentication required
- `403` - Insufficient subscription tier
- `429` - Rate limit exceeded
- `500` - Internal server error

### 2. Property Management

#### Ingest Property from Browser Extension

Saves property data from the browser extension.

**Endpoint:** `POST /api/properties/ingest`

**Request Body:**
```json
{
  "userId": "user123",
  "mlsNumber": "C5789012",
  "propertyData": {
    "address": {...},
    "price": 850000,
    "bedrooms": 3,
    "bathrooms": 2,
    "propertyType": "House",
    "listingUrl": "https://realtor.ca/..."
  }
}
```

#### List User Properties

Get all properties for the authenticated user.

**Endpoint:** `GET /api/properties/list?userId=<userId>`

**Response:**
```json
{
  "success": true,
  "properties": [
    {
      "id": "prop123",
      "address": {...},
      "price": 850000,
      "lastAnalyzed": "2024-01-15T10:30:00Z",
      "analysis": {...}
    }
  ]
}
```

#### Delete Property

Remove a property from the user's portfolio.

**Endpoint:** `DELETE /api/properties/delete?propertyId=<propertyId>`

**Response:**
```json
{
  "success": true,
  "message": "Property and related data deleted successfully",
  "deletedItems": {
    "properties": 1,
    "analyses": 3,
    "reports": 2
  }
}
```

### 3. Report Generation

#### Generate Property Report

Create a PDF report for a property analysis.

**Endpoint:** `POST /api/reports/generate`

**Request Body:**
```json
{
  "propertyId": "prop123",
  "reportType": "detailed",
  "options": {
    "includeFinancials": true,
    "includeMarket": true,
    "includeComparables": true,
    "includeCharts": true
  }
}
```

**Report Types:**
- `summary` - Basic 1-page summary
- `detailed` - Comprehensive analysis report
- `comparison` - LTR vs STR comparison report

**Response:**
```json
{
  "success": true,
  "reportId": "report123",
  "message": "Report generation started",
  "estimatedTime": "5-10 seconds"
}
```

### 4. User Management

#### Update User Profile

Update user subscription and settings.

**Endpoint:** `POST /api/user-management-enhanced`

**Request Body:**
```json
{
  "userId": "user123",
  "action": "updateProfile",
  "data": {
    "subscriptionTier": "pro",
    "settings": {
      "emailNotifications": true,
      "defaultCurrency": "CAD"
    }
  }
}
```

**Actions:**
- `updateProfile` - Update user profile
- `updateSubscription` - Change subscription tier
- `resetTrials` - Reset STR trial counter (admin only)

## Error Handling

All error responses follow this format:

```json
{
  "error": "Error type",
  "message": "Human-readable error message",
  "field": "field_name" // For validation errors
}
```

## Caching

Responses are cached with the following TTLs:
- Property analysis: 24 hours
- Market research: 7 days
- User properties: 5 minutes
- STR comparables: 24 hours

Cache headers:
- `X-Cache: HIT` - Response served from cache
- `X-Cache: MISS` - Fresh response generated

## Webhooks

### Report Generation Complete

When a report is ready, a webhook is sent to your configured URL:

```json
{
  "event": "report.completed",
  "reportId": "report123",
  "propertyId": "prop123",
  "userId": "user123",
  "fileUrl": "https://storage.url/report.pdf",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

## SDK Examples

### JavaScript/TypeScript

```typescript
import { StarterPackAPI } from '@starterpack/sdk';

const api = new StarterPackAPI({
  apiKey: 'your-api-key',
  environment: 'production'
});

// Analyze property
const analysis = await api.properties.analyze({
  address: '123 Main St, Toronto, ON',
  includeSTR: true
});

// Generate report
const report = await api.reports.generate({
  propertyId: analysis.propertyId,
  type: 'detailed'
});
```

### Python

```python
from starterpack import StarterPackAPI

api = StarterPackAPI(
    api_key='your-api-key',
    environment='production'
)

# Analyze property
analysis = api.properties.analyze(
    address='123 Main St, Toronto, ON',
    include_str=True
)

# Generate report
report = api.reports.generate(
    property_id=analysis['propertyId'],
    report_type='detailed'
)
```

## Best Practices

1. **Authentication**: Always validate tokens server-side
2. **Rate Limiting**: Implement exponential backoff for retries
3. **Caching**: Use ETags for conditional requests
4. **Error Handling**: Always check response status codes
5. **Pagination**: Use cursor-based pagination for large datasets

## Support

For API support, contact: api-support@starterpackapp.com

For bug reports: https://github.com/starterpackapp/api/issues