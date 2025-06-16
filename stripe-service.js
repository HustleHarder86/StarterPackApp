// stripe-service.js
// Stripe payment integration service (works without Stripe keys)

import { auth, db } from './firebase-config';
import { doc, updateDoc, getDoc } from 'firebase/firestore';

class StripeService {
  constructor() {
    this.stripe = null;
    this.apiEndpoint = import.meta.env.VITE_API_URL || '/api';
    this.stripeEnabled = false;
    
    // Check if Stripe keys are available
    const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || process.env.VITE_STRIPE_PUBLISHABLE_KEY;
    if (publishableKey && publishableKey !== 'your_stripe_publishable_key') {
      this.stripeEnabled = true;
      this.initStripe(publishableKey);
    }
    
    this.priceIds = {
      starter: {
        monthly: import.meta.env.VITE_STRIPE_PRICE_STARTER_MONTHLY || 'price_starter_monthly_placeholder',
        yearly: import.meta.env.VITE_STRIPE_PRICE_STARTER_YEARLY || 'price_starter_yearly_placeholder'
      },
      pro: {
        monthly: import.meta.env.VITE_STRIPE_PRICE_PRO_MONTHLY || 'price_pro_monthly_placeholder',
        yearly: import.meta.env.VITE_STRIPE_PRICE_PRO_YEARLY || 'price_pro_yearly_placeholder'
      },
      enterprise: {
        monthly: import.meta.env.VITE_STRIPE_PRICE_ENTERPRISE_MONTHLY || 'price_enterprise_monthly_placeholder',
        yearly: import.meta.env.VITE_STRIPE_PRICE_ENTERPRISE_YEARLY || 'price_enterprise_yearly_placeholder'
      }
    };
  }

  async initStripe(publishableKey) {
    try {
      const { loadStripe } = await import('@stripe/stripe-js');
      this.stripe = await loadStripe(publishableKey);
    } catch (error) {
      console.warn('Stripe initialization skipped:', error);
      this.stripeEnabled = false;
    }
  }

  async init() {
    // For backward compatibility
    if (this.stripeEnabled && !this.stripe) {
      const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || process.env.VITE_STRIPE_PUBLISHABLE_KEY;
      await this.initStripe(publishableKey);
    }
  }

  // Create Stripe Checkout session
  async createCheckoutSession(userId, tier, billingCycle = 'monthly') {
    try {
      if (!this.stripeEnabled) {
        console.warn('Stripe is not configured. Showing demo mode message.');
        alert('Payment processing is not available in demo mode. Please contact support to upgrade your account.');
        return { error: 'Stripe not configured' };
      }

      const user = auth.currentUser;
      if (!user) throw new Error('User not authenticated');

      // Call our API endpoint to create Stripe session
      const response = await fetch(`${this.apiEndpoint}/stripe-operations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'create_checkout_session',
          data: {
            userId: user.uid,
            email: user.email,
            tier: tier,
            priceId: this.priceIds[tier][billingCycle],
            billingCycle: billingCycle,
            successUrl: `${window.location.origin}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
            cancelUrl: `${window.location.origin}/roi-finder`
          }
        })
      });

      if (!response.ok) {
        const error = await response.json();
        if (error.details?.includes('Stripe not configured')) {
          alert('Payment processing is not available in demo mode. Please contact support to upgrade your account.');
          return { error: 'Stripe not configured' };
        }
        throw new Error('Failed to create checkout session');
      }

      const data = await response.json();
      
      // Redirect to Stripe Checkout
      if (this.stripe && data.sessionId) {
        const { error } = await this.stripe.redirectToCheckout({
          sessionId: data.sessionId
        });
        
        if (error) {
          throw error;
        }
      } else if (data.url) {
        // Fallback to direct URL redirect
        window.location.href = data.url;
      }
      
      return data;
    } catch (error) {
      console.error('Checkout session error:', error);
      throw error;
    }
  }

  // Create customer portal session for subscription management
  async createPortalSession() {
    try {
      if (!this.stripeEnabled) {
        alert('Subscription management is not available in demo mode.');
        return { error: 'Stripe not configured' };
      }

      const user = auth.currentUser;
      if (!user) throw new Error('User not authenticated');

      // Get user's Stripe customer ID from Firestore
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      const userData = userDoc.data();
      
      if (!userData.stripeCustomerId) {
        throw new Error('No active subscription found');
      }

      const response = await fetch(`${this.apiEndpoint}/stripe-operations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'create_portal_session',
          data: {
            customerId: userData.stripeCustomerId,
            returnUrl: `${window.location.origin}/account`
          }
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create portal session');
      }

      const data = await response.json();
      
      // Redirect to Stripe Customer Portal
      window.location.href = data.url;
      
      return data;
    } catch (error) {
      console.error('Portal session error:', error);
      throw error;
    }
  }

  // Handle successful payment (called from success page)
  async handlePaymentSuccess(sessionId) {
    try {
      if (!this.stripeEnabled) {
        console.warn('Stripe payment verification skipped - no Stripe keys');
        return { success: false, error: 'Stripe not configured' };
      }

      // Verify payment with our API
      const response = await fetch(`${this.apiEndpoint}/stripe-operations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'verify_payment',
          data: {
            sessionId: sessionId
          }
        })
      });

      if (!response.ok) {
        throw new Error('Failed to verify payment');
      }

      const data = await response.json();
      
      // The API endpoint already updated the user's subscription in Firebase
      // We can add any additional client-side actions here if needed
      
      return data;
    } catch (error) {
      console.error('Payment verification error:', error);
      throw error;
    }
  }

  // Cancel subscription
  async cancelSubscription(subscriptionId) {
    try {
      if (!this.stripeEnabled) {
        alert('Subscription cancellation is not available in demo mode.');
        return { error: 'Stripe not configured' };
      }

      const user = auth.currentUser;
      if (!user) throw new Error('User not authenticated');

      const response = await fetch(`${this.apiEndpoint}/stripe-operations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'cancel_subscription',
          data: {
            userId: user.uid,
            subscriptionId: subscriptionId
          }
        })
      });

      if (!response.ok) {
        throw new Error('Failed to cancel subscription');
      }

      const data = await response.json();
      
      // Update local user state
      await updateDoc(doc(db, 'users', user.uid), {
        subscriptionStatus: 'cancelling'
      });
      
      return data;
    } catch (error) {
      console.error('Cancellation error:', error);
      throw error;
    }
  }

  // Update payment method
  async updatePaymentMethod() {
    try {
      if (!this.stripeEnabled) {
        alert('Payment method update is not available in demo mode.');
        return { error: 'Stripe not configured' };
      }

      // Simply redirect to customer portal where they can update payment method
      await this.createPortalSession();
    } catch (error) {
      console.error('Update payment error:', error);
      throw error;
    }
  }

  // Check if Stripe is enabled
  isEnabled() {
    return this.stripeEnabled;
  }
}

export default new StripeService();
