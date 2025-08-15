/**
 * Shared API Integration Module for Property Analysis Mockups
 * Handles live data fetching from Railway API endpoints
 */

class PropertyAnalysisAPI {
    constructor() {
        // Use mockup config if available, otherwise fallback to defaults
        if (window.mockupConfig) {
            this.baseUrl = window.mockupConfig.getAPIEndpoint('railway');
            this.timeout = window.mockupConfig.config.timeout;
            this.retryAttempts = window.mockupConfig.config.retryAttempts;
            this.retryDelay = window.mockupConfig.config.retryDelay;
        } else {
            // Fallback configuration
            this.baseUrl = window.location.hostname === 'localhost' 
                ? 'http://localhost:3001/api' 
                : 'https://starterpackapp-production.up.railway.app/api';
            this.timeout = 60000; // 60 seconds
            this.retryAttempts = 3;
            this.retryDelay = 1000;
        }
        
        this.endpoints = {
            analyzeProperty: '/analysis/property',
            strAnalysis: '/analysis/str/analyze',
            strComparables: '/analysis/str/comparables'
        };
        
        this.loadingStates = new Map();
        this.cache = new Map();
        this.cacheTimeout = 5 * 60 * 1000; // 5 minutes cache
        this.lastError = null;
        
        console.log('[PropertyAnalysisAPI] Initialized with:', {
            baseUrl: this.baseUrl,
            timeout: this.timeout,
            retryAttempts: this.retryAttempts
        });
    }

    // Convert snake_case to camelCase
    toCamelCase(obj) {
        if (Array.isArray(obj)) {
            return obj.map(item => this.toCamelCase(item));
        } else if (obj !== null && typeof obj === 'object') {
            return Object.keys(obj).reduce((result, key) => {
                const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
                result[camelKey] = this.toCamelCase(obj[key]);
                return result;
            }, {});
        }
        return obj;
    }

    // Convert camelCase to snake_case for API requests
    toSnakeCase(obj) {
        if (Array.isArray(obj)) {
            return obj.map(item => this.toSnakeCase(item));
        } else if (obj !== null && typeof obj === 'object') {
            return Object.keys(obj).reduce((result, key) => {
                const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
                result[snakeKey] = this.toSnakeCase(obj[key]);
                return result;
            }, {});
        }
        return obj;
    }

    // Get auth token if available
    async getAuthToken() {
        if (window.firebaseWrapper?.auth?.currentUser) {
            try {
                return await window.firebaseWrapper.auth.currentUser.getIdToken();
            } catch (error) {
                console.warn('Failed to get auth token:', error);
                return null;
            }
        }
        return null;
    }

    // Make API call WITHOUT snake_case conversion (for endpoints that expect camelCase)
    async apiCallDirect(endpoint, data = {}, options = {}, attempt = 1) {
        // Get headers from mockup config if available
        const headers = window.mockupConfig 
            ? window.mockupConfig.getAPIHeaders(options.headers)
            : {
                'Content-Type': 'application/json',
                ...options.headers
            };

        // Add authentication if available (optional - works without)
        try {
            const token = await this.getAuthToken();
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }
        } catch (authError) {
            console.warn('Auth token not available, proceeding without authentication');
        }

