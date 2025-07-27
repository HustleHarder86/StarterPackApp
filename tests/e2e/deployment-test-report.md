# E2E Deployment Test Report

**Date**: July 26, 2025  
**Test URL**: https://starter-pack-cpl95dq4b-hustleharder86s-projects.vercel.app/roi-finder.html?e2e_test_mode=true

## Test Summary

**Status**: ❌ FAILED - Form submission results in 400 error

## Test Details

### 1. Initial Page Load ✅
- Page loaded successfully
- E2E test mode activated (authentication bypassed)
- Pre-filled address from URL parameter: "123 Main Street, Toronto, ON M5V 3A8"

### 2. Form Filling ✅
Successfully filled all form fields:
- **Property Address**: 123 Main Street, Toronto, ON M5V 3A8 (pre-filled)
- **Purchase Price**: $750,000
- **Bedrooms**: 2 Bedrooms
- **Bathrooms**: 2 Bathrooms
- **Square Footage**: 850
- **Property Taxes**: $4,500
- **Condo/Strata Fees**: $650
- **Property Type**: Condo/Apartment

### 3. Form Submission ❌
- Form submitted successfully to the API
- **Result**: HTTP 400 Bad Request error
- **Console errors**: 
  - "Analysis error: JSHandle@error"
  - "Error displayed: JSHandle@error"

### 4. Error Display ✅
- Application properly handled the error
- Displayed user-friendly error page with:
  - "Analysis Failed" message
  - Troubleshooting steps
  - "Try Again" and "Go Back" buttons
  - Error ID: api/analysis-failed-1753553407758-52NAM5

## Screenshots Captured

1. **01-initial-load.png**: Shows form with pre-filled address
2. **02-form-filled.png**: Shows all fields properly filled
3. **03-form-submitted.png**: Captured immediately after submission
4. **04-after-submission.png**: Shows loading state
5. **05-final-state.png**: Shows error screen

## Root Cause Analysis

The 400 Bad Request error suggests the API is rejecting the request. Possible causes:

1. **propertyAddress Field Issue**: The mentioned fix for propertyAddress field may not be deployed yet
2. **API Validation**: The API might be expecting different field names or formats
3. **Missing Fields**: The API might require additional fields not present in the form
4. **CORS/Authentication**: Despite E2E mode, there might be authentication issues

## Recommendations

1. **Check API Logs**: Review server logs for the specific 400 error details
2. **Verify Deployment**: Ensure the propertyAddress fix is actually deployed
3. **Test API Directly**: Use curl/Postman to test the API endpoint with the same data
4. **Check Field Mapping**: Verify form field names match API expectations
5. **Add Debug Logging**: Add console logs to see the exact request payload being sent

## Test Conclusion

While the form UI works correctly and all fields can be filled, the form submission fails with a 400 error. The application properly handles the error with a user-friendly message, but the core functionality of analyzing properties is not working on this deployment.