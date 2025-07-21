#!/bin/bash

# Pre-push Testing Checklist
# Run this before pushing to GitHub

echo "🚀 Pre-Push Checklist for StarterPackApp"
echo "========================================"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Error: Not in project root directory${NC}"
    exit 1
fi

echo "1. Running component tests..."
if node tests/test-ui-components.js > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Component tests passed${NC}"
else
    echo -e "${RED}❌ Component tests failed${NC}"
    echo "   Run: node tests/test-ui-components.js"
    exit 1
fi

echo ""
echo "2. Checking for common issues..."
# Check for debugger statements
if grep -r "debugger;" --include="*.js" . > /dev/null 2>&1; then
    echo -e "${RED}❌ Found debugger statements${NC}"
    grep -r "debugger;" --include="*.js" . | head -5
else
    echo -e "${GREEN}✅ No debugger statements${NC}"
fi

# Check for console.log in components
CONSOLE_COUNT=$(grep -r "console\.log" components/ --include="*.js" 2>/dev/null | wc -l)
if [ $CONSOLE_COUNT -gt 0 ]; then
    echo -e "${YELLOW}⚠️  Found $CONSOLE_COUNT console.log statements in components${NC}"
else
    echo -e "${GREEN}✅ No console.log in components${NC}"
fi

echo ""
echo "3. Checking critical files..."
CRITICAL_FILES=(
    "components/analysis/InvestmentVerdictEnhanced.js"
    "components/analysis/AirbnbListingsEnhanced.js"
    "components/ui/Badge.js"
    "styles/design-system.css"
    "js/modules/componentLoader.js"
)

ALL_EXIST=true
for file in "${CRITICAL_FILES[@]}"; do
    if [ ! -f "$file" ]; then
        echo -e "${RED}❌ Missing: $file${NC}"
        ALL_EXIST=false
    fi
done

if [ "$ALL_EXIST" = true ]; then
    echo -e "${GREEN}✅ All critical files present${NC}"
fi

echo ""
echo "4. Git status check..."
# Check for uncommitted changes
if [ -n "$(git status --porcelain)" ]; then
    echo -e "${YELLOW}⚠️  You have uncommitted changes:${NC}"
    git status --short
    echo ""
    echo "   Commit your changes before pushing!"
else
    echo -e "${GREEN}✅ Working directory clean${NC}"
fi

echo ""
echo "5. Manual testing reminder:"
echo "   📋 Have you tested in the browser?"
echo "   📋 Open tests/browser-test.html in browser"
echo "   📋 Test the actual roi-finder.html page"
echo "   📋 Check browser console for errors"

echo ""
echo "========================================"
echo ""

# Ask for confirmation
read -p "Have you completed manual testing? (y/n) " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${GREEN}✨ All checks complete! Ready to push.${NC}"
    echo ""
    echo "To push: git push origin main"
    exit 0
else
    echo -e "${YELLOW}⚠️  Please complete manual testing before pushing.${NC}"
    exit 1
fi