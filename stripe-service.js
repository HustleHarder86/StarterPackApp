// stripe-service.js
// Stripe payment integration service (no Make.com dependencies)

import { loadStripe } from '@stripe/stripe-js';
import { auth, db } from './firebase-config';
import { doc, updateDoc } from 'firebase/firestore';

// Initialize Stripe
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || process.env.VITE_STRIPE_PUBLISHABLE_KEY);

class StripeService {
  constructor() {
    this.stripe = null;
    this.apiEndpoint = import.meta.env.VITE_API_URL || '/api';
    this.priceIds = {
      starter: {
        monthly: import.meta.env.VITE_STRIPE_PRICE_STARTER_MONTHLY || process.env.VITE_STRIPE_PRICE_STARTER_MONTHLY,
        yearly: import.meta.env.VITE_STRIPE_PRICE_STARTER_YEARLY || process.env.VITE_STRIPE_PRICE_STARTER_YEARLY
      },
      pro: {
        monthly: import.meta.env.VITE_STRIPE_PRICE_PRO_MONTHLY || process.env.VITE_STRIPE_PRICE_PRO_MONTHLY,
        yearly: import.meta.env.VITE_STRIPE_PRICE_PRO_YEARLY || process.env.VITE_STRIPE_PRICE_PRO_YEARLY
      },
      enterprise: {
        monthly: import.meta.env.VITE_STRIPE_PRICE_ENTERPRISE_MONTHLY || process.env.VITE_STRIPE_PRICE_ENTERPRISE_MONTHLY,
        yearly: import.meta.env.VITE_STRIPE_PRICE_ENTERPRISE_YEARLY || process.env.VITE_STRIPE_PRICE_ENTERPRISE_YEARLY
      }
    };
  }

  async init() {
    this.stripe = await stripePromise;
  }

  // Create Stripe Checkout session
  async createCheckoutSession(userId, tier, billingCycle = 'monthly') {
    try {
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
      } else {
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
      // Simply redirect to customer portal where they can update payment method
      await this.createPortalSession();
    } catch (error) {
      console.error('Update payment error:', error);
      throw error;
    }
  }
}

export default new StripeService();
