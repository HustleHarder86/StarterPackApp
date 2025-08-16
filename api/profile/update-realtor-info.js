import admin from '../../utils/firebase-admin.js';
import { applyCorsHeaders } from '../../utils/cors-config.js';

export default async function handler(req, res) {
  // Apply CORS headers
  applyCorsHeaders(req, res);
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    // Get auth token
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No authorization token provided' });
    }
    
    const token = authHeader.substring(7);
    const decodedToken = await admin.auth().verifyIdToken(token);
    const userId = decodedToken.uid;
    
    // Get profile data from request
    const { realtorProfile } = req.body;
    
    if (!realtorProfile) {
      return res.status(400).json({ error: 'No profile data provided' });
    }
    
    // Validate required fields
    if (!realtorProfile.name || !realtorProfile.email || !realtorProfile.phone) {
      return res.status(400).json({ 
        error: 'Missing required fields: name, email, and phone are required' 
      });
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(realtorProfile.email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }
    
    // Validate phone format (basic validation)
    const phoneRegex = /^[\d\s\-\(\)\+]+$/;
    if (!phoneRegex.test(realtorProfile.phone)) {
      return res.status(400).json({ error: 'Invalid phone format' });
    }
    
    // Update user document in Firestore
    const db = admin.firestore();
    const userRef = db.collection('users').doc(userId);
    
    // Add timestamp
    const profileData = {
      ...realtorProfile,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    await userRef.update({
      realtorProfile: profileData
    });
    
    console.log(`Updated realtor profile for user ${userId}`);
    
    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      profile: profileData
    });
    
  } catch (error) {
    console.error('Error updating realtor profile:', error);
    
    if (error.code === 'auth/id-token-expired') {
      return res.status(401).json({ error: 'Token expired' });
    }
    
    if (error.code === 'auth/invalid-id-token') {
      return res.status(401).json({ error: 'Invalid token' });
    }
    
    return res.status(500).json({ 
      error: 'Failed to update profile',
      details: error.message 
    });
  }
}