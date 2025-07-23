// Content script for Realtor.ca property extraction
console.log('StarterPack extension loaded on Realtor.ca');

// Function to extract property data from Realtor.ca listing page
function extractPropertyData() {
  try {
    // Check if we're on a property details page
    // Updated to handle all property types and URL patterns
    const isPropertyPage = window.location.pathname.includes('/real-estate/') || 
                          window.location.pathname.includes('/immobilier/');
    
    if (!isPropertyPage) {
      console.log('[StarterPack] Not a property page:', window.location.pathname);
      return null;
    }
    
    console.log('[StarterPack] Extracting comprehensive property data from:', window.location.href);

    const propertyData = {
      source: 'realtor.ca',
      url: window.location.href,
      extractedAt: new Date().toISOString(),
      
      // MLS Number
      mlsNumber: extractMLSNumber(),
      
      // Price and financial
      price: extractPrice(),
      pricePerSqft: 0,
      propertyTaxes: extractPropertyTaxes(),
      condoFees: extractCondoFees(),
      
      // Address components
      address: extractAddress(),
      
      // Property details
      bedrooms: extractBedrooms(),
      bathrooms: extractBathrooms(),
      sqft: extractSquareFootage(),
      lotSize: extractLotSize(),
      propertyType: extractPropertyType(),
      style: extractBuildingStyle(),
      yearBuilt: extractYearBuilt(),
      
      // Features
      parking: extractParking(),
      garage: extractGarage(),
      basement: extractBasement(),
      heating: extractHeating(),
      cooling: extractCooling(),
      appliances: extractAppliances(),
      
      // Building info (for condos)
      buildingAmenities: extractBuildingAmenities(),
      
      // Listing details
      daysOnMarket: extractDaysOnMarket(),
      virtualTour: hasVirtualTour(),
      
      // Description and neighborhood
      description: extractDescription(),
      neighborhood: extractNeighborhood(),
      
      // All text for AI analysis
      allTextContent: extractAllText(),
      
      // Main property image
      mainImage: extractMainImage()
    };
    
    // Calculate price per sqft
    if (propertyData.price && propertyData.sqft) {
      propertyData.pricePerSqft = Math.round(propertyData.price / propertyData.sqft);
    }
    
    console.log('[StarterPack] Comprehensive extraction complete:', propertyData);
    console.log('[StarterPack] Final property data with image:', {
      ...propertyData,
      mainImageFound: !!propertyData.mainImage,
      mainImageLength: propertyData.mainImage ? propertyData.mainImage.length : 0
    });
    
    // Debug summary for easy visibility
    console.log('========== STARTERPACK EXTRACTION SUMMARY ==========');
    console.log(`Price: $${propertyData.price?.toLocaleString() || 'NOT FOUND'}`);
    console.log(`Property Tax: $${propertyData.propertyTaxes?.toLocaleString() || 'NOT FOUND'}/year`);
    console.log(`Condo Fees: $${propertyData.condoFees || 'NOT FOUND'}/month`);
    console.log(`Bedrooms: ${propertyData.bedrooms || 'NOT FOUND'}`);
    console.log(`Bathrooms: ${propertyData.bathrooms || 'NOT FOUND'}`);
    console.log(`Square Feet: ${propertyData.sqft || 'NOT FOUND'}`);
    console.log(`Property Type: ${propertyData.propertyType || 'NOT FOUND'}`);
    console.log(`MLS Number: ${propertyData.mlsNumber || 'NOT FOUND'}`);
    console.log(`Address: ${propertyData.address?.full || 'NOT FOUND'}`);
    console.log(`Image: ${propertyData.mainImage ? 'FOUND' : 'NOT FOUND'}`);
    console.log('==================================================');
    
    // Alert if critical data is missing
    if (!propertyData.sqft) {
      console.warn('[StarterPack] ⚠️ WARNING: Square footage not found! This will affect calculations.');
    }
    if (!propertyData.propertyTaxes) {
      console.warn('[StarterPack] ⚠️ WARNING: Property taxes not found! Calculations will use estimates.');
    }
    
    return propertyData;
  } catch (error) {
    console.error('Error extracting property data:', error);
    return null;
  }
}

// Helper function to extract MLS from URL
function extractMLSFromURL() {
  const match = window.location.pathname.match(/mls-([a-zA-Z0-9]+)/);
  return match ? match[1] : null;
}

