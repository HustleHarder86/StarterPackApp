/**
 * Integration Bridge - Handles data flow between screens in the user journey
 * This module manages state transfer between:
 * - Login/Signup → Property Input
 * - Property Input → Confirmation Modal
 * - Confirmation Modal → Analysis View
 */

class IntegrationBridge {
    constructor() {
        this.state = {
            user: null,
            propertyData: null,
            analysisType: 'full',
            source: null, // 'form', 'extension', 'saved'
            timestamp: null,
            mockupUrl: null
        };
        
        this.storageKey = 'integration_bridge_state';
        this.debugMode = true;
        
        this.init();
    }
    
    init() {
        // Load existing state from storage
        this.loadState();
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Log initialization
        this.debug('Integration Bridge initialized', this.state);
    }
    
    setupEventListeners() {
        // Listen for storage changes (cross-tab communication)
        window.addEventListener('storage', (e) => {
            if (e.key === this.storageKey) {
                this.debug('State updated from another tab');
                this.loadState();
            }
        });
        
        // Listen for custom events
        window.addEventListener('integration:propertySubmit', (e) => {
            this.handlePropertySubmit(e.detail);
        });
        
        window.addEventListener('integration:analysisSelected', (e) => {
            this.handleAnalysisSelection(e.detail);
        });
        
        window.addEventListener('integration:requestData', (e) => {
            this.provideDataToMockup(e.detail);
        });
    }
    
    // State Management
    saveState() {
        try {
            const stateJson = JSON.stringify(this.state);
            sessionStorage.setItem(this.storageKey, stateJson);
            localStorage.setItem(this.storageKey + '_backup', stateJson);
            this.debug('State saved', this.state);
        } catch (error) {
            this.debug('Failed to save state', error, 'error');
        }
    }
    
    loadState() {
        try {
            // Try sessionStorage first
            let stateJson = sessionStorage.getItem(this.storageKey);
            
            // Fall back to localStorage
            if (!stateJson) {
                stateJson = localStorage.getItem(this.storageKey + '_backup');
            }
            
            if (stateJson) {
                this.state = JSON.parse(stateJson);
                this.debug('State loaded', this.state);
            }
        } catch (error) {
            this.debug('Failed to load state', error, 'error');
        }
    }
    
    clearState() {
        this.state = {
            user: null,
            propertyData: null,
            analysisType: 'full',
            source: null,
            timestamp: null,
            mockupUrl: null
        };
        sessionStorage.removeItem(this.storageKey);
        localStorage.removeItem(this.storageKey + '_backup');
        this.debug('State cleared');
    }
    
    // Property Data Handling
    handlePropertySubmit(data) {
        this.debug('Property submitted', data);
        
        // Validate required fields
        const required = ['address', 'price'];
        const missing = required.filter(field => !data[field]);
        
        if (missing.length > 0) {
            this.debug(`Missing required fields: ${missing.join(', ')}`, null, 'error');
            return false;
        }
        
        // Store property data
        this.state.propertyData = {
            ...data,
            timestamp: new Date().toISOString(),
            source: data.source || 'form'
        };
        
        this.state.source = data.source || 'form';
        this.state.timestamp = new Date().toISOString();
        
        this.saveState();
        
        // Trigger confirmation modal
        this.showConfirmationModal();
        
        return true;
    }
    
    // Confirmation Modal
    showConfirmationModal() {
        this.debug('Showing confirmation modal');
        
        // Check if we're in the main app or test router
        if (window.showPropertyConfirmation) {
            // Main app flow
            window.showPropertyConfirmation(this.state.propertyData);
        } else {
            // Test router flow - dispatch event
            window.dispatchEvent(new CustomEvent('integration:showConfirmation', {
                detail: this.state.propertyData
            }));
        }
    }
    
    handleAnalysisSelection(analysisType) {
        this.debug(`Analysis type selected: ${analysisType}`);
        
        this.state.analysisType = analysisType;
        this.saveState();
        
        // Proceed to analysis
        this.navigateToAnalysis();
    }
    
    // Navigation
    navigateToAnalysis() {
        this.debug('Navigating to analysis view');
        
        if (!this.state.propertyData) {
            this.debug('No property data available', null, 'error');
            return;
        }
        
        // Determine mockup URL
        const mockupFile = this.state.mockupUrl || 'base-mockup-integrated.html';
        const baseUrl = '/mockups/mockup-iterations/';
        
        // Prepare data for transfer
        const transferData = {
            propertyData: this.state.propertyData,
            analysisType: this.state.analysisType,
            user: this.state.user,
            source: this.state.source,
            timestamp: this.state.timestamp
        };
        
        // Store in multiple locations for redundancy
        sessionStorage.setItem('propertyData', JSON.stringify(transferData.propertyData));
        sessionStorage.setItem('analysisType', transferData.analysisType);
        sessionStorage.setItem('integrationData', JSON.stringify(transferData));
        
        // If in iframe, post message to parent
        if (window.parent !== window) {
            window.parent.postMessage({
                type: 'integration:navigateToAnalysis',
                data: transferData,
                mockupUrl: baseUrl + mockupFile
            }, '*');
        } else {
            // Direct navigation with data in URL
            const params = new URLSearchParams();
            params.set('propertyData', encodeURIComponent(JSON.stringify(transferData.propertyData)));
            params.set('analysisType', transferData.analysisType);
            params.set('source', transferData.source);
            
            const url = `${baseUrl}${mockupFile}?${params.toString()}`;
            this.debug(`Navigating to: ${url}`);
            
            window.location.href = url;
        }
    }
    
