# Stripe Integration Guide

## Overview

Stripe provides payment processing and subscription management for the StarterPackApp. The integration is optional - the app functions without Stripe, showing demo mode when not configured.

## Configuration

### Environment Variables

**Client-side (Optional):**
```bash
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
VITE_STRIPE_PRICE_STARTER_MONTHLY=price_starter_monthly_id
VITE_STRIPE_PRICE_STARTER_YEARLY=price_starter_yearly_id
VITE_STRIPE_PRICE_PRO_MONTHLY=price_pro_monthly_id
VITE_STRIPE_PRICE_PRO_YEARLY=price_pro_yearly_id
VITE_STRIPE_PRICE_ENTERPRISE_MONTHLY=price_enterprise_monthly_id
VITE_STRIPE_PRICE_ENTERPRISE_YEARLY=price_enterprise_yearly_id
```

**Server-side (Optional):**
```bash
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
```

## Service Architecture

**Location**: `stripe-service.js`
**Features**: Graceful degradation when Stripe is not configured
**Integration**: Works seamlessly with or without Stripe credentials

## Service Implementation

```javascript
import { auth, db } from './firebase-config';
import { doc, updateDoc, getDoc } from 'firebase/firestore';

class StripeService {
  constructor() {
    this.stripe = null;
    this.apiEndpoint = import.meta.env.VITE_API_URL || '/api';
    this.stripeEnabled = false;
    
    // Check if Stripe keys are available
    const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
    if (publishableKey && publishableKey !== 'your_stripe_publishable_key') {
      this.stripeEnabled = true;
      this.initStripe(publishableKey);
    }
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

  isEnabled() {
    return this.stripeEnabled;
  }
}
```

## API Endpoints

### Create Checkout Session
```javascript
// Client-side
POST /api/stripe-operations
{
  "action": "create_checkout",
  "tier": "starter",
  "billing": "monthly",
  "successUrl": "https://your-domain.com/success",
  "cancelUrl": "https://your-domain.com/cancel"
}

// Server-side implementation
export default async function handler(req, res) {
  if (!process.env.STRIPE_SECRET_KEY) {
    return res.status(400).json({ 
      error: 'Stripe not configured',
      details: 'Payment processing is not available in demo mode'
    });
  }

  const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [{
      price: priceId,
      quantity: 1,
    }],
    mode: 'subscription',
    success_url: successUrl,
    cancel_url: cancelUrl,
    customer_email: user.email,
    metadata: {
      userId: user.uid,
      tier: tier,
      billing: billing
    }
  });

  res.json({ sessionId: session.id });
}
```

### Webhook Handler
```javascript
// /api/stripe-webhook.js
import { buffer } from 'micro';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).end();
  }

  const buf = await buffer(req);
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;
  try {
    event = stripe.webhooks.constructEvent(buf, sig, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle different event types
  switch (event.type) {
    case 'checkout.session.completed':
      await handleCheckoutCompleted(event.data.object);
      break;
    case 'customer.subscription.updated':
      await handleSubscriptionUpdated(event.data.object);
      break;
    case 'customer.subscription.deleted':
      await handleSubscriptionCanceled(event.data.object);
      break;
    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  res.json({ received: true });
}
```

## Subscription Tiers

### Pricing Structure
```javascript
const pricingTiers = {
  starter: {
    monthly: {
      priceId: 'price_starter_monthly',
      amount: 2900, // $29.00
      features: ['5 property analyses', 'Basic reports', 'Email support']
    },
    yearly: {
      priceId: 'price_starter_yearly', 
      amount: 29000, // $290.00 (save $58)
      features: ['5 property analyses', 'Basic reports', 'Email support']
    }
  },
  pro: {
    monthly: {
      priceId: 'price_pro_monthly',
      amount: 4900, // $49.00
      features: ['Unlimited analyses', 'Advanced reports', 'Priority support', 'API access']
    },
    yearly: {
      priceId: 'price_pro_yearly',
      amount: 49000, // $490.00 (save $98)
      features: ['Unlimited analyses', 'Advanced reports', 'Priority support', 'API access']
    }
  },
  enterprise: {
    monthly: {
      priceId: 'price_enterprise_monthly',
      amount: 9900, // $99.00
      features: ['White-label solution', 'Custom integrations', 'Dedicated support']
    }
  }
};
```

