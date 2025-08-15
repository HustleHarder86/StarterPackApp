/**
 * Mockup Configuration Module
 * Handles environment detection and configuration for mockup testing
 */

class MockupConfig {
    constructor() {
        this.environment = this.detectEnvironment();
        this.config = this.getConfig();
        this.testMode = this.detectTestMode();
        
        console.log('[MockupConfig] Initialized:', {
            environment: this.environment,
            testMode: this.testMode,
            railwayAPI: this.config.railwayAPI,
            vercelAPI: this.config.vercelAPI
        });
    }
    
    detectEnvironment() {
        const hostname = window.location.hostname;
        const urlParams = new URLSearchParams(window.location.search);
        
        // Allow URL param override
        const envOverride = urlParams.get('env');
        if (envOverride === 'dev' || envOverride === 'development') return 'development';
        if (envOverride === 'prod' || envOverride === 'production') return 'production';
        
        // Auto-detect based on hostname
        if (hostname === 'localhost' || hostname === '127.0.0.1') {
            return 'development';
        }
        
        return 'production';
    }
    
    detectTestMode() {
        const urlParams = new URLSearchParams(window.location.search);
        
        // Multiple ways to trigger test mode
        const testTriggers = [
            urlParams.get('test') === 'true',
            urlParams.get('e2e_test_mode') === 'true',
            urlParams.get('testMode') === 'true',
            window.location.search.includes('test=true')
        ];
        
        return testTriggers.some(trigger => trigger);
    }
    
    getConfig() {
        const configs = {
            development: {
                railwayAPI: 'http://localhost:3001/api',
                vercelAPI: 'http://localhost:3000/api',
                appURL: 'http://localhost:3000',
                firebaseConfig: null, // Optional - mockups work without auth
                timeout: 60000, // 60 seconds for local dev
                retryAttempts: 3,
                retryDelay: 1000 // 1 second
            },
            production: {
                railwayAPI: 'https://starterpackapp-production.up.railway.app/api',
                vercelAPI: 'https://starterpackapp.com/api',
                appURL: 'https://starterpackapp.com',
                firebaseConfig: null, // Optional - mockups work without auth
                timeout: 60000, // 60 seconds
                retryAttempts: 3,
                retryDelay: 2000 // 2 seconds
            }
        };
        
        return configs[this.environment] || configs.production;
    }
    
    // Get test user configuration
    getTestUserConfig() {
        return {
            // Hardcoded tester user ID with unlimited access
            testerUserId: 'yBilXCUnWAdqUuJfy2YwXnRz4Xy2',
            // Test email domains
            testDomains: ['@test.com', '@e2e.com', '@starterpackapp.com'],
            // Test headers
            testHeaders: {
                'X-E2E-Test-Mode': 'true',
                'X-Test-Mode': 'true'
            }
        };
    }
    
    // Get API headers including test mode if needed
    getAPIHeaders(additionalHeaders = {}) {
        const headers = {
            'Content-Type': 'application/json',
            ...additionalHeaders
        };
        
        if (this.testMode) {
            headers['X-E2E-Test-Mode'] = 'true';
            console.log('[MockupConfig] Test mode active - adding test headers');
        }
        
        return headers;
    }
    
    // Get the appropriate API endpoint
    getAPIEndpoint(service = 'railway', path = '') {
        const baseURL = service === 'railway' ? this.config.railwayAPI : this.config.vercelAPI;
        return `${baseURL}${path}`;
    }
    
    // Check if running in local development
    isLocalDev() {
        return this.environment === 'development';
    }
    
    // Check if test mode is active
    isTestMode() {
        return this.testMode;
    }
    
    // Display environment banner for clarity
    showEnvironmentBanner() {
        if (this.isLocalDev() || this.isTestMode()) {
            const banner = document.createElement('div');
            banner.id = 'environment-banner';
            banner.style.cssText = `
                position: fixed;
                top: 0;
                left: 50%;
                transform: translateX(-50%);
                background: ${this.isTestMode() ? '#F59E0B' : '#3B82F6'};
                color: white;
                padding: 4px 16px;
                font-size: 12px;
                font-weight: 600;
                border-radius: 0 0 8px 8px;
                z-index: 40;
                font-family: monospace;
            `;
            banner.textContent = this.isTestMode() 
                ? '🧪 TEST MODE ACTIVE' 
                : '🔧 LOCAL DEVELOPMENT';
            
            document.body.appendChild(banner);
        }
    }
    
    // Log configuration for debugging
    logConfig() {
        console.group('🔧 Mockup Configuration');
        console.log('Environment:', this.environment);
        console.log('Test Mode:', this.testMode);
        console.log('Railway API:', this.config.railwayAPI);
        console.log('Vercel API:', this.config.vercelAPI);
        console.log('Timeout:', this.config.timeout + 'ms');
        console.log('Retry Attempts:', this.config.retryAttempts);
        console.groupEnd();
    }
}

// Create global instance
window.mockupConfig = new MockupConfig();

// Show environment banner on load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.mockupConfig.showEnvironmentBanner();
    });
} else {
    window.mockupConfig.showEnvironmentBanner();
}

// Export for module usage if needed
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MockupConfig;
}