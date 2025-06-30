// Debug content script - run this in the property page console

console.log('=== Debugging StarterPack Content Script ===');

// 1. Check if content script is loaded
if (typeof extractPropertyData === 'function') {
  console.log('✅ Content script is loaded');
} else {
  console.log('❌ Content script NOT loaded');
}

// 2. Check URL
console.log('Current URL:', window.location.href);
console.log('Pathname:', window.location.pathname);
console.log('Is property page?', window.location.pathname.includes('/real-estate/'));

// 3. Check for price elements
const priceSelectors = [
  '[data-testid="listingPrice"]',
  '.listingPrice',
  '[class*="price"]',
  '.listingDetailsPrice',
  'div[class*="Price"]'
];

console.log('\n3. Looking for price elements:');
priceSelectors.forEach(selector => {
  const el = document.querySelector(selector);
  console.log(`  ${selector}:`, el ? '✅ Found' : '❌ Not found', el);
});

// 4. Check if button exists
const existingButton = document.getElementById('starterpack-analyze-btn');
console.log('\n4. Existing button:', existingButton ? '✅ Found' : '❌ Not found');

// 5. Try to find where to add button
console.log('\n5. Looking for button locations:');
const priceElement = document.querySelector('.listingDetailsPrice');
console.log('Price element:', priceElement);
if (priceElement) {
  console.log('Price parent:', priceElement.parentElement);
  console.log('Price container classes:', priceElement.parentElement.className);
}

// 6. Try to manually add button
console.log('\n6. Attempting to manually add button...');
function addDebugButton() {
  // Remove existing button if any
  const existing = document.getElementById('starterpack-analyze-btn');
  if (existing) existing.remove();
  
  // Find price container - try multiple selectors
  let container = document.querySelector('.listingDetailsPrice')?.parentElement;
  
  if (!container) {
    // Try alternative location - after property details
    container = document.querySelector('.propertyDetailsSectionContentSubCon');
  }
  
  if (container) {
    const button = document.createElement('button');
    button.id = 'starterpack-analyze-btn';
    button.style.cssText = `
      display: inline-flex;
      align-items: center;
      gap: 8px;
      margin: 16px 0;
      padding: 12px 24px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
    `;
    button.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" stroke-width="2"/>
      </svg>
      Analyze with StarterPack
    `;
    
    container.appendChild(button);
    console.log('✅ Button added to:', container);
    
    button.addEventListener('click', () => {
      console.log('Button clicked!');
      alert('StarterPack analyze button clicked! (Debug mode)');
    });
  } else {
    console.log('❌ Could not find container for button');
  }
}

addDebugButton();