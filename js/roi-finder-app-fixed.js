// ROI Finder Application - Fixed Version without ES6 modules
// This file contains the main application logic extracted from roi-finder.html

(function() {
    'use strict';

    // Export namespace to window for global access
    window.ROIFinderApp = window.ROIFinderApp || {};

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
            
            // Check for extension data first - this takes priority
            const hasExtensionData = this.checkExtensionData();
            
            if (hasExtensionData) {
                console.log('Extension data found, skipping auth state handling');
                // Extension data takes priority - don't let auth state override
                return;
            }
            
            // Only setup auth state listener if no extension data
            if (auth) {
                auth.onAuthStateChanged(user => {
                    this.handleAuthStateChange(user);
                });
            } else {
                // No auth available and no extension data, show property input
                console.log('No auth available, showing property input');
                this.showPropertyInput();
                
                // Ensure the form is actually visible (fix for hidden form bug)
                // Add a small delay to ensure DOM is fully ready
                setTimeout(() => {
                    const propertySection = document.getElementById('property-input-section');
                    if (propertySection) {
                        propertySection.classList.remove('hidden');
                        propertySection.style.display = '';
                        propertySection.style.visibility = 'visible';
                        propertySection.style.opacity = '1';
                        console.log('Property section visibility forced');
                    }
                }, 100);
            }
        }
        
        attachEventListeners() {
            // Property analysis form
            const propertyForm = document.getElementById('property-analysis-form');
            const analyzeButton = document.getElementById('analyze-button');
            
            if (propertyForm) {
                // Always add submit handler first to prevent page reload
                propertyForm.addEventListener('submit', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    return false;
                }, true);
                
                // Add our custom submit handler
                propertyForm.addEventListener('submit', (e) => {
                    e.preventDefault();
                    this.handlePropertySubmit(e);
                });
                
                // Attach form validation if available
                if (window.FormValidator) {
                    try {
                        const validator = new window.FormValidator();
                        validator.attachToForm('property-analysis-form');
                        
                        // Set custom submit handler
                        propertyForm.onValidSubmit = () => {
                            this.handlePropertySubmit(new Event('submit'));
                        };
                    } catch (error) {
                        console.warn('FormValidator initialization failed, using fallback:', error);
                        this.setupFallbackValidation(propertyForm);
                    }
                } else {
                    // No FormValidator available, use native HTML5 validation
                    this.setupFallbackValidation(propertyForm);
                }
            }
            
            // Add click handler to analyze button
            if (analyzeButton) {
                analyzeButton.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    // Trigger form submit event which will be caught by our handlers
                    if (propertyForm) {
                        const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
                        propertyForm.dispatchEvent(submitEvent);
                    }
                });
            }
            
            // Login form
            const loginForm = document.getElementById('login-form');
            if (loginForm) {
                loginForm.addEventListener('submit', async (e) => {
                    e.preventDefault();
                    const emailEl = document.getElementById('login-email');
                    const passwordEl = document.getElementById('login-password');
                    const spinnerEl = document.getElementById('login-spinner');
                    const buttonTextEl = document.getElementById('login-button-text');
                    
                    if (!emailEl || !passwordEl) {
                        console.error('Login form elements not found');
                        return;
                    }
                    
                    const email = emailEl.value;
                    const password = passwordEl.value;
                    
                    if (spinnerEl) spinnerEl.classList.remove('hidden');
                    if (buttonTextEl) buttonTextEl.textContent = 'Signing in...';
                    
                    try {
                        await auth.signInWithEmailAndPassword(email, password);
                        this.showSuccess('Login successful!');
                    } catch (error) {
                        this.showError('Login failed: ' + error.message);
                        if (spinnerEl) spinnerEl.classList.add('hidden');
                        if (buttonTextEl) buttonTextEl.textContent = 'Sign In';
                    }
                });
            }
            
            // Register form
            const registerForm = document.getElementById('register-form');
            if (registerForm) {
                registerForm.addEventListener('submit', async (e) => {
                    e.preventDefault();
                    const nameEl = document.getElementById('register-name');
                    const emailEl = document.getElementById('register-email');
                    const passwordEl = document.getElementById('register-password');
                    const spinnerEl = document.getElementById('register-spinner');
                    const buttonTextEl = document.getElementById('register-button-text');
                    
                    if (!nameEl || !emailEl || !passwordEl) {
                        console.error('Register form elements not found');
                        return;
                    }
                    
                    const name = nameEl.value;
                    const email = emailEl.value;
                    const password = passwordEl.value;
                    
                    if (spinnerEl) spinnerEl.classList.remove('hidden');
                    if (buttonTextEl) buttonTextEl.textContent = 'Creating account...';
                    
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
                        if (spinnerEl) spinnerEl.classList.add('hidden');
                        if (buttonTextEl) buttonTextEl.textContent = 'Create Account';
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
                        const mobileAuthText = document.getElementById('mobile-auth-text');
                        if (mobileAuthText) mobileAuthText.textContent = 'Already have an account?';
                        mobileAuthToggle.textContent = 'Sign In';
                    } else {
                        loginCard.classList.remove('hidden');
                        signupCard.classList.add('hidden');
                        const mobileAuthText = document.getElementById('mobile-auth-text');
                        if (mobileAuthText) mobileAuthText.textContent = 'Need an account?';
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
            // Don't interfere if we have extension data
            const urlParams = new URLSearchParams(window.location.search);
            if (urlParams.get('fromExtension') === 'true') {
                console.log('Extension data present, ignoring auth state change');
                return;
            }
            
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
                if (firebaseWrapper.isUsingMock() || !window.ENV?.production) {
                    // In development, allow access without auth
                    this.showPropertyInput();
                } else {
                    this.showLoginSection();
                }
            }
        }
        
        showLoginSection() {
            this.hideAllSections();
            const loginSection = document.getElementById('login-section');
            if (loginSection) {
                loginSection.classList.remove('hidden');
            }
            const mainContent = document.getElementById('main-content');
            if (mainContent) {
                mainContent.style.display = 'block';
            }
        }
        
        showPropertyInput() {
            this.hideAllSections();
            const propertySection = document.getElementById('property-input-section');
            if (propertySection) {
                propertySection.classList.remove('hidden');
                // Also ensure any inline styles are removed
                propertySection.style.display = '';
                // Force visibility in case of CSS conflicts
                propertySection.style.visibility = 'visible';
                propertySection.style.opacity = '1';
            }
            const mainContent = document.getElementById('main-content');
            if (mainContent) {
                mainContent.style.display = 'block';
            }
        }
        
        showPropertyConfirmation(propertyData) {
            // Hide all sections first
            this.hideAllSections();
            
            // Hide the entire app-root to remove sidebar and all content
            const appRoot = document.getElementById('app-root');
            if (appRoot) {
                appRoot.style.display = 'none';
            }
            
            // Also specifically hide the property input section with important
            const propertySection = document.getElementById('property-input-section');
            if (propertySection) {
                propertySection.classList.add('hidden');
                propertySection.style.display = 'none !important';
                propertySection.style.visibility = 'hidden';
                propertySection.style.opacity = '0';
            }
            
            // Hide the main content area to prevent layout issues
            const mainContent = document.getElementById('main-content');
            if (mainContent) {
                mainContent.style.display = 'none';
            }
            
            // Create confirmation container if it doesn't exist
            let confirmationContainer = document.getElementById('property-confirmation-container');
            if (!confirmationContainer) {
                confirmationContainer = document.createElement('div');
                confirmationContainer.id = 'property-confirmation-container';
                confirmationContainer.style.cssText = 'position: fixed; inset: 0; z-index: 9999;';
                document.body.appendChild(confirmationContainer);
            }
            
            // Show confirmation screen using PropertyConfirmation component
            if (window.PropertyConfirmation) {
                const confirmationHTML = window.PropertyConfirmation(
                    propertyData,
                    async (analysisType) => {
                        // onConfirm callback
                        console.log('Confirmed analysis type:', analysisType);
                        
                        try {
                            // Hide confirmation
                            confirmationContainer.style.display = 'none';
                            confirmationContainer.innerHTML = '';
                            
                            // Show loading with progress
                            this.showLoadingWithProgress();
                            
                            // Convert analysis type for API
                            // Keep the analysis type as-is for the API
                            const apiAnalysisType = analysisType; // 'both', 'ltr', or 'str'
                            
                            // Validate required data
                            if (!propertyData.address) {
                                throw new Error('Property address is required');
                            }
                            
                            if (!propertyData.price || propertyData.price <= 0) {
                                throw new Error('Valid property price is required');
                            }
                            
                            // Prepare property data for analysis
                            const analysisData = {
                                address: propertyData.address,
                                price: propertyData.price || 0,
                                bedrooms: propertyData.bedrooms || 0,
                                bathrooms: propertyData.bathrooms || 0,
                                sqft: propertyData.sqft || 0,
                                propertyTaxes: propertyData.propertyTaxes || 0,
                                yearBuilt: propertyData.yearBuilt || new Date().getFullYear(),
                                propertyType: propertyData.propertyType || 'house',
                                condoFees: propertyData.condoFees || 0,
                                mlsNumber: propertyData.mlsNumber || '',
                                imageUrl: propertyData.imageUrl || propertyData.mainImage || ''
                            };
                            
                            // Start analysis
                            await this.analyzeProperty(analysisData, apiAnalysisType);
                        } catch (error) {
                            console.error('Error starting analysis:', error);
                            this.hideLoadingState();
                            this.showErrorMessage(error.message || 'Failed to start analysis. Please try again.');
                        }
                    },
                    () => {
                        // onCancel callback
                        console.log('Analysis cancelled');
                        
                        // Hide confirmation
                        confirmationContainer.style.display = 'none';
                        confirmationContainer.innerHTML = '';
                        
                        // Show app-root again
                        const appRoot = document.getElementById('app-root');
                        if (appRoot) {
                            appRoot.style.display = '';
                        }
                        
                        // Show main content again
                        const mainContent = document.getElementById('main-content');
                        if (mainContent) {
                            mainContent.style.display = 'block';
                        }
                        
                        // Show property input form
                        this.showPropertyInput();
                        
                        // Pre-fill the form with the extension data
                        if (window.appState.extensionPropertyData) {
                            setTimeout(() => {
                                this.prefillPropertyForm(window.appState.extensionPropertyData);
                            }, 300);
                        }
                    }
                );
                
                // Render confirmation - extract HTML from the returned object
                const confirmationData = typeof confirmationHTML === 'string' ? 
                    confirmationHTML : confirmationHTML.html;
                confirmationContainer.innerHTML = confirmationData;
                confirmationContainer.style.display = 'block';
                
                // Run setup if available
                if (confirmationHTML.setup) {
                    confirmationHTML.setup(window.appState.currentUser);
                }
            } else {
                console.error('PropertyConfirmation component not loaded');
                // Fallback to form pre-fill
                this.showPropertyInput();
                setTimeout(() => {
                    this.prefillPropertyForm(window.appState.extensionPropertyData);
                }, 300);
            }
        }
        
        showAnalysisResults() {
            this.hideAllSections();
            const resultsSection = document.getElementById('analysis-results');
            if (resultsSection) {
                resultsSection.classList.remove('hidden');
            }
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
        
        setupFallbackValidation(form) {
            // Add custom validation for required fields
            const requiredFields = form.querySelectorAll('[required]');
            
            requiredFields.forEach(field => {
                // Add visual feedback on blur
                field.addEventListener('blur', () => {
                    if (!field.value.trim()) {
                        field.classList.add('border-red-500');
                        this.showFieldError(field, 'This field is required');
                    } else {
                        field.classList.remove('border-red-500');
                        this.clearFieldError(field);
                    }
                });
                
                // Clear error on input
                field.addEventListener('input', () => {
                    if (field.value.trim()) {
                        field.classList.remove('border-red-500');
                        this.clearFieldError(field);
                    }
                });
            });
            
            // Override form submit to check validation
            const originalSubmitHandler = form.onsubmit;
            form.onsubmit = (e) => {
                const isValid = this.validateForm(form);
                if (!isValid) {
                    e.preventDefault();
                    this.showValidationErrors(form);
                    return false;
                }
                // Call original handler if valid
                if (originalSubmitHandler) {
                    return originalSubmitHandler.call(form, e);
                }
            };
        }
        
        validateForm(form) {
            let isValid = true;
            const requiredFields = form.querySelectorAll('[required]');
            
            requiredFields.forEach(field => {
                if (!field.value.trim()) {
                    isValid = false;
                    field.classList.add('border-red-500');
                }
            });
            
            return isValid;
        }
        
        showFieldError(field, message) {
            // Remove existing error if any
            this.clearFieldError(field);
            
            // Create error element
            const error = document.createElement('div');
            error.className = 'text-red-500 text-sm mt-1';
            error.textContent = message;
            error.setAttribute('data-field-error', field.id || field.name);
            
            // Insert after field
            field.parentNode.insertBefore(error, field.nextSibling);
        }
        
        clearFieldError(field) {
            const error = field.parentNode.querySelector(`[data-field-error="${field.id || field.name}"]`);
            if (error) {
                error.remove();
            }
        }
        
        showValidationErrors(form) {
            const firstInvalidField = form.querySelector('.border-red-500');
            if (firstInvalidField) {
                firstInvalidField.focus();
                firstInvalidField.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
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
            console.log('Checking extension data. URL params:', window.location.search);
            
            if (urlParams.get('fromExtension') === 'true') {
                console.log('Extension data detected');
                
                // Pre-fill form with extension data
                const fields = ['street', 'city', 'state', 'price', 'bedrooms', 'bathrooms', 'sqft', 'yearBuilt', 'propertyTaxes'];
                const propertyData = {};
                
                fields.forEach(field => {
                    const value = urlParams.get(field);
                    if (value) {
                        propertyData[field] = value;
                        console.log(`Found ${field}: ${value}`);
                    }
                });
                
                console.log('Property data collected:', propertyData);
                
                if (Object.keys(propertyData).length > 0) {
                    // Store the property data for later use
                    window.appState.extensionPropertyData = propertyData;
                    
                    // Build complete property data object with address
                    const completePropertyData = {
                        address: `${propertyData.street || ''}, ${propertyData.city || ''}, ${propertyData.state || ''}`.trim().replace(/^,\s*|,\s*$/g, ''),
                        price: propertyData.price ? parseFloat(propertyData.price) : null,
                        bedrooms: propertyData.bedrooms ? parseInt(propertyData.bedrooms) : null,
                        bathrooms: propertyData.bathrooms ? parseFloat(propertyData.bathrooms) : null,
                        sqft: propertyData.sqft ? parseInt(propertyData.sqft) : null,
                        propertyTaxes: propertyData.propertyTaxes ? parseFloat(propertyData.propertyTaxes) : null,
                        propertyType: propertyData.propertyType || 'house'
                    };
                    
                    // Show property confirmation screen
                    this.showPropertyConfirmation(completePropertyData);
                    
                    return true;
                }
            }
            return false;
        }
        
        prefillPropertyForm(data) {
            console.log('Prefilling form with data:', data);
            
            // Fill address
            if (data.street || data.city || data.state) {
                const address = `${data.street || ''}, ${data.city || ''}, ${data.state || ''}`.trim().replace(/^,\s*|,\s*$/g, '');
                const addressField = document.getElementById('property-address');
                if (addressField) {
                    addressField.value = address;
                    console.log('Set address to:', address);
                }
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
                    if (field) {
                        field.value = data[dataKey];
                        console.log(`Set ${fieldId} to:`, data[dataKey]);
                        
                        // For select elements, ensure the option exists
                        if (field.tagName === 'SELECT') {
                            // Find matching option
                            const options = field.options;
                            for (let i = 0; i < options.length; i++) {
                                if (options[i].value == data[dataKey]) {
                                    field.selectedIndex = i;
                                    break;
                                }
                            }
                        }
                    }
                }
            });
            
            // Show optional fields if we have data for them
            if (data.sqft || data.yearBuilt || data.propertyTaxes) {
                const optionalFields = document.getElementById('optional-fields');
                if (optionalFields) {
                    optionalFields.style.display = 'block';
                    console.log('Showing optional fields');
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
            const spinnerEl = document.getElementById('analyze-spinner');
            const textEl = document.getElementById('analyze-text');
            
            if (spinnerEl) spinnerEl.classList.remove('hidden');
            if (textEl) textEl.textContent = 'Analyzing...';
            
            try {
                await this.analyzeProperty(propertyData, 'both');
            } catch (error) {
                console.error('Analysis error:', error);
                this.showError('Analysis failed: ' + error.message);
                
                // Reset button
                const spinnerEl = document.getElementById('analyze-spinner');
                const textEl = document.getElementById('analyze-text');
                if (spinnerEl) spinnerEl.classList.add('hidden');
                if (textEl) textEl.textContent = 'Analyze Property';
            }
        }
        
        async analyzeProperty(propertyData, analysisType = 'both') {
            try {
                // Check if we're in e2e test mode
                const urlParams = new URLSearchParams(window.location.search);
                const isE2ETest = urlParams.get('e2e_test_mode') === 'true';
                
                // Preserve URL parameters
                if (isE2ETest) {
                    sessionStorage.setItem('e2e_test_mode', 'true');
                }
                
                // Show loading state with progress tracking
                this.showLoadingWithProgress();
                
                // Make API call
                const fromExtension = urlParams.get('fromExtension') === 'true';
                
                const response = await fetch('/api/analyze-property', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        ...(isE2ETest && { 'X-E2E-Test-Mode': 'true' }),
                        ...(fromExtension && { 'X-Extension-Request': 'true' })
                    },
                    body: JSON.stringify({
                        propertyAddress: propertyData.address,  // Required by Railway API
                        propertyData: propertyData,
                        requestType: isE2ETest ? 'e2e-test' : 'authenticated',
                        analysisType: analysisType,
                        includeStrAnalysis: analysisType === 'both' || analysisType === 'str',
                        isE2ETest: isE2ETest,
                        userId: isE2ETest ? 'test-user-id' : (window.appState.currentUser?.uid || 'anonymous'),
                        userEmail: isE2ETest ? 'test@e2e.com' : (window.appState.currentUser?.email || null),
                        userName: isE2ETest ? 'Test User' : (window.appState.currentUser?.displayName || null)
                    })
                });
                
                if (!response.ok) {
                    let errorMessage = `API error: ${response.status}`;
                    try {
                        const errorData = await response.json();
                        if (errorData.error) {
                            errorMessage = errorData.error;
                        } else if (errorData.message) {
                            errorMessage = errorData.message;
                        }
                    } catch (e) {
                        // If JSON parsing fails, use the status message
                    }
                    throw new Error(errorMessage);
                }
                
                const analysisData = await response.json();
                
                // Store analysis data
                window.appState.currentAnalysis = analysisData;
                
                // Reset form button
                const spinnerEl = document.getElementById('analyze-spinner');
                const textEl = document.getElementById('analyze-text');
                if (spinnerEl) spinnerEl.classList.add('hidden');
                if (textEl) textEl.textContent = 'Analyze Property';
                
                // In E2E test mode, show results but keep the form accessible
                if (isE2ETest) {
                    // Show mock results without hiding the form
                    this.completeProgressAndShowResults(analysisData);
                    // Ensure we preserve the e2e_test_mode parameter
                    if (!window.location.search.includes('e2e_test_mode=true')) {
                        const newUrl = window.location.pathname + '?e2e_test_mode=true';
                        window.history.replaceState({}, '', newUrl);
                    }
                } else {
                    // Normal flow - show results
                    this.completeProgressAndShowResults(analysisData);
                }
                
            } catch (error) {
                console.error('Analysis error:', error);
                
                // Create user-friendly error message
                let errorMessage = 'Unable to complete the analysis. ';
                
                if (error.message.includes('fetch')) {
                    errorMessage += 'Please check your internet connection and try again.';
                } else if (error.message.includes('401') || error.message.includes('403')) {
                    errorMessage += 'Authentication error. Please log in again.';
                } else if (error.message.includes('500') || error.message.includes('502')) {
                    errorMessage += 'Our servers are experiencing issues. Please try again in a few minutes.';
                } else if (error.message.includes('API') || error.message.includes('Railway')) {
                    errorMessage += 'Unable to connect to analysis service. Please try again.';
                } else {
                    errorMessage += error.message || 'Please try again or contact support if the issue persists.';
                }
                
                // In E2E test mode, show form again on error
                const urlParams = new URLSearchParams(window.location.search);
                const isE2ETest = urlParams.get('e2e_test_mode') === 'true';
                
                if (isE2ETest) {
                    this.showPropertyInput();
                    this.showError(errorMessage);
                } else {
                    // Show error state
                    this.showErrorState(errorMessage);
                }
                
                // Reset button
                const spinnerEl = document.getElementById('analyze-spinner');
                const textEl = document.getElementById('analyze-text');
                if (spinnerEl) spinnerEl.classList.add('hidden');
                if (textEl) textEl.textContent = 'Analyze Property';
            }
        }
        
        showLoadingWithProgress() {
            this.hideAllSections();
            
            // Hide the entire app-root to remove sidebar and all content
            const appRoot = document.getElementById('app-root');
            if (appRoot) {
                appRoot.style.display = 'none';
            }
            
            // Create loading container if it doesn't exist
            let loadingContainer = document.getElementById('analysis-loading-container');
            if (!loadingContainer) {
                loadingContainer = document.createElement('div');
                loadingContainer.id = 'analysis-loading-container';
                loadingContainer.className = 'analysis-progress-container';
                document.body.appendChild(loadingContainer);
            }
            
            // Analysis steps that match the screenshot
            const analysisSteps = [
                { id: 'initializing', text: 'Initializing analysis', completed: false },
                { id: 'property-details', text: 'Fetching property details', completed: false },
                { id: 'market-data', text: 'Analyzing local market data', completed: false },
                { id: 'comparables', text: 'Finding comparable properties', completed: false },
                { id: 'airbnb-data', text: 'Retrieving Airbnb data', completed: false },
                { id: 'occupancy-rates', text: 'Calculating occupancy rates', completed: false },
                { id: 'projections', text: 'Running financial projections', completed: false },
                { id: 'insights', text: 'Generating investment insights', completed: false },
                { id: 'report', text: 'Finalizing report', completed: false }
            ];
            
            // Render loading UI
            loadingContainer.innerHTML = `
                <div class="analysis-progress-card">
                    <!-- Header with gradient -->
                    <div class="analysis-progress-header">
                        <h2 class="analysis-progress-title">Analyzing Your Property</h2>
                        <div class="analysis-progress-bar-container">
                            <div class="analysis-progress-bar-wrapper">
                                <div class="analysis-progress-bar-bg">
                                    <div id="progress-bar" class="analysis-progress-bar" style="width: 0%"></div>
                                </div>
                            </div>
                            <span id="progress-percentage" class="analysis-progress-percentage">0%</span>
                            <span class="analysis-progress-label">Complete</span>
                        </div>
                    </div>
                    
                    <!-- Steps List -->
                    <div class="analysis-progress-steps">
                        <div class="analysis-progress-steps-list">
                            ${analysisSteps.map(step => `
                                <div id="step-${step.id}" class="analysis-step-item">
                                    <div class="analysis-step-indicator">
                                        <svg class="analysis-step-checkmark" fill="currentColor" viewBox="0 0 20 20">
                                            <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
                                        </svg>
                                    </div>
                                    <span class="analysis-step-text">${step.text}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    
                    <!-- Footer Message -->
                    <div class="analysis-progress-footer">
                        <p class="analysis-progress-message">This comprehensive analysis typically takes 30-60 seconds</p>
                    </div>
                    </div>
                </div>
            `;
            
            loadingContainer.style.display = 'block';
            
            // Start progress simulation
            this.simulateProgress(analysisSteps);
            
            // Store reference for cleanup
            window.appState.loadingState = {
                container: loadingContainer,
                steps: analysisSteps
            };
        }
        
        simulateProgress(steps) {
            let currentStep = 0;
            const totalSteps = steps.length;
            
            const updateStep = () => {
                if (currentStep >= totalSteps) {
                    // Clear interval when all steps are complete
                    if (window.appState.progressInterval) {
                        clearInterval(window.appState.progressInterval);
                        window.appState.progressInterval = null;
                    }
                    return;
                }
                
                // Update current step to in-progress
                const stepEl = document.getElementById(`step-${steps[currentStep].id}`);
                if (stepEl) {
                    const indicator = stepEl.querySelector('.analysis-step-indicator');
                    
                    // Mark as active
                    stepEl.classList.add('active');
                    indicator.classList.add('active');
                    
                    // Update progress bar
                    const progressPercentage = Math.round(((currentStep + 0.5) / totalSteps) * 100);
                    const progressBar = document.getElementById('progress-bar');
                    const progressText = document.getElementById('progress-percentage');
                    if (progressBar) progressBar.style.width = `${progressPercentage}%`;
                    if (progressText) progressText.textContent = `${progressPercentage}%`;
                    
                    // Complete step after delay
                    setTimeout(() => {
                        // Mark as completed
                        stepEl.classList.remove('active');
                        stepEl.classList.add('completed');
                        indicator.classList.remove('active');
                        indicator.classList.add('completed');
                        
                        // Update overall progress
                        const completePercentage = Math.round(((currentStep + 1) / totalSteps) * 100);
                        if (progressBar) progressBar.style.width = `${completePercentage}%`;
                        if (progressText) progressText.textContent = `${completePercentage}%`;
                        
                        currentStep++;
                        
                        // Continue to next step
                        if (currentStep < totalSteps) {
                            setTimeout(updateStep, 800);
                        }
                    }, 1500 + Math.random() * 1000); // Variable delay for realism
                }
            };
            
            // Start the first step after a short delay
            setTimeout(updateStep, 500);
            
            // Store the progress interval reference for cleanup
            // Note: We're not using setInterval, but storing a flag to track if progress is running
            window.appState.progressRunning = true;
        }
        
        hideLoadingState() {
            const loadingContainer = document.getElementById('analysis-loading-container');
            if (loadingContainer) {
                loadingContainer.style.display = 'none';
            }
        }
        
        showErrorState(message) {
            this.hideAllSections();
            
            // Hide the loading container if it exists
            this.hideLoadingState();
            
            // Hide app-root if it was hidden
            const appRoot = document.getElementById('app-root');
            if (appRoot) {
                appRoot.style.display = 'none';
            }
            
            const errorContainer = document.getElementById('error-state');
            if (!errorContainer) {
                console.error('Error container not found');
                // Fallback to showErrorMessage
                this.showErrorMessage(message);
                return;
            }
            
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
            const mainContent = document.getElementById('main-content');
            if (mainContent) {
                mainContent.style.display = 'block';
            }
        }
        
        renderAnalysisResults(analysisData) {
            console.log('Rendering analysis results...');
            
            // First, hide ALL UI elements
            this.hideAllUIElements();
            
            // Small delay to ensure smooth transition
            setTimeout(() => {
                // Extract property data for the layout
                const propertyData = analysisData.data?.property_data || analysisData.data?.propertyData || {
                    address: analysisData.data?.property_address || 'Property Analysis',
                    city: analysisData.data?.property_details?.city || 'Location',
                    price: analysisData.data?.property_details?.estimated_value || 0,
                    bedrooms: analysisData.data?.property_details?.bedrooms || 0,
                    bathrooms: analysisData.data?.property_details?.bathrooms || 0,
                    propertyType: analysisData.data?.property_details?.property_type || 'Property'
                };
                
                // Clear the entire app root
                const appRoot = document.getElementById('app-root');
                if (appRoot) {
                    appRoot.innerHTML = '';
                    appRoot.style.display = 'block';
                    
                    // Apply CompactModernLayout with analysis results
                    if (window.CompactModernLayout) {
                        // Create a container for the analysis results
                        const analysisContent = document.createElement('div');
                        analysisContent.id = 'analysis-results-content';
                        
                        // Render the layout with property data
                        const layoutHTML = window.CompactModernLayout({
                            children: analysisContent.outerHTML,
                            currentPage: 'analytics',
                            propertyData: propertyData
                        });
                        
                        appRoot.innerHTML = layoutHTML;
                        appRoot.classList.add('fade-in');
                        
                        // Now render the analysis results into the content area
                        const contentContainer = document.getElementById('analysis-results-content');
                        if (contentContainer && (window.ComponentLoaderCompactModern || window.ComponentLoaderCompactModernGlobal)) {
                            const LoaderClass = window.ComponentLoaderCompactModern || window.ComponentLoaderCompactModernGlobal;
                            const loader = new LoaderClass();
                            loader.renderAnalysisResults(analysisData, contentContainer);
                        } else if (contentContainer) {
                            // Fallback rendering
                            contentContainer.innerHTML = `
                                <div class="container mx-auto p-xl">
                                    <div class="card card-lg">
                                        <h2 class="text-2xl font-bold mb-lg">Analysis Complete</h2>
                                        <pre>${JSON.stringify(analysisData, null, 2)}</pre>
                                    </div>
                                </div>
                            `;
                        }
                        
                        // Re-initialize mobile menu after layout change
                        this.initializeMobileMenu();
                    } else {
                        // Fallback if layout not available
                        this.showAnalysisResults();
                        const resultsContainer = document.getElementById('analysis-results');
                        if (resultsContainer) {
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
            }, 300); // 300ms delay for smooth transition
        }
        
        hideAllUIElements() {
            // Hide all possible UI containers
            const elementsToHide = [
                'analysis-loading-container',
                'property-confirmation-container',
                'property-input-section',
                'login-section',
                'loading-state',
                'error-state',
                'main-content',
                'analysis-results'
            ];
            
            elementsToHide.forEach(id => {
                const element = document.getElementById(id);
                if (element) {
                    element.style.display = 'none';
                }
            });
            
            // Also hide any class-based elements
            document.querySelectorAll('.loading-overlay').forEach(el => el.style.display = 'none');
            document.querySelectorAll('.property-confirmation-overlay').forEach(el => el.style.display = 'none');
        }
        
        completeProgressAndShowResults(analysisData) {
            // Stop any ongoing progress simulation
            window.appState.progressRunning = false;
            
            // Set progress to 100% before transitioning
            const progressBar = document.getElementById('progress-bar');
            const progressText = document.getElementById('progress-percentage');
            if (progressBar) progressBar.style.width = '100%';
            if (progressText) progressText.textContent = '100%';
            
            // Mark all steps as completed
            const steps = document.querySelectorAll('.analysis-step');
            steps.forEach(step => {
                step.classList.remove('active');
                step.classList.add('completed');
                const indicator = step.querySelector('.analysis-step-indicator');
                if (indicator) {
                    indicator.classList.remove('active');
                    indicator.classList.add('completed');
                }
            });
            
            // Add fade-out class to loading container
            const loadingContainer = document.getElementById('analysis-loading-container');
            if (loadingContainer) {
                loadingContainer.classList.add('fade-out');
            }
            
            // Small delay to show 100% completion and fade out before transitioning
            setTimeout(() => {
                this.renderAnalysisResults(analysisData);
            }, 800);
        }
    }

    // Initialize the app when DOM is ready
    document.addEventListener('DOMContentLoaded', function() {
        // Check if already initialized by layout
        if (!window.app) {
            // Initialize the app
            window.app = new ROIFinderApp();
            // Also expose as ROIFinderApp.instance for easier access
            window.ROIFinderApp.instance = window.app;
        }
    });
    
    // Add debug helpers
    window.debugROI = {
        checkHandlers: () => {
            const form = document.getElementById('property-analysis-form');
            const button = document.getElementById('analyze-button');
            console.log('Form:', form);
            console.log('Button:', button);
            console.log('URL params:', window.location.search);
            console.log('Session storage e2e:', sessionStorage.getItem('e2e_test_mode'));
        },
        testSubmit: () => {
            const form = document.getElementById('property-analysis-form');
            if (form) {
                form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
            }
        },
        forceShowForm: () => {
            const propertySection = document.getElementById('property-input-section');
            if (propertySection) {
                propertySection.classList.remove('hidden');
                propertySection.style.display = 'block';
            }
        },
        hideLoadingState: () => {
            const loadingContainer = document.getElementById('analysis-loading-container');
            if (loadingContainer) {
                loadingContainer.style.display = 'none';
            }
        },
        showErrorMessage: (message) => {
            // Hide any loading states
            if (window.roiFinderApp && window.roiFinderApp.hideLoadingState) {
                window.roiFinderApp.hideLoadingState();
            }
            
            // For extension flow, show a more user-friendly error overlay
            const errorOverlay = document.createElement('div');
            errorOverlay.className = 'fixed inset-0 z-[10000] bg-gray-900 bg-opacity-75 flex items-center justify-center p-4';
            errorOverlay.style.cssText = 'position: fixed; inset: 0; z-index: 10000; background-color: rgba(17, 24, 39, 0.75); display: flex; align-items: center; justify-content: center; padding: 1rem;';
            errorOverlay.innerHTML = `
                <div style="background-color: white; border-radius: 0.5rem; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1); max-width: 28rem; width: 100%; padding: 1.5rem;">
                    <div style="display: flex; align-items: center; margin-bottom: 1rem;">
                        <div style="width: 3rem; height: 3rem; background-color: #fee2e2; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 1rem;">
                            <svg style="width: 1.5rem; height: 1.5rem; color: #dc2626;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </div>
                        <h3 style="font-size: 1.125rem; font-weight: 600; color: #111827;">Error</h3>
                    </div>
                    <p style="color: #4b5563; margin-bottom: 1.5rem;">${message}</p>
                    <div style="display: flex; gap: 0.75rem;">
                        <button onclick="window.location.reload()" style="flex: 1; padding: 0.5rem 1rem; background-color: #2563eb; color: white; border-radius: 0.5rem; border: none; cursor: pointer;">
                            Try Again
                        </button>
                        <button onclick="this.closest('div[style*=\\'position: fixed\\']').remove()" style="flex: 1; padding: 0.5rem 1rem; background-color: #e5e7eb; color: #374151; border-radius: 0.5rem; border: none; cursor: pointer;">
                            Close
                        </button>
                    </div>
                </div>
            `;
            document.body.appendChild(errorOverlay);
        }
    };

})();