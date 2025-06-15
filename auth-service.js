// auth-service.js
// Authentication and user management service

import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut,
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth';
import { 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  increment,
  serverTimestamp 
} from 'firebase/firestore';
import { auth, db } from './firebase-config';

// User tier limits
const TIER_LIMITS = {
  trial: 3,      // 3 free analyses
  starter: 100,  // 100 analyses/month
  pro: 250,      // 250 analyses/month
  enterprise: -1 // Unlimited
};

class AuthService {
  constructor() {
    this.currentUser = null;
    this.userProfile = null;
  }

  // Initialize auth listener
  initAuthListener(callback) {
    return onAuthStateChanged(auth, async (user) => {
      if (user) {
        this.currentUser = user;
        await this.loadUserProfile(user.uid);
        callback(user, this.userProfile);
      } else {
        this.currentUser = null;
        this.userProfile = null;
        callback(null, null);
      }
    });
  }

  // Create new user with trial
  async signUpWithTrial(email, password, displayName, phoneNumber) {
    try {
      // Create Firebase auth user
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Update display name
      await updateProfile(user, { displayName });

      // Create user profile in Firestore
      const trialEndsAt = new Date();
      trialEndsAt.setDate(trialEndsAt.getDate() + 7); // 7-day trial

      const userProfile = {
        email,
        displayName,
        phoneNumber,
        createdAt: serverTimestamp(),
        subscriptionStatus: 'trial',
        subscriptionTier: 'trial',
        trialEndsAt: trialEndsAt,
        monthlyAnalysisCount: 0,
        monthlyAnalysisLimit: TIER_LIMITS.trial,
        lastResetDate: new Date(),
        stripeCustomerId: null
      };

      await setDoc(doc(db, 'users', user.uid), userProfile);

      // Notify Make.com webhook about new user
      await this.notifyMakeWebhook('user_created', {
        userId: user.uid,
        email,
        displayName,
        phoneNumber
      });

      return { user, userProfile };
    } catch (error) {
      console.error('Signup error:', error);
      throw error;
    }
  }

  // Sign in existing user
  async signIn(email, password) {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      await this.loadUserProfile(userCredential.user.uid);
      return { user: userCredential.user, userProfile: this.userProfile };
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    }
  }

  // Load user profile from Firestore
  async loadUserProfile(userId) {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        this.userProfile = { id: userDoc.id, ...userDoc.data() };
        
        // Check if monthly reset is needed
        await this.checkMonthlyReset(userId);
      }
      return this.userProfile;
    } catch (error) {
      console.error('Load profile error:', error);
      throw error;
    }
  }

  // Check if user can perform analysis
  async canPerformAnalysis(userId) {
    const profile = await this.loadUserProfile(userId);
    
    // Check trial expiration
    if (profile.subscriptionStatus === 'trial') {
      const now = new Date();
      const trialEnd = profile.trialEndsAt.toDate();
      if (now > trialEnd) {
        return {
          allowed: false,
          reason: 'trial_expired',
          message: 'Your free trial has expired. Please upgrade to continue.'
        };
      }
    }

    // Check subscription status
    if (profile.subscriptionStatus === 'cancelled' || profile.subscriptionStatus === 'past_due') {
      return {
        allowed: false,
        reason: 'subscription_issue',
        message: 'Please update your subscription to continue.'
      };
    }

    // Check monthly limit
    if (profile.monthlyAnalysisLimit !== -1 && 
        profile.monthlyAnalysisCount >= profile.monthlyAnalysisLimit) {
      return {
        allowed: false,
        reason: 'limit_reached',
        message: `You've reached your monthly limit of ${profile.monthlyAnalysisLimit} analyses.`
      };
    }

    return { allowed: true };
  }

  // Increment analysis count
  async incrementAnalysisCount(userId) {
    await updateDoc(doc(db, 'users', userId), {
      monthlyAnalysisCount: increment(1)
    });
  }

  // Check and perform monthly reset if needed
  async checkMonthlyReset(userId) {
    const profile = this.userProfile;
    const now = new Date();
    const lastReset = profile.lastResetDate.toDate();
    
    // Check if a month has passed
    if (now.getMonth() !== lastReset.getMonth() || 
        now.getFullYear() !== lastReset.getFullYear()) {
      await updateDoc(doc(db, 'users', userId), {
        monthlyAnalysisCount: 0,
        lastResetDate: now
      });
    }
  }

  // Update subscription after Stripe payment
  async updateSubscription(userId, tier, stripeCustomerId, stripeSubscriptionId) {
    const updates = {
      subscriptionStatus: 'active',
      subscriptionTier: tier,
      stripeCustomerId,
      monthlyAnalysisLimit: TIER_LIMITS[tier] || TIER_LIMITS.starter
    };

    await updateDoc(doc(db, 'users', userId), updates);

    // Create subscription record
    await setDoc(doc(db, 'subscriptions', userId), {
      stripeSubscriptionId,
      stripePriceId: this.getStripePriceId(tier),
      status: 'active',
      tier,
      monthlyLimit: TIER_LIMITS[tier],
      currentPeriodStart: serverTimestamp(),
      cancelAtPeriodEnd: false
    });
  }

  // Get Stripe price ID based on tier
  getStripePriceId(tier) {
    const priceIds = {
      starter: 'price_starter_monthly',
      pro: 'price_pro_monthly',
      enterprise: 'price_enterprise_monthly'
    };
    return priceIds[tier];
  }

  // Sign out
  async signOutUser() {
    try {
      await signOut(auth);
      this.currentUser = null;
      this.userProfile = null;
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  }

  // Notify Make.com webhook
  async notifyMakeWebhook(event, data) {
    try {
      const webhookUrl = import.meta.env.VITE_MAKE_USER_WEBHOOK || process.env.VITE_MAKE_USER_WEBHOOK;
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          event,
          timestamp: new Date().toISOString(),
          ...data
        })
      });
      
      if (!response.ok) {
        throw new Error('Webhook notification failed');
      }
    } catch (error) {
      console.error('Webhook error:', error);
      // Don't throw - webhook failures shouldn't break the flow
    }
  }
}

export default new AuthService();
