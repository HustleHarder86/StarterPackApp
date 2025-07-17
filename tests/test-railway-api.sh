#!/bin/bash

# Comprehensive Railway API Testing Script
# Tests both LTR and STR endpoints with various scenarios
# Created: 2025-01-17

# Configuration
RAILWAY_API_URL="${RAILWAY_API_URL:-https://real-estate-app-production-ba5c.up.railway.app}"
OUTPUT_FILE="railway-api-test-results.json"
SUMMARY_FILE="railway-api-test-summary.md"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Initialize results file
echo "[]" > $OUTPUT_FILE

# Function to log test results
log_test() {
    local test_name=$1
    local status=$2
    local response_time=$3
    local details=$4
    
    if [ "$status" = "passed" ]; then
        echo -e "${GREEN}✓${NC} $test_name (${response_time}ms)"
        ((PASSED_TESTS++))
    else
        echo -e "${RED}✗${NC} $test_name - $details"
        ((FAILED_TESTS++))
    fi
    ((TOTAL_TESTS++))
    
    # Append to results file
    jq --arg name "$test_name" --arg status "$status" --arg time "$response_time" --arg details "$details" \
       '. += [{"name": $name, "status": $status, "responseTime": $time, "details": $details}]' \
       $OUTPUT_FILE > tmp.json && mv tmp.json $OUTPUT_FILE
}

# Function to make API call and measure response time
make_api_call() {
    local endpoint=$1
    local data=$2
    local test_name=$3
    
    echo -e "\n${YELLOW}Testing:${NC} $test_name"
    
    # Record start time
    start_time=$(date +%s%3N)
    
    # Make the API call
    response=$(curl -s -w "\n%{http_code}" -X POST \
        -H "Content-Type: application/json" \
        -H "Accept: application/json" \
        --max-time 90 \
        -d "$data" \
        "${RAILWAY_API_URL}${endpoint}")
    
    # Record end time
    end_time=$(date +%s%3N)
    response_time=$((end_time - start_time))
    
    # Extract HTTP status code and response body
    http_code=$(echo "$response" | tail -n 1)
    response_body=$(echo "$response" | sed '$d')
    
    # Check if request was successful
    if [ "$http_code" = "200" ]; then
        log_test "$test_name" "passed" "$response_time" "HTTP $http_code"
        echo "Response preview: $(echo "$response_body" | jq -c '.success, .propertyDetails.address' 2>/dev/null || echo "Invalid JSON")"
    else
        log_test "$test_name" "failed" "$response_time" "HTTP $http_code - $response_body"
    fi
}

echo "Starting Railway API Tests..."
echo "API URL: $RAILWAY_API_URL"
echo "=========================="

# Test 1: Health Check
echo -e "\n${YELLOW}Testing:${NC} Health Check"
start_time=$(date +%s%3N)
health_response=$(curl -s -w "\n%{http_code}" --max-time 10 "${RAILWAY_API_URL}/health")
end_time=$(date +%s%3N)
response_time=$((end_time - start_time))
http_code=$(echo "$health_response" | tail -n 1)

if [ "$http_code" = "200" ]; then
    log_test "Health Check" "passed" "$response_time" "API is healthy"
else
    log_test "Health Check" "failed" "$response_time" "HTTP $http_code"
fi

# Test 2: LTR Analysis - Standard Property
property_data='{
  "propertyData": {
    "address": "123 Main St, Mississauga, ON L5A 1E1, Canada",
    "price": 850000,
    "propertyTaxes": 5490,
    "condoFees": 0,
    "bedrooms": "4 + 2",
    "bathrooms": "3.5 + 1",
    "sqft": 2100,
    "propertyType": "Single Family",
    "yearBuilt": 2015
  },
  "analysisMode": "ltr",
  "options": {
    "includeComparables": true
  }
}'

make_api_call "/api/analysis/property" "$property_data" "LTR Analysis - Standard Property"

# Test 3: STR Analysis - Standard Property
str_data='{
  "propertyData": {
    "address": "123 Main St, Mississauga, ON L5A 1E1, Canada",
    "price": 850000,
    "propertyTaxes": 5490,
    "condoFees": 0,
    "bedrooms": "4 + 2",
    "bathrooms": "3.5 + 1",
    "sqft": 2100,
    "propertyType": "Single Family"
  },
  "analysisMode": "str",
  "options": {
    "includeComparables": true,
    "maxComparables": 20
  }
}'

make_api_call "/api/analysis/property" "$str_data" "STR Analysis - Standard Property"

