// stripe-service.js
// Stripe payment integration service

import { loadStripe } from '@stripe/stripe-js';
import { auth, db } from './firebase-config';
import { doc, updateDoc } from 'firebase/firestore';

// Initialize Stripe
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || process.env.VITE_STRIPE_PUBLISHABLE_KEY);

class StripeService {
  constructor() {
    this.stripe = null;
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

  // Create Stripe Checkout session via Make.com webhook
  async createCheckoutSession(userId, tier, billingCycle = 'monthly') {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('User not authenticated');

      // Call Make.com webhook to create Stripe session
      const webhookUrl = import.meta.env.VITE_MAKE_STRIPE_WEBHOOK || process.env.VITE_MAKE_STRIPE_WEBHOOK;
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'create_checkout_session',
          userId: user.uid,
          email: user.email,
          tier: tier,
          priceId: this.priceIds[tier][billingCycle],
          billingCycle: billingCycle,
          successUrl: `${window.location.origin}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
          cancelUrl: `${window.location.origin}/roi-finder`,
          metadata: {
            userId: user.uid,
            tier: tier,
            billingCycle: billingCycle
          }
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create checkout session');
      }

      const data = await response.json();
      return data; // Should contain { url: 'stripe_checkout_url' }
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

      const webhookUrl = import.meta.env.VITE_MAKE_STRIPE_WEBHOOK || process.env.VITE_MAKE_STRIPE_WEBHOOK;
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'create_portal_session',
          userId: user.uid,
          returnUrl: `${window.location.origin}/account`
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create portal session');
      }

      const data = await response.json();
      return data; // Should contain { url: 'stripe_portal_url' }
    } catch (error) {
      console.error('Portal session error:', error);
      throw error;
    }
  }

  // Handle successful payment (called from success page)
  async handlePaymentSuccess(sessionId) {
    try {
      // Verify payment with Make.com
      const response = await fetch('YOUR_MAKE_STRIPE_WEBHOOK_URL', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'verify_payment',
          sessionId: sessionId
        })
      });

      if (!response.ok) {
        throw new Error('Failed to verify payment');
      }

      const data = await response.json();
      
      // Update user's subscription status
      if (data.success && data.subscription) {
        await this.updateUserSubscription(
          data.metadata.userId,
          data.metadata.tier,
          data.customerId,
          data.subscriptionId
        );
      }

      return data;
    } catch (error) {
      console.error('Payment verification error:', error);
      throw error;
    }
  }

  // Update user subscription in Firestore
  async updateUserSubscription(userId, tier, customerId, subscriptionId) {
    const tierLimits = {
      starter: 100,
      pro: 250,
      enterprise: -1
    };

    await updateDoc(doc(db, 'users', userId), {
      subscriptionStatus: 'active',
      subscriptionTier: tier,
      stripeCustomerId: customerId,
      monthlyAnalysisLimit: tierLimits[tier] || 100
    });
  }

  // Cancel subscription
  async cancelSubscription() {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('User not authenticated');

      const response = await fetch('YOUR_MAKE_STRIPE_WEBHOOK_URL', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'cancel_subscription',
          userId: user.uid
        })
      });

      if (!response.ok) {
        throw new Error('Failed to cancel subscription');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Cancellation error:', error);
      throw error;
    }
  }

  // Update payment method
  async updatePaymentMethod() {
    try {
      const portalSession = await this.createPortalSession();
      window.location.href = portalSession.url;
    } catch (error) {
      console.error('Update payment error:', error);
      throw error;
    }
  }
}

export default new StripeService();