    // Data Provider for Mockups
    provideDataToMockup(request) {
        this.debug('Mockup requesting data', request);
        
        // Check various storage locations
        let data = null;
        
        // Priority 1: Current state
        if (this.state.propertyData) {
            data = this.state.propertyData;
        }
        
        // Priority 2: SessionStorage
        if (!data) {
            const sessionData = sessionStorage.getItem('propertyData');
            if (sessionData) {
                try {
                    data = JSON.parse(sessionData);
                } catch (e) {
                    this.debug('Failed to parse session data', e, 'error');
                }
            }
        }
        
        // Priority 3: URL parameters
        if (!data) {
            const urlParams = new URLSearchParams(window.location.search);
            if (urlParams.has('propertyData')) {
                try {
                    data = JSON.parse(decodeURIComponent(urlParams.get('propertyData')));
                } catch (e) {
                    this.debug('Failed to parse URL data', e, 'error');
                }
            }
        }
        
        if (data) {
            this.debug('Providing data to mockup', data);
            
            // Dispatch event with data
            window.dispatchEvent(new CustomEvent('integration:dataProvided', {
                detail: {
                    propertyData: data,
                    analysisType: this.state.analysisType,
                    source: this.state.source
                }
            }));
            
            // Also call global function if available
            if (window.populatePropertyData) {
                window.populatePropertyData(data);
            }
        } else {
            this.debug('No data available for mockup', null, 'error');
        }
    }
    
    // Extension Data Handler
    handleExtensionData(extensionData) {
        this.debug('Extension data received', extensionData);
        
        // Transform extension data to standard format
        const propertyData = {
            address: extensionData.address || extensionData.fullAddress,
            price: extensionData.price || extensionData.listPrice,
            bedrooms: extensionData.bedrooms || extensionData.beds,
            bathrooms: extensionData.bathrooms || extensionData.baths,
            sqft: extensionData.sqft || extensionData.livingArea,
            propertyType: extensionData.propertyType || 'Single Family',
            mlsNumber: extensionData.mlsNumber,
            propertyTax: extensionData.propertyTax,
            condoFees: extensionData.condoFees || extensionData.hoaFees,
            source: 'extension'
        };
        
        // Store and proceed
        this.handlePropertySubmit(propertyData);
    }
    
    // Saved Property Handler
    loadSavedProperty(propertyId) {
        this.debug(`Loading saved property: ${propertyId}`);
        
        // Simulate loading from database
        // In real implementation, this would fetch from Firestore
        const mockSavedData = {
            address: '789 King Street West, Toronto, ON',
            price: 975000,
            bedrooms: 2,
            bathrooms: 2,
            sqft: 1200,
            analysisId: propertyId,
            source: 'saved',
            lastAnalyzed: '2024-01-15T10:30:00Z'
        };
        
        this.state.propertyData = mockSavedData;
        this.state.source = 'saved';
        this.saveState();
        
        // Skip confirmation for saved properties
        this.navigateToAnalysis();
    }
    
    // Utility Functions
    formatCurrency(amount) {
        return new Intl.NumberFormat('en-CA', {
            style: 'currency',
            currency: 'CAD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    }
    
    validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }
    
    // Debug Logging
    debug(message, data = null, level = 'info') {
        if (!this.debugMode) return;
        
        const timestamp = new Date().toISOString();
        const logMessage = `[IntegrationBridge ${timestamp}] ${message}`;
        
        switch(level) {
            case 'error':
                console.error(logMessage, data);
                break;
            case 'warn':
                console.warn(logMessage, data);
                break;
            default:
                console.log(logMessage, data);
        }
        
        // Dispatch debug event for external monitoring
        window.dispatchEvent(new CustomEvent('integration:debug', {
            detail: { message, data, level, timestamp }
        }));
    }
    
    // Public API
    getState() {
        return { ...this.state };
    }
    
    setState(updates) {
        this.state = { ...this.state, ...updates };
        this.saveState();
    }
    
    isReady() {
        return this.state.propertyData !== null;
    }
}

// Initialize and expose globally
window.integrationBridge = new IntegrationBridge();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = IntegrationBridge;
}