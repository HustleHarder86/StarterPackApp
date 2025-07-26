/**
 * Form Validation Module for StarterPackApp
 * Provides real-time validation feedback with enhanced error handling
 */

class FormValidator {
    constructor() {
        this.errorHandler = window.ErrorHandler ? new ErrorHandler() : null;
        this.validationRules = {
            email: {
                pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                message: 'Please enter a valid email address'
            },
            price: {
                min: 10000,
                max: 100000000,
                message: 'Price must be between $10,000 and $100,000,000'
            },
            bedrooms: {
                min: 0,
                max: 20,
                message: 'Bedrooms must be between 0 and 20'
            },
            bathrooms: {
                min: 1,
                max: 10,
                message: 'Bathrooms must be between 1 and 10'
            },
            sqft: {
                min: 100,
                max: 50000,
                message: 'Square footage must be between 100 and 50,000'
            },
            taxes: {
                min: 0,
                max: 1000000,
                message: 'Property taxes must be between $0 and $1,000,000'
            },
            condoFees: {
                min: 0,
                max: 10000,
                message: 'Condo fees must be between $0 and $10,000'
            }
        };
    }
    
    /**
     * Attach validation to form
     */
    attachToForm(formId) {
        const form = document.getElementById(formId);
        if (!form) return;
        
        // Add real-time validation to all inputs
        const inputs = form.querySelectorAll('input, select, textarea');
        inputs.forEach(input => {
            // Validate on blur
            input.addEventListener('blur', () => this.validateField(input));
            
            // Clear error on focus
            input.addEventListener('focus', () => this.clearFieldError(input));
            
            // Real-time validation for some fields
            if (input.type === 'email' || input.type === 'number') {
                input.addEventListener('input', () => {
                    clearTimeout(input.validationTimeout);
                    input.validationTimeout = setTimeout(() => {
                        this.validateField(input);
                    }, 500);
                });
            }
        });
        
        // Validate on form submit
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            if (this.validateForm(form)) {
                // Form is valid, proceed with submission
                if (form.onValidSubmit) {
                    form.onValidSubmit();
                }
            }
        });
    }
    
    /**
     * Validate individual field
     */
    validateField(field) {
        const fieldName = field.name || field.id;
        const value = field.value.trim();
        const isRequired = field.hasAttribute('required');
        
        // Clear previous error
        this.clearFieldError(field);
        
        // Check if required
        if (isRequired && !value) {
            this.showFieldError(field, 'This field is required');
            return false;
        }
        
        // Skip validation if not required and empty
        if (!isRequired && !value) {
            return true;
        }
        
        // Validate based on type
        switch (field.type) {
            case 'email':
                if (!this.validationRules.email.pattern.test(value)) {
                    this.showFieldError(field, this.validationRules.email.message);
                    return false;
                }
                break;
                
            case 'number':
                const numValue = parseFloat(value);
                if (isNaN(numValue)) {
                    this.showFieldError(field, 'Please enter a valid number');
                    return false;
                }
                
                // Check specific field rules
                if (fieldName.includes('price') && this.validationRules.price) {
                    if (numValue < this.validationRules.price.min || numValue > this.validationRules.price.max) {
                        this.showFieldError(field, this.validationRules.price.message);
                        return false;
                    }
                }
                
                if (fieldName.includes('bedroom') && this.validationRules.bedrooms) {
                    if (numValue < this.validationRules.bedrooms.min || numValue > this.validationRules.bedrooms.max) {
                        this.showFieldError(field, this.validationRules.bedrooms.message);
                        return false;
                    }
                }
                
                if (fieldName.includes('bathroom') && this.validationRules.bathrooms) {
                    if (numValue < this.validationRules.bathrooms.min || numValue > this.validationRules.bathrooms.max) {
                        this.showFieldError(field, this.validationRules.bathrooms.message);
                        return false;
                    }
                }
                
                if (fieldName.includes('sqft') && this.validationRules.sqft) {
                    if (numValue < this.validationRules.sqft.min || numValue > this.validationRules.sqft.max) {
                        this.showFieldError(field, this.validationRules.sqft.message);
                        return false;
                    }
                }
                
                if (fieldName.includes('tax') && this.validationRules.taxes) {
                    if (numValue < this.validationRules.taxes.min || numValue > this.validationRules.taxes.max) {
                        this.showFieldError(field, this.validationRules.taxes.message);
                        return false;
                    }
                }
                
                if (fieldName.includes('condo') && this.validationRules.condoFees) {
                    if (numValue < this.validationRules.condoFees.min || numValue > this.validationRules.condoFees.max) {
                        this.showFieldError(field, this.validationRules.condoFees.message);
                        return false;
                    }
                }
                break;
                
            case 'text':
                // Validate address
                if (fieldName.includes('address')) {
                    if (value.length < 10) {
                        this.showFieldError(field, 'Please enter a complete address');
                        return false;
                    }
                }
                break;
        }
        
        // Field is valid - show success indicator
        this.showFieldSuccess(field);
        return true;
    }
    
    /**
     * Validate entire form
     */
    validateForm(form) {
        const inputs = form.querySelectorAll('input, select, textarea');
        let isValid = true;
        let firstErrorField = null;
        
        inputs.forEach(input => {
            if (!this.validateField(input)) {
                isValid = false;
                if (!firstErrorField) {
                    firstErrorField = input;
                }
            }
        });
        
        // Focus on first error field
        if (firstErrorField) {
            firstErrorField.focus();
            firstErrorField.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        
        return isValid;
    }
    
    /**
     * Show field error
     */
    showFieldError(field, message) {
        // Use enhanced error handler if available
        if (this.errorHandler) {
            this.errorHandler.displayInlineError(message, field.id);
        } else {
            // Fallback method
            const wrapper = field.closest('.form-group') || field.parentElement;
            
            // Remove existing error
            const existingError = wrapper.querySelector('.error-message');
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
            wrapper.appendChild(errorDiv);
            
            // Add error styling to field
            field.classList.add('border-red-500');
            field.classList.remove('border-green-500');
        }
    }
    
    /**
     * Show field success
     */
    showFieldSuccess(field) {
        const wrapper = field.closest('.form-group') || field.parentElement;
        
        // Remove any error message
        const existingError = wrapper.querySelector('.error-message');
        if (existingError) {
            existingError.remove();
        }
        
        // Add success styling
        field.classList.remove('border-red-500');
        field.classList.add('border-green-500');
        
        // Add checkmark icon
        let successIcon = wrapper.querySelector('.success-icon');
        if (!successIcon) {
            successIcon = document.createElement('div');
            successIcon.className = 'success-icon absolute right-3 top-1/2 transform -translate-y-1/2 text-green-500';
            successIcon.innerHTML = `
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                </svg>
            `;
            
            // Make wrapper relative if needed
            if (!wrapper.style.position || wrapper.style.position === 'static') {
                wrapper.style.position = 'relative';
            }
            
            wrapper.appendChild(successIcon);
        }
    }
    
    /**
     * Clear field error
     */
    clearFieldError(field) {
        const wrapper = field.closest('.form-group') || field.parentElement;
        
        // Remove error message
        const errorMessage = wrapper.querySelector('.error-message');
        if (errorMessage) {
            errorMessage.remove();
        }
        
        // Remove success icon
        const successIcon = wrapper.querySelector('.success-icon');
        if (successIcon) {
            successIcon.remove();
        }
        
        // Remove styling
        field.classList.remove('border-red-500', 'border-green-500');
    }
    
    /**
     * Clear all form errors
     */
    clearFormErrors(form) {
        const inputs = form.querySelectorAll('input, select, textarea');
        inputs.forEach(input => this.clearFieldError(input));
    }
}

// Export for use
window.FormValidator = FormValidator;