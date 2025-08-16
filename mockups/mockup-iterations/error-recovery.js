/**
 * Error Recovery Module
 * Provides graceful error handling and recovery options for mockup testing
 */

class ErrorRecovery {
    constructor() {
        this.mockData = this.getDefaultMockData();
        this.errorHistory = [];
        this.maxErrorHistory = 10;
    }
    
    // Get default mock data for fallback
    getDefaultMockData() {
        return {
            success: true,
            data: {
                propertyDetails: {
                    address: '123 Main St, Toronto, ON',
                    estimatedValue: 849900,
                    bedrooms: 3,
                    bathrooms: 2,
                    sqft: 1800,
                    propertyType: 'Single Family',
                    yearBuilt: 2010
                },
                costs: {
                    propertyTaxAnnual: 8500,
                    propertyTaxMonthly: 708,
                    insuranceAnnual: 1800,
                    insuranceMonthly: 150,
                    hoaMonthly: 0,
                    utilities: 250,
                    maintenance: 200
                },
                shortTermRental: {
                    monthlyRevenue: 6800,
                    occupancyRate: 0.78,
                    dailyRate: 285,
                    annualRevenue: 81600,
                    cleaningFee: 125,
                    comparables: [
                        {
                            title: 'Luxury Downtown Condo',
                            nightlyRate: 295,
                            occupancy: 82,
                            rating: 4.9,
                            reviews: 127
                        },
                        {
                            title: 'Cozy Family Home',
                            nightlyRate: 275,
                            occupancy: 75,
                            rating: 4.8,
                            reviews: 89
                        },
                        {
                            title: 'Modern Executive Suite',
                            nightlyRate: 285,
                            occupancy: 80,
                            rating: 4.9,
                            reviews: 156
                        }
                    ]
                },
                longTermRental: {
                    monthlyRent: 3200,
                    vacancyRate: 5,
                    annualIncome: 38400,
                    effectiveIncome: 36480,
                    comparables: [
                        {
                            address: '456 Oak Ave',
                            monthlyRent: 3100,
                            bedrooms: 3,
                            bathrooms: 2,
                            sqft: 1750
                        },
                        {
                            address: '789 Elm St',
                            monthlyRent: 3300,
                            bedrooms: 3,
                            bathrooms: 2.5,
                            sqft: 1850
                        }
                    ]
                },
                metrics: {
                    totalRoi: 12.5,
                    capRate: 7.8,
                    cashOnCash: 9.2,
                    monthlyProfit: 2450
                },
                regulations: {
                    restricted: false,
                    summary: 'STR allowed with proper licensing',
                    details: 'Short-term rentals are permitted in this area with appropriate business license and compliance with local bylaws.'
                }
            },
            message: 'Mock data loaded for testing',
            isMockData: true
        };
    }
    
    // Log error for tracking
    logError(error, context = {}) {
        const errorEntry = {
            timestamp: new Date().toISOString(),
            message: error.message || error.toString(),
            stack: error.stack,
            context,
            url: window.location.href,
            userAgent: navigator.userAgent
        };
        
        this.errorHistory.unshift(errorEntry);
        
        // Limit history size
        if (this.errorHistory.length > this.maxErrorHistory) {
            this.errorHistory.pop();
        }
        
        console.error('[ErrorRecovery] Error logged:', errorEntry);
        
        return errorEntry;
    }
    