## Client Integration

### Checkout Flow
```javascript
async createCheckoutSession(tier, billing) {
  if (!this.stripeEnabled) {
    console.warn('Stripe not configured. Showing demo mode message.');
    return { error: 'Stripe not configured' };
  }

  try {
    const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated');

    const response = await fetch(`${this.apiEndpoint}/stripe-operations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${await user.getIdToken()}`
      },
      body: JSON.stringify({
        action: 'create_checkout',
        tier,
        billing,
        successUrl: `${window.location.origin}/payment-success`,
        cancelUrl: window.location.href
      })
    });

    const data = await response.json();
    
    if (data.error) {
      if (data.details?.includes('Stripe not configured')) {
        return { error: 'Stripe not configured' };
      }
      throw new Error(data.error);
    }

    // Redirect to Stripe Checkout
    if (this.stripe && data.sessionId) {
      const { error } = await this.stripe.redirectToCheckout({
        sessionId: data.sessionId
      });
      if (error) throw error;
    }

    return { success: true };
  } catch (error) {
    console.error('Checkout failed:', error);
    return { error: error.message };
  }
}
```

### Customer Portal
```javascript
async openCustomerPortal() {
  if (!this.stripeEnabled) {
    return { error: 'Stripe not configured' };
  }

  try {
    const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated');

    // Get user's Stripe customer ID from Firestore
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    const userData = userDoc.data();
    
    if (!userData.stripeCustomerId) {
      throw new Error('No subscription found');
    }

    const response = await fetch(`${this.apiEndpoint}/stripe-operations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${await user.getIdToken()}`
      },
      body: JSON.stringify({
        action: 'create_portal',
        customerId: userData.stripeCustomerId,
        returnUrl: window.location.href
      })
    });

    const data = await response.json();
    if (data.url) {
      window.location.href = data.url;
    }

    return data;
  } catch (error) {
    console.error('Portal access failed:', error);
    return { error: error.message };
  }
}
```

## Webhook Event Handling

### Subscription Lifecycle
```javascript
async function handleCheckoutCompleted(session) {
  const { customer, subscription, metadata } = session;
  const { userId, tier, billing } = metadata;

  // Update user record in Firebase
  await updateDoc(doc(db, 'users', userId), {
    stripeCustomerId: customer,
    stripeSubscriptionId: subscription,
    subscriptionTier: tier,
    subscriptionBilling: billing,
    subscriptionStatus: 'active',
    subscribedAt: new Date(),
    strTrialUsed: false // Reset trial status for paying customers
  });

  console.log(`Subscription activated for user ${userId}: ${tier} (${billing})`);
}

async function handleSubscriptionUpdated(subscription) {
  const { customer, status, items } = subscription;
  
  // Find user by customer ID
  const usersQuery = query(
    collection(db, 'users'),
    where('stripeCustomerId', '==', customer)
  );
  const userDocs = await getDocs(usersQuery);
  
  if (!userDocs.empty) {
    const userDoc = userDocs.docs[0];
    await updateDoc(userDoc.ref, {
      subscriptionStatus: status,
      stripeSubscriptionId: subscription.id,
      updatedAt: new Date()
    });
  }
}

async function handleSubscriptionCanceled(subscription) {
  const { customer } = subscription;
  
  // Find user by customer ID
  const usersQuery = query(
    collection(db, 'users'),
    where('stripeCustomerId', '==', customer)
  );
  const userDocs = await getDocs(usersQuery);
  
  if (!userDocs.empty) {
    const userDoc = userDocs.docs[0];
    await updateDoc(userDoc.ref, {
      subscriptionStatus: 'canceled',
      subscriptionTier: 'free',
      canceledAt: new Date()
    });
  }
}
```

## Testing & Development

### Stripe CLI Setup
```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login to your account
stripe login

# Forward webhooks to local server
stripe listen --forward-to localhost:3000/api/stripe-webhook

# Trigger test events
stripe trigger checkout.session.completed
stripe trigger customer.subscription.updated
stripe trigger customer.subscription.deleted
```

### Test Cards
```javascript
// Test card numbers for different scenarios
const testCards = {
  success: '4242424242424242',
  declined: '4000000000000002',
  requiresAuth: '4000002500003155',
  insufficientFunds: '4000000000009995'
};
```

