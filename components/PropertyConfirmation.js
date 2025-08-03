// Property Confirmation Component (Plain JavaScript)
// Shows property details and asks for user confirmation before analysis

(function() {
    'use strict';
    
    window.PropertyConfirmation = function(propertyData, onConfirm, onCancel) {
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
        <div class="property-confirmation-overlay">
            <div class="property-confirmation-container">
                <div class="property-confirmation-card">
                    <!-- Header with gradient -->
                    <div class="property-confirmation-header">
                        <div class="property-confirmation-icon">
                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                            </svg>
                        </div>
                        <h1 class="property-confirmation-title">Confirm Property Analysis</h1>
                        <p class="property-confirmation-subtitle">Review the property details and select your analysis type</p>
                    </div>
                    
                    <!-- Property Details Section -->
                    <div class="property-confirmation-content">
                        <!-- Property Image and Info Grid - Compact Layout -->
                        <div class="property-confirmation-grid">
                            <!-- Property Image - Smaller size -->
                            ${(propertyData.imageUrl || propertyData.mainImage) ? `
                            <div>
                                <div class="property-confirmation-image-container">
                                    <img src="${propertyData.imageUrl || propertyData.mainImage}" 
                                         alt="${propertyData.address || 'Property'}" 
                                         class="property-confirmation-image"
                                         onerror="this.parentElement.innerHTML='<div class=\\'property-confirmation-no-image\\'>    <svg fill=\\'none\\' stroke=\\'currentColor\\' viewBox=\\'0 0 24 24\\'>        <path stroke-linecap=\\'round\\' stroke-linejoin=\\'round\\' stroke-width=\\'2\\' d=\\'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6\\' />    </svg></div>'">
                                </div>
                            </div>
                            ` : `
                            <div>
                                <div class="property-confirmation-no-image">
                                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                                    </svg>
                                </div>
                            </div>
                            `}
                            
                            <!-- Property Info Card - Takes up more space -->
                            <div class="property-confirmation-info">
                                <h2 class="property-confirmation-info-header">
                                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                    </svg>
                                    Property Information
                                </h2>
                            
                            <div>
                                <!-- Address -->
                                <div class="property-detail-row">
                                    <span class="property-detail-label">Address:</span>
                                    <span class="property-detail-value">${propertyData.address || 'Address not provided'}</span>
                                </div>
                                
                                <!-- Price -->
                                <div class="property-detail-row">
                                    <span class="property-detail-label">Listing Price:</span>
                                    <span class="property-detail-value price">${formatCurrency(propertyData.price)}</span>
                                </div>
                                
                                <!-- Property Type -->
                                <div class="property-detail-row">
                                    <span class="property-detail-label">Property Type:</span>
                                    <span class="property-detail-value">${formatPropertyType(propertyData.propertyType)}</span>
                                </div>
                                
                                <!-- Bedrooms/Bathrooms -->
                                <div class="property-detail-row">
                                    <span class="property-detail-label">Configuration:</span>
                                    <span class="property-detail-value">
                                        ${propertyData.bedrooms || 'N/A'} Bedrooms • ${propertyData.bathrooms || 'N/A'} Bathrooms
                                        ${propertyData.sqft ? ` • ${propertyData.sqft.toLocaleString()} sq ft` : ''}
                                    </span>
                                </div>
                                
                                <!-- Property Taxes -->
                                ${propertyData.propertyTaxes ? `
                                <div class="property-detail-row">
                                    <span class="property-detail-label">Property Taxes:</span>
                                    <span class="property-detail-value">${formatCurrency(propertyData.propertyTaxes)}/year</span>
                                </div>
                                ` : ''}
                                
                                <!-- Condo Fees -->
                                ${propertyData.condoFees ? `
                                <div class="property-detail-row">
                                    <span class="property-detail-label">Condo Fees:</span>
                                    <span class="property-detail-value">${formatCurrency(propertyData.condoFees)}/month</span>
                                </div>
                                ` : ''}
                            </div>
                            </div>
                        </div>
                        
                        <!-- Analysis Type Selection -->
                        <div class="analysis-type-section">
                            <h3 class="analysis-type-header">
                                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                                </svg>
                                Select Analysis Type
                            </h3>
                            
                            <div class="analysis-type-options">
                                <!-- Complete Analysis Option -->
                                <label class="analysis-option">
                                    <input type="radio" name="analysisType" value="both" checked>
                                    <div class="analysis-option-content">
                                        <div class="analysis-option-title">
                                            <span>Complete Analysis</span>
                                            <span class="analysis-option-badge badge-recommended">RECOMMENDED</span>
                                        </div>
                                        <p class="analysis-option-description">Compare both Short-Term Rental (Airbnb) and Long-Term Rental potential</p>
                                        <div class="analysis-option-notice" id="str-trial-notice" style="display: none;">
                                            <svg fill="currentColor" viewBox="0 0 20 20">
                                                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.293l-3-3a1 1 0 00-1.414 1.414L10.586 9.5H7a1 1 0 100 2h3.586l-1.293 1.293a1 1 0 101.414 1.414l3-3a1 1 0 000-1.414z" clip-rule="evenodd"></path>
                                            </svg>
                                            Includes STR analysis (X/5 free trials remaining)
                                        </div>
                                    </div>
                                </label>
                                
                                <!-- LTR Only Option -->
                                <label class="analysis-option">
                                    <input type="radio" name="analysisType" value="ltr">
                                    <div class="analysis-option-content">
                                        <div class="analysis-option-title">
                                            <span>Long-Term Rental Only</span>
                                            <span class="analysis-option-badge badge-free">ALWAYS FREE</span>
                                        </div>
                                        <p class="analysis-option-description">Traditional rental analysis with market rates and cash flow projections</p>
                                    </div>
                                </label>
                                
                                <!-- STR Only Option -->
                                <label class="analysis-option">
                                    <input type="radio" name="analysisType" value="str">
                                    <div class="analysis-option-content">
                                        <div class="analysis-option-title">
                                            <span>Short-Term Rental Only</span>
                                            <span class="analysis-option-badge badge-premium">PREMIUM</span>
                                        </div>
                                        <p class="analysis-option-description">Airbnb analysis with live comparables and revenue projections</p>
                                        <div class="analysis-option-notice" id="str-only-trial-notice" style="display: none;">
                                            <svg fill="currentColor" viewBox="0 0 20 20">
                                                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.293l-3-3a1 1 0 00-1.414 1.414L10.586 9.5H7a1 1 0 100 2h3.586l-1.293 1.293a1 1 0 101.414 1.414l3-3a1 1 0 000-1.414z" clip-rule="evenodd"></path>
                                            </svg>
                                            Premium feature (X/5 free trials remaining)
                                        </div>
                                    </div>
                                </label>
                            </div>
                        </div>
                        
                        <!-- Action Buttons -->
                        <div class="property-confirmation-actions">
                            <button 
                                id="property-confirm-cancel"
                                class="property-confirmation-btn property-confirmation-btn-cancel"
                            >
                                Cancel
                            </button>
                            <button 
                                id="property-confirm-analyze"
                                class="property-confirmation-btn property-confirmation-btn-primary"
                            >
                                <span>
                                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                            notice.innerHTML = '<svg fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"></path></svg>Premium feature - <a href="#upgrade" style="text-decoration: underline;">Upgrade to continue</a>';
                            notice.classList.add('error');
                        }
                    }
                });
                
                // Disable STR options if no trials left
                if (trialsRemaining === 0) {
                    document.querySelectorAll('input[value="both"], input[value="str"]').forEach(input => {
                        input.disabled = true;
                        input.closest('label').classList.add('disabled');
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
                        notice.innerHTML = '<svg fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path></svg>Admin - Unlimited access';
                        notice.classList.add('admin');
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
                            label.classList.remove('selected');
                        }
                    });
                    // Highlight selected
                    if (e.target.checked) {
                        e.target.closest('label').classList.add('selected');
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
    };
})();