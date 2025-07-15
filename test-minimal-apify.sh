#!/bin/bash

# Test with absolute minimal input
API_KEY="${AIRBNB_SCRAPER_API_KEY:-apify_api_hvYNECiGK9EWtEbkhQoW2eMFu6bw0B0lh655}"

echo "Test 1: Minimal input - just location"
echo "======================================"
curl -X POST "https://api.apify.com/v2/acts/tri_angle~new-fast-airbnb-scraper/runs" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"input": {"locationQueries": ["Toronto"]}}' \
  2>/dev/null | python3 -m json.tool | grep -E "id|status" | head -5

echo -e "\n\nTest 2: Add dates"
echo "================="
curl -X POST "https://api.apify.com/v2/acts/tri_angle~new-fast-airbnb-scraper/runs" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "input": {
      "locationQueries": ["Toronto"],
      "checkIn": "2025-08-15",
      "checkOut": "2025-08-18"
    }
  }' \
  2>/dev/null | python3 -m json.tool | grep -E "id|status" | head -5

echo -e "\n\nTest 3: Add locale and currency"
echo "==============================="
curl -X POST "https://api.apify.com/v2/acts/tri_angle~new-fast-airbnb-scraper/runs" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "input": {
      "locationQueries": ["Toronto"],
      "checkIn": "2025-08-15",
      "checkOut": "2025-08-18",
      "locale": "en-CA",
      "currency": "CAD"
    }
  }' \
  2>/dev/null | python3 -m json.tool | grep -E "id|status" | head -5