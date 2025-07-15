#!/bin/bash

# Direct test of Apify API
# Replace YOUR_API_KEY with your actual Apify API key

API_KEY="${AIRBNB_SCRAPER_API_KEY:-YOUR_API_KEY}"

echo "Testing Apify API directly..."
echo "Actor: tri_angle/new-fast-airbnb-scraper"
echo ""

curl -X POST "https://api.apify.com/v2/acts/tri_angle~new-fast-airbnb-scraper/runs" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $API_KEY" \
  -d '{
    "input": {
      "locationQuery": "Toronto, Canada",
      "maxListings": 2,
      "currency": "CAD",
      "checkIn": "'$(date -d "+30 days" +%Y-%m-%d)'",
      "checkOut": "'$(date -d "+33 days" +%Y-%m-%d)'"
    }
  }' | python3 -m json.tool

echo ""
echo "If you see a run ID, the API is working!"
echo "If you see 404, the actor ID is wrong"
echo "If you see 401, the API key is invalid"