import admin from '../../utils/firebase-admin.js';

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS, PATCH, DELETE, POST, PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { propertyId, userId } = req.query;

  if (!propertyId || !userId) {
    return res.status(400).json({ 
      error: 'Missing required parameters: propertyId and userId' 
    });
  }

  try {
    const db = admin.firestore();
    
    // Verify property belongs to user
    const propertyDoc = await db.collection('properties').doc(propertyId).get();
    
    if (!propertyDoc.exists) {
      return res.status(404).json({ error: 'Property not found' });
    }
    
    if (propertyDoc.data().userId !== userId) {
      return res.status(403).json({ error: 'Unauthorized to delete this property' });
    }

    // Delete property
    await db.collection('properties').doc(propertyId).delete();
    
    // Delete related analyses
    const analysesSnapshot = await db.collection('analyses')
      .where('propertyId', '==', propertyId)
      .get();
    
    const batch = db.batch();
    analysesSnapshot.forEach(doc => {
      batch.delete(doc.ref);
    });
    
    // Delete related reports
    const reportsSnapshot = await db.collection('reports')
      .where('propertyId', '==', propertyId)
      .get();
    
    reportsSnapshot.forEach(doc => {
      batch.delete(doc.ref);
    });
    
    await batch.commit();

    console.log(`Deleted property ${propertyId} and related data for user ${userId}`);

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
      details: error.message 
    });
  }
}