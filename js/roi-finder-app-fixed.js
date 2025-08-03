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
            this.hideAllSections();
            
            // Create confirmation container if it doesn't exist
            let confirmationContainer = document.getElementById('property-confirmation-container');
            if (!confirmationContainer) {
                confirmationContainer = document.createElement('div');
                confirmationContainer.id = 'property-confirmation-container';
                confirmationContainer.className = 'fixed inset-0 z-50';
                document.body.appendChild(confirmationContainer);
            }
            
            // Show confirmation screen using PropertyConfirmation component
            if (window.PropertyConfirmation) {
                const confirmation = window.PropertyConfirmation(
                    propertyData,
                    (analysisType) => {
                        // onConfirm callback
                        console.log('Confirmed analysis type:', analysisType);
                        
                        // Hide confirmation
                        confirmationContainer.style.display = 'none';
                        confirmationContainer.innerHTML = '';
                        
                        // Show loading with progress
                        this.showLoadingWithProgress();
                        
                        // Convert analysis type for API
                        const apiAnalysisType = analysisType === 'ltr' ? 'long-term' : 
                                              analysisType === 'str' ? 'short-term' : 'both';
                        
                        // Start analysis
                        this.analyzeProperty(propertyData, apiAnalysisType);
                    },
                    () => {
                        // onCancel callback
                        console.log('Analysis cancelled');
                        
                        // Hide confirmation
                        confirmationContainer.style.display = 'none';
                        confirmationContainer.innerHTML = '';
                        
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
                
                // Render confirmation
                confirmationContainer.innerHTML = confirmation.html;
                confirmationContainer.style.display = 'block';
                
                // Setup confirmation (e.g., trial count display)
                if (confirmation.setup) {
                    confirmation.setup(window.appState.currentUser);
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
                const response = await fetch('/api/analyze-property', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        ...(isE2ETest && { 'X-E2E-Test-Mode': 'true' })
                    },
                    body: JSON.stringify({
                        propertyData,
                        analysisType,
                        userId: window.appState.currentUser?.uid || 'anonymous',
                        userEmail: window.appState.currentUser?.email || null,
                        isE2ETest
                    })
                });
                
                if (!response.ok) {
                    throw new Error(`API error: ${response.status}`);
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
                    this.renderAnalysisResults(analysisData);
                    // Ensure we preserve the e2e_test_mode parameter
                    if (!window.location.search.includes('e2e_test_mode=true')) {
                        const newUrl = window.location.pathname + '?e2e_test_mode=true';
                        window.history.replaceState({}, '', newUrl);
                    }
                } else {
                    // Normal flow - show results
                    this.renderAnalysisResults(analysisData);
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
            
            // Create loading container if it doesn't exist
            let loadingContainer = document.getElementById('analysis-loading-container');
            if (!loadingContainer) {
                loadingContainer = document.createElement('div');
                loadingContainer.id = 'analysis-loading-container';
                loadingContainer.className = 'fixed inset-0 z-50 bg-gray-50';
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
                <div class="min-h-screen flex items-center justify-center p-4">
                    <div class="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden">
                        <!-- Header with gradient -->
                        <div class="bg-gradient-to-r from-blue-600 to-purple-600 p-8 text-white">
                            <h2 class="text-2xl font-bold mb-2">Analyzing Your Property</h2>
                            <div class="flex items-center justify-between">
                                <div class="flex-1">
                                    <div class="bg-white/20 rounded-full h-4 overflow-hidden">
                                        <div id="progress-bar" class="bg-white h-full rounded-full transition-all duration-500" style="width: 0%"></div>
                                    </div>
                                </div>
                                <span id="progress-percentage" class="ml-4 text-xl font-bold">0%</span>
                                <span class="ml-1 text-sm">Complete</span>
                            </div>
                        </div>
                        
                        <!-- Steps List -->
                        <div class="p-8">
                            <div class="space-y-3">
                                ${analysisSteps.map(step => `
                                    <div id="step-${step.id}" class="flex items-center">
                                        <div class="step-indicator w-6 h-6 rounded-full border-2 border-gray-300 bg-white mr-3 flex items-center justify-center">
                                            <svg class="w-4 h-4 text-green-500 hidden" fill="currentColor" viewBox="0 0 20 20">
                                                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
                                            </svg>
                                            <div class="spinner w-3 h-3 border-2 border-purple-600 border-t-transparent rounded-full animate-spin hidden"></div>
                                        </div>
                                        <span class="step-text text-gray-600">${step.text}</span>
                                        <div class="step-progress ml-auto hidden">
                                            <div class="bg-gray-200 rounded-full h-2 w-24">
                                                <div class="bg-gradient-to-r from-blue-600 to-purple-600 h-full rounded-full transition-all duration-300" style="width: 0%"></div>
                                            </div>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                            
                            <!-- Analysis Timeout Warning -->
                            <div id="timeout-warning" class="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg hidden">
                                <p class="text-sm text-red-600 flex items-center">
                                    <svg class="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                        <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path>
                                    </svg>
                                    Analysis Timeout: The analysis is taking longer than expected. This might be due to high server load. Please try again or contact support if the issue persists.
                                </p>
                            </div>
                            
                            <!-- Retry Button -->
                            <div class="mt-8 text-center">
                                <button id="retry-analysis-btn" class="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all hidden">
                                    Retry Analysis
                                </button>
                            </div>
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
                if (currentStep >= totalSteps) return;
                
                // Update current step to in-progress
                const stepEl = document.getElementById(`step-${steps[currentStep].id}`);
                if (stepEl) {
                    const indicator = stepEl.querySelector('.step-indicator');
                    const spinner = indicator.querySelector('.spinner');
                    const checkmark = indicator.querySelector('svg');
                    const progressBar = stepEl.querySelector('.step-progress');
                    
                    // Show spinner
                    spinner.classList.remove('hidden');
                    indicator.classList.add('border-purple-600');
                    
                    // Show progress bar for current step
                    if (progressBar) {
                        progressBar.classList.remove('hidden');
                        setTimeout(() => {
                            progressBar.querySelector('div div').style.width = '100%';
                        }, 100);
                    }
                    
                    // Complete step after delay
                    setTimeout(() => {
                        spinner.classList.add('hidden');
                        checkmark.classList.remove('hidden');
                        indicator.classList.remove('border-purple-600');
                        indicator.classList.add('border-green-500', 'bg-green-50');
                        stepEl.querySelector('.step-text').classList.add('text-green-600', 'font-medium');
                        
                        // Update overall progress
                        const progress = Math.round(((currentStep + 1) / totalSteps) * 100);
                        document.getElementById('progress-bar').style.width = `${progress}%`;
                        document.getElementById('progress-percentage').textContent = `${progress}%`;
                        
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
            const mainContent = document.getElementById('main-content');
            if (mainContent) {
                mainContent.style.display = 'block';
            }
        }
        
        renderAnalysisResults(analysisData) {
            // Hide loading container if it exists
            const loadingContainer = document.getElementById('analysis-loading-container');
            if (loadingContainer) {
                loadingContainer.style.display = 'none';
            }
            
            // Hide property confirmation container if it exists
            const confirmationContainer = document.getElementById('property-confirmation-container');
            if (confirmationContainer) {
                confirmationContainer.style.display = 'none';
            }
            
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
        }
    };

})();