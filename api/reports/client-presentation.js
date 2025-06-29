// API endpoint for creating shareable client presentations
import { authenticate } from '../../utils/auth-middleware.js';
import { firestore, FieldValue } from '../../utils/firebase-admin.js';
import crypto from 'crypto';

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    if (req.method === 'POST') {
      // Create new client presentation
      await authenticate(req, res, async () => {
        const { 
          analysisId,
          clientName,
          clientEmail,
          realtorBranding,
          expiryDays = 7,
          allowDownload = true,
          includeComparables = true
        } = req.body;

        // Validate required fields
        if (!analysisId) {
          return res.status(400).json({ error: 'Analysis ID is required' });
        }

        // Get the analysis data
        const analysisDoc = await firestore
          .collection('analyses')
          .doc(analysisId)
          .get();

        if (!analysisDoc.exists) {
          return res.status(404).json({ error: 'Analysis not found' });
        }

        const analysisData = analysisDoc.data();

        // Verify user owns this analysis or is a realtor with access
        if (analysisData.userId !== req.user.uid) {
          // Check if user is a realtor with team access
          const userDoc = await firestore
            .collection('users')
            .doc(req.user.uid)
            .get();
          
          const userData = userDoc.data();
          if (!userData?.isRealtor || !userData?.teamMembers?.includes(analysisData.userId)) {
            return res.status(403).json({ error: 'Access denied' });
          }
        }

        // Generate unique share token
        const shareToken = crypto.randomBytes(32).toString('hex');
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + expiryDays);

        // Create the presentation document
        const presentationData = {
          shareToken,
          analysisId,
          createdBy: req.user.uid,
          clientName: clientName || 'Valued Client',
          clientEmail: clientEmail || null,
          realtorInfo: realtorBranding || {
            name: req.user.displayName || 'Your Realtor',
            email: req.user.email,
            phone: req.user.phoneNumber || null,
            logo: req.user.photoURL || null,
            brokerage: null
          },
          settings: {
            allowDownload,
            includeComparables,
            presentationMode: true,
            hideSubscriptionPrompts: true,
            hideTechnicalDetails: false
          },
          viewCount: 0,
          lastViewedAt: null,
          createdAt: FieldValue.serverTimestamp(),
          expiresAt: expiryDate,
          isActive: true
        };

        // Store the presentation
        const presentationRef = await firestore
          .collection('clientPresentations')
          .add(presentationData);

        // Log activity
        await firestore.collection('activityLogs').add({
          userId: req.user.uid,
          action: 'client_presentation_created',
          metadata: {
            presentationId: presentationRef.id,
            analysisId,
            clientName,
            expiryDays
          },
          timestamp: FieldValue.serverTimestamp()
        });

        // Generate shareable URL
        const baseUrl = process.env.APP_URL || 'https://investorprops.vercel.app';
        const shareUrl = `${baseUrl}/client-view?token=${shareToken}`;

        // Send email to client if email provided
        if (clientEmail) {
          // TODO: Implement email sending
          console.log('Would send email to:', clientEmail);
        }

        return res.status(200).json({
          success: true,
          presentationId: presentationRef.id,
          shareUrl,
          shareToken,
          expiresAt: expiryDate.toISOString(),
          message: 'Client presentation created successfully'
        });
      });

    } else if (req.method === 'GET') {
      // Get presentation by token (no auth required for viewing)
      const { token } = req.query;

      if (!token) {
        return res.status(400).json({ error: 'Share token required' });
      }

      // Find presentation by token
      const presentationsQuery = await firestore
        .collection('clientPresentations')
        .where('shareToken', '==', token)
        .where('isActive', '==', true)
        .limit(1)
        .get();

      if (presentationsQuery.empty) {
        return res.status(404).json({ error: 'Presentation not found or expired' });
      }

      const presentationDoc = presentationsQuery.docs[0];
      const presentation = presentationDoc.data();

      // Check if expired
      if (presentation.expiresAt.toDate() < new Date()) {
        return res.status(410).json({ error: 'This presentation has expired' });
      }

      // Get the analysis data
      const analysisDoc = await firestore
        .collection('analyses')
        .doc(presentation.analysisId)
        .get();

      if (!analysisDoc.exists) {
        return res.status(404).json({ error: 'Analysis data not found' });
      }

      const analysisData = analysisDoc.data();

      // Get property data if available
      let propertyData = null;
      if (analysisData.propertyId) {
        const propertyDoc = await firestore
          .collection('properties')
          .doc(analysisData.propertyId)
          .get();
        
        if (propertyDoc.exists) {
          propertyData = propertyDoc.data();
        }
      }

      // Update view count and last viewed
      await presentationDoc.ref.update({
        viewCount: FieldValue.increment(1),
        lastViewedAt: FieldValue.serverTimestamp()
      });

      // Prepare client-friendly data
      const clientData = {
        analysis: {
          ...analysisData,
          // Remove sensitive data
          userId: undefined,
          apiCosts: undefined,
          internalNotes: undefined
        },
        property: propertyData,
        presentation: {
          clientName: presentation.clientName,
          realtorInfo: presentation.realtorInfo,
          settings: presentation.settings,
          createdAt: presentation.createdAt,
          expiresAt: presentation.expiresAt
        }
      };

      // Add comparables if allowed
      if (!presentation.settings.includeComparables) {
        clientData.analysis.longTermRental.comparables = [];
        clientData.analysis.strAnalysis.comparables = [];
      }

      return res.status(200).json({
        success: true,
        data: clientData
      });

    } else {
      return res.status(405).json({ error: 'Method not allowed' });
    }

  } catch (error) {
    console.error('Client presentation error:', error);
    return res.status(500).json({ 
      error: 'Failed to process presentation request',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}