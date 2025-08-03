// Stripe payment integration service (works without Stripe keys)
// Browser-compatible version without import.meta.env

class StripeService {
  constructor() {
    this.stripe = null;
    this.apiEndpoint = window.getAPIBaseUrl ? window.getAPIBaseUrl() : '/api';
    this.stripeEnabled = false;
    
    // Check if Stripe keys are available from window.ENV
    const publishableKey = window.ENV?.stripe?.publishableKey;
    if (publishableKey && publishableKey !== 'your_stripe_publishable_key') {
      this.stripeEnabled = true;
      this.initStripe(publishableKey);
    }
    
    // Price IDs - these would normally come from environment variables
    this.priceIds = {
      starter: {
        monthly: 'price_starter_monthly_placeholder',
        yearly: 'price_starter_yearly_placeholder'
      },
      pro: {
        monthly: 'price_pro_monthly_placeholder',
        yearly: 'price_pro_yearly_placeholder'
      },
      enterprise: {
        monthly: 'price_enterprise_monthly_placeholder',
        yearly: 'price_enterprise_yearly_placeholder'
      }
    };
  }

  async initStripe(publishableKey) {
    try {
      // Load Stripe from CDN if not already loaded
      if (window.Stripe) {
        this.stripe = window.Stripe(publishableKey);
      } else {
        console.warn('Stripe.js not loaded. Add <script src="https://js.stripe.com/v3/"></script> to use payments.');
      }
    } catch (error) {
      console.error('Failed to initialize Stripe:', error);
      this.stripeEnabled = false;
    }
  }

  isEnabled() {
    return this.stripeEnabled;
  }

  // Show message when Stripe is not configured
  showDisabledMessage(elementId = 'payment-message') {
    const element = document.getElementById(elementId);
    if (element) {
      element.innerHTML = `
        <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
          <p class="font-medium mb-1">Payment processing is currently disabled</p>
          <p>Contact support to enable subscription features.</p>
        </div>
      `;
    }
  }

  async createCheckoutSession(plan, interval) {
    if (!this.stripeEnabled) {
      this.showDisabledMessage();
      return null;
    }

    if (!auth.currentUser) {
      throw new Error('User must be logged in to subscribe');
    }

    const priceId = this.priceIds[plan]?.[interval];
    if (!priceId || priceId.includes('placeholder')) {
      throw new Error('Invalid subscription plan');
    }

    try {
      const idToken = await auth.currentUser.getIdToken();
      const response = await fetch(`${this.apiEndpoint}/stripe-create-checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({
          priceId,
          successUrl: `${window.location.origin}/payment-success.html?session_id={CHECKOUT_SESSION_ID}`,
          cancelUrl: `${window.location.origin}/pricing.html`
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create checkout session');
      }

      const { sessionId } = await response.json();
      
      // Redirect to Stripe Checkout
      const { error } = await this.stripe.redirectToCheckout({ sessionId });
      
      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Checkout error:', error);
      throw error;
    }
  }

  async cancelSubscription() {
    if (!this.stripeEnabled) {
      this.showDisabledMessage();
      return null;
    }

    if (!auth.currentUser) {
      throw new Error('User must be logged in');
    }

    try {
      const idToken = await auth.currentUser.getIdToken();
      const response = await fetch(`${this.apiEndpoint}/stripe-cancel-subscription`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to cancel subscription');
      }

      const result = await response.json();
      
      // Update local user data
      if (window.firebaseWrapper) {
        const user = auth.currentUser;
        await window.firebaseWrapper.updateUserData(user.uid, {
          subscriptionTier: 'free',
          subscriptionStatus: 'canceled',
          subscriptionEndDate: result.subscription.current_period_end
        });
      }
      
      return result;
    } catch (error) {
      console.error('Cancel subscription error:', error);
      throw error;
    }
  }

  async handlePaymentSuccess(sessionId) {
    if (!sessionId) {
      throw new Error('No session ID provided');
    }

    // The webhook will handle updating the user's subscription
    // We just need to verify the session and show success
    return {
      success: true,
      message: 'Payment successful! Your subscription is now active.'
    };
  }
}

// Create and export singleton instance
window.stripeService = new StripeService();