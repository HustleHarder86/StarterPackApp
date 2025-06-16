// api/stripe-operations.js
// Stripe payment operations API endpoint

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
  
  try {
    const { action, data } = req.body;

    switch (action) {
      case 'create_checkout_session':
        const { userId, email, tier, priceId, billingCycle, successUrl, cancelUrl } = data;
        
        const session = await stripe.checkout.sessions.create({
          payment_method_types: ['card'],
          line_items: [
            {
              price: priceId,
              quantity: 1,
            },
          ],
          mode: 'subscription',
          success_url: successUrl,
          cancel_url: cancelUrl,
          customer_email: email,
          metadata: {
            userId,
            tier,
            billingCycle
          },
          subscription_data: {
            metadata: {
              userId,
              tier
            }
          }
        });

        return res.status(200).json({ 
          success: true,
          sessionId: session.id,
          url: session.url
        });

      case 'create_portal_session':
        const { customerId, returnUrl } = data;
        
        const portalSession = await stripe.billingPortal.sessions.create({
          customer: customerId,
          return_url: returnUrl,
        });

        return res.status(200).json({ 
          success: true,
          url: portalSession.url
        });

      case 'verify_payment':
        const { sessionId } = data;
        
        const verifySession = await stripe.checkout.sessions.retrieve(sessionId, {
          expand: ['subscription', 'customer']
        });

        if (verifySession.payment_status === 'paid') {
          // Update user subscription in Firebase
          const admin = await import('firebase-admin');
          
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
          const { userId, tier } = verifySession.metadata;
          
          await db.collection('users').doc(userId).update({
            subscriptionStatus: 'active',
            subscriptionTier: tier,
            stripeCustomerId: verifySession.customer.id,
            monthlyAnalysisLimit: {
              'starter': 100,
              'pro': 250,
              'enterprise': -1
            }[tier] || 100
          });

          return res.status(200).json({ 
            success: true,
            subscription: verifySession.subscription,
            customerId: verifySession.customer.id,
            metadata: verifySession.metadata
          });
        } else {
          return res.status(400).json({ 
            success: false,
            error: 'Payment not completed'
          });
        }

      case 'cancel_subscription':
        const { subscriptionId } = data;
        
        const canceledSubscription = await stripe.subscriptions.update(
          subscriptionId,
          { cancel_at_period_end: true }
        );

        return res.status(200).json({ 
          success: true,
          subscription: canceledSubscription
        });

      default:
        return res.status(400).json({ error: 'Invalid action' });
    }
  } catch (error) {
    console.error('Stripe operation error:', error);
    return res.status(500).json({ 
      error: 'Stripe operation failed', 
      details: error.message 
    });
  }
}
