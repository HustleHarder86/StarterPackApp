#!/bin/bash

# Test with synchronous run
API_KEY="${AIRBNB_SCRAPER_API_KEY:-apify_api_hvYNECiGK9EWtEbkhQoW2eMFu6bw0B0lh655}"

echo "Test synchronous run with dataset items"
echo "======================================="

# Use run-sync-get-dataset-items endpoint
curl -X POST "https://api.apify.com/v2/acts/tri_angle~new-fast-airbnb-scraper/run-sync-get-dataset-items?timeout=60" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "locationQueries": ["Toronto"],
    "checkIn": "2025-08-15", 
    "checkOut": "2025-08-18",
    "locale": "en-CA",
    "currency": "CAD",
    "adults": 2,
    "minBedrooms": 1
  }' \
  2>/dev/null | python3 -m json.tool | head -50