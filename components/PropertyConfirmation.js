// Property Confirmation Component - Option 4 Card-Based Design
// Beautiful card layout with purple gradient background

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
        <div class="property-confirmation-overlay">
            <div class="property-confirmation-container">
                <div class="property-confirmation-main-card">
                    <!-- Header -->
                    <div class="property-confirmation-header">
                        <h1 class="property-confirmation-title">Property Investment Analysis</h1>
                        <p class="property-confirmation-subtitle">Confirm details and choose your analysis type</p>
                    </div>
                    
                    <!-- Content -->
                    <div class="property-confirmation-content">
                        <!-- Property Details Card -->
                        <div class="property-details-card">
                            <div class="property-badge">Property Details</div>
                            <div class="property-details-content">
                                <!-- Property Image -->
                                <div class="property-image-section">
                                    ${(propertyData.imageUrl || propertyData.mainImage || propertyData.image) ? `
                                        <img src="${propertyData.imageUrl || propertyData.mainImage || propertyData.image}" 
                                             alt="${propertyData.address || 'Property'}" 
                                             class="property-image"
                                             onerror="this.parentElement.innerHTML='<div class=\\'property-no-image\\'>No Image</div>'">
                                    ` : `
                                        <div class="property-no-image">No Image</div>
                                    `}
                                </div>
                                
                                <!-- Property Info -->
                                <div class="property-info-section">
                                    <div class="property-address">${propertyData.address || 'Address not provided'}</div>
                                    <div class="property-location">${propertyData.city || 'Toronto'}, ${propertyData.state || 'Ontario'} ${propertyData.postal || ''}</div>
                                    
                                    <div class="property-stats-grid">
                                        <div class="stat-item">
                                            <span class="stat-label">List Price</span>
                                            <span class="stat-value price">${formatCurrency(propertyData.price)}</span>
                                        </div>
                                        <div class="stat-item">
                                            <span class="stat-label">Type</span>
                                            <span class="stat-value">${formatPropertyType(propertyData.propertyType)}</span>
                                        </div>
                                        <div class="stat-item">
                                            <span class="stat-label">Size</span>
                                            <span class="stat-value">${propertyData.bedrooms || 'N/A'} Bed • ${propertyData.bathrooms || 'N/A'} Bath</span>
                                        </div>
                                        <div class="stat-item">
                                            <span class="stat-label">Area</span>
                                            <span class="stat-value">${propertyData.sqft ? propertyData.sqft.toLocaleString() + ' sq ft' : 'N/A'}</span>
                                        </div>
                                        ${propertyData.propertyTaxes ? `
                                        <div class="stat-item">
                                            <span class="stat-label">Property Tax</span>
                                            <span class="stat-value">${formatCurrency(propertyData.propertyTaxes)}/yr</span>
                                        </div>
                                        ` : ''}
                                        ${propertyData.condoFees ? `
                                        <div class="stat-item">
                                            <span class="stat-label">Condo Fee</span>
                                            <span class="stat-value">${formatCurrency(propertyData.condoFees)}/mo</span>
                                        </div>
                                        ` : ''}
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Analysis Type Selection -->
                        <h2 class="analysis-section-title">
                            <span class="section-icon">📊</span>
                            Choose Your Analysis Type
                        </h2>
                        
                        <div class="analysis-cards-grid">
                            <!-- Full Analysis Card -->
                            <div class="analysis-card selected" data-type="both">
                                <div class="recommended-ribbon">Best</div>
                                <div class="card-icon">🚀</div>
                                <div class="card-title">Full Analysis</div>
                                <div class="card-description">
                                    Get comprehensive insights with both rental strategies
                                </div>
                                <div class="card-features">
                                    <div class="feature-item">
                                        <span class="feature-check">✓</span>
                                        <span>Short-Term Rental (Airbnb)</span>
                                    </div>
                                    <div class="feature-item">
                                        <span class="feature-check">✓</span>
                                        <span>Long-Term Rental</span>
                                    </div>
                                    <div class="feature-item">
                                        <span class="feature-check">✓</span>
                                        <span>Side-by-side comparison</span>
                                    </div>
                                </div>
                                <input type="radio" name="analysisType" value="both" checked class="analysis-radio">
                            </div>
                            
                            <!-- Long-Term Only Card -->
                            <div class="analysis-card" data-type="ltr">
                                <div class="card-icon">🏠</div>
                                <div class="card-title">Long-Term Only</div>
                                <div class="card-description">
                                    Traditional rental analysis with market projections
                                </div>
                                <div class="card-features">
                                    <div class="feature-item">
                                        <span class="feature-check">✓</span>
                                        <span>Market rent analysis</span>
                                    </div>
                                    <div class="feature-item">
                                        <span class="feature-check">✓</span>
                                        <span>Cash flow projections</span>
                                    </div>
                                    <div class="feature-item">
                                        <span class="feature-check">✓</span>
                                        <span>10-year forecast</span>
                                    </div>
                                </div>
                                <input type="radio" name="analysisType" value="ltr" class="analysis-radio">
                            </div>
                        </div>
                        
                        <!-- Action Area -->
                        <div class="action-area">
                            <button id="property-confirm-analyze" class="continue-btn">
                                Continue with Full Analysis
                            </button>
                            <div class="trial-notice" id="trial-notice" style="display: none;">
                                You have <span class="trial-count">5 free STR analyses</span> remaining
                            </div>
                            <button id="property-confirm-cancel" class="cancel-link">
                                Cancel and go back
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
            // Check if user is admin or has premium access
            const isAdmin = userData && (userData.role === 'admin' || userData.isAdmin === true);
            const isPremium = userData && (userData.isPremium || userData.subscriptionTier === 'premium' || 
                                          userData.subscriptionTier === 'pro' || userData.subscriptionTier === 'enterprise');
            
            // Show trial count for non-premium users
            if (userData && !isPremium && !isAdmin) {
                const trialsUsed = userData.strTrialUsed || 0;
                const trialsRemaining = Math.max(0, 5 - trialsUsed);
                
                const trialNotice = document.getElementById('trial-notice');
                if (trialNotice) {
                    trialNotice.style.display = 'block';
                    const trialCountElement = trialNotice.querySelector('.trial-count');
                    if (trialCountElement) {
                        if (trialsRemaining === 0) {
                            trialCountElement.innerHTML = '<span style="color: #ef4444;">No free trials left - Upgrade to continue</span>';
                            // Disable Full Analysis option
                            const fullAnalysisCard = document.querySelector('[data-type="both"]');
                            if (fullAnalysisCard) {
                                fullAnalysisCard.classList.add('disabled');
                                fullAnalysisCard.querySelector('input').disabled = true;
                            }
                            // Auto-select Long-Term Only
                            const ltrCard = document.querySelector('[data-type="ltr"]');
                            if (ltrCard) {
                                ltrCard.classList.add('selected');
                                ltrCard.querySelector('input').checked = true;
                            }
                        } else {
                            trialCountElement.textContent = `${trialsRemaining} free STR ${trialsRemaining === 1 ? 'analysis' : 'analyses'}`;
                        }
                    }
                }
            } else if (isAdmin) {
                // Show admin badge
                const trialNotice = document.getElementById('trial-notice');
                if (trialNotice) {
                    trialNotice.style.display = 'block';
                    trialNotice.innerHTML = '<span class="admin-badge">✓ Admin - Unlimited Access</span>';
                }
            }
            
            // Handle card selection
            const cards = document.querySelectorAll('.analysis-card');
            const continueBtn = document.getElementById('property-confirm-analyze');
            
            cards.forEach(card => {
                if (!card.classList.contains('disabled')) {
                    card.addEventListener('click', (e) => {
                        // Don't handle if clicking on disabled card
                        if (card.classList.contains('disabled')) return;
                        
                        // Remove selected from all cards
                        cards.forEach(c => c.classList.remove('selected'));
                        
                        // Add selected to clicked card
                        card.classList.add('selected');
                        
                        // Check the radio button
                        const radio = card.querySelector('input[type="radio"]');
                        if (radio) {
                            radio.checked = true;
                            
                            // Update button text
                            const type = radio.value;
                            if (continueBtn) {
                                continueBtn.textContent = type === 'both' 
                                    ? 'Continue with Full Analysis'
                                    : 'Continue with Long-Term Analysis';
                            }
                        }
                    });
                }
            });
            
            // Handle button clicks
            if (continueBtn) {
                continueBtn.addEventListener('click', () => {
                    const selectedType = document.querySelector('input[name="analysisType"]:checked')?.value || 'both';
                    onConfirm(selectedType);
                });
            }
            
            const cancelBtn = document.getElementById('property-confirm-cancel');
            if (cancelBtn) {
                cancelBtn.addEventListener('click', onCancel);
            }
            
            // Set initial button text
            const initialSelection = document.querySelector('input[name="analysisType"]:checked')?.value || 'both';
            if (continueBtn) {
                continueBtn.textContent = initialSelection === 'both' 
                    ? 'Continue with Full Analysis'
                    : 'Continue with Long-Term Analysis';
            }
        }
    };
}