// Helper functions for data extraction
function extractPrice() {
  try {
    // Try multiple selectors - more specific for Realtor.ca
    const selectors = [
      '.listingDetailsPrice',
      '[data-testid="listingPrice"]',
      '.priceWrapper',
      '.price',
      '.listingPrice',
      '[class*="priceWrapper"] span',
      '[class*="listingPrice"]',
      'div[class*="price"]:not([class*="priceChange"])',
      '.propertyDetailsSectionContentValue',
      'span[class*="price"]',
      '.listingDetailsPriceAmount',
      '[class*="priceAmount"]'
    ];
    
    for (const selector of selectors) {
      const priceElement = document.querySelector(selector);
      if (priceElement && priceElement.textContent) {
        const priceText = priceElement.textContent.trim();
        console.log('[StarterPack] Price text found:', priceText, 'from selector:', selector);
        
        // Extract price more carefully - look for dollar sign and number pattern
        const priceMatch = priceText.match(/\$([0-9,]+)/);
        if (priceMatch) {
          const price = priceMatch[1].replace(/,/g, '');
          const priceNum = parseInt(price);
          if (!isNaN(priceNum) && priceNum > 10000 && priceNum < 100000000) {
            console.log('[StarterPack] Extracted price:', priceNum);
            return priceNum;
          }
        }
        
        // Fallback: if no $ sign, try to extract just numbers with commas
        const fallbackMatch = priceText.match(/([0-9]{1,3}(?:,[0-9]{3})+)/);
        if (fallbackMatch) {
          const price = fallbackMatch[1].replace(/,/g, '');
          const priceNum = parseInt(price);
          if (!isNaN(priceNum) && priceNum > 10000 && priceNum < 100000000) {
            console.log('[StarterPack] Extracted price (fallback):', priceNum);
            return priceNum;
          }
        }
      }
    }
    
    // Try to find price in property details section
    const propertyDetailsRows = document.querySelectorAll('.propertyDetailsSectionContentRow, tr');
    for (const row of propertyDetailsRows) {
      const label = row.querySelector('.propertyDetailsSectionContentLabel, td:first-child');
      const value = row.querySelector('.propertyDetailsSectionContentValue, td:last-child');
      if (label && value && label.textContent.toLowerCase().includes('price')) {
        const priceText = value.textContent.trim();
        console.log('[StarterPack] Found price in property details:', priceText);
        const priceMatch = priceText.match(/\$([0-9,]+)/);
        if (priceMatch) {
          const price = priceMatch[1].replace(/,/g, '');
          const priceNum = parseInt(price);
          if (!isNaN(priceNum) && priceNum > 10000) {
            return priceNum;
          }
        }
      }
    }
    
    // Last resort: search all elements for price pattern
    console.log('[StarterPack] Trying last resort price search...');
    const allElements = document.querySelectorAll('span, div, p, td');
    for (const element of allElements) {
      if (element.childNodes.length > 0) {
        const text = element.textContent.trim();
        // Look for standalone price format
        if (text.match(/^\$[0-9]{1,3}(,[0-9]{3})+$/)) {
          const price = text.replace(/[$,]/g, '');
          const priceNum = parseInt(price);
          if (!isNaN(priceNum) && priceNum > 10000 && priceNum < 100000000) {
            console.log('[StarterPack] Found price in element:', text, 'tag:', element.tagName, 'class:', element.className);
            return priceNum;
          }
        }
      }
    }
    
    console.log('[StarterPack] Could not extract price');
  } catch (e) {
    console.error('[StarterPack] Price extraction error:', e);
  }
  return null;
}

function extractAddress() {
  try {
    // Try multiple selectors
    const selectors = [
      '.listingDetailsAddressBar',
      '[data-testid="listingAddress"]',
      '.listingAddress',
      '[class*="address"]',
      'h1'
    ];
    
    for (const selector of selectors) {
      const addressElement = document.querySelector(selector);
      if (addressElement && addressElement.textContent) {
        let fullAddress = addressElement.textContent.trim();
        if (fullAddress && fullAddress.length > 5 && !fullAddress.includes('Cookie')) {
          console.log('[StarterPack] Found raw address:', fullAddress, 'from selector:', selector);
          
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
            fullAddress = fullAddress.replace(regex, '$1 $2');
          });
          
          // Fix other concatenation issues (e.g., "E Oakville" -> "E Oakville")
          fullAddress = fullAddress
            .replace(/([a-z])([A-Z])/g, '$1 $2') // lowercase followed by uppercase
            .replace(/([A-Z]{2,})([A-Z][a-z])/g, '$1 $2') // multiple caps followed by capital+lowercase
            .replace(/\s+/g, ' ') // normalize multiple spaces
            .trim();
          
          console.log('[StarterPack] Fixed address:', fullAddress);
          
          // First try to split by comma
          let parts = fullAddress.split(',').map(part => part.trim());
          
          // If no comma after street, try to extract city from the fixed address
          if (parts.length === 1 || (parts[1] && parts[1].includes('Ontario'))) {
            // Look for city name before province
            const match = fullAddress.match(/(.+?)\s+(\w+)\s*(?:\([^)]+\))?\s*,?\s*(Ontario|ON|British Columbia|BC|Alberta|AB|Quebec|QC)\s+([A-Z]\d[A-Z]\s*\d[A-Z]\d)$/i);
            if (match) {
              const streetPart = match[1].trim();
              const cityName = match[2].trim();
              const province = match[3].trim();
              const postalCode = match[4].trim();
              
              return {
                street: streetPart,
                city: cityName,
                province: province,
                postalCode: postalCode,
                country: 'Canada',
                full: fullAddress
              };
            }
          }
          
          // Fallback to comma-based parsing
          return {
            street: parts[0] || '',
            city: parts[1] || '',
            province: parts[2]?.split(' ')[0] || '',
            postalCode: parts[2]?.split(' ').slice(1).join(' ') || '',
            country: 'Canada',
            full: fullAddress
          };
        }
      }
    }
    
    console.log('[StarterPack] Could not extract address');
  } catch (e) {
    console.error('[StarterPack] Address extraction error:', e);
  }
  
  return {
    street: '',
    city: '',
    province: '',
    postalCode: '',
    country: 'Canada',
    full: ''
  };
}