        // Add test mode headers
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('test') === 'true' || 
            urlParams.get('e2e_test_mode') === 'true' ||
            urlParams.get('testMode') === 'true') {
            headers['X-E2E-Test-Mode'] = 'true';
            headers['X-Test-Mode'] = 'true';
        }

        try {
            // Create abort controller for timeout
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), this.timeout);

            console.log(`[API] Calling ${endpoint} (attempt ${attempt}/${this.retryAttempts}) with camelCase data`);
            
            const response = await fetch(`${this.baseUrl}${endpoint}`, {
                method: options.method || 'POST',
                headers,
                body: JSON.stringify(data), // Send data as-is without snake_case conversion
                signal: controller.signal,
                ...options
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                const error = await response.json().catch(() => ({}));
                const errorMessage = error.message || error.error || `Request failed: ${response.status}`;
                
                // Check if it's a CORS error
                if (response.status === 0 || !response.status) {
                    throw new Error('CORS error - API may be unreachable. Check if Railway API is running on port 3001.');
                }
                
                throw new Error(errorMessage);
            }

            const result = await response.json();
            console.log(`[API] Success for ${endpoint}`);
            this.lastError = null;
            return this.toCamelCase(result);
            
        } catch (error) {
            console.error(`[API] Attempt ${attempt} failed for ${endpoint}:`, error.message);
            
            // Handle timeout specifically
            if (error.name === 'AbortError') {
                const timeoutError = new Error(`Request timeout after ${this.timeout / 1000} seconds. STR analysis may take longer - please try again.`);
                timeoutError.name = 'TimeoutError';
                error = timeoutError;
            }
            
            // Retry logic
            if (attempt < this.retryAttempts && !error.message.includes('CORS')) {
                console.log(`[API] Retrying in ${this.retryDelay}ms...`);
                await new Promise(resolve => setTimeout(resolve, this.retryDelay * attempt));
                return this.apiCallDirect(endpoint, data, options, attempt + 1);
            }
            
            // Store last error for recovery
            this.lastError = error;
            console.error('[API] All attempts failed:', error);
            throw error;
        }
    }
    
    // Make API call with error handling and retry logic (WITH snake_case conversion)
    async apiCall(endpoint, data = {}, options = {}, attempt = 1) {
        // Get headers from mockup config if available
        const headers = window.mockupConfig 
            ? window.mockupConfig.getAPIHeaders(options.headers)
            : {
                'Content-Type': 'application/json',
                ...options.headers
            };

        // Add authentication if available (optional - works without)
        try {
            const token = await this.getAuthToken();
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }
        } catch (authError) {
            console.warn('Auth token not available, proceeding without authentication');
        }

        // Add test mode headers
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('test') === 'true' || 
            urlParams.get('e2e_test_mode') === 'true' ||
            urlParams.get('testMode') === 'true') {
            headers['X-E2E-Test-Mode'] = 'true';
            headers['X-Test-Mode'] = 'true';
        }

        try {
            // Create abort controller for timeout
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), this.timeout);

            console.log(`[API] Calling ${endpoint} (attempt ${attempt}/${this.retryAttempts})`);
            
            const response = await fetch(`${this.baseUrl}${endpoint}`, {
                method: options.method || 'POST',
                headers,
                body: JSON.stringify(this.toSnakeCase(data)),
                signal: controller.signal,
                ...options
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                const error = await response.json().catch(() => ({}));
                const errorMessage = error.message || error.error || `Request failed: ${response.status}`;
                
                // Check if it's a CORS error
                if (response.status === 0 || !response.status) {
                    throw new Error('CORS error - API may be unreachable. Check if Railway API is running on port 3001.');
                }
                
                throw new Error(errorMessage);
            }

            const result = await response.json();
            console.log(`[API] Success for ${endpoint}`);
            this.lastError = null;
            return this.toCamelCase(result);
            
        } catch (error) {
            console.error(`[API] Attempt ${attempt} failed for ${endpoint}:`, error.message);
            
            // Handle timeout specifically
            if (error.name === 'AbortError') {
                const timeoutError = new Error(`Request timeout after ${this.timeout / 1000} seconds. STR analysis may take longer - please try again.`);
                timeoutError.name = 'TimeoutError';
                error = timeoutError;
            }
            
            // Retry logic
            if (attempt < this.retryAttempts && !error.message.includes('CORS')) {
                console.log(`[API] Retrying in ${this.retryDelay}ms...`);
                await new Promise(resolve => setTimeout(resolve, this.retryDelay * attempt));
                return this.apiCall(endpoint, data, options, attempt + 1);
            }
            
            // Store last error for recovery
            this.lastError = error;
            console.error('[API] All attempts failed:', error);
            throw error;
        }
    }

    // Show loading state in UI
    showLoading(elementId, message = 'Loading...') {
        const element = document.getElementById(elementId);
        if (!element) return;
        
        const loadingHTML = `
            <div class="loading-state" style="padding: 20px; text-align: center;">
                <div class="spinner" style="display: inline-block; width: 40px; height: 40px; border: 4px solid #f3f4f6; border-top: 4px solid #3B82F6; border-radius: 50%; animation: spin 1s linear infinite;"></div>
                <p style="margin-top: 10px; color: #6B7280;">${message}</p>
            </div>
        `;
        
        this.loadingStates.set(elementId, element.innerHTML);
        element.innerHTML = loadingHTML;
        
        // Add spinner animation if not exists
        if (!document.getElementById('spinner-style')) {
            const style = document.createElement('style');
            style.id = 'spinner-style';
            style.textContent = '@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }';
            document.head.appendChild(style);
        }
    }

    // Hide loading state
    hideLoading(elementId) {
        const element = document.getElementById(elementId);
        if (!element) return;
        
        const originalContent = this.loadingStates.get(elementId);
        if (originalContent) {
            element.innerHTML = originalContent;
            this.loadingStates.delete(elementId);
        }
    }

    // Show error message
    showError(elementId, error) {
        const element = document.getElementById(elementId);
        if (!element) return;
        
        const errorMessage = error.message || 'An error occurred';
        element.innerHTML = `
            <div class="error-state" style="padding: 20px; background: #FEE2E2; border: 1px solid #FECACA; border-radius: 8px;">
                <h3 style="color: #DC2626; margin: 0 0 10px 0;">⚠️ Error</h3>
                <p style="color: #7F1D1D; margin: 0;">${errorMessage}</p>
                <button onclick="window.propertyAPI.retryLastAction()" style="margin-top: 10px; padding: 8px 16px; background: #DC2626; color: white; border: none; border-radius: 6px; cursor: pointer;">Retry</button>
            </div>
        `;
    }

    // Fetch and analyze property
    async analyzeFromExtension(extensionData) {
        console.log('Processing extension data:', extensionData);
        
        // Prepare the request in the format the API expects
        const requestData = {
            propertyAddress: extensionData.address,
            propertyData: {
                price: parseFloat(extensionData.price) || 0,
                propertyType: extensionData.propertyType || 'house',
                bedrooms: parseInt(extensionData.bedrooms) || 0,
                bathrooms: parseFloat(extensionData.bathrooms) || 0,
                sqft: parseInt(extensionData.sqft) || 0,
                yearBuilt: parseInt(extensionData.yearBuilt) || 0,
                propertyTax: parseFloat(extensionData.propertyTax) || 0,
                hoaFees: parseFloat(extensionData.strataFee) || 0
            },
            includeStrAnalysis: true,
            analysisType: 'both'
        };
        
        try {
            console.log('Sending analysis request:', requestData);
            const result = await this.apiCallDirect(this.endpoints.analyzeProperty, requestData);
            console.log('Analysis result received:', result);
            
            if (result && result.data) {
                // Wrap in correct structure for updateMockup
                this.updateMockup({ data: result.data });
            }
            
            return result;
        } catch (error) {
            console.error('Extension analysis failed:', error);
            this.handleError(error);
        }
    }
    
    async analyzeProperty(address, options = {}) {
        const cacheKey = `property-${address}`;
        
        // Check cache first
        const cached = this.cache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
            console.log('Using cached data for:', address);
            return cached.data;
        }

        try {
            // TEMPORARILY DISABLE loading states as they break the DOM
            // The showLoading function replaces innerHTML which loses all element references
            // TODO: Fix loading states to use overlays instead of replacing content
            /*
            if (options.showLoading !== false) {
                if (document.getElementById('property-header')) {
                    this.showLoading('property-header', 'Fetching property data...');
                }
                if (document.getElementById('str-section')) {
                    this.showLoading('str-section', 'Analyzing STR potential...');
                }
                if (document.getElementById('ltr-section')) {
                    this.showLoading('ltr-section', 'Analyzing LTR market...');
                }
            }
            */

            // Don't use snake_case conversion for this endpoint as API expects camelCase
            const requestData = {
                propertyAddress: address,
                analysisType: options.analysisType || 'both',
                includeStrAnalysis: options.includeStr !== false
            };
            
            // Call API without snake_case conversion for this specific endpoint
            const result = await this.apiCallDirect(this.endpoints.analyzeProperty, requestData, options);

            // Fix double-wrapped structure if needed
            // If result has {success, data: {success, data: actualData}}, unwrap it
            let finalResult = result;
            if (result && result.data && result.data.success && result.data.data) {
                console.log('[PropertyAPI] Unwrapping double-nested data structure');
                finalResult = result.data;
            }

            // Cache successful result
            this.cache.set(cacheKey, {
                data: finalResult,
                timestamp: Date.now()
            });

            // Store for retry
            this.lastAction = () => this.analyzeProperty(address, options);

            return finalResult;
        } catch (error) {
            console.error('Property analysis failed:', error);
            
            // Show errors in each section
            if (options.showErrors !== false) {
                this.showError('property-header', error);
                this.showError('str-section', error);
                this.showError('ltr-section', error);
            }
            
            throw error;
        } finally {
            // Hide loading states - DISABLED as loading states are disabled
            /*
            if (options.showLoading !== false) {
                this.hideLoading('property-header');
                this.hideLoading('str-section');
                this.hideLoading('ltr-section');
            }
            */
        }
    }

    // Format value with N/A display and source indicator
    formatValue(value, type = 'currency', source = 'api') {
        // Check if value is undefined, null, or NaN
        if (value === undefined || value === null || (typeof value === 'number' && isNaN(value))) {
            return '<span style="color: #EF4444; font-weight: 600;">N/A</span>';
        }
        
        // Handle zero values explicitly
        if (value === 0 && type === 'currency') {
            return '<span style="color: #6B7280;">$0</span>';
        }
        
        // Format based on type
        let formatted;
        switch(type) {
            case 'currency':
                formatted = `$${Math.round(value).toLocaleString()}`;
                break;
            case 'percentage':
                formatted = `${Math.round(value * 100)}%`;
                break;
            case 'number':
                formatted = Math.round(value).toLocaleString();
                break;
            default:
                formatted = String(value);
        }
        
        // Add source indicator color
        let color = '#10B981'; // Green for real data
        if (source === 'estimate') {
            color = '#F59E0B'; // Yellow for estimates
            formatted += ' <span style="font-size: 10px; color: #F59E0B;">(est)</span>';
        } else if (source === 'placeholder') {
            color = '#6B7280'; // Gray for placeholders
        }
        
        return `<span style="color: ${color};">${formatted}</span>`;
    }

    // Update mockup with real data
    updateMockup(data, mockupType = 'base') {
        console.log('[PropertyAPI] updateMockup called with:', data);
        
        if (!data || !data.data) {
            console.error('Invalid data structure:', data);
            // Clear all data displays to show N/A
            this.clearAllDataDisplays();
            return;
        }

        const analysisData = data.data;
        console.log('[PropertyAPI] Analysis data keys:', Object.keys(analysisData));
        
        // Update property header
        this.updatePropertyHeader(analysisData);
        
        // Update STR section (handle both camelCase and snake_case)
        const strData = analysisData.shortTermRental || analysisData.short_term_rental;
        if (strData) {
            this.updateSTRSection(strData, analysisData.regulations);
        } else {
            // Clear STR section to show N/A
            this.clearSTRSection();
        }
        
        // Update LTR section (handle both camelCase and snake_case)
        const ltrData = analysisData.longTermRental || analysisData.long_term_rental;
        if (ltrData) {
            // Pass property details from top level to LTR section
            const propertyDetails = analysisData.propertyDetails || analysisData.property_details || {};
            this.updateLTRSection(ltrData, propertyDetails);
        } else {
            // Clear LTR section to show N/A
            this.clearLTRSection();
        }
        
        // Update financial calculator
        this.updateFinancialCalculator(analysisData);
        
        // Update investment grade for both mockups
        this.updateInvestmentGrade(analysisData);
        
        // Update comparison if mockup2
        if (mockupType === 'mockup2') {
            this.updateQuickComparison(analysisData);
            this.updateMockup2SpecificElements(analysisData);
        }
    }
    
    // Clear all data displays to show N/A
    clearAllDataDisplays() {
        const elementsToClear = [
            'str-monthly-revenue', 'str-occupancy', 'str-daily-rate', 'str-annual-revenue',
            'ltr-monthly-rent', 'netCashFlowDisplay', 'strRevenueCard', 'strMortgageCard',
            'strExpensesCard', 'strCashFlowCard', 'ltrRentCard', 'ltrMortgageCard',
            'ltrCashFlowCard', 'monthlyRevenueResult', 'annualRevenueCalc'
        ];
        
        elementsToClear.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.innerHTML = this.formatValue(undefined);
            }
        });
    }
    
    // Clear STR section to show N/A
    clearSTRSection() {
        const strElements = [
            'str-monthly-revenue', 'str-occupancy', 'str-daily-rate', 'str-annual-revenue',
            'strRevenueCard', 'strMortgageCard', 'strExpensesCard', 'strCashFlowCard'
        ];
        
        strElements.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.innerHTML = this.formatValue(undefined);
            }
        });
    }
    
    // Clear LTR section to show N/A
    clearLTRSection() {
        const ltrElements = [
            'ltr-monthly-rent', 'ltrRentCard', 'ltrMortgageCard', 'ltrCashFlowCard'
        ];
        
        ltrElements.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.innerHTML = this.formatValue(undefined);
            }
        });
    }

    // Update property header with real data
    updatePropertyHeader(data) {
        console.log('[PropertyAPI] updatePropertyHeader called with:', data);
        const propertyDetails = data.propertyDetails || data.property_details || {};
        const metrics = data.metrics || {};
        console.log('[PropertyAPI] Property details:', propertyDetails);
        console.log('[PropertyAPI] Metrics:', metrics);
        
        // Update address
        const addressEl = document.querySelector('.property-address');
        console.log('[PropertyAPI] Found address element:', addressEl);
        if (addressEl) addressEl.textContent = propertyDetails.address || 'Property Address';
        
        // Update price
        const priceEl = document.querySelector('.property-price');
        if (priceEl && propertyDetails.estimatedValue) {
            priceEl.textContent = `$${propertyDetails.estimatedValue.toLocaleString()}`;
        }
        
        // Update property details
        const bedroomsEl = document.querySelector('[data-field="bedrooms"]');
        if (bedroomsEl && propertyDetails.bedrooms) {
            bedroomsEl.textContent = `${propertyDetails.bedrooms} Bedrooms`;
        }
        
        const bathroomsEl = document.querySelector('[data-field="bathrooms"]');
        if (bathroomsEl && propertyDetails.bathrooms) {
            bathroomsEl.textContent = `${propertyDetails.bathrooms} Bathrooms`;
        }
        
        const sqftEl = document.querySelector('[data-field="sqft"]');
        if (sqftEl && propertyDetails.sqft) {
            sqftEl.textContent = `${propertyDetails.sqft.toLocaleString()} sq ft`;
        }
        
        // Update ROI metric in header
        const roiDisplay = document.getElementById('roiDisplay');
        if (roiDisplay && metrics.total_r_o_i) {
            roiDisplay.textContent = `${parseFloat(metrics.total_r_o_i).toFixed(1)}%`;
        }
        
        // Update Cap Rate and Cash-on-Cash in financial sections
        const capRateEl = document.getElementById('capRate');
        if (capRateEl && metrics.cap_rate) {
            capRateEl.textContent = `${parseFloat(metrics.cap_rate).toFixed(1)}%`;
        }
        
        const cashOnCashEl = document.getElementById('cashOnCash');
        if (cashOnCashEl && metrics.cash_on_cash_return) {
            cashOnCashEl.textContent = `${parseFloat(metrics.cash_on_cash_return).toFixed(1)}%`;
        }
    }

    // Update STR section with real data
    updateSTRSection(strData, regulations) {
        // Check if STR is restricted
        if (regulations?.restricted) {
            const strSection = document.getElementById('str-section');
            if (strSection) {
                strSection.classList.add('restricted');
                const restrictionBanner = strSection.querySelector('.restriction-banner');
                if (restrictionBanner) {
                    restrictionBanner.style.display = 'block';
                    restrictionBanner.querySelector('.restriction-text').textContent = regulations.summary || 'STR restricted in this area';
                }
            }
            return;
        }

        // Extract values (handle both camelCase and snake_case)
        const monthlyRevenue = strData.monthlyRevenue || strData.monthly_revenue || strData.monthlyRate || 0;
        const dailyRate = strData.dailyRate || strData.daily_rate || strData.avg_nightly_rate || 0;
        const occupancyRate = strData.occupancyRate || strData.occupancy_rate || 0.75;
        const annualRevenue = strData.annualRevenue || strData.annual_revenue || (monthlyRevenue * 12);

        // Update STR metrics
        const netCashFlow = strData.net_cash_flow || strData.netCashFlow || 0;
        const metricsToUpdate = {
            'str-monthly-revenue': monthlyRevenue,
            'str-occupancy': occupancyRate,
            'str-daily-rate': dailyRate,
            'str-annual-revenue': annualRevenue,
            'netCashFlowDisplay': netCashFlow
        };

        Object.entries(metricsToUpdate).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) {
                if (id === 'str-occupancy') {
                    element.innerHTML = this.formatValue(value, 'percentage');
                } else {
                    element.innerHTML = this.formatValue(value, 'currency');
                    // Add positive/negative class for cash flow
                    if (id === 'netCashFlowDisplay') {
                        element.classList.remove('positive', 'negative');
                        element.classList.add(value >= 0 ? 'positive' : 'negative');
                    }
                }
            }
        });

        // Update the STR calculator with actual API values
        this.updateSTRCalculator(dailyRate, occupancyRate, monthlyRevenue);

        // Update comparables if available
        if (strData.comparables && Array.isArray(strData.comparables)) {
            this.updateSTRComparables(strData.comparables);
        }
        
        // Update STR vs LTR comparison cards
        this.updateComparisonCards(strData);
    }
    
    // Update the STR vs LTR comparison cards with real data
    updateComparisonCards(strData) {
        // STR Card values
        const strRevenue = strData.monthlyRevenue || strData.monthly_revenue || 0;
        const strExpenses = strData.expenses?.monthly?.total || 0;
        const strMortgage = strData.mortgagePayment || strData.mortgage_payment || 0;
        const strNetCashFlow = strData.net_cash_flow || strData.netCashFlow || 0;
        
        // Update STR card elements
        const strRevenueCard = document.getElementById('strRevenueCard');
        if (strRevenueCard) {
            strRevenueCard.textContent = this.formatValue(strRevenue, 'currency');
            strRevenueCard.classList.add('positive');
        }
        
        const strExpensesCard = document.getElementById('strExpensesCard');
        if (strExpensesCard) {
            strExpensesCard.textContent = '-' + this.formatValue(strExpenses, 'currency').substring(1);
            strExpensesCard.classList.add('negative');
        }
        
        const strMortgageCard = document.getElementById('strMortgageCard');
        if (strMortgageCard && strMortgage) {
            strMortgageCard.textContent = '-' + this.formatValue(strMortgage, 'currency').substring(1);
            strMortgageCard.classList.add('negative');
        }
        
        const strCashFlowCard = document.getElementById('strCashFlowCard');
        if (strCashFlowCard) {
            strCashFlowCard.textContent = this.formatValue(strNetCashFlow, 'currency');
            strCashFlowCard.classList.remove('positive', 'negative');
            strCashFlowCard.classList.add(strNetCashFlow >= 0 ? 'positive' : 'negative');
        }
    }
    
    // Update STR calculator sliders with API data
    updateSTRCalculator(dailyRate, occupancyRate, monthlyRevenue) {
        // Update simple calculator sliders
        const nightlyRateSlider = document.getElementById('nightlyRate');
        const occupancySlider = document.getElementById('occupancyRate');
        const nightlyValueDisplay = document.getElementById('nightlyRateValue');
        const occupancyValueDisplay = document.getElementById('occupancyRateValue');
        const projectedRevenueDisplay = document.getElementById('monthlyRevenueValue');
        
        if (nightlyRateSlider && dailyRate > 0) {
            nightlyRateSlider.value = Math.round(dailyRate);
            if (nightlyValueDisplay) {
                nightlyValueDisplay.textContent = `$${Math.round(dailyRate)}/night`;
            }
        }
        
        if (occupancySlider && occupancyRate > 0) {
            occupancySlider.value = Math.round(occupancyRate * 100);
            if (occupancyValueDisplay) {
                occupancyValueDisplay.textContent = `${Math.round(occupancyRate * 100)}%`;
            }
        }
        
        // Update projected monthly revenue to match actual API data
        if (projectedRevenueDisplay && monthlyRevenue > 0) {
            projectedRevenueDisplay.textContent = `$${Math.round(monthlyRevenue).toLocaleString()}/month`;
        }
        
        // Also update the financial calculator STR values
        const strNightlySlider = document.getElementById('strNightlySlider');
        const strOccupancySlider = document.getElementById('strOccupancySlider');
        
        if (strNightlySlider && dailyRate > 0) {
            strNightlySlider.value = Math.round(dailyRate);
            const strNightlyValue = document.getElementById('strNightlyValue');
            if (strNightlyValue) {
                strNightlyValue.textContent = `$${Math.round(dailyRate)}`;
            }
        }
        
        if (strOccupancySlider && occupancyRate > 0) {
            strOccupancySlider.value = Math.round(occupancyRate * 100);
            const strOccupancyValue = document.getElementById('strOccupancyValue');
            if (strOccupancyValue) {
                strOccupancyValue.textContent = `${Math.round(occupancyRate * 100)}%`;
            }
        }
        
        // Trigger calculator update
        if (typeof window.updateSimpleCalculator === 'function') {
            window.updateSimpleCalculator();
        }
        if (typeof window.updateFinancialCalculator === 'function') {
            window.updateFinancialCalculator();
        }
    }

    // Update STR comparables
    updateSTRComparables(comparables) {
        const container = document.getElementById('airbnb-comparables-container');
        if (!container) return;

        console.log('[PropertyAPI] Updating STR comparables with:', comparables);

        const comparableHTML = comparables.slice(0, 3).map(comp => {
            // Handle both snake_case and camelCase property names
            const nightlyRate = comp.nightly_rate || comp.nightlyRate || 0;
            const imageUrl = comp.image_url || comp.imageUrl || comp.image || '';
            const airbnbUrl = comp.airbnb_url || comp.airbnbUrl || '#';
            const occupancyRate = (comp.occupancy_rate || comp.occupancyRate || 0.7) * 100;
            const monthlyRevenue = comp.monthly_revenue || comp.monthlyRevenue || (nightlyRate * occupancyRate * 30 / 100);
            const rating = comp.rating || 0;
            const reviewCount = comp.review_count || comp.reviewCount || comp.reviews || 0;
            const title = comp.title || comp.address || 'Comparable Property';
            const bedrooms = comp.bedrooms || 0;
            const bathrooms = comp.bathrooms || 0;

            return `
                <a href="${airbnbUrl}" target="_blank" rel="noopener noreferrer" style="text-decoration: none; color: inherit;">
                    <div class="comparable-card">
                        <div style="position: relative;">
                            ${imageUrl ? 
                                `<img src="${imageUrl}" alt="${title}" class="comparable-image" onerror="this.src='https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600&h=400&fit=crop'">` : 
                                `<div class="comparable-image" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); display: flex; align-items: center; justify-content: center; color: white; font-size: 18px;">No Image</div>`
                            }
                            <div class="comparable-price">$${nightlyRate}/night</div>
                            ${comp.similarity_score >= 90 ? '<span class="comparable-badge badge-top">Top Match</span>' : 
                              comp.similarity_score >= 70 ? '<span class="comparable-badge badge-similar">Similar</span>' :
                              '<span class="comparable-badge badge-value">Comparable</span>'}
                        </div>
                        <div class="comparable-details">
                            <h3 class="comparable-title">${title}</h3>
                            <div class="comparable-stats">
                                <div style="display: flex; justify-content: space-between; margin: 8px 0;">
                                    <span style="color: #6B7280; font-size: 14px;">Bedrooms</span>
                                    <span style="font-weight: 600; font-size: 14px;">${bedrooms}</span>
                                </div>
                                <div style="display: flex; justify-content: space-between; margin: 8px 0;">
                                    <span style="color: #6B7280; font-size: 14px;">Bathrooms</span>
                                    <span style="font-weight: 600; font-size: 14px;">${bathrooms}</span>
                                </div>
                                <div style="display: flex; justify-content: space-between; margin: 8px 0;">
                                    <span style="color: #6B7280; font-size: 14px;">Occupancy</span>
                                    <span style="font-weight: 600; font-size: 14px;">${occupancyRate.toFixed(0)}%</span>
                                </div>
                                <div style="display: flex; justify-content: space-between; margin: 8px 0; padding-top: 8px; border-top: 1px solid #E5E7EB;">
                                    <span style="color: #6B7280; font-size: 14px;">Monthly Revenue</span>
                                    <span style="font-weight: 600; color: #10B981; font-size: 14px;">$${monthlyRevenue.toLocaleString()}</span>
                                </div>
                                ${rating > 0 ? `
                                    <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid #E5E7EB;">
                                        <span style="color: #F59E0B;">★</span> ${rating.toFixed(2)} (${reviewCount} reviews)
                                    </div>
                                ` : ''}
                            </div>
                        </div>
                    </div>
                </a>
            `;
        }).join('');

        container.innerHTML = comparableHTML;
    }

    // Update LTR section with real data
    updateLTRSection(ltrData, propertyDetails = {}) {
        // Update LTR metrics (handle snake_case)
        const monthlyRent = ltrData.monthlyRent || ltrData.monthly_rent || ltrData.average_rent || ltrData.averageRent || 0;
        const metricsToUpdate = {
            'ltr-monthly-rent': monthlyRent,
            'ltr-rent': monthlyRent, // Also update alternate ID
            'ltr-vacancy-rate': ltrData.vacancyRate || ltrData.vacancy_rate || 5,
            'ltr-annual-income': monthlyRent * 12,
            'ltr-effective-income': monthlyRent * 12 * 0.95
        };

        Object.entries(metricsToUpdate).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element && value !== undefined) {
                if (id === 'ltr-vacancy-rate') {
                    element.textContent = `${value}%`;
                } else {
                    element.textContent = `$${Math.round(value).toLocaleString()}`;
                }
            }
        });

        // Use property details passed from main data structure
        const city = propertyDetails.city || 'Toronto';
        const address = propertyDetails.address || 'Your Property';
        
        // Update all hardcoded location references more specifically
        const ltrSection = document.getElementById('ltr-section');
        if (ltrSection) {
            // Find all text nodes within LTR section
            const walker = document.createTreeWalker(
                ltrSection,
                NodeFilter.SHOW_TEXT,
                null,
                false
            );
            
            let node;
            while (node = walker.nextNode()) {
                if (node.textContent.includes('Mississauga') || node.textContent.includes('ABSOLUTE AVENUE')) {
                    node.textContent = node.textContent
                        .replace(/ABSOLUTE AVENUE Mississauga/g, address.split(',')[0] + ' ' + city)
                        .replace(/Mississauga/g, city)
                        .replace(/ABSOLUTE AVENUE/g, address.split(',')[0]);
                }
            }
        }

        // Update rental comparables if available
        if (ltrData.comparables && Array.isArray(ltrData.comparables)) {
            this.updateLTRComparables(ltrData.comparables);
        }
    }

    // Update LTR comparables with enhanced data
    updateLTRComparables(comparables) {
        const container = document.getElementById('rental-comparables-container');
        if (!container) return;

        // Clear existing content
        container.innerHTML = '';
        
        // Take top 6 comparables (or all if less than 6)
        const topComparables = comparables.slice(0, 6);
        
        topComparables.forEach(comp => {
            // Handle both snake_case and camelCase
            const monthlyRent = comp.monthly_rent || comp.monthlyRent || 0;
            const matchScore = comp.match_score || comp.matchScore || 0;
            const daysOnMarket = comp.days_on_market || comp.daysOnMarket || 0;
            const distanceKm = comp.distance_km || comp.distanceKm || 0;
            const sourceUrl = comp.source_url || comp.sourceUrl;
            const source = comp.source || 'Unknown';
            
            const card = document.createElement('div');
            card.style.cssText = 'border: 1px solid var(--gray-200, #E5E7EB); border-radius: 12px; overflow: hidden;';
            
            card.innerHTML = `
                <div style="background: linear-gradient(135deg, #f3f4f6, #e5e7eb); height: 160px; position: relative;">
                    <div style="position: absolute; bottom: 10px; left: 10px; background: white; padding: 6px 12px; border-radius: 6px; font-weight: 600;">
                        $${monthlyRent.toLocaleString()}/mo
                    </div>
                    ${matchScore >= 90 ? 
                        `<div style="position: absolute; top: 10px; right: 10px; background: #22c55e; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 500;">
                            ${matchScore}% Match
                        </div>` : 
                        matchScore >= 80 ?
                        `<div style="position: absolute; top: 10px; right: 10px; background: #3b82f6; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 500;">
                            ${matchScore}% Match
                        </div>` : ''
                    }
                </div>
                <div style="padding: 16px;">
                    <h4 style="font-size: 15px; font-weight: 600; margin-bottom: 8px; color: #111827;">
                        ${comp.bedrooms}BR • ${comp.address ? comp.address.split(',')[0] : 'Comparable Property'}
                    </h4>
                    <div style="display: flex; gap: 12px; margin-bottom: 12px;">
                        <span style="font-size: 13px; color: #6B7280;">${comp.bedrooms} Bed</span>
                        <span style="font-size: 13px; color: #6B7280;">${comp.bathrooms} Bath</span>
                        <span style="font-size: 13px; color: #6B7280;">${comp.sqft || 'N/A'} sqft</span>
                    </div>
                    <div style="display: flex; gap: 12px; margin-bottom: 12px;">
                        <span style="font-size: 12px; color: #6B7280;">📍 ${distanceKm} km</span>
                        <span style="font-size: 12px; color: ${daysOnMarket < 7 ? '#22c55e' : daysOnMarket < 14 ? '#f59e0b' : '#6B7280'}; font-weight: 500;">
                            ${daysOnMarket < 7 ? '🔥 New' : `Listed ${daysOnMarket} days ago`}
                        </span>
                    </div>
                    <div style="display: flex; justify-content: space-between; align-items: center; padding-top: 8px; border-top: 1px solid #E5E7EB;">
                        ${sourceUrl ? 
                            `<a href="${sourceUrl}" target="_blank" style="font-size: 12px; color: #3b82f6; text-decoration: none; font-weight: 500;">
                                View on ${source} →
                            </a>` :
                            `<span style="font-size: 12px; color: #6B7280;">Source: ${source}</span>`
                        }
                    </div>
                </div>
            `;
            
            container.appendChild(card);
        });
        
        // Add confidence indicator if we have it
        const ltrSection = document.querySelector('#ltr-analysis-section h2, #ltr-section h2');
        if (ltrSection && comparables.length > 0) {
            // Check if confidence badge already exists
            if (!ltrSection.querySelector('.ltr-confidence-badge')) {
                const confidence = comparables[0].confidence || (comparables.length >= 5 ? 'high' : comparables.length >= 3 ? 'medium' : 'low');
                const badge = document.createElement('span');
                badge.className = 'ltr-confidence-badge data-source-badge';
                badge.style.cssText = `
                    background: ${confidence === 'high' ? '#22c55e' : confidence === 'medium' ? '#f59e0b' : '#ef4444'};
                    color: white;
                    margin-left: 8px;
                    padding: 4px 8px;
                    border-radius: 4px;
                    font-size: 12px;
                    font-weight: 500;
                `;
                badge.textContent = `${confidence} confidence`;
                ltrSection.appendChild(badge);
            }
        }
    }

    // Update financial calculator
    updateFinancialCalculator(data) {
        const costs = data.costs || {};
        const propertyDetails = data.propertyDetails || data.property_details || {};
        
        // Update property price
        const propertyPrice = propertyDetails.estimatedValue || propertyDetails.estimated_value || 849900;
        window.propertyPrice = propertyPrice; // Store globally for calculator
        
        // Get LTR data (handle both camelCase and snake_case)
        const ltrData = data.longTermRental || data.long_term_rental || {};
        const monthlyRent = ltrData.monthlyRent || ltrData.monthly_rent || 0;
        
        // Update LTR rent slider in financial calculator
        const ltrRentSlider = document.getElementById('ltrRentSlider');
        if (ltrRentSlider && monthlyRent > 0) {
            ltrRentSlider.value = Math.round(monthlyRent);
            const ltrRentValue = document.getElementById('ltrRentValue');
            if (ltrRentValue) {
                ltrRentValue.textContent = `$${Math.round(monthlyRent).toLocaleString()}`;
            }
        }
        
        // Update property tax
        const propertyTaxInput = document.getElementById('propertyTaxInput');
        const propertyTaxAnnual = costs.propertyTaxAnnual || costs.property_tax_annual;
        if (propertyTaxInput && propertyTaxAnnual) {
            const monthlyTax = Math.round(propertyTaxAnnual / 12);
            propertyTaxInput.value = monthlyTax;
            const taxMonthlyEl = document.getElementById('propertyTaxMonthly');
            if (taxMonthlyEl) taxMonthlyEl.textContent = `$${monthlyTax}/mo`;
            const taxAnnualEl = document.getElementById('propertyTaxAnnual');
            if (taxAnnualEl) taxAnnualEl.textContent = `$${propertyTaxAnnual.toLocaleString()}/year`;
        }
        
        // Update insurance
        const insuranceSlider = document.getElementById('insuranceSlider');
        const insuranceAnnual = costs.insuranceAnnual || costs.insurance_annual;
        if (insuranceSlider && insuranceAnnual) {
            const monthlyInsurance = Math.round(insuranceAnnual / 12);
            insuranceSlider.value = monthlyInsurance;
            const insuranceValueEl = document.getElementById('insuranceValue');
            if (insuranceValueEl) insuranceValueEl.textContent = `$${monthlyInsurance}/mo`;
        }
        
        // Trigger calculator update
        if (typeof updateFinancialCalculations === 'function') {
            updateFinancialCalculations();
        }
        if (typeof window.updateFinancialCalculator === 'function') {
            window.updateFinancialCalculator();
        }
    }

    // Update quick comparison (for mockup2)
    updateQuickComparison(data) {
        const strData = data.shortTermRental || {};
        const ltrData = data.longTermRental || {};
        const isStrRestricted = data.regulations?.restricted;
        
        // Update comparison metrics
        const strMonthlyEl = document.getElementById('comparison-str-monthly');
        if (strMonthlyEl) {
            if (isStrRestricted) {
                strMonthlyEl.textContent = 'N/A (Restricted)';
                strMonthlyEl.style.color = '#6B7280';
            } else {
                strMonthlyEl.textContent = `$${(strData.monthlyRevenue || 0).toLocaleString()}`;
            }
        }
        
        const ltrMonthlyEl = document.getElementById('comparison-ltr-monthly');
        if (ltrMonthlyEl) {
            ltrMonthlyEl.textContent = `$${(ltrData.monthlyRent || 0).toLocaleString()}`;
        }
        
        // Update recommendation
        const recommendationEl = document.getElementById('comparison-recommendation');
        if (recommendationEl) {
            if (isStrRestricted) {
                recommendationEl.textContent = 'LTR Recommended (STR Restricted)';
                recommendationEl.style.color = '#10B981';
            } else if ((strData.monthlyRevenue || 0) > (ltrData.monthlyRent || 0) * 1.5) {
                recommendationEl.textContent = 'STR Recommended (Higher Returns)';
                recommendationEl.style.color = '#10B981';
            } else {
                recommendationEl.textContent = 'LTR Recommended (More Stable)';
                recommendationEl.style.color = '#3B82F6';
            }
        }
    }

    // Update investment grade (for both mockups)
    updateInvestmentGrade(data) {
        const metrics = data.metrics || {};
        
        // Try different element IDs for different mockup structures
        let gradeEl = document.getElementById('investment-grade');
        let gradeDescEl = document.getElementById('investment-grade-desc');
        
        // For base-mockup.html, look for the grade in the h2 element
        if (!gradeEl) {
            const h2Elements = document.querySelectorAll('#investment-grade-card h2');
            h2Elements.forEach(h2 => {
                if (h2.textContent.includes('Investment Grade:')) {
                    gradeEl = h2;
                }
            });
        }
        
        if (!gradeEl) return;
        
        // Calculate grade based on metrics
        const roi = parseFloat(metrics.totalRoi) || 0;
        const capRate = parseFloat(metrics.capRate) || 0;
        
        let grade, description;
        if (roi > 15 && capRate > 8) {
            grade = 'A+';
            description = 'Exceptional investment opportunity';
        } else if (roi > 12 && capRate > 6) {
            grade = 'A';
            description = 'Excellent investment potential';
        } else if (roi > 10 && capRate > 5) {
            grade = 'B+';
            description = 'Strong investment opportunity';
        } else if (roi > 8 && capRate > 4) {
            grade = 'B';
            description = 'Good investment potential';
        } else if (roi > 5 && capRate > 3) {
            grade = 'C+';
            description = 'Moderate investment potential';
        } else {
            grade = 'C';
            description = 'Consider other opportunities';
        }
        
        // Update the grade element based on its structure
        if (gradeEl.tagName === 'H2' && gradeEl.textContent.includes('Investment Grade:')) {
            // For base-mockup.html structure
            gradeEl.textContent = `Investment Grade: ${grade}`;
            // Update description in the next paragraph
            const nextP = gradeEl.nextElementSibling;
            if (nextP && nextP.tagName === 'P') {
                nextP.textContent = description;
            }
        } else {
            // For mockup2 structure
            gradeEl.textContent = grade;
            if (gradeDescEl) gradeDescEl.textContent = description;
        }
    }

    // Retry last failed action
    retryLastAction() {
        if (this.lastAction) {
            this.lastAction();
        }
    }

    // Initialize property analysis from form
    async initializeFromForm(formId = 'property-form') {
        const form = document.getElementById(formId);
        if (!form) {
            console.error('Property form not found');
            return;
        }

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const addressInput = form.querySelector('input[name="address"]');
            if (!addressInput) return;
            
            const address = addressInput.value.trim();
            if (!address) {
                alert('Please enter a property address');
                return;
            }

            try {
                // Detect which mockup we're in
                const mockupType = window.location.pathname.includes('mockup2') ? 'mockup2' : 'base';
                
                // Fetch and analyze property
                const result = await this.analyzeProperty(address);
                
                // Update the mockup with real data
                this.updateMockup(result, mockupType);
                
                // Show success message
                this.showSuccessMessage('Property analysis complete!');
                
            } catch (error) {
                console.error('Analysis failed:', error);
                alert(`Analysis failed: ${error.message}`);
            }
        });
    }

    // Show success message
    showSuccessMessage(message) {
        const toast = document.createElement('div');
        toast.className = 'success-toast';
        toast.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: #10B981;
            color: white;
            padding: 16px 24px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 99;
            animation: slideUp 0.3s ease;
        `;
        toast.textContent = message;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.style.animation = 'slideDown 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
        
        // Add animation if not exists
        if (!document.getElementById('toast-animations')) {
            const style = document.createElement('style');
            style.id = 'toast-animations';
            style.textContent = `
                @keyframes slideUp { from { transform: translateY(100px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
                @keyframes slideDown { from { transform: translateY(0); opacity: 1; } to { transform: translateY(100px); opacity: 0; } }
            `;
            document.head.appendChild(style);
        }
    }
    
    // Update Base Mockup 2 specific elements with real data
    updateMockup2SpecificElements(data) {
        console.log('[PropertyAPI] Updating Mockup 2 specific elements');
        
        // Get STR and LTR data
        const strData = data.short_term_rental || data.shortTermRental || {};
        const ltrData = data.long_term_rental || data.longTermRental || {};
        const cashFlow = data.cash_flow || data.cashFlow || {};
        const monthlyExpenses = data.monthly_expenses || data.monthlyExpenses || {};
        
        // Update comparison teaser values
        const comparisonLtr = document.getElementById('comparison-ltr-monthly');
        if (comparisonLtr) {
            const ltrCashFlow = cashFlow.monthly || (ltrData.monthly_rent - (monthlyExpenses.total || 0));
            comparisonLtr.textContent = this.formatValue(ltrCashFlow, 'currency');
            comparisonLtr.classList.remove('positive', 'negative');
            comparisonLtr.classList.add(ltrCashFlow >= 0 ? 'positive' : 'negative');
        }
        
        // Update STR daily rate
        const strDailyRate = document.getElementById('str-daily-rate');
        if (strDailyRate) {
            const dailyRate = strData.avg_nightly_rate || strData.daily_rate || strData.avgNightlyRate || 0;
            strDailyRate.textContent = this.formatValue(dailyRate, 'currency');
        }
        
        // Update LTR monthly rent
        const ltrMonthlyRent = document.getElementById('ltr-monthly-rent');
        if (ltrMonthlyRent) {
            const monthlyRent = ltrData.monthly_rent || ltrData.monthlyRent || 0;
            ltrMonthlyRent.textContent = this.formatValue(monthlyRent, 'currency');
        }
        
        // Update cash flow breakdown
        const rentalIncome = document.getElementById('rentalIncome');
        if (rentalIncome) {
            const rent = ltrData.monthly_rent || ltrData.monthlyRent || 0;
            rentalIncome.textContent = '+' + this.formatValue(rent, 'currency').substring(1);
        }
        
        const mortgagePayment = document.getElementById('mortgagePayment');
        if (mortgagePayment) {
            const mortgage = monthlyExpenses.mortgage || 0;
            mortgagePayment.textContent = '-' + this.formatValue(mortgage, 'currency').substring(1);
        }
        
        const netCashFlowEl = document.getElementById('netCashFlow');
        if (netCashFlowEl) {
            const netFlow = cashFlow.monthly || 0;
            netCashFlowEl.textContent = this.formatValue(netFlow, 'currency');
            netCashFlowEl.classList.remove('positive', 'negative');
            netCashFlowEl.classList.add(netFlow >= 0 ? 'positive' : 'negative');
            
            // Also update the parent element's class
            const parent = netCashFlowEl.parentElement;
            if (parent && parent.classList.contains('breakdown-value')) {
                parent.classList.remove('positive', 'negative');
                parent.classList.add(netFlow >= 0 ? 'positive' : 'negative');
            }
        }
        
        // Update LTR rent slider and value
        const ltrRentSlider = document.getElementById('ltrRentSlider');
        const ltrRentValue = document.getElementById('ltrRentValue');
        if (ltrRentSlider && ltrData.monthly_rent) {
            const rent = ltrData.monthly_rent || ltrData.monthlyRent || 3950;
            ltrRentSlider.value = rent;
            if (ltrRentValue) {
                ltrRentValue.textContent = this.formatValue(rent, 'currency');
            }
        }
        
        // Update the bar chart value
        const ltrBarValue = document.getElementById('ltrBarValue');
        if (ltrBarValue) {
            const netFlow = cashFlow.monthly || 0;
            ltrBarValue.textContent = this.formatValue(Math.abs(netFlow), 'currency');
            ltrBarValue.setAttribute('fill', netFlow >= 0 ? '#10b981' : '#ef4444');
        }
        
        // Update the bar height
        const ltrBar = document.getElementById('ltrBar');
        if (ltrBar) {
            const netFlow = cashFlow.monthly || 0;
            const ltrHeight = Math.min(200, Math.abs(netFlow) / 20); // Scale for visualization
            
            if (netFlow >= 0) {
                ltrBar.setAttribute('y', 230 - ltrHeight);
                ltrBar.setAttribute('height', ltrHeight);
                ltrBar.setAttribute('fill', '#10b981');
            } else {
                ltrBar.setAttribute('y', 230);
                ltrBar.setAttribute('height', ltrHeight);
                ltrBar.setAttribute('fill', '#ef4444');
            }
        }
        
        console.log('[PropertyAPI] Mockup 2 specific elements updated');
    }
}

// Initialize global instance
window.propertyAPI = new PropertyAnalysisAPI();

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        // Always initialize the form for manual input
        window.propertyAPI.initializeFromForm();
        
        // Check for extension parameters in URL
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.has('source') && urlParams.get('source') === 'extension') {
            // Process extension data
            const propertyData = {
                address: urlParams.get('address'),
                price: urlParams.get('price'),
                propertyType: urlParams.get('propertyType'),
                bedrooms: urlParams.get('bedrooms'),
                bathrooms: urlParams.get('bathrooms'),
                sqft: urlParams.get('sqft'),
                yearBuilt: urlParams.get('yearBuilt'),
                propertyTax: urlParams.get('propertyTax'),
                strataFee: urlParams.get('strataFee')
            };
            
            console.log('Extension data detected:', propertyData);
            
            // Automatically analyze the property
            window.propertyAPI.analyzeFromExtension(propertyData);
        }
    });
} else {
    window.propertyAPI.initializeFromForm();
}

// Export for module usage if needed
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PropertyAnalysisAPI;
}