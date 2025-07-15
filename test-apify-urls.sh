#!/bin/bash

# Test with URLs instead of location queries
API_KEY="${AIRBNB_SCRAPER_API_KEY:-apify_api_hvYNECiGK9EWtEbkhQoW2eMFu6bw0B0lh655}"

echo "Test with startUrls"
echo "=================="

# Try with a direct Airbnb search URL
curl -X POST "https://api.apify.com/v2/acts/tri_angle~new-fast-airbnb-scraper/runs" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "input": {
      "startUrls": ["https://www.airbnb.ca/s/Toronto--ON--Canada/homes"],
      "currency": "CAD",
      "locale": "en-CA"
    }
  }' \
  2>/dev/null | python3 -m json.tool

echo -e "\n\nWait 15 seconds for results..."
sleep 15

# Get the last run's results
echo -e "\nChecking last run results:"
curl -s "https://api.apify.com/v2/acts/tri_angle~new-fast-airbnb-scraper/runs/last" \
  -H "Authorization: Bearer $API_KEY" \
  | python3 -m json.tool | grep -E "status\":|statusMessage|itemCount"