function extractBedrooms() {
  console.log('[StarterPack] Starting bedroom extraction...');
  
  // Debug: Log all elements found with bedroom-related classes
  const elements = document.querySelectorAll('[class*="bedroom"], [data-testid*="bed"]');
  console.log('[StarterPack] Found', elements.length, 'elements with bedroom classes');
  
  // Try to find any element containing bedroom info
  const bedroomElement = Array.from(elements)
    .find(el => {
      const text = el.textContent;
      console.log('[StarterPack] Checking element:', el.className, 'Text:', text.substring(0, 50));
      return text.match(/\d+\s*(bed|bedroom)/i);
    });
  
  if (bedroomElement) {
    const text = bedroomElement.textContent;
    
    // Check for "X + Y" format (e.g., "4 + 2 bedrooms")
    const plusMatch = text.match(/(\d+)\s*\+\s*(\d+)\s*(bed|bedroom|bdrm|br)s?/i);
    if (plusMatch) {
      const mainBeds = parseInt(plusMatch[1]);
      const additionalBeds = parseInt(plusMatch[2]);
      const totalBeds = mainBeds + additionalBeds;
      console.log('[StarterPack] Found bedrooms in "X + Y" format:', mainBeds, '+', additionalBeds, '=', totalBeds);
      return totalBeds;
    }
    
    // Fallback to simple number extraction
    const match = text.match(/(\d+)/);
    console.log('[StarterPack] Found bedrooms:', match ? match[1] : 'no match');
    return match ? parseInt(match[1]) : null;
  }
  
  // Try a broader search - look for any element with bedroom text
  console.log('[StarterPack] Trying broader search...');
  
  // Try different selector patterns
  const additionalSelectors = [
    'span', 'div', 'td', 'li', 'p',
    '[class*="detail"]',
    '[class*="spec"]',
    '[class*="feature"]',
    '[class*="listing"]'
  ];
  
  for (let selector of additionalSelectors) {
    const elements = document.querySelectorAll(selector);
    for (let el of elements) {
      if (el.textContent) {
        const text = el.textContent.trim();
        
        // Check for "X + Y" format first
        const plusMatch = text.match(/(\d+)\s*\+\s*(\d+)\s*(bed|bedroom|bdrm|br)s?\b/i);
        if (plusMatch && text.length < 30) {
          const mainBeds = parseInt(plusMatch[1]);
          const additionalBeds = parseInt(plusMatch[2]);
          const totalBeds = mainBeds + additionalBeds;
          console.log('[StarterPack] Found bedrooms in "X + Y" format in', selector, ':', text, 'Total:', totalBeds);
          return totalBeds;
        }
        
        // More flexible patterns for regular format
        if (text.match(/\b\d+\s*(bed|bedroom|bdrm|br)s?\b/i) && text.length < 20) {
          console.log('[StarterPack] Found bedroom match in', selector, ':', text);
          const match = text.match(/(\d+)/);
          if (match) {
            return parseInt(match[1]);
          }
        }
      }
    }
  }
  
  console.log('[StarterPack] Could not find bedroom element');
  return null;
}

function extractBathrooms() {
  console.log('[StarterPack] Starting bathroom extraction...');
  
  // Debug: Log all elements found with bathroom-related classes
  const elements = document.querySelectorAll('[class*="bathroom"], [data-testid*="bath"]');
  console.log('[StarterPack] Found', elements.length, 'elements with bathroom classes');
  
  // Try to find any element containing bathroom info
  const bathroomElement = Array.from(elements)
    .find(el => {
      const text = el.textContent;
      console.log('[StarterPack] Checking bathroom element:', el.className, 'Text:', text.substring(0, 50));
      return text.match(/\d+\.?\d*\s*(bath|bathroom)/i);
    });
  
  if (bathroomElement) {
    const text = bathroomElement.textContent;
    
    // Check for "X + Y" format (e.g., "2 + 1 bathrooms")
    const plusMatch = text.match(/(\d+\.?\d*)\s*\+\s*(\d+\.?\d*)\s*(bath|bathroom|bthrm|ba)s?/i);
    if (plusMatch) {
      const mainBaths = parseFloat(plusMatch[1]);
      const additionalBaths = parseFloat(plusMatch[2]);
      const totalBaths = mainBaths + additionalBaths;
      console.log('[StarterPack] Found bathrooms in "X + Y" format:', mainBaths, '+', additionalBaths, '=', totalBaths);
      return totalBaths;
    }
    
    // Fallback to simple number extraction
    const match = text.match(/(\d+\.?\d*)/);
    console.log('[StarterPack] Found bathrooms:', match ? match[1] : 'no match');
    return match ? parseFloat(match[1]) : null;
  }
  
  // Try a broader search - look for any element with bathroom text
  console.log('[StarterPack] Trying broader bathroom search...');
  
  // Try different selector patterns
  const additionalSelectors = [
    'span', 'div', 'td', 'li', 'p',
    '[class*="detail"]',
    '[class*="spec"]',
    '[class*="feature"]',
    '[class*="listing"]'
  ];
  
  for (let selector of additionalSelectors) {
    const elements = document.querySelectorAll(selector);
    for (let el of elements) {
      if (el.textContent) {
        const text = el.textContent.trim();
        
        // Check for "X + Y" format first
        const plusMatch = text.match(/(\d+\.?\d*)\s*\+\s*(\d+\.?\d*)\s*(bath|bathroom|bthrm|ba)s?\b/i);
        if (plusMatch && text.length < 30) {
          const mainBaths = parseFloat(plusMatch[1]);
          const additionalBaths = parseFloat(plusMatch[2]);
          const totalBaths = mainBaths + additionalBaths;
          console.log('[StarterPack] Found bathrooms in "X + Y" format in', selector, ':', text, 'Total:', totalBaths);
          return totalBaths;
        }
        
        // More flexible patterns - also match "bath" alone
        if (text.match(/\b\d+\.?\d*\s*(bath|bathroom|bthrm|ba)s?\b/i) && text.length < 20) {
          console.log('[StarterPack] Found bathroom match in', selector, ':', text);
          const match = text.match(/(\d+\.?\d*)/);
          if (match) {
            return parseFloat(match[1]);
          }
        }
      }
    }
  }
  
  console.log('[StarterPack] Could not find bathroom element');
  return null;
}

