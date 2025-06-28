// Content script for Realtor.ca property extraction
console.log('StarterPackApp extension loaded on Realtor.ca');

// Function to extract property data from Realtor.ca listing page
function extractPropertyData() {
  try {
    // Check if we're on a property details page
    const isPropertyPage = window.location.pathname.includes('/real-estate/') && 
                          window.location.pathname.includes('/house');
    
    if (!isPropertyPage) {
      return null;
    }

    // Extract data from the page
    const propertyData = {
      source: 'realtor.ca',
      url: window.location.href,
      extractedAt: new Date().toISOString(),
      
      // MLS Number
      mlsNumber: document.querySelector('[data-testid="listingIDValue"]')?.textContent?.trim() || 
                 document.querySelector('.listingIdValue')?.textContent?.trim(),
      
      // Price
      price: extractPrice(),
      
      // Address components
      address: extractAddress(),
      
      // Property details
      bedrooms: extractBedrooms(),
      bathrooms: extractBathrooms(),
      sqft: extractSquareFootage(),
      propertyType: extractPropertyType(),
      yearBuilt: extractYearBuilt(),
      
      // Financial details
      taxes: extractPropertyTaxes(),
      condoFees: extractCondoFees(),
      
      // Additional details
      description: document.querySelector('[data-testid="listingDescription"]')?.textContent?.trim() ||
                  document.querySelector('.propertyDescriptionText')?.textContent?.trim(),
      
      // Raw listing data for backup
      rawHtml: document.querySelector('.listingDetailsContainer')?.innerHTML
    };

    return propertyData;
  } catch (error) {
    console.error('Error extracting property data:', error);
    return null;
  }
}

// Helper functions for data extraction
function extractPrice() {
  const priceElement = document.querySelector('[data-testid="listingPrice"]') ||
                      document.querySelector('.listingPrice') ||
                      document.querySelector('[class*="price"]');
  
  if (priceElement) {
    const priceText = priceElement.textContent;
    const price = priceText.replace(/[^0-9]/g, '');
    return parseInt(price) || null;
  }
  return null;
}

function extractAddress() {
  const addressElement = document.querySelector('[data-testid="listingAddress"]') ||
                        document.querySelector('.listingAddress');
  
  if (addressElement) {
    const fullAddress = addressElement.textContent.trim();
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
  const taxElement = Array.from(document.querySelectorAll('*'))
    .find(el => el.textContent.match(/tax(es)?.*\$[\d,]+/i));
  
  if (taxElement) {
    const match = taxElement.textContent.match(/\$?([\d,]+)/);
    if (match) {
      return parseInt(match[1].replace(/,/g, ''));
    }
  }
  return null;
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

  // Find a good location for the button
  const priceContainer = document.querySelector('[data-testid="listingPrice"]')?.parentElement ||
                        document.querySelector('.listingPrice')?.parentElement ||
                        document.querySelector('[class*="price"]')?.parentElement;

  if (priceContainer) {
    const analyzeButton = document.createElement('button');
    analyzeButton.id = 'starterpack-analyze-btn';
    analyzeButton.className = 'starterpack-analyze-button';
    analyzeButton.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
      </svg>
      Analyze with StarterPackApp
    `;
    
    analyzeButton.addEventListener('click', handleAnalyzeClick);
    priceContainer.appendChild(analyzeButton);
  }
}

// Handle analyze button click
async function handleAnalyzeClick() {
  const button = document.getElementById('starterpack-analyze-btn');
  button.disabled = true;
  button.innerHTML = 'Extracting data...';

  try {
    const propertyData = extractPropertyData();
    
    if (!propertyData) {
      throw new Error('Unable to extract property data');
    }

    // Send to background script
    chrome.runtime.sendMessage({
      action: 'analyzeProperty',
      data: propertyData
    }, (response) => {
      if (response.success) {
        button.innerHTML = '✓ Analysis started!';
        setTimeout(() => {
          button.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
            </svg>
            Analyze with StarterPackApp
          `;
          button.disabled = false;
        }, 3000);
      } else {
        throw new Error(response.error || 'Analysis failed');
      }
    });
  } catch (error) {
    console.error('Analysis error:', error);
    button.innerHTML = '✗ Error - Try again';
    button.disabled = false;
  }
}

// Initialize extension
function initialize() {
  // Add button on page load
  setTimeout(addAnalyzeButton, 1000);
  
  // Watch for navigation changes (single-page app)
  let lastUrl = location.href;
  new MutationObserver(() => {
    const url = location.href;
    if (url !== lastUrl) {
      lastUrl = url;
      setTimeout(addAnalyzeButton, 1000);
    }
  }).observe(document, {subtree: true, childList: true});
}

// Run initialization
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initialize);
} else {
  initialize();
}