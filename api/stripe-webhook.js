import { apiLimits } from '../utils/rate-limiter.js';

// api/stripe-webhook.js
// Stripe webhook handler for subscription events (works without Stripe keys)

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Check if Stripe is configured
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
  
  const isStripeConfigured = stripeSecretKey && 
    stripeSecretKey !== 'sk_test_your_stripe_secret_key' &&
    stripeSecretKey.startsWith('sk_') &&
    endpointSecret &&
    endpointSecret !== 'whsec_your_webhook_secret';

  if (!isStripeConfigured) {
    console.warn('Stripe webhook called but Stripe is not configured');
    // Return 200 to prevent webhook retries when Stripe is not configured
    return res.status(200).json({ 
      received: true,
      message: 'Stripe not configured, webhook ignored'
    });
  }

  const stripe = require('stripe')(stripeSecretKey);
  let event;

  try {
    // Verify webhook signature
    const sig = req.headers['stripe-signature'];
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Initialize Firebase Admin
  const adminModule = await import('firebase-admin');
  const admin = adminModule.default;
  
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
      })
    });
  }

  const db = admin.firestore();

  // Handle the event
  try {
    switch (event.type) {
      case 'checkout.session.completed':
        // Payment is successful and subscription is created
        const session = event.data.object;
        const { userId, tier } = session.metadata;

        if (userId && tier) {
          await db.collection('users').doc(userId).update({
            subscriptionStatus: 'active',
            subscriptionTier: tier,
            stripeCustomerId: session.customer,
            monthlyAnalysisLimit: {
              'starter': 100,
              'pro': 250,
              'enterprise': -1
            }[tier] || 100
          });

          // Create subscription record
          if (session.subscription) {
            await db.collection('subscriptions').doc(userId).set({
              stripeSubscriptionId: session.subscription,
              stripeCustomerId: session.customer,
              status: 'active',
              tier,
              currentPeriodStart: admin.firestore.FieldValue.serverTimestamp()
            });
          }
        }
        break;

      case 'customer.subscription.updated':
        // Subscription updated (plan change, etc.)
        const updatedSubscription = event.data.object;
        const updateMetadata = updatedSubscription.metadata;
        
        if (updateMetadata.userId) {
          const newTier = updateMetadata.tier || 'starter';
          await db.collection('users').doc(updateMetadata.userId).update({
            subscriptionStatus: updatedSubscription.status,
            subscriptionTier: newTier,
            monthlyAnalysisLimit: {
              'starter': 100,
              'pro': 250,
              'enterprise': -1
            }[newTier] || 100
          });
        }
        break;

      case 'customer.subscription.deleted':
        // Subscription cancelled
        const cancelledSubscription = event.data.object;
        const cancelMetadata = cancelledSubscription.metadata;
        
        if (cancelMetadata.userId) {
          await db.collection('users').doc(cancelMetadata.userId).update({
            subscriptionStatus: 'cancelled',
            subscriptionTier: 'trial',
            monthlyAnalysisLimit: 3
          });
        }
        break;

      case 'invoice.payment_failed':
        // Payment failed
        const failedInvoice = event.data.object;
        
        // Find user by customer ID
        const usersSnapshot = await db.collection('users')
          .where('stripeCustomerId', '==', failedInvoice.customer)
          .limit(1)
          .get();
        
        if (!usersSnapshot.empty) {
          const userDoc = usersSnapshot.docs[0];
          await userDoc.ref.update({
            subscriptionStatus: 'past_due'
          });
        }
        break;

      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    return res.status(200).json({ received: true });
  } catch (error) {
    console.error('Webhook handler error:', error);
    return res.status(500).json({ error: 'Webhook handler failed' });
  }
}
