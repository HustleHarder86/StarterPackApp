// Comprehensive property data extraction for Realtor.ca
// This extracts ALL available data for investment analysis

function extractAllPropertyData() {
  console.log('[StarterPack] Starting comprehensive data extraction...');
  
  const data = {
    // Basic info
    url: window.location.href,
    mlsNumber: '',
    
    // Location
    address: {},
    coordinates: {},
    
    // Price info
    price: 0,
    pricePerSqft: 0,
    
    // Property characteristics
    propertyType: '',
    style: '',
    bedrooms: 0,
    bathrooms: 0,
    sqft: 0,
    lotSize: '',
    yearBuilt: null,
    
    // Financial data
    propertyTaxes: 0,
    condoFees: 0,
    
    // Features
    parking: '',
    garage: '',
    basement: '',
    heating: '',
    cooling: '',
    utilities: [],
    appliances: [],
    
    // Building info
    buildingAmenities: [],
    totalUnitsInBuilding: 0,
    
    // Listing info
    listingDate: '',
    daysOnMarket: 0,
    virtualTour: false,
    
    // Description
    description: '',
    
    // Neighborhood
    neighborhood: '',
    walkScore: 0,
    transitScore: 0,
    
    // Schools
    schools: [],
    
    // All raw text for AI analysis
    allTextContent: ''
  };
  
  // Extract MLS Number
  const mlsElement = Array.from(document.querySelectorAll('*')).find(el => 
    el.textContent.match(/MLS®?\s*Number:?\s*([A-Z0-9]+)/i)
  );
  if (mlsElement) {
    const match = mlsElement.textContent.match(/MLS®?\s*Number:?\s*([A-Z0-9]+)/i);
    data.mlsNumber = match ? match[1] : '';
  }
  
  // Extract price
  const priceText = document.querySelector('h1 + div span')?.textContent || 
                   document.querySelector('[class*="price"]')?.textContent || '';
  data.price = parseInt(priceText.replace(/[^0-9]/g, '')) || 0;
  
  // Extract address
  const addressElement = document.querySelector('h1');
  if (addressElement) {
    const addressText = addressElement.textContent.trim();
    const parts = addressText.split(/[,()]/);
    data.address = {
      full: addressText,
      street: parts[0]?.trim() || '',
      city: parts[1]?.trim() || '',
      province: parts[2]?.trim()?.split(' ')[0] || '',
      postalCode: parts[2]?.trim()?.split(' ').slice(1).join(' ') || ''
    };
  }
  
  // Extract property details from the table
  const propertyTable = document.querySelector('.propertyDetailsSectionContentSubCon');
  if (propertyTable) {
    // Get all rows
    const rows = propertyTable.querySelectorAll('tr');
    rows.forEach(row => {
      const label = row.querySelector('td:first-child')?.textContent?.trim().toLowerCase() || '';
      const value = row.querySelector('td:last-child')?.textContent?.trim() || '';
      
      // Map common fields
      if (label.includes('property type')) data.propertyType = value;
      else if (label.includes('building type')) data.style = value;
      else if (label.includes('storeys')) data.storeys = parseInt(value) || 0;
      else if (label.includes('square footage')) data.sqft = parseInt(value.replace(/[^0-9]/g, '')) || 0;
      else if (label.includes('bedrooms')) data.bedrooms = parseInt(value) || 0;
      else if (label.includes('bathrooms')) data.bathrooms = parseInt(value) || 0;
      else if (label.includes('parking type')) data.parking = value;
      else if (label.includes('garage')) data.garage = value;
      else if (label.includes('basement')) data.basement = value;
      else if (label.includes('heating')) data.heating = value;
      else if (label.includes('cooling') || label.includes('air conditioning')) data.cooling = value;
      else if (label.includes('annual property taxes')) {
        data.propertyTaxes = parseInt(value.replace(/[^0-9]/g, '')) || 0;
        console.log('[StarterPack] Found property taxes:', data.propertyTaxes);
      }
      else if (label.includes('time on realtor.ca')) data.daysOnMarket = parseInt(value) || 0;
      else if (label.includes('land size')) data.lotSize = value;
      else if (label.includes('year built')) data.yearBuilt = parseInt(value) || null;
    });
  }
  
  // Extract building details for condos
  const buildingSection = document.querySelector('#buildingSection');
  if (buildingSection) {
    const buildingRows = buildingSection.querySelectorAll('tr');
    buildingRows.forEach(row => {
      const label = row.querySelector('td:first-child')?.textContent?.trim().toLowerCase() || '';
      const value = row.querySelector('td:last-child')?.textContent?.trim() || '';
      
      if (label.includes('condo fee') || label.includes('maintenance fee')) {
        data.condoFees = parseInt(value.replace(/[^0-9]/g, '')) || 0;
        console.log('[StarterPack] Found condo fees:', data.condoFees);
      }
      else if (label.includes('amenities')) {
        data.buildingAmenities = value.split(',').map(a => a.trim());
      }
    });
  }
  
  // Extract utilities
  const utilityElements = Array.from(document.querySelectorAll('*')).filter(el => 
    el.textContent.match(/utilities|hydro|water|sewer|electricity/i)
  );
  utilityElements.forEach(el => {
    const text = el.textContent;
    if (!data.utilities.includes(text) && text.length < 100) {
      data.utilities.push(text);
    }
  });
  
  // Extract description
  const descElement = document.querySelector('.listingDescriptionCon');
  if (descElement) {
    data.description = descElement.textContent.trim();
  }
  
  // Extract neighborhood info
  const neighborhoodElement = document.querySelector('[class*="neighbourhood"]');
  if (neighborhoodElement) {
    data.neighborhood = neighborhoodElement.textContent.trim();
  }
  
  // Extract walk score if available
  const walkScoreElement = Array.from(document.querySelectorAll('*')).find(el => 
    el.textContent.match(/walk\s*score:?\s*(\d+)/i)
  );
  if (walkScoreElement) {
    const match = walkScoreElement.textContent.match(/walk\s*score:?\s*(\d+)/i);
    data.walkScore = match ? parseInt(match[1]) : 0;
  }
  
  // Check for virtual tour
  data.virtualTour = !!document.querySelector('[class*="virtual-tour"], [class*="3d-tour"]');
  
  // Get ALL text content for AI analysis
  const mainContent = document.querySelector('.listingDetailsCon');
  if (mainContent) {
    data.allTextContent = mainContent.textContent.replace(/\s+/g, ' ').trim();
  }
  
  // Calculate price per sqft
  if (data.price && data.sqft) {
    data.pricePerSqft = Math.round(data.price / data.sqft);
  }
  
  console.log('[StarterPack] Extraction complete:', data);
  return data;
}