# Test 4: Combined Analysis
combined_data='{
  "propertyData": {
    "address": "500 Queens Quay W Unit 1205, Toronto, ON M5V 3K8, Canada",
    "price": 650000,
    "propertyTaxes": 3200,
    "condoFees": 456,
    "bedrooms": "2",
    "bathrooms": "2",
    "sqft": 950,
    "propertyType": "Condo"
  },
  "analysisMode": "combined",
  "options": {
    "includeComparables": true,
    "includeComparison": true
  }
}'

make_api_call "/api/analysis/property" "$combined_data" "Combined LTR + STR Analysis - Condo"

# Test 5: Problematic City Format
problematic_data='{
  "propertyData": {
    "address": {
      "street": "789 Elm Street",
      "city": "Ontario L5A1E1",
      "province": "ON",
      "postalCode": "L5A1E1"
    },
    "price": 950000,
    "propertyTaxes": 6800,
    "bedrooms": "5",
    "bathrooms": "4",
    "sqft": 2800,
    "propertyType": "Detached"
  },
  "analysisMode": "ltr"
}'

make_api_call "/api/analysis/property" "$problematic_data" "LTR Analysis - Problematic City Format"

# Test 6: Missing Required Fields
invalid_data='{
  "propertyData": {
    "address": "123 Test St"
  }
}'

make_api_call "/api/analysis/property" "$invalid_data" "Error Handling - Missing Fields"

# Test 7: Simple Bedroom/Bathroom Format
simple_format_data='{
  "propertyData": {
    "address": "456 Oak Ave, Ottawa, ON K1A 0A1, Canada",
    "price": 550000,
    "propertyTaxes": 4200,
    "bedrooms": "3",
    "bathrooms": "2",
    "sqft": 1500,
    "propertyType": "Townhouse"
  },
  "analysisMode": "ltr"
}'

make_api_call "/api/analysis/property" "$simple_format_data" "LTR Analysis - Simple Format"

# Generate Summary Report
echo -e "\n\n=========================="
echo "Test Summary"
echo "=========================="
echo -e "Total Tests: $TOTAL_TESTS"
echo -e "${GREEN}Passed: $PASSED_TESTS${NC}"
echo -e "${RED}Failed: $FAILED_TESTS${NC}"
echo -e "Pass Rate: $(( PASSED_TESTS * 100 / TOTAL_TESTS ))%"

# Create markdown summary
cat > $SUMMARY_FILE << EOF
# Railway API Test Summary

## Test Results
- **Date**: $(date)
- **API URL**: $RAILWAY_API_URL
- **Total Tests**: $TOTAL_TESTS
- **Passed**: $PASSED_TESTS
- **Failed**: $FAILED_TESTS
- **Pass Rate**: $(( PASSED_TESTS * 100 / TOTAL_TESTS ))%

## Test Details
EOF

# Add test details to summary
echo -e "\n### Individual Test Results\n" >> $SUMMARY_FILE
jq -r '.[] | "- **\(.name)**: \(.status) (\(.responseTime)ms) - \(.details)"' $OUTPUT_FILE >> $SUMMARY_FILE

# Performance analysis
echo -e "\n### Performance Analysis\n" >> $SUMMARY_FILE
avg_response_time=$(jq -s 'map(select(.status == "passed") | .responseTime | tonumber) | add/length | floor' $OUTPUT_FILE)
max_response_time=$(jq -s 'map(select(.status == "passed") | .responseTime | tonumber) | max' $OUTPUT_FILE)
min_response_time=$(jq -s 'map(select(.status == "passed") | .responseTime | tonumber) | min' $OUTPUT_FILE)

echo "- **Average Response Time**: ${avg_response_time}ms" >> $SUMMARY_FILE
echo "- **Max Response Time**: ${max_response_time}ms" >> $SUMMARY_FILE
echo "- **Min Response Time**: ${min_response_time}ms" >> $SUMMARY_FILE

# Recommendations
echo -e "\n### Recommendations\n" >> $SUMMARY_FILE

if [ $FAILED_TESTS -gt 0 ]; then
    echo "1. **Fix Failed Tests**: $FAILED_TESTS tests failed and need immediate attention." >> $SUMMARY_FILE
fi

if [ $avg_response_time -gt 30000 ]; then
    echo "2. **Performance Optimization**: Average response time exceeds 30 seconds. Consider optimizing API calls." >> $SUMMARY_FILE
fi

if [ $max_response_time -gt 60000 ]; then
    echo "3. **Timeout Issues**: Some requests took over 60 seconds. Review timeout settings and long-running operations." >> $SUMMARY_FILE
fi

echo -e "\n---\n*Generated by test-railway-api.sh*" >> $SUMMARY_FILE

echo -e "\n${GREEN}Test results saved to:${NC}"
echo "- JSON: $OUTPUT_FILE"
echo "- Summary: $SUMMARY_FILE"