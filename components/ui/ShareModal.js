/**
 * Share Modal Component
 * Allows users to share analysis via URL
 */

export const ShareModal = () => {
  return `
    <!-- Share Modal -->
    <div id="shareModal" class="hidden fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-xl p-2xl max-w-lg w-full mx-lg shadow-2xl">
        <h3 class="text-xl font-bold text-gray-900 mb-lg">Share This Analysis</h3>
        <p class="text-gray-600 mb-lg">Share this interactive analysis with anyone using the link below:</p>
        
        <div class="bg-gray-50 rounded-lg p-lg mb-lg">
          <div class="flex items-center gap-sm">
            <input type="text" id="shareUrl" readonly 
                   class="flex-1 px-md py-sm bg-white border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                   value="">
            <button onclick="copyShareUrl()" 
                    class="btn btn-primary btn-sm">
              Copy
            </button>
          </div>
          <div id="copySuccess" class="hidden mt-sm text-green-600 text-sm">
            ✓ Link copied to clipboard!
          </div>
        </div>
        
        <div class="text-sm text-gray-500 mb-xl">
          <p class="mb-sm">This link includes:</p>
          <ul class="list-disc list-inside space-y-xs">
            <li>All revenue and expense values</li>
            <li>Property details and location</li>
            <li>Current calculation results</li>
          </ul>
        </div>
        
        <div class="flex gap-md">
          <button onclick="closeShareModal()" 
                  class="flex-1 btn btn-secondary">
            Close
          </button>
          <button onclick="copyAndClose()" 
                  class="flex-1 btn btn-primary">
            Copy & Close
          </button>
        </div>
      </div>
    </div>
  `;
};

export const shareModalScript = `
<script>
// Share functionality
function shareAnalysis() {
  // Get current analysis data
  const analysisData = window.appState?.currentAnalysis || {};
  const propertyData = analysisData.property || {};
  
  // Collect all current financial values - only real data
  const financialData = {};
  
  // Property details - only include if available
  if (propertyData.address) financialData.address = propertyData.address;
  if (propertyData.price) financialData.price = propertyData.price;
  if (propertyData.bedrooms) financialData.bedrooms = propertyData.bedrooms;
  if (propertyData.bathrooms) financialData.bathrooms = propertyData.bathrooms;
  if (propertyData.sqft) financialData.sqft = propertyData.sqft;
  
  // Financial values from calculator - only include actual values
  const monthlyRevenue = document.getElementById('monthlyRevenue')?.value;
  if (monthlyRevenue) financialData.monthlyRevenue = monthlyRevenue;
  
  const propertyTax = document.getElementById('propertyTax')?.value;
  if (propertyTax) financialData.propertyTax = propertyTax;
  
  const insurance = document.getElementById('insurance')?.value;
  if (insurance) financialData.insurance = insurance;
  
  const hoaFees = document.getElementById('hoaFees')?.value;
  if (hoaFees) financialData.hoaFees = hoaFees;
  
  const propertyMgmt = document.getElementById('propertyMgmt')?.value;
  if (propertyMgmt) financialData.propertyMgmt = propertyMgmt;
  
  const utilities = document.getElementById('utilities')?.value;
  if (utilities) financialData.utilities = utilities;
  
  const cleaning = document.getElementById('cleaning')?.value;
  if (cleaning) financialData.cleaning = cleaning;
  
  const maintenance = document.getElementById('maintenance')?.value;
  if (maintenance) financialData.maintenance = maintenance;
  
  const supplies = document.getElementById('supplies')?.value;
  if (supplies) financialData.supplies = supplies;
  
  const platformFees = document.getElementById('platformFees')?.value;
  if (platformFees) financialData.platformFees = platformFees;
  
  const otherExpenses = document.getElementById('otherExpenses')?.value;
  if (otherExpenses) financialData.otherExpenses = otherExpenses;
  
  // Analysis ID if available
  if (analysisData.id) financialData.analysisId = analysisData.id;
  
  // Encode data in URL
  const params = new URLSearchParams(financialData);
  const shareUrl = window.location.origin + window.location.pathname + '?' + params.toString();
  
  // Show modal with URL
  document.getElementById('shareUrl').value = shareUrl;
  document.getElementById('shareModal').classList.remove('hidden');
}

function copyShareUrl() {
  const shareUrl = document.getElementById('shareUrl');
  shareUrl.select();
  shareUrl.setSelectionRange(0, 99999); // For mobile devices
  
  try {
    document.execCommand('copy');
    showCopySuccess();
  } catch (err) {
    // Fallback for newer browsers
    navigator.clipboard.writeText(shareUrl.value).then(() => {
      showCopySuccess();
    }).catch(err => {
      console.error('Failed to copy:', err);
    });
  }
}

function showCopySuccess() {
  document.getElementById('copySuccess').classList.remove('hidden');
  setTimeout(() => {
    document.getElementById('copySuccess').classList.add('hidden');
  }, 3000);
}

function closeShareModal() {
  document.getElementById('shareModal').classList.add('hidden');
}

function copyAndClose() {
  copyShareUrl();
  setTimeout(closeShareModal, 1000);
}

// Load shared data from URL if present
function loadSharedData() {
  const urlParams = new URLSearchParams(window.location.search);
  
  // Check if we have financial data in URL
  if (urlParams.has('monthlyRevenue')) {
    // Load all financial values from URL
    const fields = ['monthlyRevenue', 'propertyTax', 'insurance', 'hoaFees', 
                   'propertyMgmt', 'utilities', 'cleaning', 'maintenance', 
                   'supplies', 'platformFees', 'otherExpenses'];
    
    fields.forEach(field => {
      const value = urlParams.get(field);
      if (value) {
        const element = document.getElementById(field);
        if (element) {
          element.value = value;
        }
      }
    });
    
    // Update calculations with loaded values
    if (typeof updateFinancialCalculations === 'function') {
      setTimeout(() => {
        updateFinancialCalculations();
      }, 500);
    }
    
    // Show a notification that shared data was loaded
    const notification = document.createElement('div');
    notification.className = 'fixed top-4 right-4 bg-purple-600 text-white px-xl py-md rounded-lg shadow-lg z-50';
    notification.innerHTML = '✓ Shared analysis loaded successfully';
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.remove();
    }, 3000);
  }
}

// Check for shared data when page loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', loadSharedData);
} else {
  loadSharedData();
}
</script>
`;