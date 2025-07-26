/**
 * Enhanced Error Handler for StarterPackApp
 * Provides user-friendly error messages with troubleshooting guidance
 */

class ErrorHandler {
    constructor() {
        this.errorMappings = {
            // Network errors
            'NetworkError': {
                title: 'Connection Problem',
                message: 'Unable to connect to our servers. Please check your internet connection.',
                troubleshooting: [
                    'Check if you\'re connected to the internet',
                    'Try refreshing the page',
                    'Check if your firewall or VPN is blocking the connection'
                ],
                icon: '🌐'
            },
            'TimeoutError': {
                title: 'Request Timeout',
                message: 'The server took too long to respond. This might be due to high traffic.',
                troubleshooting: [
                    'Wait a few moments and try again',
                    'Check your internet speed',
                    'Try again during off-peak hours'
                ],
                icon: '⏱️'
            },
            
            // Authentication errors
            'auth/invalid-email': {
                title: 'Invalid Email',
                message: 'The email address you entered is not valid.',
                troubleshooting: [
                    'Check for typos in your email address',
                    'Make sure there are no spaces',
                    'Use a valid email format (e.g., user@example.com)'
                ],
                icon: '📧'
            },
            'auth/user-not-found': {
                title: 'Account Not Found',
                message: 'No account exists with this email address.',
                troubleshooting: [
                    'Check if you typed your email correctly',
                    'Try signing up for a new account',
                    'Use the email you registered with'
                ],
                icon: '👤'
            },
            'auth/wrong-password': {
                title: 'Incorrect Password',
                message: 'The password you entered is incorrect.',
                troubleshooting: [
                    'Check if Caps Lock is on',
                    'Try resetting your password',
                    'Make sure you\'re using the correct account'
                ],
                icon: '🔑'
            },
            'auth/too-many-requests': {
                title: 'Too Many Attempts',
                message: 'Access temporarily blocked due to too many failed attempts.',
                troubleshooting: [
                    'Wait 15 minutes before trying again',
                    'Reset your password if you\'ve forgotten it',
                    'Contact support if the issue persists'
                ],
                icon: '🚫'
            },
            
            // API errors
            'api/rate-limit': {
                title: 'Rate Limit Exceeded',
                message: 'You\'ve made too many requests. Please slow down.',
                troubleshooting: [
                    'Wait a few minutes before trying again',
                    'Upgrade to a premium plan for higher limits',
                    'Contact support if you need immediate assistance'
                ],
                icon: '⚡'
            },
            'api/invalid-data': {
                title: 'Invalid Property Data',
                message: 'Some of the property information appears to be incorrect.',
                troubleshooting: [
                    'Check all required fields are filled',
                    'Verify the property address is complete',
                    'Ensure numeric values are entered correctly'
                ],
                icon: '📋'
            },
            'api/analysis-failed': {
                title: 'Analysis Failed',
                message: 'We couldn\'t complete the property analysis.',
                troubleshooting: [
                    'Verify all property details are accurate',
                    'Try analyzing a different property first',
                    'Contact support with the property address'
                ],
                icon: '📊'
            },
            
            // Form validation errors
            'validation/missing-required': {
                title: 'Missing Information',
                message: 'Please fill in all required fields.',
                troubleshooting: [
                    'Look for fields marked with a red asterisk (*)',
                    'Check that all sections are completed',
                    'Review the form for any error messages'
                ],
                icon: '📝'
            },
            'validation/invalid-price': {
                title: 'Invalid Price',
                message: 'The property price doesn\'t appear to be valid.',
                troubleshooting: [
                    'Enter numbers only (no $ or commas)',
                    'Check the price is reasonable for the area',
                    'Verify you haven\'t added extra zeros'
                ],
                icon: '💰'
            },
            
            // Generic errors
            'unknown': {
                title: 'Something Went Wrong',
                message: 'An unexpected error occurred. We\'re working to fix it.',
                troubleshooting: [
                    'Try refreshing the page',
                    'Clear your browser cache',
                    'Try using a different browser'
                ],
                icon: '❌'
            }
        };
        
        this.supportInfo = {
            email: 'support@starterpackapp.com',
            phone: '1-800-STARTER',
            hours: 'Monday-Friday, 9AM-5PM EST',
            responseTime: 'Usually within 24 hours'
        };
    }
    
    /**
     * Get error details based on error code or type
     */
    getErrorDetails(error) {
        // Check for specific error codes
        if (error.code && this.errorMappings[error.code]) {
            return this.errorMappings[error.code];
        }
        
        // Check for error type
        if (error.name && this.errorMappings[error.name]) {
            return this.errorMappings[error.name];
        }
        
        // Check for API errors
        if (error.response?.data?.error) {
            const apiError = error.response.data.error;
            if (this.errorMappings[`api/${apiError}`]) {
                return this.errorMappings[`api/${apiError}`];
            }
        }
        
        // Check for network errors
        if (error.message?.includes('network') || error.message?.includes('Network')) {
            return this.errorMappings['NetworkError'];
        }
        
        if (error.message?.includes('timeout') || error.message?.includes('Timeout')) {
            return this.errorMappings['TimeoutError'];
        }
        
        // Default to unknown error
        return this.errorMappings['unknown'];
    }
    
