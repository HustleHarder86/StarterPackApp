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
        <div class="min-h-screen bg-gray-50 py-8">
            <div class="max-w-4xl mx-auto px-4">
                <div class="bg-white rounded-xl shadow-xl overflow-hidden">
                    <!-- Header with gradient -->
                    <div class="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-8">
                        <div class="flex items-center justify-center mb-4">
                            <div class="w-16 h-16 bg-white/20 backdrop-blur rounded-full flex items-center justify-center">
                                <svg class="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                                </svg>
                            </div>
                        </div>
                        <h1 class="text-3xl font-bold text-center mb-2">Confirm Property Analysis</h1>
                        <p class="text-center text-blue-100">Review the property details and select your analysis type</p>
                    </div>
                    
                    <!-- Property Details Section -->
                    <div class="p-8">
                        <!-- Property Image and Info Grid -->
                        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                            <!-- Property Image -->
                            ${propertyData.imageUrl ? `
                            <div class="order-2 lg:order-1">
                                <div class="relative h-64 rounded-lg overflow-hidden shadow-lg bg-gray-100">
                                    <img src="${propertyData.imageUrl}" 
                                         alt="${propertyData.address || 'Property'}" 
                                         class="w-full h-full object-cover"
                                         onerror="this.parentElement.innerHTML='<div class=\\'w-full h-full bg-gray-200 flex items-center justify-center\\'>    <svg class=\\'w-16 h-16 text-gray-400\\' fill=\\'none\\' stroke=\\'currentColor\\' viewBox=\\'0 0 24 24\\'>        <path stroke-linecap=\\'round\\' stroke-linejoin=\\'round\\' stroke-width=\\'2\\' d=\\'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6\\' />    </svg></div>'">
                                </div>
                            </div>
                            ` : `
                            <div class="order-2 lg:order-1">
                                <div class="w-full h-64 bg-gray-200 rounded-lg flex items-center justify-center">
                                    <svg class="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                                    </svg>
                                </div>
                            </div>
                            `}
                            
                            <!-- Property Info Card -->
                            <div class="bg-gray-50 rounded-lg p-6 order-1 lg:order-2">
                                <h2 class="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                                    <svg class="w-5 h-5 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                    </svg>
                                    Property Information
                                </h2>
                            
                            <div class="space-y-3">
                                <!-- Address -->
                                <div class="flex items-start">
                                    <span class="text-sm font-medium text-gray-500 w-32">Address:</span>
                                    <span class="text-sm text-gray-900 font-medium flex-1">${propertyData.address || 'Address not provided'}</span>
                                </div>
                                
                                <!-- Price -->
                                <div class="flex items-start">
                                    <span class="text-sm font-medium text-gray-500 w-32">Listing Price:</span>
                                    <span class="text-lg text-green-600 font-bold flex-1">${formatCurrency(propertyData.price)}</span>
                                </div>
                                
                                <!-- Property Type -->
                                <div class="flex items-start">
                                    <span class="text-sm font-medium text-gray-500 w-32">Property Type:</span>
                                    <span class="text-sm text-gray-900 flex-1">${formatPropertyType(propertyData.propertyType)}</span>
                                </div>
                                
                                <!-- Bedrooms/Bathrooms -->
                                <div class="flex items-start">
                                    <span class="text-sm font-medium text-gray-500 w-32">Configuration:</span>
                                    <span class="text-sm text-gray-900 flex-1">
                                        ${propertyData.bedrooms || 'N/A'} Bedrooms • ${propertyData.bathrooms || 'N/A'} Bathrooms
                                        ${propertyData.sqft ? ` • ${propertyData.sqft.toLocaleString()} sq ft` : ''}
                                    </span>
                                </div>
                                
                                <!-- Property Taxes -->
                                ${propertyData.propertyTaxes ? `
                                <div class="flex items-start">
                                    <span class="text-sm font-medium text-gray-500 w-32">Property Taxes:</span>
                                    <span class="text-sm text-gray-900 flex-1">${formatCurrency(propertyData.propertyTaxes)}/year</span>
                                </div>
                                ` : ''}
                                
                                <!-- Condo Fees -->
                                ${propertyData.condoFees ? `
                                <div class="flex items-start">
                                    <span class="text-sm font-medium text-gray-500 w-32">Condo Fees:</span>
                                    <span class="text-sm text-gray-900 flex-1">${formatCurrency(propertyData.condoFees)}/month</span>
                                </div>
                                ` : ''}
                            </div>
                            </div>
                        </div>
                        
                        <!-- Analysis Type Selection -->
                        <div class="mb-8">
                            <h3 class="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                                <svg class="w-5 h-5 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                                </svg>
                                Select Analysis Type
                            </h3>
                            
                            <div class="space-y-3">
                                <!-- Complete Analysis Option -->
                                <label class="relative flex items-start p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-blue-300 hover:bg-blue-50 transition-all">
                                    <input type="radio" name="analysisType" value="both" checked class="mt-1 mr-3 text-blue-600">
                                    <div class="flex-1">
                                        <div class="flex items-center">
                                            <span class="font-semibold text-gray-900">Complete Analysis</span>
                                            <span class="ml-2 px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded">RECOMMENDED</span>
                                        </div>
                                        <p class="text-sm text-gray-600 mt-1">Compare both Short-Term Rental (Airbnb) and Long-Term Rental potential</p>
                                        <div class="text-xs text-orange-600 mt-2 flex items-center" id="str-trial-notice" style="display: none;">
                                            <svg class="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.293l-3-3a1 1 0 00-1.414 1.414L10.586 9.5H7a1 1 0 100 2h3.586l-1.293 1.293a1 1 0 101.414 1.414l3-3a1 1 0 000-1.414z" clip-rule="evenodd"></path>
                                            </svg>
                                            Includes STR analysis (X/5 free trials remaining)
                                        </div>
                                    </div>
                                </label>
                                
                                <!-- LTR Only Option -->
                                <label class="relative flex items-start p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-blue-300 hover:bg-blue-50 transition-all">
                                    <input type="radio" name="analysisType" value="ltr" class="mt-1 mr-3 text-blue-600">
                                    <div class="flex-1">
                                        <div class="flex items-center">
                                            <span class="font-semibold text-gray-900">Long-Term Rental Only</span>
                                            <span class="ml-2 px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded">ALWAYS FREE</span>
                                        </div>
                                        <p class="text-sm text-gray-600 mt-1">Traditional rental analysis with market rates and cash flow projections</p>
                                    </div>
                                </label>
                                
                                <!-- STR Only Option -->
                                <label class="relative flex items-start p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-blue-300 hover:bg-blue-50 transition-all">
                                    <input type="radio" name="analysisType" value="str" class="mt-1 mr-3 text-blue-600">
                                    <div class="flex-1">
                                        <div class="flex items-center">
                                            <span class="font-semibold text-gray-900">Short-Term Rental Only</span>
                                            <span class="ml-2 px-2 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded">PREMIUM</span>
                                        </div>
                                        <p class="text-sm text-gray-600 mt-1">Airbnb analysis with live comparables and revenue projections</p>
                                        <div class="text-xs text-orange-600 mt-2 flex items-center" id="str-only-trial-notice" style="display: none;">
                                            <svg class="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.293l-3-3a1 1 0 00-1.414 1.414L10.586 9.5H7a1 1 0 100 2h3.586l-1.293 1.293a1 1 0 101.414 1.414l3-3a1 1 0 000-1.414z" clip-rule="evenodd"></path>
                                            </svg>
                                            Premium feature (X/5 free trials remaining)
                                        </div>
                                    </div>
                                </label>
                            </div>
                        </div>
                        
                        <!-- Action Buttons -->
                        <div class="flex gap-4">
                            <button 
                                id="property-confirm-cancel"
                                class="flex-1 px-6 py-3 bg-gray-100 text-gray-700 font-semibold rounded-lg hover:bg-gray-200 transition-colors duration-200"
                            >
                                Cancel
                            </button>
                            <button 
                                id="property-confirm-analyze"
                                class="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
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
                        notice.style.display = 'flex';
                        notice.innerHTML = notice.innerHTML.replace('X', trialsRemaining);
                        
                        // If no trials left, show upgrade message
                        if (trialsRemaining === 0) {
                            notice.innerHTML = '<svg class="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"></path></svg>Premium feature - <a href="#upgrade" class="underline">Upgrade to continue</a>';
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
                        input.closest('label').classList.remove('hover:border-blue-300', 'hover:bg-blue-50');
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
                        notice.style.display = 'flex';
                        notice.innerHTML = '<svg class="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path></svg>Admin - Unlimited access';
                        notice.classList.remove('text-orange-600');
                        notice.classList.add('text-purple-600');
                    }
                });
            }
            
            // Add visual feedback for radio selection
            const radioInputs = document.querySelectorAll('input[name="analysisType"]');
            radioInputs.forEach(input => {
                input.addEventListener('change', (e) => {
                    // Reset all labels
                    document.querySelectorAll('label').forEach(label => {
                        if (label.querySelector('input[name="analysisType"]')) {
                            label.classList.remove('border-blue-500', 'bg-blue-50');
                            label.classList.add('border-gray-200');
                        }
                    });
                    // Highlight selected
                    if (e.target.checked) {
                        e.target.closest('label').classList.remove('border-gray-200');
                        e.target.closest('label').classList.add('border-blue-500', 'bg-blue-50');
                    }
                });
            });
            
            // Trigger initial selection
            document.querySelector('input[name="analysisType"]:checked')?.dispatchEvent(new Event('change'));
            
            // Attach event listeners
            document.getElementById('property-confirm-analyze').addEventListener('click', () => {
                const selectedType = document.querySelector('input[name="analysisType"]:checked').value;
                onConfirm(selectedType);
            });
            document.getElementById('property-confirm-cancel').addEventListener('click', onCancel);
        }
    };
}