    // Determine error type and recovery strategy
    getErrorType(error) {
        const errorMessage = error.message?.toLowerCase() || '';
        
        if (errorMessage.includes('cors')) {
            return 'cors';
        } else if (errorMessage.includes('timeout') || errorMessage.includes('abort')) {
            return 'timeout';
        } else if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
            return 'network';
        } else if (errorMessage.includes('auth') || errorMessage.includes('unauthorized')) {
            return 'auth';
        } else if (errorMessage.includes('404')) {
            return 'notfound';
        } else if (errorMessage.includes('500') || errorMessage.includes('server')) {
            return 'server';
        } else {
            return 'unknown';
        }
    }
    
    // Get recovery suggestions based on error type
    getRecoverySuggestions(errorType) {
        const suggestions = {
            cors: [
                'Check if Railway API is running on port 3001',
                'Verify CORS configuration in Railway API',
                'Try using the production API instead',
                'Check browser console for specific CORS errors'
            ],
            timeout: [
                'STR analysis can take 30-60 seconds - please wait',
                'Check your internet connection',
                'Try analyzing a simpler property',
                'Refresh the page and try again'
            ],
            network: [
                'Check your internet connection',
                'Verify both servers are running (npm run dev)',
                'Try refreshing the page',
                'Check if APIs are accessible directly'
            ],
            auth: [
                'Authentication is optional - you can proceed without login',
                'Try refreshing your authentication token',
                'Clear browser cache and cookies',
                'Use test mode (?test=true) for unlimited access'
            ],
            notfound: [
                'Check the API endpoint URL',
                'Verify the property address is valid',
                'Ensure the API route exists',
                'Check for typos in the request'
            ],
            server: [
                'The server encountered an error - please try again',
                'Check Railway API logs for details',
                'Try with different property data',
                'Contact support if the issue persists'
            ],
            unknown: [
                'An unexpected error occurred',
                'Try refreshing the page',
                'Check browser console for details',
                'Use mock data for testing (?useMock=true)'
            ]
        };
        
        return suggestions[errorType] || suggestions.unknown;
    }
    
    // Show error UI with recovery options
    showErrorUI(error, elementId = 'error-container', options = {}) {
        const errorType = this.getErrorType(error);
        const suggestions = this.getRecoverySuggestions(errorType);
        
        // Create or find error container
        let container = document.getElementById(elementId);
        if (!container) {
            container = document.createElement('div');
            container.id = elementId;
            document.body.appendChild(container);
        }
        
        // Build error UI
        container.innerHTML = `
            <div style="background: #FEF2F2; border: 2px solid #FCA5A5; border-radius: 12px; 
                        padding: 20px; margin: 20px 0; animation: shake 0.5s;">
                <style>
                    @keyframes shake {
                        0%, 100% { transform: translateX(0); }
                        25% { transform: translateX(-5px); }
                        75% { transform: translateX(5px); }
                    }
                </style>
                
                <div style="display: flex; align-items: start; gap: 12px;">
                    <span style="font-size: 24px;">⚠️</span>
                    <div style="flex: 1;">
                        <h3 style="margin: 0 0 8px 0; color: #DC2626; font-size: 18px; font-weight: 600;">
                            ${this.getErrorTitle(errorType)}
                        </h3>
                        
                        <p style="margin: 0 0 16px 0; color: #7F1D1D; font-size: 14px;">
                            ${error.message || 'An error occurred while processing your request'}
                        </p>
                        
                        <div style="background: white; border-radius: 8px; padding: 12px; margin-bottom: 16px;">
                            <h4 style="margin: 0 0 8px 0; color: #374151; font-size: 14px; font-weight: 600;">
                                Suggested Solutions:
                            </h4>
                            <ul style="margin: 0; padding-left: 20px; color: #6B7280; font-size: 13px; line-height: 1.6;">
                                ${suggestions.map(s => `<li>${s}</li>`).join('')}
                            </ul>
                        </div>
                        
                        <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                            <button onclick="window.errorRecovery.retry()" 
                                    style="padding: 8px 16px; background: #DC2626; color: white; 
                                           border: none; border-radius: 6px; font-size: 14px; 
                                           font-weight: 500; cursor: pointer;">
                                🔄 Retry
                            </button>
                            
                            <button onclick="window.errorRecovery.useMockData()" 
                                    style="padding: 8px 16px; background: #F59E0B; color: white; 
                                           border: none; border-radius: 6px; font-size: 14px; 
                                           font-weight: 500; cursor: pointer;">
                                📊 Use Mock Data
                            </button>
                            
                            <button onclick="window.errorRecovery.dismissError('${elementId}')" 
                                    style="padding: 8px 16px; background: #6B7280; color: white; 
                                           border: none; border-radius: 6px; font-size: 14px; 
                                           font-weight: 500; cursor: pointer;">
                                ✕ Dismiss
                            </button>
                            
                            ${errorType === 'cors' || errorType === 'network' ? `
                                <button onclick="window.errorRecovery.checkAPIHealth()" 
                                        style="padding: 8px 16px; background: #3B82F6; color: white; 
                                               border: none; border-radius: 6px; font-size: 14px; 
                                               font-weight: 500; cursor: pointer;">
                                    🏥 Check API Health
                                </button>
                            ` : ''}
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Log the error
        this.logError(error, { elementId, errorType });
        
        return container;
    }
    
    // Get error title based on type
    getErrorTitle(errorType) {
        const titles = {
            cors: 'CORS Configuration Error',
            timeout: 'Request Timeout',
            network: 'Network Connection Error',
            auth: 'Authentication Issue',
            notfound: 'Resource Not Found',
            server: 'Server Error',
            unknown: 'Unexpected Error'
        };
        
        return titles[errorType] || 'Error';
    }
    
    // Retry last failed operation
    retry() {
        console.log('[ErrorRecovery] Retrying last operation...');
        
        // Check if propertyAPI has a retry method
        if (window.propertyAPI?.retryLastAction) {
            window.propertyAPI.retryLastAction();
        } else {
            // Fallback to page reload
            window.location.reload();
        }
    }
    
    // Use mock data for testing
    useMockData() {
        console.log('[ErrorRecovery] Loading mock data for testing...');
        
        const mockData = this.getDefaultMockData();
        
        // Show mock data banner
        this.showMockDataBanner();
        
        // Update UI with mock data
        if (window.propertyAPI?.updateMockup) {
            window.propertyAPI.updateMockup(mockData);
        }
        
        // Dismiss any error UI
        this.dismissAllErrors();
        
        return mockData;
    }
    
    // Show mock data banner
    showMockDataBanner() {
        if (document.getElementById('mock-data-banner')) return;
        
        const banner = document.createElement('div');
        banner.id = 'mock-data-banner';
        banner.style.cssText = `
            position: fixed;
            top: 60px;
            left: 50%;
            transform: translateX(-50%);
            background: linear-gradient(135deg, #F59E0B, #D97706);
            color: white;
            padding: 8px 24px;
            font-size: 14px;
            font-weight: 600;
            border-radius: 20px;
            z-index: 97;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        `;
        banner.textContent = '📊 Using Mock Data for Testing';
        
        document.body.appendChild(banner);
    }
    
    // Check API health
    async checkAPIHealth() {
        console.log('[ErrorRecovery] Checking API health...');
        
        const healthChecks = [
            {
                name: 'Railway API',
                url: window.mockupConfig?.getAPIEndpoint('railway', '/health') || 'http://localhost:3001/api/health'
            },
            {
                name: 'Vercel API',
                url: window.mockupConfig?.getAPIEndpoint('vercel', '/health') || 'http://localhost:3000/api/health'
            }
        ];
        
        const results = [];
        
        for (const check of healthChecks) {
            try {
                const response = await fetch(check.url, { 
                    method: 'GET',
                    mode: 'cors',
                    credentials: 'omit'
                });
                
                results.push({
                    name: check.name,
                    url: check.url,
                    status: response.ok ? 'healthy' : 'unhealthy',
                    statusCode: response.status
                });
            } catch (error) {
                results.push({
                    name: check.name,
                    url: check.url,
                    status: 'unreachable',
                    error: error.message
                });
            }
        }
        
        // Show health check results
        this.showHealthCheckResults(results);
        
        return results;
    }
    
    // Show health check results
    showHealthCheckResults(results) {
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: white;
            border-radius: 12px;
            padding: 24px;
            box-shadow: 0 20px 50px rgba(0,0,0,0.2);
            z-index: 98;
            max-width: 400px;
        `;
        
        modal.innerHTML = `
            <h3 style="margin: 0 0 16px 0; font-size: 18px; font-weight: 600;">
                🏥 API Health Check
            </h3>
            
            <div style="space-y: 12px;">
                ${results.map(r => `
                    <div style="padding: 12px; background: ${r.status === 'healthy' ? '#D1FAE5' : '#FEE2E2'}; 
                                border-radius: 8px; margin-bottom: 8px;">
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <span style="font-weight: 600; color: #374151;">${r.name}</span>
                            <span style="font-size: 24px;">
                                ${r.status === 'healthy' ? '✅' : '❌'}
                            </span>
                        </div>
                        <div style="font-size: 12px; color: #6B7280; margin-top: 4px;">
                            ${r.url}
                        </div>
                        ${r.error ? `
                            <div style="font-size: 12px; color: #DC2626; margin-top: 4px;">
                                ${r.error}
                            </div>
                        ` : ''}
                    </div>
                `).join('')}
            </div>
            
            <button onclick="this.parentElement.remove()" 
                    style="width: 100%; margin-top: 16px; padding: 10px; 
                           background: #3B82F6; color: white; border: none; 
                           border-radius: 6px; font-size: 14px; font-weight: 500; 
                           cursor: pointer;">
                Close
            </button>
        `;
        
        document.body.appendChild(modal);
    }
    
    // Dismiss specific error
    dismissError(elementId) {
        const element = document.getElementById(elementId);
        if (element) {
            element.style.animation = 'fadeOut 0.3s ease';
            setTimeout(() => element.remove(), 300);
        }
    }
    
    // Dismiss all errors
    dismissAllErrors() {
        const errorElements = document.querySelectorAll('[id*="error"]');
        errorElements.forEach(el => {
            if (el.id !== 'error-recovery-style') {
                el.remove();
            }
        });
    }
}

// Create global instance
window.errorRecovery = new ErrorRecovery();

// Add global error handler
window.addEventListener('unhandledrejection', event => {
    console.error('[ErrorRecovery] Unhandled promise rejection:', event.reason);
    window.errorRecovery.logError(event.reason, { type: 'unhandledRejection' });
});

// Export for module usage if needed
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ErrorRecovery;
}