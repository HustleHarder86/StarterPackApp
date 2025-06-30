// Debug property extraction - run this in the Realtor.ca property page console

console.log('=== Debugging Property Extraction ===');

// Check if we're on a property page
const pathname = window.location.pathname;
console.log('1. Current pathname:', pathname);
console.log('2. Is property page?', pathname.includes('/real-estate/'));

// Test price extraction
console.log('\n3. Testing price extraction:');
const priceSelectors = [
  '.listingPrice',
  '[data-testid="listingPrice"]',
  '.listingDetailsPrice',
  '[class*="price"]',
  'span[class*="Price"]'
];

priceSelectors.forEach(selector => {
  const el = document.querySelector(selector);
  if (el) {
    console.log(`  ✅ ${selector}: "${el.textContent.trim()}"`);
  } else {
    console.log(`  ❌ ${selector}: not found`);
  }
});

// Test address extraction
console.log('\n4. Testing address extraction:');
const addressSelectors = [
  '[data-testid="listingAddress"]',
  '.listingAddress',
  '.listingDetailsAddressBar',
  '[class*="address"]',
  'h1[class*="Address"]'
];

addressSelectors.forEach(selector => {
  const el = document.querySelector(selector);
  if (el) {
    console.log(`  ✅ ${selector}: "${el.textContent.trim()}"`);
  } else {
    console.log(`  ❌ ${selector}: not found`);
  }
});

// Test MLS extraction
console.log('\n5. Testing MLS number extraction:');
const mlsSelectors = [
  '[data-testid="listingIDValue"]',
  '.listingIdValue',
  '[class*="listingId"]',
  'span:contains("MLS")'
];

mlsSelectors.forEach(selector => {
  const el = selector.includes(':contains') 
    ? Array.from(document.querySelectorAll('span')).find(e => e.textContent.includes('MLS'))
    : document.querySelector(selector);
  if (el) {
    console.log(`  ✅ ${selector}: "${el.textContent.trim()}"`);
  } else {
    console.log(`  ❌ ${selector}: not found`);
  }
});

// Look for property details
console.log('\n6. Looking for property details container:');
const detailContainers = document.querySelectorAll('[class*="propertyDetails"], [class*="listingDetails"]');
console.log(`Found ${detailContainers.length} detail containers`);

// Try to extract basic info
console.log('\n7. Attempting basic extraction:');
const propertyData = {
  url: window.location.href,
  price: document.querySelector('.listingDetailsPrice')?.textContent?.trim() || 
         document.querySelector('[class*="price"]')?.textContent?.trim(),
  address: document.querySelector('.listingDetailsAddressBar')?.textContent?.trim() ||
           document.querySelector('[class*="address"]')?.textContent?.trim(),
  mls: Array.from(document.querySelectorAll('*')).find(el => 
         el.textContent.match(/MLS.*[A-Z0-9]+/))?.textContent?.match(/MLS.*?([A-Z0-9]+)/)?.[1]
};

console.log('Extracted data:', propertyData);

// Check page structure
console.log('\n8. Page structure analysis:');
console.log('Body classes:', document.body.className);
console.log('Main containers:', Array.from(document.querySelectorAll('main, [role="main"]')).map(el => el.className));