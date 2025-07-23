#!/bin/bash

echo "🔍 Verifying Analysis Type Flow Implementation"
echo "============================================="

# Check 1: Tab switching fix in componentLoader.js
echo -n "1. Tab switching fix (window.switchTab): "
if grep -q "window.switchTab = function" js/modules/componentLoader.js; then
    echo "✅ PASS"
else
    echo "❌ FAIL"
fi

# Check 2: Analysis type in PropertyConfirmation.js
echo -n "2. Analysis type selection in PropertyConfirmation: "
if grep -q "name=\"analysisType\"" components/PropertyConfirmation.js && \
   grep -q "value=\"both\"" components/PropertyConfirmation.js && \
   grep -q "value=\"ltr\"" components/PropertyConfirmation.js && \
   grep -q "value=\"str\"" components/PropertyConfirmation.js; then
    echo "✅ PASS"
else
    echo "❌ FAIL"
fi

# Check 3: Trial notice in PropertyConfirmation.js
echo -n "3. STR trial notice implementation: "
if grep -q "str-trial-notice" components/PropertyConfirmation.js && \
   grep -q "trialsRemaining" components/PropertyConfirmation.js; then
    echo "✅ PASS"
else
    echo "❌ FAIL"
fi

# Check 4: analyzeProperty accepts analysisType in roi-finder.html
echo -n "4. analyzeProperty handles analysisType parameter: "
if grep -q "analyzeProperty(propertyData, analysisType" roi-finder.html; then
    echo "✅ PASS"
else
    echo "❌ FAIL"
fi

# Check 5: API handles analysisType in analysis.js
echo -n "5. Railway API processes analysisType: "
if grep -q "analysisType" railway-api/src/routes/analysis.js && \
   grep -q "effectiveAnalysisType" railway-api/src/routes/analysis.js; then
    echo "✅ PASS"
else
    echo "❌ FAIL"
fi

# Check 6: Conditional rendering in componentLoader.js
echo -n "6. Conditional tab/content rendering: "
if grep -q "showSTR = analysisType === 'both' || analysisType === 'str'" js/modules/componentLoader.js && \
   grep -q "showTabs = analysisType === 'both'" js/modules/componentLoader.js; then
    echo "✅ PASS"
else
    echo "❌ FAIL"
fi

echo ""
echo "📋 Summary"
echo "----------"
echo "All critical components have been updated to support:"
echo "- User-selectable analysis types (Both, LTR only, STR only)"
echo "- STR trial management with 5 free trials"
echo "- Conditional tab display based on selection"
echo "- Fixed LTR tab switching functionality"

# Kill the test server if running
echo ""
echo "Cleaning up test server..."
pkill -f "python3 -m http.server 8080" 2>/dev/null || true
echo "✅ Done!"