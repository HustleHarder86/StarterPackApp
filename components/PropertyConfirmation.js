// Property Confirmation Component (Plain JavaScript)
// Shows property details and asks for user confirmation before analysis

export function PropertyConfirmation(propertyData, onConfirm, onCancel) {
    // Format currency
    const formatCurrency = (amount) => {
        if (!amount) return 'N/A';
        return new Intl.NumberFormat('en-CA', {
            style: 'currency',
            currency: 'CAD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };
    
    // Format property type
    const formatPropertyType = (type) => {
        if (!type) return 'Property';
        // Convert camelCase to Title Case
        return type.replace(/([A-Z])/g, ' $1').trim()
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');
    };
    
    const html = `
        <div class="max-w-4xl mx-auto p-6">
            <div class="bg-white rounded-xl shadow-lg overflow-hidden">
                <!-- Header -->
                <div class="text-center py-8 px-6 bg-gradient-to-b from-gray-50 to-white">
                    <div class="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                        <svg class="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                        </svg>
                    </div>
                    <h1 class="text-3xl font-bold text-gray-900 mb-2">Confirm Property Analysis</h1>
                    <p class="text-gray-600">Review the property details before we analyze the investment potential</p>
                </div>
                
                <!-- Property Details -->
                <div class="p-8">
                    <!-- Analysis Type Selection -->
                    <div class="mb-6 p-4 bg-gray-50 rounded-lg">
                        <h3 class="text-sm font-medium text-gray-700 mb-3">Select Analysis Type</h3>
                        <div class="space-y-2">
                            <label class="flex items-start p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-white transition-colors">
                                <input type="radio" name="analysisType" value="both" checked class="mt-1 mr-3">
                                <div class="flex-1">
                                    <div class="font-medium text-gray-900">Complete Analysis (Recommended)</div>
                                    <div class="text-sm text-gray-600">Compare both Short-Term Rental (Airbnb) and Long-Term Rental potential</div>
                                    <div class="text-xs text-orange-600 mt-1" id="str-trial-notice" style="display: none;">
                                        ⚡ Includes STR analysis (X/5 free trials remaining)
                                    </div>
                                </div>
                            </label>
                            
                            <label class="flex items-start p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-white transition-colors">
                                <input type="radio" name="analysisType" value="ltr" class="mt-1 mr-3">
                                <div class="flex-1">
                                    <div class="font-medium text-gray-900">Long-Term Rental Only</div>
                                    <div class="text-sm text-gray-600">Traditional rental analysis with market rates and projections</div>
                                    <div class="text-xs text-green-600 mt-1">✓ Always free</div>
                                </div>
                            </label>
                            
                            <label class="flex items-start p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-white transition-colors">
                                <input type="radio" name="analysisType" value="str" class="mt-1 mr-3">
                                <div class="flex-1">
                                    <div class="font-medium text-gray-900">Short-Term Rental Only</div>
                                    <div class="text-sm text-gray-600">Airbnb analysis with live comparables and revenue projections</div>
                                    <div class="text-xs text-orange-600 mt-1" id="str-only-trial-notice" style="display: none;">
                                        ⚡ Premium feature (X/5 free trials remaining)
                                    </div>
                                </div>
                            </label>
                        </div>
                    </div>
                    
                    <!-- Property Image and Info Grid -->
                    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <!-- Left Column - Image -->
                        <div class="aspect-[4/3] bg-gray-100 rounded-lg overflow-hidden">
                            ${propertyData.mainImage ? `
                                <img 
                                    src="${propertyData.mainImage}" 
                                    alt="Property" 
                                    class="w-full h-full object-cover"
                                    onerror="this.onerror=null; this.src='data:image/svg+xml,%3Csvg xmlns=&quot;http://www.w3.org/2000/svg&quot; width=&quot;400&quot; height=&quot;300&quot; viewBox=&quot;0 0 400 300&quot;%3E%3Crect width=&quot;400&quot; height=&quot;300&quot; fill=&quot;%23f3f4f6&quot;/%3E%3Ctext x=&quot;50%25&quot; y=&quot;50%25&quot; text-anchor=&quot;middle&quot; dy=&quot;.3em&quot; fill=&quot;%239ca3af&quot; font-family=&quot;system-ui&quot; font-size=&quot;20&quot;%3ENo Image Available%3C/text%3E%3C/svg%3E';"
                                />
                            ` : `
                                <div class="w-full h-full flex items-center justify-center text-gray-400">
                                    <svg class="w-24 h-24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 22V12h6v10" />
                                    </svg>
                                </div>
                            `}
                        </div>
                        
                        <!-- Right Column - Details -->
                        <div class="space-y-4">
                            <!-- Property Address -->
                            <div>
                                <h3 class="text-sm font-medium text-gray-500 uppercase tracking-wider mb-1">Property Address</h3>
                                <p class="text-lg font-semibold text-gray-900">${propertyData.address || 'Address not provided'}</p>
                            </div>
                            
                            <!-- Price and Taxes -->
                            <div class="grid grid-cols-2 gap-4">
                                <div>
                                    <h3 class="text-sm font-medium text-gray-500 uppercase tracking-wider mb-1">Listing Price</h3>
                                    <p class="text-2xl font-bold text-green-600">${formatCurrency(propertyData.price)}</p>
                                </div>
                                <div>
                                    <h3 class="text-sm font-medium text-gray-500 uppercase tracking-wider mb-1">Property Taxes</h3>
                                    <p class="text-lg font-semibold text-gray-900">${formatCurrency(propertyData.propertyTaxes)}/year</p>
                                </div>
                            </div>
                            
                            <!-- Property Features -->
                            <div class="grid grid-cols-2 gap-4">
                                <div>
                                    <h3 class="text-sm font-medium text-gray-500 uppercase tracking-wider mb-1">Bedrooms</h3>
                                    <p class="text-lg font-semibold text-gray-900">${propertyData.bedrooms || 'N/A'}</p>
                                </div>
                                <div>
                                    <h3 class="text-sm font-medium text-gray-500 uppercase tracking-wider mb-1">Bathrooms</h3>
                                    <p class="text-lg font-semibold text-gray-900">${propertyData.bathrooms || 'N/A'}</p>
                                </div>
                            </div>
                            
                            <!-- Additional Details -->
                            <div class="grid grid-cols-2 gap-4">
                                <div>
                                    <h3 class="text-sm font-medium text-gray-500 uppercase tracking-wider mb-1">Square Feet</h3>
                                    <p class="text-lg font-semibold text-gray-900">
                                        ${propertyData.sqft ? `${propertyData.sqft.toLocaleString()} sq ft` : 'N/A'}
                                    </p>
                                </div>
                                <div>
                                    <h3 class="text-sm font-medium text-gray-500 uppercase tracking-wider mb-1">Property Type</h3>
                                    <p class="text-lg font-semibold text-gray-900">${formatPropertyType(propertyData.propertyType)}</p>
                                </div>
                            </div>
                            
                            ${propertyData.mlsNumber ? `
                            <!-- MLS Number -->
                            <div>
                                <h3 class="text-sm font-medium text-gray-500 uppercase tracking-wider mb-1">MLS® Number</h3>
                                <p class="text-lg font-semibold text-gray-900">${propertyData.mlsNumber}</p>
                            </div>
                            ` : ''}
                        </div>
                    </div>
                    
                    <!-- Action Buttons -->
                    <div class="flex gap-4 mt-8">
                        <button 
                            id="property-confirm-cancel"
                            class="flex-1 px-6 py-4 bg-gray-100 text-gray-700 font-semibold rounded-lg hover:bg-gray-200 transition-colors duration-200"
                        >
                            Cancel
                        </button>
                        <button 
                            id="property-confirm-analyze"
                            class="flex-1 px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-blue-800 transition-colors duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all"
                        >
                            <span class="flex items-center justify-center gap-2">
                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                                Analyze Investment
                            </span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Return HTML and setup function
    return {
        html,
        setup: (userData) => {
            // Check if user is admin
            const isAdmin = userData && (userData.role === 'admin' || userData.isAdmin === true);
            
            // Show STR trial count if user is not premium and not admin
            if (userData && !userData.isPremium && !isAdmin) {
                const trialsUsed = userData.strTrialUsed || 0;
                const trialsRemaining = Math.max(0, 5 - trialsUsed);
                
                // Update trial notices
                const notices = ['str-trial-notice', 'str-only-trial-notice'];
                notices.forEach(id => {
                    const notice = document.getElementById(id);
                    if (notice) {
                        notice.style.display = 'block';
                        notice.innerHTML = notice.innerHTML.replace('X', trialsRemaining);
                        
                        // If no trials left, show upgrade message
                        if (trialsRemaining === 0) {
                            notice.innerHTML = '⚡ Premium feature - <a href="#upgrade" class="underline">Upgrade to continue</a>';
                            notice.classList.remove('text-orange-600');
                            notice.classList.add('text-red-600');
                        }
                    }
                });
                
                // Disable STR options if no trials left
                if (trialsRemaining === 0) {
                    document.querySelectorAll('input[value="both"], input[value="str"]').forEach(input => {
                        input.disabled = true;
                        input.closest('label').classList.add('opacity-50', 'cursor-not-allowed');
                    });
                    // Auto-select LTR only
                    document.querySelector('input[value="ltr"]').checked = true;
                }
            } else if (isAdmin) {
                // For admin users, show unlimited access notice
                const notices = ['str-trial-notice', 'str-only-trial-notice'];
                notices.forEach(id => {
                    const notice = document.getElementById(id);
                    if (notice) {
                        notice.style.display = 'block';
                        notice.innerHTML = '👑 Admin - Unlimited access';
                        notice.classList.remove('text-orange-600');
                        notice.classList.add('text-purple-600');
                    }
                });
            }
            
            // Attach event listeners
            document.getElementById('property-confirm-analyze').addEventListener('click', () => {
                const selectedType = document.querySelector('input[name="analysisType"]:checked').value;
                onConfirm(selectedType);
            });
            document.getElementById('property-confirm-cancel').addEventListener('click', onCancel);
        }
    };
}