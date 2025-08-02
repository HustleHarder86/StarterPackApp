// ROI Finder Application - Fixed Version without ES6 modules
// This file contains the main application logic extracted from roi-finder.html

(function() {
    'use strict';

    // Initialize Firebase with wrapper
    const firebaseWrapper = new window.FirebaseWrapper();
    let auth, db;

    async function initializeFirebase() {
        let config;
        try {
            const response = await fetch('/api/config');
            if (!response.ok) {
                throw new Error('Config not available');
            }
            config = await response.json();
        } catch (error) {
            console.warn('Using local Firebase config:', error);
            // Try to load local config
            if (window.firebaseConfig) {
                config = window.firebaseConfig;
            } else {
                console.error('No Firebase config available');
                return false;
            }
        }
        
        try {
            await firebaseWrapper.initialize(config);
            auth = firebaseWrapper.getAuth();
            db = firebaseWrapper.getDb();
            
            if (firebaseWrapper.isUsingMock()) {
                console.log('Using mock Firebase for development');
                // Show development mode banner
                const devBanner = document.createElement('div');
                devBanner.className = 'bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-2 text-sm text-center';
                devBanner.innerHTML = '<strong>Development Mode:</strong> Using mock authentication. Some features may be limited.';
                document.body.insertBefore(devBanner, document.body.firstChild);
            }
            
            return true;
        } catch (error) {
            console.error('Firebase initialization failed:', error);
            return false;
        }
    }

    // Application initialization
    function checkFirebaseConfig() {
        // First check if Firebase is available
        if (typeof firebase === 'undefined') {
            console.error('Firebase SDK not loaded');
            return false;
        }
        
        // Check if we have config
        if (window.firebaseConfig || window.firebase.apps.length > 0) {
            return true;
        }
        
        return false;
    }

    // Try to initialize immediately, or wait for it
    if (checkFirebaseConfig()) {
        initializeFirebase();
    } else {
        // Wait for config to be available
        const configWait = setInterval(() => {
            if (checkFirebaseConfig()) {
                clearInterval(configWait);
                initializeFirebase();
            }
        }, 100);
    }

    // Application state
    window.appState = {
        currentUser: null,
        currentPropertyData: null,
        currentAnalysis: null,
        loadingState: null,
        lastPropertyData: null,
        lastAnalysisType: null
    };

    // Main application class
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
            
            // Check for extension data
            this.checkExtensionData();
            
            // Setup auth state listener
            if (auth) {
                auth.onAuthStateChanged(user => {
                    this.handleAuthStateChange(user);
                });
            } else {
                // No auth available, show property input
                console.log('No auth available, showing property input');
                this.showPropertyInput();
            }
        }
        
        attachEventListeners() {
            // Property analysis form
            const propertyForm = document.getElementById('property-analysis-form');
            if (propertyForm) {
                // Attach form validation
                if (window.FormValidator) {
                    const validator = new window.FormValidator();
                    validator.attachToForm('property-analysis-form');
                    
                    // Set custom submit handler
                    propertyForm.onValidSubmit = () => {
                        this.handlePropertySubmit(new Event('submit'));
                    };
                } else {
                    // Fallback: direct submit handler
                    propertyForm.addEventListener('submit', (e) => this.handlePropertySubmit(e));
                }
            }
            
            // Login form
            const loginForm = document.getElementById('login-form');
            if (loginForm) {
                loginForm.addEventListener('submit', async (e) => {
                    e.preventDefault();
                    const email = document.getElementById('login-email').value;
                    const password = document.getElementById('login-password').value;
                    
                    document.getElementById('login-spinner').classList.remove('hidden');
                    document.getElementById('login-button-text').textContent = 'Signing in...';
                    
                    try {
                        await auth.signInWithEmailAndPassword(email, password);
                        this.showSuccess('Login successful!');
                    } catch (error) {
                        this.showError('Login failed: ' + error.message);
                        document.getElementById('login-spinner').classList.add('hidden');
                        document.getElementById('login-button-text').textContent = 'Sign In';
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
                    
                    document.getElementById('register-spinner').classList.remove('hidden');
                    document.getElementById('register-button-text').textContent = 'Creating account...';
                    
                    try {
                        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
                        
                        // Create user profile
                        if (db && userCredential.user) {
                            await db.collection('users').doc(userCredential.user.uid).set({
                                name: name,
                                email: email,
                                createdAt: new Date().toISOString(),
                                subscriptionTier: 'free',
                                strTrialUsed: 0
                            });
                        }
                        
                        this.showSuccess('Account created successfully!');
                    } catch (error) {
                        this.showError('Registration failed: ' + error.message);
                        document.getElementById('register-spinner').classList.add('hidden');
                        document.getElementById('register-button-text').textContent = 'Create Account';
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
            
            // Mobile auth toggle
            const mobileAuthToggle = document.getElementById('mobile-auth-toggle');
            if (mobileAuthToggle) {
                mobileAuthToggle.addEventListener('click', () => {
                    const loginCard = document.getElementById('login-card');
                    const signupCard = document.getElementById('signup-card');
                    const isLoginVisible = !loginCard.classList.contains('hidden');
                    
                    if (isLoginVisible) {
                        loginCard.classList.add('hidden');
                        signupCard.classList.remove('hidden');
                        document.getElementById('mobile-auth-text').textContent = 'Already have an account?';
                        mobileAuthToggle.textContent = 'Sign In';
                    } else {
                        loginCard.classList.remove('hidden');
                        signupCard.classList.add('hidden');
                        document.getElementById('mobile-auth-text').textContent = 'Need an account?';
                        mobileAuthToggle.textContent = 'Sign Up';
                    }
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
        
        handleAuthStateChange(user) {
            window.appState.currentUser = user;
            
            if (user) {
                // User is signed in
                console.log('User signed in:', user.email);
                this.showPropertyInput();
                
                // Update UI elements if they exist
                const userEmailElements = document.querySelectorAll('[data-user-email]');
                userEmailElements.forEach(el => {
                    el.textContent = user.email;
                });
            } else {
                // User is signed out
                console.log('User signed out');
                // Check if we're in development mode
                if (firebaseWrapper.isUsingMock() || window.location.hostname === 'localhost') {
                    // In development, allow access without auth
                    this.showPropertyInput();
                } else {
                    this.showLoginSection();
                }
            }
        }
        
        showLoginSection() {
            this.hideAllSections();
            document.getElementById('login-section').classList.remove('hidden');
            document.getElementById('main-content').style.display = 'block';
        }
        
        showPropertyInput() {
            this.hideAllSections();
            document.getElementById('property-input-section').classList.remove('hidden');
            document.getElementById('main-content').style.display = 'block';
        }
        
        showAnalysisResults() {
            this.hideAllSections();
            document.getElementById('analysis-results').classList.remove('hidden');
        }
        
        hideAllSections() {
            const sections = [
                'loading-state',
                'login-section', 
                'property-input-section',
                'analysis-results',
                'property-confirmation',
                'error-state'
            ];
            
            sections.forEach(sectionId => {
                const element = document.getElementById(sectionId);
                if (element) {
                    element.classList.add('hidden');
                }
            });
        }
        
        showError(message) {
            const authError = document.getElementById('auth-error');
            const authErrorMessage = document.getElementById('auth-error-message');
            const authFeedback = document.getElementById('auth-feedback');
            
            if (authError && authErrorMessage && authFeedback) {
                authErrorMessage.textContent = message;
                authError.classList.remove('hidden');
                authFeedback.classList.remove('hidden');
                
                setTimeout(() => {
                    authError.classList.add('hidden');
                    authFeedback.classList.add('hidden');
                }, 5000);
            }
        }
        
        showSuccess(message) {
            const authSuccess = document.getElementById('auth-success');
            const authFeedback = document.getElementById('auth-feedback');
            
            if (authSuccess && authFeedback) {
                authSuccess.classList.remove('hidden');
                authFeedback.classList.remove('hidden');
                
                setTimeout(() => {
                    authSuccess.classList.add('hidden');
                    authFeedback.classList.add('hidden');
                }, 3000);
            }
        }
        
        checkExtensionData() {
            const urlParams = new URLSearchParams(window.location.search);
            if (urlParams.get('fromExtension') === 'true') {
                // Pre-fill form with extension data
                const fields = ['street', 'city', 'state', 'price', 'bedrooms', 'bathrooms', 'sqft', 'yearBuilt', 'propertyTaxes'];
                const propertyData = {};
                
                fields.forEach(field => {
                    const value = urlParams.get(field);
                    if (value) propertyData[field] = value;
                });
                
                if (Object.keys(propertyData).length > 0) {
                    this.prefillPropertyForm(propertyData);
                    
                    // Auto-analyze if requested
                    if (urlParams.get('autoAnalyze') === 'true') {
                        setTimeout(() => {
                            const form = document.getElementById('property-analysis-form');
                            if (form) {
                                form.dispatchEvent(new Event('submit'));
                            }
                        }, 500);
                    }
                }
            }
        }
        
        prefillPropertyForm(data) {
            // Fill address
            if (data.street || data.city || data.state) {
                const address = `${data.street || ''} ${data.city || ''} ${data.state || ''}`.trim();
                const addressField = document.getElementById('property-address');
                if (addressField) addressField.value = address;
            }
            
            // Fill other fields
            const fieldMap = {
                price: 'property-price',
                bedrooms: 'property-bedrooms',
                bathrooms: 'property-bathrooms',
                sqft: 'property-sqft',
                yearBuilt: 'property-year-built',
                propertyTaxes: 'property-taxes'
            };
            
            Object.entries(fieldMap).forEach(([dataKey, fieldId]) => {
                if (data[dataKey]) {
                    const field = document.getElementById(fieldId);
                    if (field) field.value = data[dataKey];
                }
            });
            
            // Show optional fields if we have data for them
            if (data.sqft || data.yearBuilt || data.propertyTaxes) {
                const optionalFields = document.getElementById('optional-fields');
                if (optionalFields) {
                    optionalFields.classList.remove('hidden');
                }
            }
        }
        
        async handlePropertySubmit(e) {
            e.preventDefault();
            
            // Collect form data
            const propertyData = {
                address: document.getElementById('property-address').value,
                price: parseFloat(document.getElementById('property-price').value),
                bedrooms: parseInt(document.getElementById('property-bedrooms').value),
                bathrooms: parseFloat(document.getElementById('property-bathrooms').value),
                sqft: document.getElementById('property-sqft').value ? parseInt(document.getElementById('property-sqft').value) : null,
                propertyTaxes: document.getElementById('property-taxes').value ? parseFloat(document.getElementById('property-taxes').value) : null,
                condoFees: document.getElementById('property-condofees').value ? parseFloat(document.getElementById('property-condofees').value) : null,
                propertyType: document.getElementById('property-type').value || null
            };
            
            // Store for retry
            window.appState.lastPropertyData = propertyData;
            
            // Show loading
            document.getElementById('analyze-spinner').classList.remove('hidden');
            document.getElementById('analyze-text').textContent = 'Analyzing...';
            
            try {
                await this.analyzeProperty(propertyData, 'both');
            } catch (error) {
                console.error('Analysis error:', error);
                this.showError('Analysis failed: ' + error.message);
                
                // Reset button
                document.getElementById('analyze-spinner').classList.add('hidden');
                document.getElementById('analyze-text').textContent = 'Analyze Property';
            }
        }
        
        async analyzeProperty(propertyData, analysisType = 'both') {
            try {
                // Show loading state with progress tracking
                this.showLoadingWithProgress();
                
                // Make API call
                const response = await fetch('/api/analyze-property', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        propertyData,
                        analysisType,
                        userId: window.appState.currentUser?.uid || 'anonymous',
                        userEmail: window.appState.currentUser?.email || null
                    })
                });
                
                if (!response.ok) {
                    throw new Error(`API error: ${response.status}`);
                }
                
                const analysisData = await response.json();
                
                // Store analysis data
                window.appState.currentAnalysis = analysisData;
                
                // Reset form button
                document.getElementById('analyze-spinner').classList.add('hidden');
                document.getElementById('analyze-text').textContent = 'Analyze Property';
                
                // Render results
                this.renderAnalysisResults(analysisData);
                
            } catch (error) {
                console.error('Analysis error:', error);
                
                // Show error state
                this.showErrorState(error.message);
                
                // Reset button
                document.getElementById('analyze-spinner').classList.add('hidden');
                document.getElementById('analyze-text').textContent = 'Analyze Property';
            }
        }
        
        showLoadingWithProgress() {
            this.hideAllSections();
            
            // Create loading state component
            const loadingState = window.EnhancedLoadingState ? new window.EnhancedLoadingState() : null;
            
            if (loadingState) {
                const loadingContainer = document.getElementById('loading-state');
                loadingContainer.innerHTML = '';
                loadingContainer.appendChild(loadingState.render());
                loadingContainer.classList.remove('hidden');
                
                // Store reference for cancellation
                window.appState.loadingState = loadingState;
                
                // Subscribe to progress updates if available
                if (window.progressTracker) {
                    window.progressTracker.subscribe((state) => {
                        loadingState.updateProgress(state.progress, state.message);
                    });
                }
            } else {
                // Fallback to simple loading
                document.getElementById('loading-state').classList.remove('hidden');
            }
            
            document.getElementById('main-content').style.display = 'block';
        }
        
        showErrorState(message) {
            this.hideAllSections();
            
            const errorContainer = document.getElementById('error-state');
            errorContainer.innerHTML = `
                <div class="container mx-auto p-xl">
                    <div class="card card-lg max-w-2xl mx-auto text-center">
                        <div class="mb-lg">
                            <div class="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-lg">
                                <svg class="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                                </svg>
                            </div>
                            <h2 class="text-2xl font-bold text-gray-900 mb-md">Analysis Failed</h2>
                            <p class="text-gray-600 mb-lg">${message}</p>
                        </div>
                        
                        <div class="space-y-md">
                            <button onclick="window.retryAnalysis()" class="btn btn-primary">
                                <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                                </svg>
                                Retry Analysis
                            </button>
                            <button onclick="window.app.showPropertyInput()" class="btn btn-secondary">
                                Back to Form
                            </button>
                        </div>
                    </div>
                </div>
            `;
            
            errorContainer.classList.remove('hidden');
            document.getElementById('main-content').style.display = 'block';
        }
        
        renderAnalysisResults(analysisData) {
            this.showAnalysisResults();
            
            const resultsContainer = document.getElementById('analysis-results');
            
            // Use ComponentLoaderCompactModern if available
            if (window.ComponentLoaderCompactModern || window.ComponentLoaderCompactModernGlobal) {
                const LoaderClass = window.ComponentLoaderCompactModern || window.ComponentLoaderCompactModernGlobal;
                const loader = new LoaderClass();
                loader.renderAnalysisResults(analysisData, resultsContainer);
            } else {
                // Fallback rendering
                resultsContainer.innerHTML = `
                    <div class="container mx-auto p-xl">
                        <div class="card card-lg">
                            <h2 class="text-2xl font-bold mb-lg">Analysis Complete</h2>
                            <pre>${JSON.stringify(analysisData, null, 2)}</pre>
                        </div>
                    </div>
                `;
            }
        }
    }

    // Initialize the app when DOM is ready
    document.addEventListener('DOMContentLoaded', function() {
        // Check if already initialized by layout
        if (!window.app) {
            // Initialize the app
            window.app = new ROIFinderApp();
        }
    });

})();