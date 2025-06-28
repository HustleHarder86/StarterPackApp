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

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { userId, propertyId, reportType = 'summary', options = {} } = req.body;

  if (!userId || !propertyId) {
    return res.status(400).json({ 
      error: 'Missing required parameters: userId and propertyId' 
    });
  }

  try {
    const db = admin.firestore();
    
    // Get property data
    const propertyDoc = await db.collection('properties').doc(propertyId).get();
    if (!propertyDoc.exists) {
      return res.status(404).json({ error: 'Property not found' });
    }
    
    const property = propertyDoc.data();
    
    // Verify property belongs to user
    if (property.userId !== userId) {
      return res.status(403).json({ error: 'Unauthorized to generate report for this property' });
    }
    
    // Get latest analysis for the property
    const analysisSnapshot = await db.collection('analyses')
      .where('propertyId', '==', propertyId)
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .limit(1)
      .get();
    
    if (analysisSnapshot.empty) {
      return res.status(404).json({ error: 'No analysis found for this property' });
    }
    
    const analysis = analysisSnapshot.docs[0].data();
    
    // Create report record
    const reportData = {
      userId,
      propertyId,
      analysisId: analysisSnapshot.docs[0].id,
      propertyAddress: property.address?.street || 'Unknown Property',
      reportType,
      options,
      status: 'generating',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
    };
    
    const reportRef = await db.collection('reports').add(reportData);
    
    console.log(`Created report ${reportRef.id} for property ${propertyId}`);
    
    // In a production environment, this would trigger a background job
    // to generate the PDF. For now, we'll simulate it with a delayed update
    setTimeout(async () => {
      try {
        // Simulate PDF generation
        const mockPdfUrl = `https://firebasestorage.googleapis.com/v0/b/${process.env.FIREBASE_PROJECT_ID}.appspot.com/o/reports%2F${reportRef.id}.pdf?alt=media`;
        
        await db.collection('reports').doc(reportRef.id).update({
          status: 'ready',
          fileUrl: mockPdfUrl,
          fileSize: 1024 * 512, // 512KB mock size
          generatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        
        console.log(`Report ${reportRef.id} marked as ready`);
      } catch (error) {
        console.error('Error updating report status:', error);
        await db.collection('reports').doc(reportRef.id).update({
          status: 'failed',
          error: error.message
        });
      }
    }, 5000); // 5 second delay to simulate generation
    
    return res.status(200).json({ 
      success: true,
      reportId: reportRef.id,
      message: 'Report generation started',
      estimatedTime: '5-10 seconds'
    });

  } catch (error) {
    console.error('Error generating report:', error);
    return res.status(500).json({ 
      error: 'Failed to generate report',
      details: error.message 
    });
  }
}