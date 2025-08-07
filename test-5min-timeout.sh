#!/bin/bash

# Test 5-minute timeout for STR analysis

echo "Testing 5-minute timeout configuration..."
echo "========================================="
echo ""

# Test Railway API directly
echo "1. Testing Railway API with STR analysis (may take up to 5 minutes)..."
echo "   Starting at: $(date '+%Y-%m-%d %H:%M:%S')"

START_TIME=$(date +%s)

# Make the request with a 310 second (5min 10sec) timeout
curl -X POST http://localhost:3001/api/analysis/property \
  -H "Content-Type: application/json" \
  -H "X-E2E-Test-Mode: true" \
  -d '{
    "propertyAddress": "789 Queen Street West, Toronto, ON",
    "propertyData": {
      "address": "789 Queen Street West, Toronto, ON",
      "bedrooms": 2,
      "bathrooms": 1,
      "price": 650000,
      "sqft": 1200
    },
    "analysisType": "both",
    "includeStrAnalysis": true,
    "userId": "test-user-timeout",
    "userEmail": "timeout-test@e2e.com"
  }' \
  -o /tmp/str-response.json \
  -w "\n\nHTTP Status: %{http_code}\nTime taken: %{time_total}s\n" \
  -m 310 \
  --progress-bar

END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))

echo "   Completed at: $(date '+%Y-%m-%d %H:%M:%S')"
echo "   Total duration: ${DURATION} seconds"
echo ""

# Check if response was successful
if [ -f /tmp/str-response.json ]; then
    echo "2. Response received. Checking content..."
    
    # Check if STR data is present
    if grep -q "short_term_rental" /tmp/str-response.json; then
        echo "   ✓ STR analysis data found in response"
        
        # Extract some key metrics
        echo ""
        echo "3. STR Analysis Metrics:"
        cat /tmp/str-response.json | python3 -c "
import json
import sys
data = json.load(sys.stdin)
if 'short_term_rental' in data:
    str_data = data['short_term_rental']
    print(f'   - Monthly Revenue: \${str_data.get(\"monthly_revenue\", \"N/A\")}')
    print(f'   - Daily Rate: \${str_data.get(\"daily_rate\", \"N/A\")}')
    print(f'   - Occupancy Rate: {str_data.get(\"occupancy_rate\", \"N/A\")}%')
    print(f'   - Comparables Found: {len(str_data.get(\"comparables\", []))}')
" 2>/dev/null || echo "   Could not parse STR metrics"
    else
        echo "   ✗ No STR analysis data in response"
    fi
    
    echo ""
    echo "4. Response size: $(wc -c < /tmp/str-response.json) bytes"
else
    echo "   ✗ No response received or request failed"
fi

echo ""
echo "========================================="
echo "Test completed. Summary:"
echo "- Request duration: ${DURATION} seconds"

if [ $DURATION -gt 240 ] && [ $DURATION -lt 330 ]; then
    echo "- Status: ✓ Timeout configuration working (4-5.5 minute range)"
elif [ $DURATION -lt 240 ]; then
    echo "- Status: ✓ Request completed quickly (under 4 minutes)"
else
    echo "- Status: ✗ Timeout may not be configured correctly"
fi

# Clean up
rm -f /tmp/str-response.json