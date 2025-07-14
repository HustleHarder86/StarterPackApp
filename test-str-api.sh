#!/bin/bash

# Test STR Analysis API
echo "Testing STR Analysis API..."

# First, let's check the health endpoint with a longer timeout
echo -e "\n1. Checking health endpoint..."
curl -X GET https://starterpackapp-production.up.railway.app/health \
  --max-time 60 \
  -H "Accept: application/json" | jq .

# Test STR analysis without auth (should fail with auth error)
echo -e "\n\n2. Testing STR analysis endpoint (no auth)..."
curl -X POST https://starterpackapp-production.up.railway.app/api/analysis/str/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "propertyId": "test-123",
    "propertyData": {
      "address": "123 Test St, Toronto, ON",
      "price": 500000,
      "bedrooms": 2,
      "bathrooms": 2,
      "propertyType": "condo",
      "coordinates": {
        "lat": 43.6532,
        "lng": -79.3832
      }
    }
  }' | jq .

# Check environment variables
echo -e "\n\n3. Checking environment variables..."
curl https://starterpackapp-production.up.railway.app/health/env | jq .