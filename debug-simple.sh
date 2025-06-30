#!/bin/bash

echo "🚀 InvestorProps Application Debug Report"
echo "========================================"
echo ""

# Base URL
BASE_URL="https://starter-pack-app.vercel.app"

# Function to test a page
test_page() {
    local url=$1
    local name=$2
    echo "🔍 Testing $name..."
    
    # Get HTTP status
    status=$(curl -s -o /dev/null -w "%{http_code}" "$url")
    echo "  HTTP Status: $status"
    
    # Check for specific content
    content=$(curl -s "$url")
    
    # Check for errors
    if echo "$content" | grep -q "Error:\|error:\|Firebase.*Error"; then
        echo "  ❌ Error messages found on page"
    fi
    
    # Page-specific checks
    case "$name" in
        "Homepage")
            if echo "$content" | grep -q "InvestorProps"; then
                echo "  ✅ Brand name found"
            else
                echo "  ❌ Brand name not found"
            fi
            
            if echo "$content" | grep -q 'href="blog'; then
                echo "  ✅ Blog link found"
            else
                echo "  ❌ Blog link not found"
            fi
            ;;
        "Blog")
            if echo "$content" | grep -q "blog-card"; then
                echo "  ✅ Blog posts structure found"
            else
                echo "  ❌ Blog posts structure not found"
            fi
            ;;
        "Blog Admin")
            if echo "$content" | grep -q "rental-roi-calculator-ddce2"; then
                echo "  ✅ Correct Firebase config found"
            else
                echo "  ❌ Incorrect Firebase config"
            fi
            ;;
    esac
    
    echo ""
}

# Function to test API
test_api() {
    local url=$1
    local name=$2
    echo "🔌 Testing API: $name..."
    
    response=$(curl -s "$url")
    status=$(curl -s -o /dev/null -w "%{http_code}" "$url")
    
    echo "  HTTP Status: $status"
    
    # Check if valid JSON
    if echo "$response" | python3 -m json.tool > /dev/null 2>&1; then
        echo "  ✅ Valid JSON response"
        
        # API-specific checks
        case "$name" in
            "Config API")
                if echo "$response" | grep -q '"firebase"'; then
                    echo "  ✅ Firebase config present"
                else
                    echo "  ❌ Firebase config missing"
                fi
                ;;
            "Blog Posts API")
                if echo "$response" | grep -q '"posts"\|"error"'; then
                    echo "  ✅ Expected response structure"
                else
                    echo "  ❌ Unexpected response structure"
                fi
                ;;
        esac
    else
        echo "  ❌ Invalid JSON response"
    fi
    
    echo ""
}

# Test all pages
echo "📄 TESTING PAGES"
echo "================"
test_page "$BASE_URL/" "Homepage"
test_page "$BASE_URL/blog.html" "Blog"
test_page "$BASE_URL/roi-finder.html" "ROI Finder"
test_page "$BASE_URL/portfolio.html" "Portfolio"
test_page "$BASE_URL/realtor-settings.html" "Realtor Settings"
test_page "$BASE_URL/blog-admin.html" "Blog Admin"
test_page "$BASE_URL/test-firebase-auth.html" "Firebase Test"

echo "🔌 TESTING APIs"
echo "==============="
test_api "$BASE_URL/api/config" "Config API"
test_api "$BASE_URL/api/blog/posts" "Blog Posts API"

echo "🔍 CHECKING NAVIGATION CONSISTENCY"
echo "=================================="
# Check if blog link is consistent across pages
pages=("/" "/roi-finder.html" "/portfolio.html")
for page in "${pages[@]}"; do
    if curl -s "$BASE_URL$page" | grep -q 'href="blog\|href="/blog'; then
        echo "  ✅ Blog link found on $page"
    else
        echo "  ❌ Blog link missing on $page"
    fi
done

echo ""
echo "📊 SUMMARY"
echo "=========="
echo "Debug complete. Check results above for any ❌ marks indicating issues."