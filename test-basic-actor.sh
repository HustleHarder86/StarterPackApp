#!/bin/bash

# Test the most basic possible input
API_KEY="${AIRBNB_SCRAPER_API_KEY:-apify_api_hvYNECiGK9EWtEbkhQoW2eMFu6bw0B0lh655}"

echo "Testing actor with minimal input..."
echo ""

# Just startUrls - the most basic input many scrapers accept
curl -X POST "https://api.apify.com/v2/acts/tri_angle~new-fast-airbnb-scraper/runs" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $API_KEY" \
  -d '{
    "input": {
      "startUrls": [
        "https://www.airbnb.ca/s/Toronto--ON--Canada/homes"
      ]
    }
  }' | python3 -m json.tool

echo ""