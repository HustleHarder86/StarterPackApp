/**
 * Debug component to trace property data flow
 */

export const PropertyDataDebugger = ({ analysis }) => {
  // Extract property data from all possible locations
  const locations = {
    'analysis.propertyData': analysis?.propertyData,
    'analysis.property_data': analysis?.property_data,
    'analysis.data.propertyData': analysis?.data?.propertyData,
    'analysis.data.property_data': analysis?.data?.property_data,
    'window.analysisData.propertyData': window.analysisData?.propertyData,
    'window.extractedPropertyData': window.extractedPropertyData
  };
  
  // Find the first location with data
  let propertyData = null;
  let foundLocation = null;
  
  for (const [location, data] of Object.entries(locations)) {
    if (data && Object.keys(data).length > 0) {
      propertyData = data;
      foundLocation = location;
      break;
    }
  }
  
  console.log('=== Property Data Debugger ===');
  console.log('Checking all locations:', locations);
  console.log('Found property data at:', foundLocation);
  console.log('Property data contents:', propertyData);
  console.log('============================');
  
  // Store globally for other components
  if (propertyData && !window.analysisData.propertyData) {
    window.analysisData.propertyData = propertyData;
  }
  
  return ''; // Don't render anything
};