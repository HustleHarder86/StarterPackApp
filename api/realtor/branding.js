import { authenticateUser } from '../../utils/auth-middleware.js';
import { getFirebaseAdmin } from '../../utils/firebase-admin.js';

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle OPTIONS request for CORS
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    // Authenticate user
    const user = await authenticateUser(req);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { db } = await getFirebaseAdmin();

    // Handle GET request - fetch branding settings
    if (req.method === 'GET') {
      try {
        const brandingDoc = await db
          .collection('realtorBranding')
          .doc(user.uid)
          .get();

        if (!brandingDoc.exists) {
          // Return default branding based on user profile
          return res.status(200).json({
            success: true,
            data: {
              name: user.displayName || '',
              email: user.email || '',
              phone: '',
              title: 'Real Estate Professional',
              brokerage: '',
              license: '',
              logo: null,
              headshot: null,
              colors: {
                primary: '#667eea',
                secondary: '#764ba2'
              },
              options: {
                showHeadshot: true,
                showBrokerage: true,
                showLicense: false,
                customFooter: false,
                footerText: ''
              }
            }
          });
        }

        return res.status(200).json({
          success: true,
          data: brandingDoc.data()
        });
      } catch (error) {
        console.error('Error fetching branding:', error);
        return res.status(500).json({ error: 'Failed to fetch branding settings' });
      }
    }

    // Handle POST request - save branding settings
    if (req.method === 'POST') {
      try {
        const brandingData = req.body;
        
        // Validate required fields
        if (!brandingData.name || !brandingData.email || !brandingData.phone) {
          return res.status(400).json({ 
            error: 'Name, email, and phone are required' 
          });
        }

        // Validate image sizes if provided
        if (brandingData.logo && brandingData.logo.length > 2 * 1024 * 1024) {
          return res.status(400).json({ 
            error: 'Logo image must be less than 2MB' 
          });
        }

        if (brandingData.headshot && brandingData.headshot.length > 2 * 1024 * 1024) {
          return res.status(400).json({ 
            error: 'Headshot image must be less than 2MB' 
          });
        }

        // Save to Firestore
        const brandingRef = db.collection('realtorBranding').doc(user.uid);
        
        await brandingRef.set({
          ...brandingData,
          userId: user.uid,
          updatedAt: new Date().toISOString(),
          createdAt: brandingDoc.exists ? 
            (await brandingRef.get()).data()?.createdAt : 
            new Date().toISOString()
        }, { merge: true });

        // Also update user profile with basic info
        await db.collection('users').doc(user.uid).update({
          displayName: brandingData.name,
          realtorBrandingEnabled: true,
          updatedAt: new Date().toISOString()
        });

        return res.status(200).json({
          success: true,
          message: 'Branding settings saved successfully'
        });
      } catch (error) {
        console.error('Error saving branding:', error);
        return res.status(500).json({ error: 'Failed to save branding settings' });
      }
    }

    // Method not allowed
    return res.status(405).json({ error: 'Method not allowed' });

  } catch (error) {
    console.error('Handler error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}