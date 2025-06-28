import admin from '../../utils/firebase-admin.js';
import { authenticate } from '../../utils/auth-middleware.js';
import { validatePropertyId } from '../../utils/validators.js';
import { apiLimits } from '../../utils/rate-limiter.js';

// Wrap handler with middleware
async function deletePropertyHandler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', process.env.NODE_ENV === 'production' 
    ? 'https://starterpackapp.vercel.app' 
    : 'http://localhost:3000');
  res.setHeader('Access-Control-Allow-Methods', 'DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { propertyId } = req.query;
  const userId = req.user.uid; // Get from authenticated user, not query

  if (!propertyId) {
    return res.status(400).json({ 
      error: 'Missing required parameter: propertyId' 
    });
  }
  
  // Validate property ID
  let validatedPropertyId;
  try {
    validatedPropertyId = validatePropertyId(propertyId);
  } catch (error) {
    return res.status(400).json({ 
      error: 'Invalid property ID',
      message: error.message 
    });
  }

  try {
    const db = admin.firestore();
    
    // Verify property belongs to user
    const propertyDoc = await db.collection('properties').doc(validatedPropertyId).get();
    
    if (!propertyDoc.exists) {
      return res.status(404).json({ error: 'Property not found' });
    }
    
    if (propertyDoc.data().userId !== userId) {
      return res.status(403).json({ error: 'Unauthorized to delete this property' });
    }

    // Delete property
    await db.collection('properties').doc(validatedPropertyId).delete();
    
    // Delete related analyses
    const analysesSnapshot = await db.collection('analyses')
      .where('propertyId', '==', validatedPropertyId)
      .get();
    
    const batch = db.batch();
    analysesSnapshot.forEach(doc => {
      batch.delete(doc.ref);
    });
    
    // Delete related reports
    const reportsSnapshot = await db.collection('reports')
      .where('propertyId', '==', validatedPropertyId)
      .get();
    
    reportsSnapshot.forEach(doc => {
      batch.delete(doc.ref);
    });
    
    await batch.commit();

    console.log(`Deleted property ${validatedPropertyId} and related data for user ${userId}`);

    return res.status(200).json({ 
      success: true,
      message: 'Property and related data deleted successfully',
      deletedItems: {
        properties: 1,
        analyses: analysesSnapshot.size,
        reports: reportsSnapshot.size
      }
    });

  } catch (error) {
    console.error('Error deleting property:', error);
    return res.status(500).json({ 
      error: 'Failed to delete property',
      message: 'An error occurred while deleting the property' 
    });
  }
}

// Export handler with authentication and rate limiting
export default async function handler(req, res) {
  // Apply rate limiting
  await new Promise((resolve, reject) => {
    apiLimits.properties(req, res, (err) => {
      if (err) reject(err);
      else resolve();
    });
  }).catch(() => {}); // Rate limit response already sent

  // Apply authentication
  await new Promise((resolve, reject) => {
    authenticate(req, res, (err) => {
      if (err) reject(err);
      else resolve();
    });
  }).catch(() => {}); // Auth response already sent

  // If we got here, user is authenticated and within rate limits
  if (req.user) {
    return deletePropertyHandler(req, res);
  }
}