function extractSquareFootage() {
  try {
    console.log('[StarterPack] Starting square footage extraction...');
    
    // Try multiple approaches
    const selectors = [
      '[class*="sqft"]',
      '[class*="square"]',
      '[class*="area"]',
      '[class*="size"]',
      '[class*="living"]',
      '.listingDetailsSectionContentValue',
      '.propertyDetailsSectionContentValue',
      'span',
      'td',
      'div'
    ];
    
    // First, look for range patterns in all text elements - HIGHEST PRIORITY
    const allElements = document.querySelectorAll('*');
    for (const el of allElements) {
      if (el.childNodes.length === 1 && el.childNodes[0].nodeType === Node.TEXT_NODE) {
        const text = el.textContent.trim();
        
        // PRIORITY 1: Look for range patterns first
        const rangePatterns = [
          /(\d{1,3}(?:,\d{3})*)\s*-\s*(\d{1,3}(?:,\d{3})*)\s*(?:sq\.?\s*ft\.?|square\s*feet|sqft|sf)/i,
          /(\d{3,5})\s*-\s*(\d{3,5})\s*(?:sq\.?\s*ft\.?|square\s*feet|sqft|sf)/i,
          /living\s*area[:\s]*(\d{1,3}(?:,\d{3})*)\s*-\s*(\d{1,3}(?:,\d{3})*)/i,
          /floor\s*area[:\s]*(\d{1,3}(?:,\d{3})*)\s*-\s*(\d{1,3}(?:,\d{3})*)/i,
          /total\s*area[:\s]*(\d{1,3}(?:,\d{3})*)\s*-\s*(\d{1,3}(?:,\d{3})*)/i
        ];
        
        for (const pattern of rangePatterns) {
          const match = text.match(pattern);
          if (match) {
            const lowSqft = parseInt(match[1].replace(/,/g, ''));
            const highSqft = parseInt(match[2].replace(/,/g, ''));
            
            if (lowSqft > 100 && lowSqft < 50000 && highSqft > 100 && highSqft < 50000 && highSqft > lowSqft) {
              const midpointSqft = Math.round((lowSqft + highSqft) / 2);
              console.log('[StarterPack] Found square footage RANGE:', `${lowSqft}-${highSqft}`, 'using midpoint:', midpointSqft, 'in text:', text, 'element:', el.tagName);
              return midpointSqft;
            }
          }
        }
        
        // PRIORITY 2: Look for single number patterns (existing logic)
        const singlePatterns = [
          /(\d{1,3}(?:,\d{3})*)\s*(?:sq\.?\s*ft\.?|square\s*feet|sqft|sf)/i,
          /(\d{3,5})\s*(?:sq\.?\s*ft\.?|square\s*feet|sqft|sf)/i,
          /living\s*area[:\s]*(\d{1,3}(?:,\d{3})*)/i,
          /floor\s*area[:\s]*(\d{1,3}(?:,\d{3})*)/i,
          /total\s*area[:\s]*(\d{1,3}(?:,\d{3})*)/i
        ];
        
        for (const pattern of singlePatterns) {
          const match = text.match(pattern);
          if (match) {
            const sqft = parseInt(match[1].replace(/,/g, ''));
            if (sqft > 100 && sqft < 50000) { // Sanity check
              console.log('[StarterPack] Found square footage (single):', sqft, 'in text:', text, 'element:', el.tagName);
              return sqft;
            }
          }
        }
      }
    }
    
    // Search in property details table more thoroughly
    const tables = document.querySelectorAll('table, .propertyDetailsSectionContentSubCon, [class*="details"]');
    for (const table of tables) {
      const rows = table.querySelectorAll('tr, .propertyDetailsSectionContentRow, [class*="row"]');
      for (const row of rows) {
        const text = row.textContent;
        console.log('[StarterPack] Checking table row:', text.substring(0, 100));
        
        // Check if this row contains size/area information
        if (text.match(/square|sq\s*ft|area|size|living|floor/i)) {
          // PRIORITY 1: Look for ranges in table rows
          const rangeMatch = text.match(/(\d{1,3}(?:,\d{3})*)\s*-\s*(\d{1,3}(?:,\d{3})*)/);
          if (rangeMatch) {
            const lowSqft = parseInt(rangeMatch[1].replace(/,/g, ''));
            const highSqft = parseInt(rangeMatch[2].replace(/,/g, ''));
            
            if (lowSqft > 100 && lowSqft < 50000 && highSqft > 100 && highSqft < 50000 && highSqft > lowSqft) {
              const midpointSqft = Math.round((lowSqft + highSqft) / 2);
              console.log('[StarterPack] Found square footage RANGE in table:', `${lowSqft}-${highSqft}`, 'using midpoint:', midpointSqft, 'from row:', text);
              return midpointSqft;
            }
          }
          
          // PRIORITY 2: Extract single numbers from this row
          const numbers = text.match(/\d{1,3}(?:,\d{3})*|\d{3,5}/g);
          if (numbers) {
            for (const num of numbers) {
              const sqft = parseInt(num.replace(/,/g, ''));
              if (sqft > 100 && sqft < 50000) {
                console.log('[StarterPack] Found potential square footage in table:', sqft, 'from row:', text);
                return sqft;
              }
            }
          }
        }
      }
    }
    
    // Last resort: look for any text with sq ft pattern in full page
    const allText = document.body.innerText;
    console.log('[StarterPack] Searching full page text for square footage patterns...');
    
    // PRIORITY 1: Look for range patterns in full page text
    const pageRangePatterns = [
      /(\d{1,3}(?:,\d{3})*)\s*-\s*(\d{1,3}(?:,\d{3})*)\s*(?:sq\.?\s*ft\.?|square\s*feet|sqft|sf)(?!\s*lot)/i,
      /living\s*area[:\s]*(\d{1,3}(?:,\d{3})*)\s*-\s*(\d{1,3}(?:,\d{3})*)/i,
      /floor\s*area[:\s]*(\d{1,3}(?:,\d{3})*)\s*-\s*(\d{1,3}(?:,\d{3})*)/i
    ];
    
    for (const pattern of pageRangePatterns) {
      const matches = allText.match(pattern);
      if (matches) {
        const lowSqft = parseInt(matches[1].replace(/,/g, ''));
        const highSqft = parseInt(matches[2].replace(/,/g, ''));
        
        if (lowSqft > 100 && lowSqft < 50000 && highSqft > 100 && highSqft < 50000 && highSqft > lowSqft) {
          const midpointSqft = Math.round((lowSqft + highSqft) / 2);
          console.log('[StarterPack] Found square footage RANGE via page text search:', `${lowSqft}-${highSqft}`, 'using midpoint:', midpointSqft, 'pattern:', pattern);
          return midpointSqft;
        }
      }
    }
    
    // PRIORITY 2: Try single number patterns in full page text
    const pageSinglePatterns = [
      /(\d{1,3}(?:,\d{3})*)\s*(?:sq\.?\s*ft\.?|square\s*feet|sqft|sf)(?!\s*lot)/i,
      /living\s*area[:\s]*(\d{1,3}(?:,\d{3})*)/i,
      /floor\s*area[:\s]*(\d{1,3}(?:,\d{3})*)/i,
      /(\d{3,5})\s*sf(?:\s|$)/i
    ];
    
    for (const pattern of pageSinglePatterns) {
      const matches = allText.match(pattern);
      if (matches) {
        const sqft = parseInt(matches[1].replace(/,/g, ''));
        if (sqft > 100 && sqft < 50000) {
          console.log('[StarterPack] Found square footage via page text search:', sqft, 'pattern:', pattern);
          return sqft;
        }
      }
    }
    
    console.log('[StarterPack] Could not extract square footage from any source');
  } catch (e) {
    console.error('[StarterPack] Square footage extraction error:', e);
  }
  return null;
}

