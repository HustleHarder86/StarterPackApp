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
    // Try multiple selectors
    const selectors = [
      '.listingDetailsPrice',
      '[data-testid="listingPrice"]',
      '.listingPrice',
      '[class*="price"]',
      'h1 + div span' // Sometimes price is in a span after h1
    ];
    
    for (const selector of selectors) {
      const priceElement = document.querySelector(selector);
      if (priceElement && priceElement.textContent) {
        const priceText = priceElement.textContent;
        const price = priceText.replace(/[^0-9]/g, '');
        const priceNum = parseInt(price);
        if (!isNaN(priceNum) && priceNum > 0) {
          console.log('[StarterPack] Found price:', priceNum, 'from selector:', selector);
          return priceNum;
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
        const fullAddress = addressElement.textContent.trim();
        if (fullAddress && fullAddress.length > 5 && !fullAddress.includes('Cookie')) {
          console.log('[StarterPack] Found address:', fullAddress, 'from selector:', selector);
          const parts = fullAddress.split(',').map(part => part.trim());
          
          // Try to parse Canadian address format
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
  const bedroomElement = Array.from(document.querySelectorAll('[class*="bedroom"], [data-testid*="bed"]'))
    .find(el => el.textContent.match(/\d+\s*(bed|bedroom)/i));
  
  if (bedroomElement) {
    const match = bedroomElement.textContent.match(/(\d+)/);
    return match ? parseInt(match[1]) : null;
  }
  return null;
}

function extractBathrooms() {
  const bathroomElement = Array.from(document.querySelectorAll('[class*="bathroom"], [data-testid*="bath"]'))
    .find(el => el.textContent.match(/\d+\.?\d*\s*(bath|bathroom)/i));
  
  if (bathroomElement) {
    const match = bathroomElement.textContent.match(/(\d+\.?\d*)/);
    return match ? parseFloat(match[1]) : null;
  }
  return null;
}

function extractSquareFootage() {
  const sqftElement = Array.from(document.querySelectorAll('[class*="sqft"], [class*="square"]'))
    .find(el => el.textContent.match(/\d+\s*(sq|square)/i));
  
  if (sqftElement) {
    const match = sqftElement.textContent.match(/(\d+)/);
    return match ? parseInt(match[1]) : null;
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
      'img[alt*="property"]',
      'img[alt*="listing"]'
    ];
    
    for (const selector of selectors) {
      const imgElement = document.querySelector(selector);
      if (imgElement && imgElement.src) {
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
    for (const img of allImages) {
      if (img.src && img.naturalWidth > 400 && img.naturalHeight > 300) {
        console.log('[StarterPack] Using fallback image:', img.src);
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
  const feeElement = Array.from(document.querySelectorAll('*'))
    .find(el => el.textContent.match(/(condo|maintenance|strata).*fee.*\$[\d,]+/i));
  
  if (feeElement) {
    const match = feeElement.textContent.match(/\$?([\d,]+)/);
    if (match) {
      return parseInt(match[1].replace(/,/g, ''));
    }
  }
  return null;
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