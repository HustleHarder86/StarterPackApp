#!/bin/bash

# Simple test with minimal input
API_KEY="${AIRBNB_SCRAPER_API_KEY}"

echo "Testing Apify with simple input..."
echo ""

# Try with just location
curl -X POST "https://api.apify.com/v2/acts/tri_angle~new-fast-airbnb-scraper/runs" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $API_KEY" \
  -d '{
    "input": {
      "location": "Toronto",
      "checkIn": "2025-08-14",
      "checkOut": "2025-08-17",
      "currency": "CAD",
      "adults": 2,
      "maxResults": 10
    }
  }' | python3 -m json.tool

echo ""
echo "Check if this returns a run ID..."