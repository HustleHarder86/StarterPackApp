/**
 * Extension Handler Module
 * Processes data from Chrome extension and handles URL parameters
 */

class ExtensionHandler {
    constructor() {
        this.urlParams = new URLSearchParams(window.location.search);
        this.extensionData = null;
        this.isFromExtension = false;
        this.shouldAutoAnalyze = false;
        
        this.parseExtensionData();
    }
    
    // Parse URL parameters from extension
    parseExtensionData() {
        // Check if coming from extension
        this.isFromExtension = this.urlParams.get('fromExtension') === 'true';
        this.shouldAutoAnalyze = this.urlParams.get('autoAnalyze') === 'true';
        
        if (!this.isFromExtension) {
            console.log('[ExtensionHandler] Not from extension, skipping data parsing');
            return null;
        }
        
        console.log('[ExtensionHandler] Processing extension data from URL params');
        
        // Extract all property data from URL params
        this.extensionData = {
            // Address components
            address: {
                street: this.urlParams.get('street') || '',
                city: this.urlParams.get('city') || '',
                province: this.urlParams.get('state') || this.urlParams.get('province') || '',
                country: this.urlParams.get('country') || 'Canada',
                postalCode: this.urlParams.get('postal') || this.urlParams.get('postalCode') || '',
                full: '' // Will be constructed below
            },
            
            // Property details
            price: this.parseNumber(this.urlParams.get('price')),
            mlsNumber: this.urlParams.get('mlsNumber') || '',
            bedrooms: this.parseNumber(this.urlParams.get('bedrooms')),
            bathrooms: this.parseNumber(this.urlParams.get('bathrooms')),
            sqft: this.parseNumber(this.urlParams.get('sqft')),
            propertyType: this.urlParams.get('propertyType') || '',
            yearBuilt: this.parseNumber(this.urlParams.get('yearBuilt')),
            
            // Financial details
            propertyTaxes: this.parseNumber(this.urlParams.get('taxes')),
            condoFees: this.parseNumber(this.urlParams.get('condoFees')),
            
            // Additional details
            mainImage: this.urlParams.get('image') || '',
            virtualTour: this.urlParams.get('virtualTour') || '',
            daysOnMarket: this.parseNumber(this.urlParams.get('daysOnMarket')),
            
            // Meta information
            source: 'chrome-extension',
            extractedAt: new Date().toISOString()
        };
        
        // Construct full address
        const addressParts = [
            this.extensionData.address.street,
            this.extensionData.address.city,
            this.extensionData.address.province,
            this.extensionData.address.postalCode
        ].filter(part => part);
        
        this.extensionData.address.full = addressParts.join(', ');
        
        console.log('[ExtensionHandler] Parsed extension data:', this.extensionData);
        
        // Show property confirmation if we have data
        if (this.extensionData.address.full) {
            this.showPropertyConfirmation();
        }
        
        return this.extensionData;
    }
    
    // Parse number from string, return null if invalid
    parseNumber(value) {
        if (!value) return null;
        const num = parseFloat(value);
        return isNaN(num) ? null : num;
    }
    
