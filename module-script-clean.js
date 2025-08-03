        import { FirebaseWrapper } from './js/firebase-wrapper.js';
        import { progressTracker } from './js/modules/analysisProgressTracker.js';
        
        // Initialize Firebase with wrapper
        const firebaseWrapper = new FirebaseWrapper();
        let auth, db;
        
        async function initializeFirebase() {
            let config;
            
            try {
                // Always load config from API - no hardcoded values
                const response = await fetch('/api/config');
                
                if (!response.ok) {
                    const error = await response.json();
                    throw new Error(error.message || 'Failed to load configuration');
                }
                
                config = await response.json();
                
                // Validate required Firebase config
                if (!config.firebase || !config.firebase.apiKey || !config.firebase.projectId) {
                    throw new Error('Invalid Firebase configuration received from server');
                }
                
                // Initialize Firebase
                firebase.initializeApp(config.firebase);
                auth = firebase.auth();
                db = firebase.firestore();
                
                // Enable persistence for offline support
                await auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);
                
                console.log('Firebase initialized successfully with project:', config.firebase.projectId);
                return true;
                
            } catch (error) {
                console.error('Failed to initialize Firebase:', error);
                
                // Use wrapper with mock fallback
                console.warn('Using Firebase wrapper with mock fallback');
                await firebaseWrapper.initialize({});
                auth = firebaseWrapper.getAuth();
                db = firebaseWrapper.getDb();
                
                // Show error message only in production
                if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
                    const warning = document.createElement('div');
                    warning.className = 'fixed top-0 left-0 right-0 bg-red-100 border-b border-red-400 text-red-700 px-4 py-3 text-center';
                    warning.innerHTML = `Firebase configuration error: ${error.message}. Please contact support.`;
                    document.body.prepend(warning);
                } else {
                    // Development mode - show a less intrusive warning
                    const devWarning = document.createElement('div');
                    devWarning.className = 'fixed bottom-4 right-4 bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-2 rounded-lg shadow-lg text-sm max-w-sm';
                    devWarning.innerHTML = `⚠️ Development Mode: Firebase API unavailable, using mock data`;
                    document.body.appendChild(devWarning);
                    
                    // Auto-hide after 5 seconds
                    setTimeout(() => devWarning.remove(), 5000);
                }
                
                return true;
            }
        }
        
        // Initialize on DOM ready
        document.addEventListener('DOMContentLoaded', async () => {
            await initializeFirebase();
            // Start the app after Firebase is initialized
            if (window.startApp) {
                window.startApp();
            }
        });
        
        // Load configuration
        const configScript = document.createElement('script');
        configScript.src = 'js/config.js';
        document.head.appendChild(configScript);
        
        // Global application state
        window.appState = {
            currentUser: null,
            currentAnalysis: null,
            isLoading: false,
            isMobile: window.innerWidth <= 640,
            loadingState: null,
            currentAnalysisController: null,
            lastPropertyData: null,
            lastAnalysisType: null
        };
        
        // Initialize component loader with Compact Modern design
        let componentLoader;
        
        // Function to initialize component loader when ready
        function initializeComponentLoader() {
            if (typeof ComponentLoaderCompactModern !== 'undefined') {
                componentLoader = new ComponentLoaderCompactModern();
                window.componentLoader = componentLoader;
                console.log('[INIT] Component loader initialized');
                return true;
            }
            return false;
        }
        
        // Try to initialize immediately, or wait for it
        if (!initializeComponentLoader()) {
            // Wait for ComponentLoaderCompactModern to be available
            const checkInterval = setInterval(() => {
                if (initializeComponentLoader()) {
                    clearInterval(checkInterval);
                }
            }, 100);
        }
        
        // Application initialization
        class ROIFinderApp {
            constructor() {
                this.init();
            }
            
            async init() {
                try {
                    this.attachEventListeners();
                } catch (error) {
                    console.error('Error attaching event listeners:', error);
                    // Continue initialization even if some event listeners fail
                }
                this.checkAuthState();
                this.handleUrlParameters();
                this.optimizeForMobile();
                this.initializeFormValidation();
            }
            
            checkAuthState() {
                // E2E Test Bypass: Check for test mode parameter
                const urlParams = new URLSearchParams(window.location.search);
                const isTestMode = urlParams.get('e2e_test_mode') === 'true';
                
                if (isTestMode) {
                    console.log('🧪 E2E Test Mode Activated - Bypassing Authentication');
                    
                    // Create a mock user for testing
                    window.appState.currentUser = {
                        uid: 'test-user-e2e',
                        email: 'test@e2e.com',
                        displayName: 'E2E Test User'
                    };
                    
                    // Set mock user data
                    window.appState.userData = {
                        subscriptionTier: 'starter',
                        strTrialUsed: 0,
                        portfolio: []
                    };
                    
                    // Update UI
                    document.getElementById('user-email').textContent = 'test@e2e.com';
                    
                    // Handle extension data if present
                    if (urlParams.get('fromExtension') === 'true' && urlParams.get('autoAnalyze') === 'true') {
                        setTimeout(() => this.handleExtensionData(), 100);
                    } else {
                        this.showAppropriateView();
                    }
                    
                    return;
                }
                
                // Normal authentication flow
                auth.onAuthStateChanged(async (user) => {
                    if (user) {
                        window.appState.currentUser = user;
                        document.getElementById('user-email').textContent = user.email;
                        await this.loadUserData();
                        
                        // If coming from extension with autoAnalyze, handle it
                        const urlParams = new URLSearchParams(window.location.search);
                        if (urlParams.get('fromExtension') === 'true' && urlParams.get('autoAnalyze') === 'true') {
                            this.handleExtensionData();
                        } else {
                            this.showAppropriateView();
                        }
                    } else {
                        // Check if user is coming from extension
                        const urlParams = new URLSearchParams(window.location.search);
                        if (urlParams.get('fromExtension') === 'true') {
                            // Store the current URL to redirect back after login
                            sessionStorage.setItem('redirectAfterLogin', window.location.href);
                        }
                        // In development mode, show property form even without auth
                        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
                            console.log('Development mode: Showing property form without authentication');
                            // Create mock user for development
                            window.appState.currentUser = {
                                uid: 'dev-user-local',
                                email: 'dev@localhost',
                                displayName: 'Local Developer',
                                getIdToken: async () => 'dev-token-123'
                            };
                            this.showPropertyInput();
                        } else {
                            this.showLoginForm();
                        }
                    }
                });
            }
            
            async loadUserData() {
                try {
                    const userDoc = await db.collection('users').doc(window.appState.currentUser.uid).get();
                    if (userDoc.exists) {
                        window.appState.userData = userDoc.data();
                    }
                } catch (error) {
                    console.error('Error loading user data:', error);
                }
            }
            
            handleUrlParameters() {
                // Only handle non-extension URLs here
                const urlParams = new URLSearchParams(window.location.search);
                
                if (urlParams.get('fromExtension') === 'true') {
                    // Extension data will be handled after authentication
                    return;
                }
                
                // Check if E2E test mode with data
                const isTestMode = urlParams.get('e2e_test_mode') === 'true';
                if (isTestMode && urlParams.get('street')) {
                    // Show property input with pre-filled data
                    this.showPropertyInput();
                    // Pre-fill form after showing it
                    setTimeout(() => this.prefillFormFromUrlParams(), 100);
                    return;
                }
                
                const analysisId = urlParams.get('analysis');
                const propertyData = urlParams.get('property');
                
                if (analysisId) {
                    this.loadExistingAnalysis(analysisId);
                } else if (propertyData) {
                    this.loadPropertyFromExtension(propertyData);
                } else {
                    this.showPropertyInput();
                }
            }
            
            prefillFormFromUrlParams() {
                try {
                    const urlParams = new URLSearchParams(window.location.search);
                    
                    // Sanitize function for text inputs
                    const sanitizeInput = (input) => {
                        if (!input) return '';
                        // Use DOMPurify if available, otherwise basic sanitization
                        if (window.DOMPurify) {
                            return DOMPurify.sanitize(input, { ALLOWED_TAGS: [] });
                        }
                        // Basic sanitization: remove HTML tags and limit length
                        return input.toString().replace(/<[^>]*>/g, '').substring(0, 200);
                    };
                    
                    // Build address from components with sanitization
                    const addressParts = [];
                    if (urlParams.get('street')) addressParts.push(sanitizeInput(urlParams.get('street')));
                    if (urlParams.get('city')) addressParts.push(sanitizeInput(urlParams.get('city')));
                    if (urlParams.get('state')) addressParts.push(sanitizeInput(urlParams.get('state')));
                    if (urlParams.get('postal')) addressParts.push(sanitizeInput(urlParams.get('postal')));
                    
                    const fullAddress = addressParts.join(', ');
                
                    // Sanitize numeric inputs
                    const sanitizeNumber = (value, min = 0, max = 999999999) => {
                        const num = parseFloat(value);
                        if (isNaN(num)) return '';
                        return Math.max(min, Math.min(max, num)).toString();
                    };
                    
                    // Cache form elements for efficiency
                    const formElements = {
                        address: document.getElementById('property-address'),
                        price: document.getElementById('property-price'),
                        bedrooms: document.getElementById('property-bedrooms'),
                        bathrooms: document.getElementById('property-bathrooms'),
                        sqft: document.getElementById('property-sqft'),
                        propertyType: document.getElementById('property-type'),
                        taxes: document.getElementById('property-taxes'),
                        condoFees: document.getElementById('property-condofees')
                    };
                    
                    // Pre-fill form fields with sanitized values
                    if (formElements.address && fullAddress) {
                        formElements.address.value = fullAddress;
                    }
                    
                    if (formElements.price && urlParams.get('price')) {
                        formElements.price.value = sanitizeNumber(urlParams.get('price'), 0, 100000000);
                    }
                    
                    if (formElements.bedrooms && urlParams.get('bedrooms')) {
                        formElements.bedrooms.value = sanitizeNumber(urlParams.get('bedrooms'), 0, 20);
                    }
                    
                    if (formElements.bathrooms && urlParams.get('bathrooms')) {
                        formElements.bathrooms.value = sanitizeNumber(urlParams.get('bathrooms'), 0, 20);
                    }
                    
                    if (formElements.sqft && urlParams.get('sqft')) {
                        formElements.sqft.value = sanitizeNumber(urlParams.get('sqft'), 0, 50000);
                    }
                    
                    // Sanitize property type against allowed values
                    if (formElements.propertyType && urlParams.get('propertyType')) {
                        const allowedTypes = ['House', 'Condo', 'Townhouse', 'Multi-family'];
                        const type = sanitizeInput(urlParams.get('propertyType'));
                        if (allowedTypes.includes(type)) {
                            formElements.propertyType.value = type;
                        }
                    }
                    
                    if (formElements.taxes && urlParams.get('taxes')) {
                        formElements.taxes.value = sanitizeNumber(urlParams.get('taxes'), 0, 100000);
                    }
                    
                    if (formElements.condoFees && urlParams.get('condoFees')) {
                        formElements.condoFees.value = sanitizeNumber(urlParams.get('condoFees'), 0, 10000);
                    }
                    
                    console.log('✅ Form pre-filled from URL parameters');
                } catch (error) {
                    console.error('Error pre-filling form:', error);
                    // Continue without pre-filling on error
                }
            }
            
            handleExtensionData() {
                const urlParams = new URLSearchParams(window.location.search);
                
                // Build property data from URL parameters
                const propertyData = {
                    address: {},
                    price: null,
                    bedrooms: null,
                    bathrooms: null,
                    sqft: null,
                    propertyType: null,
                    yearBuilt: null,
                    propertyTaxes: null,
                    condoFees: null,
                    mlsNumber: null,
                    mainImage: null
                };
                
                // Address components
                if (urlParams.get('street')) propertyData.address.street = urlParams.get('street');
                if (urlParams.get('city')) propertyData.address.city = urlParams.get('city');
                if (urlParams.get('state')) propertyData.address.province = urlParams.get('state');
                if (urlParams.get('country')) propertyData.address.country = urlParams.get('country');
                if (urlParams.get('postal')) propertyData.address.postalCode = urlParams.get('postal');
                
                // Property details
                if (urlParams.get('price')) propertyData.price = parseFloat(urlParams.get('price'));
                if (urlParams.get('bedrooms')) propertyData.bedrooms = parseInt(urlParams.get('bedrooms'));
                if (urlParams.get('bathrooms')) propertyData.bathrooms = parseFloat(urlParams.get('bathrooms'));
                if (urlParams.get('sqft')) propertyData.sqft = parseInt(urlParams.get('sqft'));
                if (urlParams.get('propertyType')) propertyData.propertyType = urlParams.get('propertyType');
                if (urlParams.get('yearBuilt')) propertyData.yearBuilt = parseInt(urlParams.get('yearBuilt'));
                if (urlParams.get('taxes')) propertyData.propertyTaxes = parseFloat(urlParams.get('taxes'));
                if (urlParams.get('condoFees')) propertyData.condoFees = parseFloat(urlParams.get('condoFees'));
                if (urlParams.get('mlsNumber')) propertyData.mlsNumber = urlParams.get('mlsNumber');
                if (urlParams.get('image')) propertyData.mainImage = urlParams.get('image');
                
                // Build full address string
                const addressParts = [];
                if (propertyData.address.street) addressParts.push(propertyData.address.street);
                if (propertyData.address.city) addressParts.push(propertyData.address.city);
                if (propertyData.address.province) addressParts.push(propertyData.address.province);
                if (propertyData.address.postalCode) addressParts.push(propertyData.address.postalCode);
                propertyData.address = addressParts.join(', ');
                
                // Show property confirmation screen instead of auto-analyzing
                this.showPropertyConfirmation(propertyData);
            }
            
            async loadExistingAnalysis(analysisId) {
                this.showLoading('Loading saved analysis...');
                
                try {
                    const analysisDoc = await db.collection('analyses').doc(analysisId).get();
                    if (analysisDoc.exists) {
                        let analysisData = analysisDoc.data();
                        
                        // Apply the same data mapping as in analyzeProperty
                        analysisData = this.mapAnalysisData(analysisData);
                        
                        window.appState.currentAnalysis = analysisData;
                        // Also set window.analysisData for compatibility with showAllComparables
                        window.analysisData = analysisData;
                        await this.renderAnalysisResults(analysisData);
                    } else {
                        this.showError('Analysis not found');
                    }
                } catch (error) {
                    console.error('Error loading analysis:', error);
                    this.showError('Failed to load analysis', error);
                }
            }
            
            loadPropertyFromExtension(propertyDataString) {
                try {
                    const propertyData = JSON.parse(decodeURIComponent(propertyDataString));
                    this.analyzeProperty(propertyData);
                } catch (error) {
                    console.error('Error parsing property data:', error);
                    this.showPropertyInput();
                }
            }
            
            showAppropriateView() {
                if (window.appState.currentAnalysis) {
                    // Ensure data mapping is applied
                    window.appState.currentAnalysis = this.mapAnalysisData(window.appState.currentAnalysis);
                    this.renderAnalysisResults(window.appState.currentAnalysis);
                } else {
                    this.showPropertyInput();
                }
            }
            
            async showLoading(message = 'Loading...') {
                this.hideAllViews();
                const loadingContainer = document.getElementById('loading-state');
                loadingContainer.classList.remove('hidden');
                
                // Use enhanced loading state for analysis
                if (message.includes('Analyzing')) {
                    try {
                        const { AnalysisLoadingState } = await import('./components/ui/AnalysisLoadingState.js');
                        
                        // Create and store the loading state instance
                        window.appState.loadingState = new AnalysisLoadingState(loadingContainer, {
                            timeout: 300000, // 5 minutes for debug mode
                            onCancel: () => {
                                // Cancel the current analysis request if possible
                                if (window.appState.currentAnalysisController) {
                                    window.appState.currentAnalysisController.abort();
                                }
                                this.showPropertyInput();
                            },
                            onTimeout: () => {
                                console.error('Analysis timed out after 5 minutes');
                            },
                            onRetry: () => {
                                // Retry the last analysis
                                if (window.appState.lastPropertyData) {
                                    this.analyzeProperty(window.appState.lastPropertyData, window.appState.lastAnalysisType);
                                } else {
                                    this.showPropertyInput();
                                }
                            }
                        });
                        
                        window.appState.loadingState.render();
                        
                        // Subscribe to progress updates
                        window.appState.progressUnsubscribe = progressTracker.subscribe((update) => {
                            if (window.appState.loadingState) {
                                window.appState.loadingState.updateProgress(update.progress);
                            }
                        });
                        
                        // Start simulated progress (will be replaced by real progress from server)
                        progressTracker.simulateProgress(35000);
                    } catch (error) {
                        console.error('Failed to load enhanced loading state:', error);
                        // Fallback to simple loading
                        document.querySelector('#loading-state h2').textContent = message;
                    }
                } else {
                    document.querySelector('#loading-state h2').textContent = message;
                }
                
                window.appState.isLoading = true;
            }
            
            showPropertyInput() {
                this.hideAllViews();
                document.getElementById('property-input-section').classList.remove('hidden');
                window.appState.isLoading = false;
                
                // Dispatch custom event for navigation protection
                window.dispatchEvent(new Event('analysisClosed'));
            }
            
            showError(message, error = null) {
                this.hideAllViews();
                window.appState.isLoading = false;
                
                // Use enhanced error handler if available
                if (window.ErrorHandler) {
                    const errorHandler = new ErrorHandler();
                    
                    // Create error object if only message provided
                    if (!error) {
                        error = new Error(message);
                        // Try to determine error type from message
                        if (message.includes('not found')) {
                            error.code = 'auth/user-not-found';
                        } else if (message.includes('timeout') || message.includes('taking longer')) {
                            error.name = 'TimeoutError';
                        } else if (message.includes('connection') || message.includes('fetch')) {
                            error.name = 'NetworkError';
                        } else if (message.includes('analyze property')) {
                            error.code = 'api/analysis-failed';
                        }
                    }
                    
                    errorHandler.displayError(error, 'error-state');
                    errorHandler.logError(error, { context: 'ROIFinderApp' });
                } else {
                    // Fallback to simple error display
                    document.getElementById('error-state').classList.remove('hidden');
                    document.querySelector('#error-state p').textContent = message;
                }
            }
            
            showLoginForm() {
                this.hideAllViews();
                document.getElementById('login-section').classList.remove('hidden');
            }
            
            hideAllViews() {
                ['loading-state', 'login-section', 'property-input-section', 'property-confirmation', 'analysis-results', 'error-state'].forEach(id => {
                    const element = document.getElementById(id);
                    if (element) element.classList.add('hidden');
                });
            }
            
            async pollForSTRResults(analysisId) {
                const maxAttempts = 60; // Poll for up to 5 minutes
                const pollInterval = 5000; // Check every 5 seconds
                let attempts = 0;
                
                const pollTimer = setInterval(async () => {
                    attempts++;
                    
                    try {
                        const response = await fetch(`/api/check-str-status?analysisId=${analysisId}`, {
                            headers: {
                                'Authorization': `Bearer ${await window.appState.currentUser.getIdToken()}`
                            }
                        });
                        
                        if (!response.ok) {
                            console.error('Failed to check STR status:', response.status);
                            if (attempts >= maxAttempts) {
                                clearInterval(pollTimer);
                                this.showSTRTimeout();
                            }
                            return;
                        }
                        
                        const result = await response.json();
                        
                        if (result.status === 'completed' && result.strData) {
                            clearInterval(pollTimer);
                            console.log('STR analysis completed, updating UI...');
                            
                            // Update the analysis data with STR results
                            if (window.appState.currentAnalysis) {
                                window.appState.currentAnalysis.strAnalysis = result.strData;
                                window.appState.currentAnalysis.strPending = false;
                                window.analysisData = window.appState.currentAnalysis;
                                
                                // Update the STR tab if it's currently visible
                                await this.updateSTRTabData(result.strData);
                            }
                        } else if (result.status === 'failed') {
                            clearInterval(pollTimer);
                            console.error('STR analysis failed:', result.error);
                            this.showSTRError(result.error);
                        } else if (attempts >= maxAttempts) {
                            clearInterval(pollTimer);
                            this.showSTRTimeout();
                        }
                    } catch (error) {
                        console.error('Error polling for STR results:', error);
                        if (attempts >= maxAttempts) {
                            clearInterval(pollTimer);
                            this.showSTRTimeout();
                        }
                    }
                }, pollInterval);
                
                // Store timer reference for cleanup
                window.appState.strPollTimer = pollTimer;
            }
            
            async updateSTRTabData(strData) {
                // Check if STR tab is currently active
                const activeTab = document.querySelector('[data-tab].active');
                if (activeTab && activeTab.dataset.tab === 'str') {
                    // Re-render the STR tab with new data
                    const tabContent = document.getElementById('str-content');
                    if (tabContent) {
                        tabContent.innerHTML = `
                            <div class="text-center py-4">
                                <div class="text-green-600 mb-2">✓ STR Analysis Complete!</div>
                                <div class="text-sm text-gray-600">Updating display...</div>
                            </div>
                        `;
                        
                        // Small delay for visual feedback
                        await new Promise(resolve => setTimeout(resolve, 500));
                        
                        // Re-render with actual data
                        await this.renderAnalysisResults(window.appState.currentAnalysis);
                    }
                } else {
                    // Just show a notification that STR data is ready
                    const notification = document.createElement('div');
                    notification.className = 'fixed bottom-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
                    notification.innerHTML = '✓ Short-term rental analysis complete!';
                    document.body.appendChild(notification);
                    
                    setTimeout(() => {
                        notification.remove();
                    }, 5000);
                }
            }
            
            showSTRTimeout() {
                const strTab = document.getElementById('str-content');
                if (strTab) {
                    strTab.innerHTML = `
                        <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
                            <h3 class="text-lg font-semibold text-yellow-900 mb-2">STR Analysis Taking Longer Than Expected</h3>
                            <p class="text-yellow-700 mb-4">The Airbnb market analysis is taking longer than usual. This can happen in busy markets.</p>
                            <button onclick="window.app && window.app.retrySTRAnalysis()" class="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">
                                Retry Analysis
                            </button>
                        </div>
                    `;
                }
            }
            
            showSTRError(error) {
                const strTab = document.getElementById('str-content');
                if (strTab) {
                    strTab.innerHTML = `
                        <div class="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
                            <h3 class="text-lg font-semibold text-red-900 mb-2">STR Analysis Failed</h3>
                            <p class="text-red-700 mb-4">${error || 'Unable to retrieve Airbnb market data at this time.'}</p>
                            <button onclick="window.app && window.app.retrySTRAnalysis()" class="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">
                                Retry Analysis
                            </button>
                        </div>
                    `;
                }
            }
            
            async retrySTRAnalysis() {
                // Implement retry logic for STR only
                console.log('Retrying STR analysis...');
                // This would need to be implemented on the backend
            }
            
            async analyzeProperty(propertyData, analysisType = 'both') {
                // Store for retry functionality
                window.appState.lastPropertyData = propertyData;
                window.appState.lastAnalysisType = analysisType;
                
                this.showLoading('Analyzing property...');
                
                try {
                    // Create an AbortController for cancellation
                    window.appState.currentAnalysisController = new AbortController();
                    
                    // Use Vercel API endpoint which will proxy to Railway
                    const apiUrl = '/api/analyze-property';
                    
                    // Check if in E2E test mode
                    const urlParams = new URLSearchParams(window.location.search);
                    const isTestMode = urlParams.get('e2e_test_mode') === 'true';
                    
                    // Build headers - handle test mode differently
                    const headers = {
                        'Content-Type': 'application/json'
                    };
                    
                    // In test mode, use a test token. In production, use real auth
                    if (isTestMode) {
                        headers['Authorization'] = 'Bearer e2e-test-token';
                        headers['X-E2E-Test-Mode'] = 'true';
                    } else {
                        headers['Authorization'] = `Bearer ${await window.appState.currentUser.getIdToken()}`;
                    }
                    
                    // Set timeout from configuration
                    const analysisTimeout = window.TIMEOUTS?.ANALYSIS_REQUEST || 300000; // Default to 5 minutes
                    const timeoutId = setTimeout(() => {
                        window.appState.currentAnalysisController.abort();
                    }, analysisTimeout);
                    
                    const response = await fetch(apiUrl, {
                        method: 'POST',
                        headers: headers,
                        body: JSON.stringify({
                            propertyAddress: propertyData.address, // Required by API
                            propertyData: propertyData,
                            requestType: isTestMode ? 'e2e-test' : 'authenticated',
                            analysisType: analysisType,
                            includeStrAnalysis: analysisType === 'both' || analysisType === 'str',
                            isE2ETest: isTestMode,
                            userId: isTestMode ? 'test-user-id' : window.appState.currentUser?.uid,
                            userEmail: isTestMode ? 'test@e2e.com' : window.appState.currentUser?.email,
                            userName: isTestMode ? 'Test User' : window.appState.currentUser?.displayName
                        }),
                        signal: window.appState.currentAnalysisController.signal
                    });
                    
                    // Clear timeout if request completes
                    clearTimeout(timeoutId);
                    
                    if (!response.ok) {
                        throw new Error(`Analysis failed: ${response.statusText}`);
                    }
                    
                    const result = await response.json();
                    let analysisData = result.data || result;
                    
                    // Apply data mapping
                    analysisData = this.mapAnalysisData(analysisData);
                    
                    console.log('Transformed analysis data:', analysisData);
                    
                    // Store analysis type in the data
                    analysisData.analysisType = analysisType;
                    
                    window.appState.currentAnalysis = analysisData;
                    // Also set window.analysisData for compatibility with showAllComparables
                    window.analysisData = analysisData;
                    
                    // No need for polling with 5-minute timeout
                    
                    // Complete the loading state
                    if (window.appState.loadingState) {
                        progressTracker.updateStep('complete');
                        window.appState.loadingState.complete();
                        // Small delay to show completion before transitioning
                        await new Promise(resolve => setTimeout(resolve, 500));
                        window.appState.loadingState.destroy();
                        window.appState.loadingState = null;
                    }
                    
                    // Unsubscribe from progress updates
                    if (window.appState.progressUnsubscribe) {
                        window.appState.progressUnsubscribe();
                        window.appState.progressUnsubscribe = null;
                    }
                    
                    await this.renderAnalysisResults(analysisData);
                    
                } catch (error) {
                    // Clean up loading state
                    if (window.appState.loadingState) {
                        window.appState.loadingState.destroy();
                        window.appState.loadingState = null;
                    }
                    
                    // Unsubscribe from progress updates
                    if (window.appState.progressUnsubscribe) {
                        window.appState.progressUnsubscribe();
                        window.appState.progressUnsubscribe = null;
                    }
                    
                    if (error.name === 'AbortError') {
                        console.log('Analysis was cancelled or timed out');
                        error.name = 'TimeoutError';
                        this.showError('Analysis is taking longer than expected. This can happen with complex properties. Please try again or contact support if the issue persists.', error);
                        return;
                    }
                    
                    // Check for connection reset error
                    if (error.message.includes('Failed to fetch') || error.message.includes('ERR_CONNECTION_RESET')) {
                        console.error('Connection error:', error);
                        error.name = 'NetworkError';
                        this.showError('Connection lost while analyzing property. The analysis may have completed successfully. Please refresh the page and check your analysis history, or try again.', error);
                        return;
                    }
                    
                    console.error('Analysis error:', error);
                    error.code = 'api/analysis-failed';
                    this.showError(`Failed to analyze property: ${error.message}. Please try again.`, error);
                } finally {
                    // Clean up controller
                    window.appState.currentAnalysisController = null;
                }
            }
            
            async renderAnalysisResults(analysisData) {
                this.hideAllViews();
                const resultsContainer = document.getElementById('analysis-results');
                resultsContainer.classList.remove('hidden');
                
                if (window.appState.isMobile) {
                    await componentLoader.renderMobileAnalysis(analysisData, resultsContainer);
                } else {
                    await componentLoader.renderAnalysisResults(analysisData, resultsContainer);
                }
                
                window.appState.isLoading = false;
                
                // Dispatch custom event for navigation protection
                window.dispatchEvent(new Event('analysisLoaded'));
            }
            
            async showPropertyConfirmation(propertyData) {
                this.hideAllViews();
                const confirmationContainer = document.getElementById('property-confirmation');
                confirmationContainer.classList.remove('hidden');
                
                // Load and render the PropertyConfirmation component
                try {
                    const { PropertyConfirmation } = await import('./components/PropertyConfirmation.js');
                    
                    const component = PropertyConfirmation(
                        propertyData,
                        (analysisType) => {
                            // onConfirm with selected analysis type
                            this.analyzeProperty(propertyData, analysisType);
                        },
                        () => {
                            // onCancel
                            this.showPropertyInput();
                            // Clear URL parameters
                            const url = new URL(window.location);
                            url.search = '';
                            window.history.replaceState({}, '', url);
                        }
                    );
                    
                    // Render the component
                    confirmationContainer.innerHTML = component.html;
                    
                    // Get user data for trial count
                    const userData = window.appState.userData ? {
                        isPremium: window.appState.userData.subscriptionTier === 'premium' || 
                                   window.appState.userData.subscriptionTier === 'pro' || 
                                   window.appState.userData.subscriptionTier === 'enterprise',
                        strTrialUsed: window.appState.userData.strTrialUsed || 0,
                        role: window.appState.userData.role,
                        isAdmin: window.appState.userData.isAdmin
                    } : null;
                    
                    // Setup event listeners with user data
                    component.setup(userData);
                    
                } catch (error) {
                    console.error('Failed to load PropertyConfirmation component:', error);
                    // Fallback: analyze directly
                    this.analyzeProperty(propertyData);
                }
            }
            
            optimizeForMobile() {
                // Add mobile-specific optimizations
                if (window.appState.isMobile) {
                    document.body.classList.add('mobile-optimized');
                }
                
                // Handle orientation changes
                window.addEventListener('orientationchange', () => {
                    setTimeout(() => {
                        window.appState.isMobile = window.innerWidth <= 640;
                        if (window.appState.currentAnalysis) {
                            this.renderAnalysisResults(window.appState.currentAnalysis);
                        }
                    }, 100);
                });
            }
            
            initializeFormValidation() {
                // Initialize form validation if available
                if (window.FormValidator) {
                    const validator = new FormValidator();
                    
                    // Attach to property analysis form
                    validator.attachToForm('property-analysis-form');
                    
                    // Set form submission handler
                    const form = document.getElementById('property-analysis-form');
                    if (form) {
                        form.onValidSubmit = () => {
                            // Form is valid, proceed with analysis
                            const formData = new FormData(form);
                            const propertyData = Object.fromEntries(formData);
                            const analysisType = document.querySelector('input[name="analysis-type"]:checked')?.value || 'both';
                            this.analyzeProperty(propertyData, analysisType);
                        };
                    }
                    
                    // Also attach to login/signup forms
                    validator.attachToForm('login-form');
                    validator.attachToForm('signup-form');
                }
            }
            
            mapAnalysisData(analysisData) {
                // Map API response fields to frontend expectations
                if (analysisData.short_term_rental) {
                    analysisData.strAnalysis = analysisData.short_term_rental;
                    
                    // Ensure proper field mapping for comparables
                    if (analysisData.strAnalysis.comparables) {
                        analysisData.strAnalysis.comparables = analysisData.strAnalysis.comparables.map(comp => ({
                            ...comp,
                            nightly_rate: comp.nightlyRate || comp.nightly_rate || comp.price,
                            occupancy_rate: comp.occupancyRate || comp.occupancy_rate || 0.70,
                            monthly_revenue: comp.monthlyRevenue || comp.monthly_revenue || 0,
                            area: comp.area || comp.neighborhood || 'Local Area'
                        }));
                    }
                    
                    // Map top-level STR fields
                    if (analysisData.strAnalysis.daily_rate !== undefined) {
                        analysisData.strAnalysis.avgNightlyRate = analysisData.strAnalysis.daily_rate;
                        analysisData.strAnalysis.nightlyRate = analysisData.strAnalysis.daily_rate;
                    }
                    if (analysisData.strAnalysis.occupancy_rate !== undefined) {
                        analysisData.strAnalysis.occupancyRate = analysisData.strAnalysis.occupancy_rate * 100; // Convert to percentage
                    }
                    if (analysisData.strAnalysis.annual_revenue !== undefined) {
                        analysisData.strAnalysis.monthlyRevenue = Math.round(analysisData.strAnalysis.annual_revenue / 12);
                    }
                }
                
                // Map long-term rental data
                if (analysisData.long_term_rental) {
                    analysisData.longTermRental = analysisData.long_term_rental;
                    
                    // Map LTR fields
                    if (analysisData.longTermRental.monthly_rent !== undefined) {
                        analysisData.longTermRental.monthlyRent = analysisData.longTermRental.monthly_rent;
                    }
                    if (analysisData.longTermRental.annual_profit !== undefined) {
                        analysisData.longTermRental.cashFlow = Math.round(analysisData.longTermRental.annual_profit / 12);
                    }
                    if (analysisData.longTermRental.annual_revenue !== undefined && analysisData.property_details?.estimated_value) {
                        analysisData.longTermRental.roi = (analysisData.longTermRental.annual_profit / analysisData.property_details.estimated_value) * 100;
                    }
                }
                
                // Map property data if needed
                if (analysisData.property_data && !analysisData.propertyData) {
                    analysisData.propertyData = {
                        ...analysisData.property_data,
                        // Ensure mainImage is mapped correctly
                        mainImage: analysisData.property_data.mainImage || analysisData.property_data.image || analysisData.property_data.imageUrl
                    };
                } else if (analysisData.property_details && !analysisData.propertyData) {
                    analysisData.propertyData = {
                        ...analysisData.property_details,
                        price: analysisData.property_details.estimated_value,
                        address: analysisData.propertyAddress || analysisData.property_address,
                        propertyTaxes: analysisData.costs?.property_tax_annual,
                        condoFees: analysisData.costs?.hoa_monthly
                    };
                }
                
                return analysisData;
            }
            
            attachEventListeners() {
                // Property analysis form
                const propertyForm = document.getElementById('property-analysis-form');
                if (propertyForm) {
                    propertyForm.addEventListener('submit', (e) => {
                    e.preventDefault();
                    const formData = new FormData(e.target);
                    const propertyData = {
                        address: document.getElementById('property-address').value.trim(),
                        price: parseFloat(document.getElementById('property-price').value),
                        bedrooms: parseInt(document.getElementById('property-bedrooms').value),
                        bathrooms: parseFloat(document.getElementById('property-bathrooms').value)
                    };
                    
                    // Add optional fields if provided
                    const sqft = document.getElementById('property-sqft').value;
                    if (sqft) propertyData.sqft = parseInt(sqft);
                    
                    const taxes = document.getElementById('property-taxes').value;
                    if (taxes) propertyData.propertyTaxes = parseFloat(taxes);
                    
                    const condoFees = document.getElementById('property-condofees').value;
                    if (condoFees) propertyData.condoFees = parseFloat(condoFees);
                    
                    const propertyType = document.getElementById('property-type').value;
                    if (propertyType) propertyData.propertyType = propertyType;
                    
                    this.analyzeProperty(propertyData);
                });
                
                // Helper function to show authentication feedback
                const showAuthFeedback = (type, message) => {
                    const feedbackContainer = document.getElementById('auth-feedback');
                    const successDiv = document.getElementById('auth-success');
                    const errorDiv = document.getElementById('auth-error');
                    const errorMessage = document.getElementById('auth-error-message');
                    
                    // Hide all feedback first
                    feedbackContainer.classList.add('hidden');
                    successDiv.classList.add('hidden');
                    errorDiv.classList.add('hidden');
                    
                    // Show appropriate feedback
                    feedbackContainer.classList.remove('hidden');
                    if (type === 'success') {
                        successDiv.classList.remove('hidden');
                    } else {
                        errorDiv.classList.remove('hidden');
                        errorMessage.textContent = message;
                    }
                    
                    // Auto-hide after 5 seconds
                    setTimeout(() => {
                        feedbackContainer.classList.add('hidden');
                    }, 5000);
                };
                }

                // Password validation helper
                const validatePassword = (password) => {
                    const requirements = {
                        length: password.length >= 6,
                        uppercase: /[A-Z]/.test(password),
                        lowercase: /[a-z]/.test(password),
                        number: /\d/.test(password)
                    };
                    
                    // Update UI indicators
                    document.getElementById('password-length').className = requirements.length ? 'text-green-600' : 'text-gray-500';
                    document.getElementById('password-uppercase').className = requirements.uppercase ? 'text-green-600' : 'text-gray-500';
                    document.getElementById('password-lowercase').className = requirements.lowercase ? 'text-green-600' : 'text-gray-500';
                    document.getElementById('password-number').className = requirements.number ? 'text-green-600' : 'text-gray-500';
                    
                    return requirements.length && requirements.uppercase && requirements.lowercase && requirements.number;
                };

                // Password input validation
                const passwordInput = document.getElementById('register-password');
                if (passwordInput) {
                    passwordInput.addEventListener('input', (e) => {
                        validatePassword(e.target.value);
                    });
                }

                // Login form
                const loginForm = document.getElementById('login-form');
                if (loginForm) {
                    loginForm.addEventListener('submit', async (e) => {
                    e.preventDefault();
                    const email = document.getElementById('login-email').value;
                    const password = document.getElementById('login-password').value;
                    const spinner = document.getElementById('login-spinner');
                    const buttonText = document.getElementById('login-button-text');
                    
                    // Show loading state
                    spinner.classList.remove('hidden');
                    buttonText.textContent = 'Signing in...';
                    
                    try {
                        await auth.signInWithEmailAndPassword(email, password);
                        showAuthFeedback('success', 'Login successful! Redirecting...');
                        
                        // Check if we need to redirect back to extension data
                        const redirectUrl = sessionStorage.getItem('redirectAfterLogin');
                        if (redirectUrl) {
                            sessionStorage.removeItem('redirectAfterLogin');
                            window.location.href = redirectUrl;
                        }
                        // Otherwise Firebase auth state change will handle the redirect
                    } catch (error) {
                        let errorMessage = 'Login failed. Please try again.';
                        if (error.code === 'auth/user-not-found') {
                            errorMessage = 'No account found with this email address.';
                        } else if (error.code === 'auth/wrong-password') {
                            errorMessage = 'Incorrect password. Please try again.';
                        } else if (error.code === 'auth/invalid-email') {
                            errorMessage = 'Please enter a valid email address.';
                        }
                        showAuthFeedback('error', errorMessage);
                    } finally {
                        // Hide loading state
                        spinner.classList.add('hidden');
                        buttonText.textContent = 'Sign In';
                    }
                });
                
                // Mobile toggle for auth forms
                const mobileToggle = document.getElementById('mobile-auth-toggle');
                if (mobileToggle) {
                    mobileToggle.addEventListener('click', () => {
                        const loginCard = document.getElementById('login-card');
                        const signupCard = document.getElementById('signup-card');
                        const mobileText = document.getElementById('mobile-auth-text');
                        
                        if (loginCard.classList.contains('hidden')) {
                            loginCard.classList.remove('hidden');
                            signupCard.classList.add('hidden');
                            mobileText.textContent = "Don't have an account?";
                            mobileToggle.textContent = 'Sign Up';
                        } else {
                            loginCard.classList.add('hidden');
                            signupCard.classList.remove('hidden');
                            mobileText.textContent = 'Already have an account?';
                            mobileToggle.textContent = 'Sign In';
                        }
                    });
                }
                
                // Register form
                const registerForm = document.getElementById('register-form');
                if (registerForm) {
                    registerForm.addEventListener('submit', async (e) => {
                    e.preventDefault();
                    const name = document.getElementById('register-name').value;
                    const email = document.getElementById('register-email').value;
                    const password = document.getElementById('register-password').value;
                    const spinner = document.getElementById('register-spinner');
                    const buttonText = document.getElementById('register-button-text');
                    
                    // Validate password requirements
                    if (!validatePassword(password)) {
                        showAuthFeedback('error', 'Please ensure your password meets all requirements.');
                        return;
                    }
                    
                    // Show loading state
                    spinner.classList.remove('hidden');
                    buttonText.textContent = 'Creating account...';
                    
                    try {
                        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
                        await userCredential.user.updateProfile({ displayName: name });
                        
                        // Create user document in Firestore
                        await db.collection('users').doc(userCredential.user.uid).set({
                            email: email,
                            displayName: name,
                            subscriptionTier: 'free',
                            subscriptionStatus: 'active',
                            monthlyAnalysisCount: 0,
                            monthlyAnalysisLimit: 5,
                            strAnalysisEnabled: false,
                            strTrialUsed: 0,
                            createdAt: firebase.firestore.FieldValue.serverTimestamp()
                        });
                        
                        showAuthFeedback('success', 'Account created successfully! Redirecting...');
                        
                        // Firebase auth state change will handle the redirect
                    } catch (error) {
                        let errorMessage = 'Registration failed. Please try again.';
                        if (error.code === 'auth/email-already-in-use') {
                            errorMessage = 'An account with this email already exists.';
                        } else if (error.code === 'auth/invalid-email') {
                            errorMessage = 'Please enter a valid email address.';
                        } else if (error.code === 'auth/weak-password') {
                            errorMessage = 'Password is too weak. Please choose a stronger password.';
                        }
                        showAuthFeedback('error', errorMessage);
                    } finally {
                        // Hide loading state
                        spinner.classList.add('hidden');
                        buttonText.textContent = 'Create Account';
                    }
                });
                }
                
                // Logout button
                const logoutBtn = document.getElementById('logout-btn');
                if (logoutBtn) {
                    logoutBtn.addEventListener('click', () => {
                    auth.signOut();
                });
                }
                
                // Global retry function
                window.retryAnalysis = () => {
                    if (window.appState.lastPropertyData) {
                        this.analyzeProperty(window.appState.lastPropertyData, window.appState.lastAnalysisType || 'both');
                    } else if (window.appState.currentAnalysis) {
                        this.renderAnalysisResults(window.appState.currentAnalysis);
                    } else {
                        this.showPropertyInput();
                    }
                };
                
                // Global cancel analysis function
                window.cancelAnalysis = () => {
                    if (window.appState.loadingState) {
                        window.appState.loadingState.handleCancel();
                    }
                };
            }
        }
        
        // Note: Global helper functions moved outside module script for onclick handlers
        
        // Import and initialize navigation protection
        import('/js/modules/navigationProtection.js').then(module => {
            module.init();
        });

        // Initialize the application
        // Move initialization to window object to make it accessible from module script
        window.startApp = function() {
            new ROIFinderApp();
        };
        
    </script>
    
    <!-- Global Functions for Event Handlers -->
    <script>
        // These functions need to be in global scope for onclick handlers
        window.toggleOptionalFields = function() {
            const optionalFields = document.getElementById('optional-fields');
            if (optionalFields) {
                optionalFields.classList.toggle('hidden');
            }
        };
        
        window.fillSampleData = function() {
            // Sample Toronto property data
            const fields = {
                'property-address': '123 King Street West, Unit 1205, Toronto, ON M5H 1A1',
                'property-price': '850000',
                'property-bedrooms': '2',
                'property-bathrooms': '2',
                'property-sqft': '1100',
                'property-year-built': '2018',
                'property-taxes': '6800',
                'property-condo-fees': '650'
            };
            
            // Fill each field
            Object.entries(fields).forEach(([id, value]) => {
                const element = document.getElementById(id);
                if (element) {
                    element.value = value;
                }
            });
            
            // Show optional fields
            const optionalFields = document.getElementById('optional-fields');
            if (optionalFields) {
                optionalFields.classList.remove('hidden');