    /**
     * Display error in the UI
     */
    displayError(error, containerId = 'error-state') {
        const errorDetails = this.getErrorDetails(error);
        const errorContainer = document.getElementById(containerId);
        
        if (!errorContainer) {
            console.error('Error container not found:', containerId);
            return;
        }
        
        // Create error HTML
        const errorHTML = `
            <div class="container mx-auto p-xl">
                <div class="card text-center p-2xl max-w-2xl mx-auto">
                    <!-- Error Icon -->
                    <div class="text-6xl mb-lg animate-bounce-slow">
                        ${errorDetails.icon}
                    </div>
                    
                    <!-- Error Title -->
                    <h2 class="text-2xl font-bold text-gray-900 mb-md">
                        ${errorDetails.title}
                    </h2>
                    
                    <!-- Error Message -->
                    <p class="text-gray-700 mb-xl max-w-md mx-auto">
                        ${errorDetails.message}
                    </p>
                    
                    <!-- Troubleshooting Steps -->
                    <div class="bg-gray-50 rounded-lg p-lg mb-xl text-left max-w-md mx-auto">
                        <h3 class="font-semibold text-gray-900 mb-md flex items-center gap-2">
                            <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
                            </svg>
                            Troubleshooting Steps
                        </h3>
                        <ul class="space-y-2">
                            ${errorDetails.troubleshooting.map(step => `
                                <li class="flex items-start gap-2">
                                    <span class="text-blue-600 mt-1">•</span>
                                    <span class="text-gray-700">${step}</span>
                                </li>
                            `).join('')}
                        </ul>
                    </div>
                    
                    <!-- Action Buttons -->
                    <div class="flex flex-col sm:flex-row gap-md justify-center mb-xl">
                        <button onclick="location.reload()" class="btn btn-primary">
                            Try Again
                        </button>
                        <button onclick="window.history.back()" class="btn btn-secondary">
                            Go Back
                        </button>
                    </div>
                    
                    <!-- Support Section -->
                    <div class="border-t border-gray-200 pt-lg">
                        <h3 class="text-sm font-semibold text-gray-900 mb-sm">
                            Still need help?
                        </h3>
                        <div class="text-sm text-gray-600 space-y-1">
                            <p>
                                Email: <a href="mailto:${this.supportInfo.email}" class="text-blue-600 hover:underline">
                                    ${this.supportInfo.email}
                                </a>
                            </p>
                            <p>
                                Phone: <span class="font-medium">${this.supportInfo.phone}</span>
                            </p>
                            <p class="text-xs text-gray-500 mt-2">
                                ${this.supportInfo.hours} • ${this.supportInfo.responseTime}
                            </p>
                        </div>
                    </div>
                    
                    <!-- Error ID for support -->
                    <div class="mt-lg pt-lg border-t border-gray-200">
                        <p class="text-xs text-gray-500">
                            Error ID: ${this.generateErrorId(error)}
                        </p>
                    </div>
                </div>
            </div>
        `;
        
        // Update container
        errorContainer.innerHTML = errorHTML;
        errorContainer.classList.remove('hidden');
        
        // Hide other sections
        this.hideOtherSections(containerId);
        
        // Log error for debugging
        console.error('Error displayed:', error);
    }
    
    /**
     * Display inline error (for form validation)
     */
    displayInlineError(message, elementId) {
        const element = document.getElementById(elementId);
        if (!element) return;
        
        // Remove existing error
        const existingError = element.parentElement.querySelector('.error-message');
        if (existingError) {
            existingError.remove();
        }
        
        // Add error message
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message text-sm text-red-600 mt-1 flex items-center gap-1';
        errorDiv.innerHTML = `
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <span>${message}</span>
        `;
        element.parentElement.appendChild(errorDiv);
        
        // Add error styling to input
        element.classList.add('border-red-500');
        
        // Remove error after 5 seconds
        setTimeout(() => {
            errorDiv.remove();
            element.classList.remove('border-red-500');
        }, 5000);
    }
    
    /**
     * Generate unique error ID for support
     */
    generateErrorId(error) {
        const timestamp = Date.now();
        const errorCode = error.code || error.name || 'UNKNOWN';
        const random = Math.random().toString(36).substring(2, 8).toUpperCase();
        return `${errorCode}-${timestamp}-${random}`;
    }
    
    /**
     * Hide other sections when displaying error
     */
    hideOtherSections(exceptId) {
        const sections = [
            'loading-state',
            'login-section',
            'property-input-section',
            'results-section'
        ];
        
        sections.forEach(sectionId => {
            if (sectionId !== exceptId) {
                const section = document.getElementById(sectionId);
                if (section) {
                    section.classList.add('hidden');
                }
            }
        });
    }
    
    /**
     * Log error for analytics
     */
    logError(error, context = {}) {
        // Send to analytics service
        if (window.gtag) {
            window.gtag('event', 'exception', {
                description: error.message || error.toString(),
                fatal: false,
                error_code: error.code || 'unknown',
                ...context
            });
        }
        
        // Log to console in development
        if (window.location.hostname === 'localhost') {
            console.error('Error logged:', error, context);
        }
    }
}

// Export for use in other modules
window.ErrorHandler = ErrorHandler;