    // Show property confirmation card
    showPropertyConfirmation() {
        // Create confirmation card if it doesn't exist
        let confirmationCard = document.getElementById('extension-confirmation-card');
        if (!confirmationCard) {
            confirmationCard = document.createElement('div');
            confirmationCard.id = 'extension-confirmation-card';
            confirmationCard.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: white;
                border: 2px solid #10B981;
                border-radius: 12px;
                padding: 20px;
                box-shadow: 0 10px 25px rgba(0,0,0,0.1);
                z-index: 98;
                max-width: 400px;
                animation: slideIn 0.3s ease;
            `;
            
            // Add animation
            const style = document.createElement('style');
            style.textContent = `
                @keyframes slideIn {
                    from { transform: translateX(400px); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
            `;
            document.head.appendChild(style);
        }
        
        // Build confirmation content
        const { address, price, bedrooms, bathrooms, sqft, propertyTaxes } = this.extensionData;
        
        confirmationCard.innerHTML = `
            <h3 style="margin: 0 0 16px 0; color: #111827; font-size: 18px; font-weight: 600;">
                ✅ Property Data Loaded from Realtor.ca
            </h3>
            
            <div style="color: #6B7280; font-size: 14px; line-height: 1.6;">
                <p style="margin: 0 0 12px 0; font-weight: 600; color: #374151;">
                    ${address.full || 'Property Address'}
                </p>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
                    ${price ? `<div>💰 Price: $${price.toLocaleString()}</div>` : ''}
                    ${bedrooms ? `<div>🛏️ Beds: ${bedrooms}</div>` : ''}
                    ${bathrooms ? `<div>🚿 Baths: ${bathrooms}</div>` : ''}
                    ${sqft ? `<div>📐 Sqft: ${sqft.toLocaleString()}</div>` : ''}
                    ${propertyTaxes ? `<div>📋 Tax: $${propertyTaxes.toLocaleString()}/yr</div>` : ''}
                </div>
            </div>
            
            <div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid #E5E7EB;">
                ${this.shouldAutoAnalyze ? `
                    <p style="margin: 0 0 12px 0; color: #059669; font-size: 14px; font-weight: 500;">
                        🔄 Auto-analyzing property...
                    </p>
                ` : ''}
                <button onclick="window.extensionHandler.dismissConfirmation()" 
                        style="padding: 8px 16px; background: #F3F4F6; border: none; border-radius: 6px; 
                               color: #374151; font-size: 14px; cursor: pointer; width: 100%;">
                    Dismiss
                </button>
            </div>
        `;
        
        document.body.appendChild(confirmationCard);
        
        // Auto-dismiss after 10 seconds
        setTimeout(() => this.dismissConfirmation(), 10000);
    }
    
    // Dismiss confirmation card
    dismissConfirmation() {
        const card = document.getElementById('extension-confirmation-card');
        if (card) {
            card.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => card.remove(), 300);
        }
    }
    
    // Populate form with extension data
    populateForm(formId = 'property-form') {
        if (!this.extensionData) return;
        
        const form = document.getElementById(formId);
        if (!form) {
            console.warn('[ExtensionHandler] Form not found:', formId);
            return;
        }
        
        console.log('[ExtensionHandler] Populating form with extension data');
        
        // Find and populate address input
        const addressInput = form.querySelector('input[name="address"], input[type="text"], #address-input');
        if (addressInput && this.extensionData.address.full) {
            addressInput.value = this.extensionData.address.full;
            console.log('[ExtensionHandler] Set address:', this.extensionData.address.full);
        }
        
        // Store additional data in form dataset for later use
        form.dataset.extensionData = JSON.stringify(this.extensionData);
        
        // Trigger input event to update any listeners
        if (addressInput) {
            addressInput.dispatchEvent(new Event('input', { bubbles: true }));
            addressInput.dispatchEvent(new Event('change', { bubbles: true }));
        }
        
        return true;
    }
    
    // Auto-submit form if autoAnalyze is true
    async autoSubmitForm(formId = 'property-form', delay = 1000) {
        if (!this.shouldAutoAnalyze) {
            console.log('[ExtensionHandler] Auto-analyze not requested');
            return;
        }
        
        console.log('[ExtensionHandler] Auto-submitting form in', delay, 'ms');
        
        // Wait a bit for everything to load
        await new Promise(resolve => setTimeout(resolve, delay));
        
        const form = document.getElementById(formId);
        if (!form) {
            console.warn('[ExtensionHandler] Form not found for auto-submit:', formId);
            return;
        }
        
        // Check if address is populated
        const addressInput = form.querySelector('input[name="address"], input[type="text"], #address-input');
        if (!addressInput || !addressInput.value) {
            console.warn('[ExtensionHandler] Address not populated, skipping auto-submit');
            return;
        }
        
        console.log('[ExtensionHandler] Auto-submitting form with address:', addressInput.value);
        
        // Find and click submit button
        const submitButton = form.querySelector('button[type="submit"], button:not([type])');
        if (submitButton) {
            submitButton.click();
        } else {
            // Fallback to form submit
            form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
        }
    }
    
    // Get extension data for API calls
    getDataForAPI() {
        if (!this.extensionData) return null;
        
        // Format data for API consumption
        return {
            propertyAddress: this.extensionData.address.full,
            propertyData: {
                price: this.extensionData.price,
                bedrooms: this.extensionData.bedrooms,
                bathrooms: this.extensionData.bathrooms,
                sqft: this.extensionData.sqft,
                propertyType: this.extensionData.propertyType,
                yearBuilt: this.extensionData.yearBuilt,
                propertyTaxes: this.extensionData.propertyTaxes,
                condoFees: this.extensionData.condoFees,
                mlsNumber: this.extensionData.mlsNumber
            },
            includeStrAnalysis: true,
            analysisType: 'both'
        };
    }
    
    // Check if data is from extension
    hasExtensionData() {
        return this.isFromExtension && this.extensionData !== null;
    }
    
    // Initialize extension handling
    async initialize() {
        if (!this.hasExtensionData()) {
            return false;
        }
        
        console.log('[ExtensionHandler] Initializing extension data handling');
        
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            await new Promise(resolve => {
                document.addEventListener('DOMContentLoaded', resolve);
            });
        }
        
        // Populate form
        this.populateForm();
        
        // Auto-submit if requested
        if (this.shouldAutoAnalyze) {
            await this.autoSubmitForm();
        }
        
        return true;
    }
}

// Create global instance
window.extensionHandler = new ExtensionHandler();

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.extensionHandler.initialize();
    });
} else {
    window.extensionHandler.initialize();
}

// Export for module usage if needed
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ExtensionHandler;
}