import admin from '../../utils/firebase-admin.js';
import { PDFReportBuilder } from '../../utils/pdf-report-builder.js';
import storageUploader from '../../utils/firebase-storage-uploader.js';
import { applyCorsHeaders } from '../../utils/cors-config.js';
import { apiLimits } from '../utils/rate-limiter.js';

export default async function handler(req, res) {
  // Apply proper CORS headers
  applyCorsHeaders(req, res);
  

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Apply rate limiting
  await new Promise((resolve, reject) => {
    apiLimits.reports(req, res, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { userId, propertyId, analysisId, reportConfig = {} } = req.body;

  if (!userId || (!propertyId && !analysisId)) {
    return res.status(400).json({ 
      error: 'Missing required parameters: userId and either propertyId or analysisId' 
    });
  }

  try {
    const db = admin.firestore();
    
    // Get analysis data
    let analysis;
    let analysisDocId;
    
    if (analysisId) {
      // Use provided analysis ID
      const analysisDoc = await db.collection('analyses').doc(analysisId).get();
      if (!analysisDoc.exists) {
        return res.status(404).json({ error: 'Analysis not found' });
      }
      analysis = analysisDoc.data();
      analysisDocId = analysisId;
      
      // Verify analysis belongs to user
      if (analysis.userId !== userId) {
        return res.status(403).json({ error: 'Unauthorized to generate report for this analysis' });
      }
    } else {
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
      
      analysis = analysisSnapshot.docs[0].data();
      analysisDocId = analysisSnapshot.docs[0].id;
    }
    
    // Get user data for realtor info
    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.exists ? userDoc.data() : {};
    const realtorInfo = userData.realtorProfile || null;
    
    // Generate unique file name
    const fileName = storageUploader.generateReportFileName(userId, propertyId || analysisDocId);
    
    // Create report record first
    const reportData = {
      userId,
      propertyId: propertyId || analysis.propertyId,
      analysisId: analysisDocId,
      propertyAddress: analysis.propertyAddress || 'Unknown Property',
      reportConfig: {
        selectedSections: reportConfig.selectedSections || [
          'executiveSummary',
          'propertyDetails',
          'financialAnalysis',
          'longTermRental',
          'investmentRecommendations'
        ],
        format: reportConfig.format || 'detailed',
        customNotes: reportConfig.customNotes || ''
      },
      realtorInfo: realtorInfo,
      status: 'generating',
      fileName: fileName,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    const reportRef = await db.collection('reports').add(reportData);
    console.log(`Created report record ${reportRef.id} for analysis ${analysisDocId}`);
    
    // Generate PDF asynchronously
    setTimeout(async () => {
      try {
        console.log('Generating enhanced PDF report with charts...');
        
        // Create PDF using PDFReportBuilder (now includes all enhanced features)
        const pdfBuilder = new PDFReportBuilder(analysis, reportConfig, realtorInfo);
        const pdfDoc = await pdfBuilder.generate();
        
        // Convert to buffer
        const pdfBuffer = pdfDoc.output('arraybuffer');
        const buffer = Buffer.from(pdfBuffer);
        
        console.log('Uploading PDF to Firebase Storage...');
        
        // Upload to Firebase Storage
        const uploadResult = await storageUploader.uploadPDF(
          buffer,
          fileName,
          {
            reportId: reportRef.id,
            userId: userId,
            propertyId: propertyId || analysis.propertyId,
            analysisId: analysisDocId
          }
        );
        
        console.log('PDF uploaded successfully:', uploadResult.fileUrl);
        
        // Update report record with file info
        await db.collection('reports').doc(reportRef.id).update({
          status: 'ready',
          fileUrl: uploadResult.fileUrl,
          fileSize: uploadResult.fileSize,
          filePath: uploadResult.path,
          generatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        
        console.log(`Report ${reportRef.id} completed successfully`);
        
      } catch (error) {
        console.error('Error generating report:', error);
        
        // Update report status to failed
        await db.collection('reports').doc(reportRef.id).update({
          status: 'failed',
          error: error.message,
          failedAt: admin.firestore.FieldValue.serverTimestamp()
        });
      }
    }, 2000); // Small delay to ensure response is sent first
    
    return res.status(200).json({ 
      success: true,
      reportId: reportRef.id,
      message: 'Report generation started',
      estimatedTime: '10-15 seconds'
    });

  } catch (error) {
    console.error('Error generating report:', error);
    return res.status(500).json({ 
      error: 'Failed to generate report',
      details: error.message 
    });
  }
}