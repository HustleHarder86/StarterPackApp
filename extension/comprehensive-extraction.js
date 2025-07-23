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
    let addressText = addressElement.textContent.trim();
    console.log('[StarterPack] Raw address text:', addressText);
    
    // Fix common spacing issues before parsing
    // Fix concatenated street types and city names (e.g., "ROADMilton" -> "ROAD Milton")
    const streetTypes = [
      'AVENUE', 'AVE', 'STREET', 'ST', 'ROAD', 'RD', 'DRIVE', 'DR',
      'BOULEVARD', 'BLVD', 'COURT', 'CT', 'PLACE', 'PL', 'LANE', 'LN',
      'WAY', 'PARKWAY', 'PKWY', 'CIRCLE', 'CIR', 'CRESCENT', 'CRES',
      'TERRACE', 'TERR', 'TRAIL', 'TRL', 'CROSSING', 'XING', 'SQUARE', 'SQ',
      'HEIGHTS', 'HTS', 'GROVE', 'GRV'
    ];
    
    // Add spaces after street types if missing
    streetTypes.forEach(type => {
      const regex = new RegExp(`(${type})([A-Z])`, 'g');
      addressText = addressText.replace(regex, '$1 $2');
    });
    
    // Fix other concatenation issues
    addressText = addressText
      .replace(/([a-z])([A-Z])/g, '$1 $2') // lowercase followed by uppercase
      .replace(/([A-Z]{2,})([A-Z][a-z])/g, '$1 $2') // multiple caps followed by capital+lowercase
      .replace(/\s+/g, ' ') // normalize multiple spaces
      .trim();
    
    console.log('[StarterPack] Fixed address text:', addressText);
    
    // First try to split by comma/parentheses
    let parts = addressText.split(/[,()]/);
    
    // If no proper city found, try to extract from the fixed address
    if (parts.length === 1 || (parts[1] && parts[1].includes('Ontario'))) {
      // Look for city name pattern
      const match = addressText.match(/(.+?)\s+(\w+)\s*(?:\([^)]+\))?\s*,?\s*(Ontario|ON|British Columbia|BC|Alberta|AB|Quebec|QC)\s+([A-Z]\d[A-Z]\s*\d[A-Z]\d)$/i);
      if (match) {
        data.address = {
          full: addressText,
          street: match[1].trim(),
          city: match[2].trim(),
          province: match[3].trim(),
          postalCode: match[4].trim()
        };
      } else {
        // Fallback to original parsing
        data.address = {
          full: addressText,
          street: parts[0]?.trim() || '',
          city: parts[1]?.trim() || '',
          province: parts[2]?.trim()?.split(' ')[0] || '',
          postalCode: parts[2]?.trim()?.split(' ').slice(1).join(' ') || ''
        };
      }
    } else {
      // Use standard parsing
      data.address = {
        full: addressText,
        street: parts[0]?.trim() || '',
        city: parts[1]?.trim() || '',
        province: parts[2]?.trim()?.split(' ')[0] || '',
        postalCode: parts[2]?.trim()?.split(' ').slice(1).join(' ') || ''
      };
    }
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
      else if (label.includes('bedrooms')) {
        // Handle "X + Y" format (e.g., "4 + 2")
        const plusMatch = value.match(/(\d+)\s*\+\s*(\d+)/);
        if (plusMatch) {
          data.bedrooms = parseInt(plusMatch[1]) + parseInt(plusMatch[2]);
        } else {
          data.bedrooms = parseInt(value) || 0;
        }
      }
      else if (label.includes('bathrooms')) {
        // Handle "X + Y" format (e.g., "2 + 1")
        const plusMatch = value.match(/(\d+\.?\d*)\s*\+\s*(\d+\.?\d*)/);
        if (plusMatch) {
          data.bathrooms = parseFloat(plusMatch[1]) + parseFloat(plusMatch[2]);
        } else {
          data.bathrooms = parseFloat(value) || 0;
        }
      }
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