## Error Handling

### Graceful Degradation
```javascript
// App continues to work without Stripe
class PaymentHandler {
  async handleUpgrade(tier) {
    if (!stripeService.isEnabled()) {
      // Show demo mode message
      this.showDemoModeDialog();
      return;
    }

    try {
      await stripeService.createCheckoutSession(tier, 'monthly');
    } catch (error) {
      console.error('Payment failed:', error);
      this.showErrorMessage('Payment processing failed. Please try again.');
    }
  }

  showDemoModeDialog() {
    alert('Payment processing is not configured. This is a demo version.');
  }
}
```

### Common Error Scenarios
```javascript
// Handle payment failures gracefully
async function handlePaymentError(error, tier) {
  if (error.includes('Stripe not configured')) {
    return {
      type: 'demo_mode',
      message: 'Payment processing unavailable in demo mode',
      action: 'continue_as_demo'
    };
  }

  if (error.includes('card_declined')) {
    return {
      type: 'payment_failed',
      message: 'Your card was declined. Please try a different payment method.',
      action: 'retry_payment'
    };
  }

  return {
    type: 'general_error',
    message: 'Payment processing failed. Please try again later.',
    action: 'retry_later'
  };
}
```

## Security Best Practices

### Webhook Security
```javascript
// Always verify webhook signatures
export default async function webhookHandler(req, res) {
  const signature = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  try {
    const event = stripe.webhooks.constructEvent(
      req.body,
      signature,
      webhookSecret
    );
    
    // Process verified event
    await processWebhookEvent(event);
  } catch (err) {
    console.error('Webhook verification failed:', err.message);
    return res.status(400).send('Webhook verification failed');
  }

  res.json({ received: true });
}
```

### API Key Management
```javascript
// Never expose secret keys in client-side code
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Use environment-specific keys
const getStripeKey = () => {
  return process.env.NODE_ENV === 'production'
    ? process.env.STRIPE_LIVE_SECRET_KEY
    : process.env.STRIPE_TEST_SECRET_KEY;
};
```

## Monitoring & Analytics

### Usage Tracking
```javascript
// Track subscription events
async function trackSubscriptionEvent(event, userId, metadata = {}) {
  await addDoc(collection(db, 'subscription_events'), {
    userId,
    event,
    metadata,
    timestamp: new Date(),
    source: 'stripe_webhook'
  });
}

// Track payment attempts
async function trackPaymentAttempt(sessionId, userId, tier, result) {
  await addDoc(collection(db, 'payment_attempts'), {
    sessionId,
    userId,
    tier,
    result, // 'success', 'failed', 'abandoned'
    timestamp: new Date()
  });
}
```

## Best Practices

### Implementation Guidelines
1. **Graceful Degradation**: App works without Stripe
2. **Security**: Always verify webhook signatures
3. **Error Handling**: Provide clear error messages
4. **Testing**: Use Stripe CLI for local development
5. **Monitoring**: Track subscription events and failures

### Performance Optimization
1. **Async Operations**: Don't block UI during payment processing
2. **Caching**: Cache subscription status locally
3. **Retry Logic**: Implement retry for failed API calls
4. **Timeouts**: Set appropriate timeouts for Stripe operations

## Troubleshooting

### Common Issues

1. **Webhook Not Firing**: Check endpoint URL and webhook configuration
2. **Payment Fails**: Verify API keys and test card numbers
3. **Demo Mode**: Check if STRIPE_SECRET_KEY is properly set
4. **CORS Errors**: Ensure domain is configured in Stripe dashboard

### Debug Tools
```javascript
// Enable Stripe debug logging in development
if (process.env.NODE_ENV === 'development') {
  stripe.setTelemetryEnabled(true);
}

// Log detailed error information
const handleStripeError = (error) => {
  console.error('Stripe Error:', {
    type: error.type,
    code: error.code,
    message: error.message,
    param: error.param
  });
};
```

## Links

- [Stripe Dashboard](https://dashboard.stripe.com/)
- [Stripe Documentation](https://stripe.com/docs)
- [Stripe Node.js Library](https://github.com/stripe/stripe-node)
- [Stripe CLI](https://stripe.com/docs/stripe-cli)
- [Webhook Testing](https://stripe.com/docs/webhooks/test)