function extractMainImage() {
  try {
    // Try multiple selectors for the main property image
    const selectors = [
      '.heroImageWrapper img',
      '.primaryPhoto img',
      '.listingPrimaryImage img',
      '[data-testid="hero-image"] img',
      '.gallery img',
      '.photoGallery img',
      '.listingPhotos img',
      '.propertyPhoto img',
      '.listingDetailsHero img',
      '.heroImage img',
      '.mediaContainer img',
      '.listingMedia img',
      '[class*="hero"] img',
      '[class*="Hero"] img',
      '[class*="gallery"] img:first-child',
      '[class*="Gallery"] img:first-child',
      'img[alt*="property"]',
      'img[alt*="listing"]'
    ];
    
    for (const selector of selectors) {
      const imgElement = document.querySelector(selector);
      if (imgElement && imgElement.src) {
        // Skip SVG icons and small images
        if (imgElement.src.includes('.svg') || 
            imgElement.src.includes('icon') || 
            imgElement.src.includes('logo') ||
            imgElement.src.includes('heart')) {
          continue;
        }
        
        console.log('[StarterPack] Found main image:', imgElement.src, 'from selector:', selector);
        // Return the full resolution image URL
        let imageUrl = imgElement.src;
        // Remove any resize parameters to get full quality
        imageUrl = imageUrl.replace(/\/\d+x\d+\//, '/');
        return imageUrl;
      }
    }
    
    // Fallback: try to find the first large image on the page
    const allImages = document.querySelectorAll('img');
    console.log('[StarterPack] Found', allImages.length, 'total images on page');
    
    for (const img of allImages) {
      // Skip icons and SVGs
      if (img.src && (img.src.includes('.svg') || img.src.includes('icon') || img.src.includes('heart'))) {
        continue;
      }
      
      // Check if image is loaded and has reasonable dimensions
      if (img.src && img.complete) {
        console.log('[StarterPack] Checking image:', img.src, 'dimensions:', img.naturalWidth, 'x', img.naturalHeight);
        if (img.naturalWidth > 400 && img.naturalHeight > 300) {
          console.log('[StarterPack] Using fallback image:', img.src);
          return img.src;
        }
      }
    }
    
    // Try images that might not be fully loaded yet  
    for (const img of allImages) {
      if (img.src && 
          (img.src.includes('rcp-prod-uploads-realtor') || 
           img.src.includes('s3.amazonaws.com')) && 
          !img.src.includes('logo') && 
          !img.src.includes('.svg')) {
        console.log('[StarterPack] Using property image (not fully loaded):', img.src);
        return img.src;
      }
    }
    
    console.log('[StarterPack] No property image found');
  } catch (e) {
    console.error('[StarterPack] Image extraction error:', e);
  }
  return null;
}

function extractPropertyType() {
  const typeElement = document.querySelector('[data-testid="propertyType"]') ||
                     Array.from(document.querySelectorAll('*')).find(el => 
                       el.textContent.match(/(house|condo|townhouse|apartment)/i)
                     );
  
  if (typeElement) {
    const text = typeElement.textContent.toLowerCase();
    if (text.includes('house')) return 'house';
    if (text.includes('condo')) return 'condo';
    if (text.includes('townhouse')) return 'townhouse';
    if (text.includes('apartment')) return 'apartment';
  }
  return 'residential';
}

function extractYearBuilt() {
  const yearElement = Array.from(document.querySelectorAll('*'))
    .find(el => el.textContent.match(/built\s*:?\s*(\d{4})/i));
  
  if (yearElement) {
    const match = yearElement.textContent.match(/(\d{4})/);
    return match ? parseInt(match[1]) : null;
  }
  return null;
}

function extractPropertyTaxes() {
  try {
    // Method 1: Look in property details table
    const tables = document.querySelectorAll('.propertyDetailsSectionContentSubCon, #propertyDetailsSectionContentSubCon, table');
    for (const table of tables) {
      const rows = table.querySelectorAll('tr');
      for (const row of rows) {
        const cells = row.querySelectorAll('td');
        if (cells.length >= 2) {
          const label = cells[0]?.textContent?.trim().toLowerCase() || '';
          const value = cells[1]?.textContent?.trim() || '';
          
          if (label.includes('annual property tax') || label.includes('property tax')) {
            const taxAmount = parseInt(value.replace(/[^0-9]/g, '')) || 0;
            if (taxAmount > 0) {
              console.log('[StarterPack] Found property taxes in table:', taxAmount);
              return taxAmount;
            }
          }
        }
      }
    }
    
    // Method 2: Search for specific text patterns
    const taxPatterns = [
      /annual\s+property\s+tax[:\s]+\$?([\d,]+)/i,
      /property\s+tax[:\s]+\$?([\d,]+)/i,
      /taxes[:\s]+\$?([\d,]+)\s*\/\s*year/i,
      /taxes[:\s]+\$?([\d,]+)/i
    ];
    
    const allText = document.body.innerText;
    for (const pattern of taxPatterns) {
      const match = allText.match(pattern);
      if (match && match[1]) {
        const amount = parseInt(match[1].replace(/,/g, ''));
        if (amount > 0 && amount < 100000) { // Sanity check
          console.log('[StarterPack] Found property taxes via pattern:', amount);
          return amount;
        }
      }
    }
    
    console.log('[StarterPack] No property taxes found');
  } catch (e) {
    console.error('[StarterPack] Error extracting property taxes:', e);
  }
  return 0;
}

function extractCondoFees() {
  try {
    console.log('[StarterPack] Starting condo fees extraction...');
    
    // Method 1: Look in property details table
    const tables = document.querySelectorAll('.propertyDetailsSectionContentSubCon, #propertyDetailsSectionContentSubCon, table');
    for (const table of tables) {
      const rows = table.querySelectorAll('tr');
      for (const row of rows) {
        const cells = row.querySelectorAll('td');
        if (cells.length >= 2) {
          const label = cells[0]?.textContent?.trim().toLowerCase() || '';
          const value = cells[1]?.textContent?.trim() || '';
          
          if (label.includes('condo fee') || label.includes('maintenance fee') || label.includes('strata fee') || label.includes('hoa')) {
            const feeAmount = parseInt(value.replace(/[^0-9]/g, '')) || 0;
            if (feeAmount > 0) {
              console.log('[StarterPack] Found condo fees in table:', feeAmount);
              return feeAmount;
            }
          }
        }
      }
    }
    
    // Method 2: Search for specific text patterns
    const feePatterns = [
      /condo\s+fees?[:\s]+\$?([\d,]+)\s*(?:\/\s*month)?/i,
      /maintenance\s+fees?[:\s]+\$?([\d,]+)\s*(?:\/\s*month)?/i,
      /strata\s+fees?[:\s]+\$?([\d,]+)\s*(?:\/\s*month)?/i,
      /hoa\s+fees?[:\s]+\$?([\d,]+)\s*(?:\/\s*month)?/i,
      /monthly\s+fees?[:\s]+\$?([\d,]+)/i
    ];
    
    const allText = document.body.innerText;
    for (const pattern of feePatterns) {
      const match = allText.match(pattern);
      if (match && match[1]) {
        const amount = parseInt(match[1].replace(/,/g, ''));
        if (amount > 0 && amount < 5000) { // Sanity check - monthly fees shouldn't be too high
          console.log('[StarterPack] Found condo fees via pattern:', amount);
          return amount;
        }
      }
    }
    
    // Method 3: Look for any element mentioning fees
    const feeElements = Array.from(document.querySelectorAll('*'))
      .filter(el => el.textContent.match(/(condo|maintenance|strata|hoa).*fee.*\$[\d,]+/i));
    
    for (const element of feeElements) {
      const match = element.textContent.match(/\$?([\d,]+)/);
      if (match) {
        const amount = parseInt(match[1].replace(/,/g, ''));
        if (amount > 0 && amount < 5000) {
          console.log('[StarterPack] Found condo fees in element:', amount);
          return amount;
        }
      }
    }
    
    console.log('[StarterPack] No condo fees found');
  } catch (e) {
    console.error('[StarterPack] Error extracting condo fees:', e);
  }
  return 0;
}

// Add analyze button to property pages
function addAnalyzeButton() {
  // Check if button already exists
  if (document.getElementById('starterpack-analyze-btn')) {
    return;
  }

  console.log('[StarterPack] Looking for place to add button...');

  // Find a good location for the button - try multiple selectors
  let targetContainer = null;
  
  // Try 1: Price element (new Realtor.ca layout)
  const priceElement = document.querySelector('.listingDetailsPrice');
  if (priceElement && priceElement.parentElement) {
    targetContainer = priceElement.parentElement;
    console.log('[StarterPack] Found price container');
  }
  
  // Try 2: Old selectors
  if (!targetContainer) {
    targetContainer = document.querySelector('[data-testid="listingPrice"]')?.parentElement ||
                     document.querySelector('.listingPrice')?.parentElement ||
                     document.querySelector('[class*="price"]')?.parentElement;
  }
  
  // Try 3: Property details section
  if (!targetContainer) {
    targetContainer = document.querySelector('.propertyDetailsSectionContentSubCon') ||
                     document.querySelector('.listingDetailsSectionContentSubCon');
  }
  
  // Try 4: After address
  if (!targetContainer) {
    const addressElement = document.querySelector('.listingDetailsAddressBar');
    if (addressElement && addressElement.parentElement) {
      targetContainer = addressElement.parentElement;
    }
  }

  if (targetContainer) {
    console.log('[StarterPack] Adding analyze button to:', targetContainer.className);
    
    const analyzeButton = document.createElement('button');
    analyzeButton.id = 'starterpack-analyze-btn';
    analyzeButton.className = 'starterpack-analyze-button';
    analyzeButton.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
      </svg>
      Analyze with StarterPack
    `;
    
    analyzeButton.addEventListener('click', handleAnalyzeClick);
    targetContainer.appendChild(analyzeButton);
    console.log('[StarterPack] Button added successfully');
    
    // Add a data preview panel for debugging
    addDataPreviewPanel();
  } else {
    console.log('[StarterPack] Could not find suitable container for button');
  }
}

// New extraction functions for comprehensive data
function extractMLSNumber() {
  // Try URL first
  const urlMatch = window.location.pathname.match(/mls-([a-zA-Z0-9]+)/);
  if (urlMatch) return urlMatch[1];
  
  // Try page content
  const mlsElement = Array.from(document.querySelectorAll('*')).find(el => 
    el.textContent.match(/MLS®?\s*Number:?\s*([A-Z0-9]+)/i)
  );
  if (mlsElement) {
    const match = mlsElement.textContent.match(/MLS®?\s*Number:?\s*([A-Z0-9]+)/i);
    return match ? match[1] : '';
  }
  return '';
}

function extractLotSize() {
  const patterns = [/lot\s+size[:\s]+([\d,.]+ x [\d,.]+|[\d,.]+ sq\.? ?ft)/i];
  const text = document.body.innerText;
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) return match[1];
  }
  return '';
}

function extractBuildingStyle() {
  const stylePatterns = ['detached', 'semi-detached', 'attached', 'townhouse', 'condo', 'apartment'];
  const text = document.body.innerText.toLowerCase();
  for (const style of stylePatterns) {
    if (text.includes(style)) return style;
  }
  return '';
}

function extractParking() {
  const parkingElement = Array.from(document.querySelectorAll('*')).find(el => 
    el.textContent.match(/parking[:\s]+(.*?)(?:\.|,|$)/i)
  );
  if (parkingElement) {
    const match = parkingElement.textContent.match(/parking[:\s]+(.*?)(?:\.|,|$)/i);
    return match ? match[1].trim() : '';
  }
  return '';
}

function extractGarage() {
  const text = document.body.innerText;
  const match = text.match(/garage[:\s]+(.*?)(?:\.|,|$)/i);
  return match ? match[1].trim() : '';
}

function extractBasement() {
  const text = document.body.innerText;
  const match = text.match(/basement[:\s]+(.*?)(?:\.|,|$)/i);
  return match ? match[1].trim() : '';
}

function extractHeating() {
  const text = document.body.innerText;
  const match = text.match(/heating[:\s]+(.*?)(?:\.|,|$)/i);
  return match ? match[1].trim() : '';
}

function extractCooling() {
  const text = document.body.innerText;
  const match = text.match(/(cooling|air conditioning)[:\s]+(.*?)(?:\.|,|$)/i);
  return match ? match[2].trim() : '';
}

function extractAppliances() {
  const applianceKeywords = ['refrigerator', 'fridge', 'stove', 'dishwasher', 'washer', 'dryer', 'microwave'];
  const found = [];
  const text = document.body.innerText.toLowerCase();
  for (const appliance of applianceKeywords) {
    if (text.includes(appliance)) found.push(appliance);
  }
  return found;
}

function extractBuildingAmenities() {
  const amenityKeywords = ['pool', 'gym', 'fitness', 'concierge', 'security', 'elevator', 'party room', 'sauna'];
  const found = [];
  const text = document.body.innerText.toLowerCase();
  for (const amenity of amenityKeywords) {
    if (text.includes(amenity)) found.push(amenity);
  }
  return found;
}

function extractDaysOnMarket() {
  const text = document.body.innerText;
  const match = text.match(/time on realtor\.ca[:\s]+(\d+)\s*days?/i);
  return match ? parseInt(match[1]) : 0;
}

function hasVirtualTour() {
  return !!document.querySelector('[class*="virtual-tour"], [class*="3d-tour"], [class*="video-tour"]');
}

function extractDescription() {
  const descElement = document.querySelector('.listingDescriptionCon, [class*="description"]');
  return descElement ? descElement.textContent.trim() : '';
}

function extractNeighborhood() {
  const neighborhoodElement = document.querySelector('[class*="neighbourhood"], [class*="neighborhood"]');
  return neighborhoodElement ? neighborhoodElement.textContent.trim() : '';
}

function extractAllText() {
  const mainContent = document.querySelector('.listingDetailsCon, .propertyDetailsCon, main');
  if (mainContent) {
    return mainContent.textContent.replace(/\s+/g, ' ').trim().substring(0, 10000); // Limit to 10k chars
  }
  return '';
}

// Add data preview panel for debugging
function addDataPreviewPanel() {
  // Only add in development/debug mode
  if (!window.location.href.includes('debug=true')) return;
  
  const panel = document.createElement('div');
  panel.id = 'starterpack-data-preview';
  panel.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    background: white;
    border: 2px solid #3b82f6;
    border-radius: 8px;
    padding: 16px;
    max-width: 300px;
    z-index: 9999;
    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    font-family: monospace;
    font-size: 12px;
  `;
  
  // Extract data for preview
  const previewData = extractPropertyData();
  
  panel.innerHTML = `
    <h3 style="margin: 0 0 10px 0; color: #3b82f6;">StarterPack Data Preview</h3>
    <div style="display: grid; gap: 4px;">
      <div>Price: <strong>${previewData?.price ? '$' + previewData.price.toLocaleString() : '❌ Not Found'}</strong></div>
      <div>Tax: <strong>${previewData?.propertyTaxes ? '$' + previewData.propertyTaxes + '/yr' : '❌ Not Found'}</strong></div>
      <div>Sq Ft: <strong>${previewData?.sqft || '❌ Not Found'}</strong></div>
      <div>Beds: <strong>${previewData?.bedrooms || '❌ Not Found'}</strong></div>
      <div>Baths: <strong>${previewData?.bathrooms || '❌ Not Found'}</strong></div>
      <div>HOA: <strong>${previewData?.condoFees ? '$' + previewData.condoFees + '/mo' : '❌ Not Found'}</strong></div>
    </div>
    <button onclick="this.parentElement.remove()" style="margin-top: 10px; padding: 4px 8px; background: #ef4444; color: white; border: none; border-radius: 4px; cursor: pointer;">Close</button>
  `;
  
  document.body.appendChild(panel);
}

// Handle analyze button click
async function handleAnalyzeClick() {
  const button = document.getElementById('starterpack-analyze-btn');
  button.disabled = true;
  button.innerHTML = 'Extracting data...';

  try {
    let propertyData = extractPropertyData();
    
    if (!propertyData) {
      console.log('[StarterPack] Extraction failed, using fallback data');
      // Create minimal property data from URL
      propertyData = {
        source: 'realtor.ca',
        url: window.location.href,
        extractedAt: new Date().toISOString(),
        mlsNumber: extractMLSFromURL() || 'Unknown',
        price: 0,
        address: {
          full: 'Property from Realtor.ca',
          street: '',
          city: '',
          province: '',
          postalCode: '',
          country: 'Canada'
        },
        // Set defaults
        bedrooms: 0,
        bathrooms: 0,
        sqft: 0,
        propertyType: 'residential',
        yearBuilt: null,
        taxes: 0,
        condoFees: 0,
        description: 'Property data will be filled in manually',
        extractionFailed: true
      };
    }

    console.log('[StarterPack] Sending property data:', propertyData);

    // Send to background script
    chrome.runtime.sendMessage({
      action: 'analyzeProperty',
      data: propertyData
    }, (response) => {
      if (response && response.success) {
        button.innerHTML = '✓ Analysis started!';
        setTimeout(() => {
          button.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
            </svg>
            Analyze with StarterPack
          `;
          button.disabled = false;
        }, 3000);
      } else {
        throw new Error(response?.error || 'Analysis failed');
      }
    });
  } catch (error) {
    console.error('[StarterPack] Analysis error:', error);
    button.innerHTML = '✗ Error - Try again';
    button.disabled = false;
  }
}

// Initialize extension
function initialize() {
  console.log('[StarterPack] Initializing extension on:', window.location.href);
  
  // Try to add button multiple times with delays
  const attempts = [500, 1000, 2000, 3000, 5000];
  attempts.forEach(delay => {
    setTimeout(() => {
      if (!document.getElementById('starterpack-analyze-btn')) {
        addAnalyzeButton();
      }
    }, delay);
  });
  
  // Watch for navigation changes (single-page app)
  let lastUrl = location.href;
  new MutationObserver(() => {
    const url = location.href;
    if (url !== lastUrl) {
      lastUrl = url;
      console.log('[StarterPack] URL changed to:', url);
      // Try adding button multiple times on navigation
      attempts.forEach(delay => {
        setTimeout(() => {
          if (!document.getElementById('starterpack-analyze-btn')) {
            addAnalyzeButton();
          }
        }, delay);
      });
    }
  }).observe(document, {subtree: true, childList: true});
}

// Run initialization
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initialize);
} else {
  initialize();
}