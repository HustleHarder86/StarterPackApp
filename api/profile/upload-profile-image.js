import admin from '../../utils/firebase-admin.js';
import storageUploader from '../../utils/firebase-storage-uploader.js';
import { applyCorsHeaders } from '../../utils/cors-config.js';
import formidable from 'formidable';
import fs from 'fs/promises';

export const config = {
  api: {
    bodyParser: false, // Disable body parser for file uploads
  },
};

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
    
    // Parse form data
    const form = formidable({
      maxFileSize: 5 * 1024 * 1024, // 5MB max
      allowEmptyFiles: false,
      multiples: false
    });
    
    const [fields, files] = await form.parse(req);
    
    // Get image type from fields
    const imageType = fields.imageType?.[0] || 'profile';
    
    if (!['profile', 'logo'].includes(imageType)) {
      return res.status(400).json({ error: 'Invalid image type. Must be "profile" or "logo"' });
    }
    
    // Get the uploaded file
    const file = files.image?.[0];
    
    if (!file) {
      return res.status(400).json({ error: 'No image file provided' });
    }
    
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.mimetype)) {
      return res.status(400).json({ 
        error: 'Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed' 
      });
    }
    
    // Read file buffer
    const fileBuffer = await fs.readFile(file.filepath);
    
    // Get file extension
    const extension = file.originalFilename.split('.').pop().toLowerCase();
    
    // Upload to Firebase Storage
    const publicUrl = await storageUploader.uploadProfileImage(
      fileBuffer,
      userId,
      imageType,
      extension
    );
    
    // Update user profile with new image URL
    const db = admin.firestore();
    const userRef = db.collection('users').doc(userId);
    
    const updateData = {};
    if (imageType === 'profile') {
      updateData['realtorProfile.profilePicUrl'] = publicUrl;
    } else {
      updateData['realtorProfile.logoUrl'] = publicUrl;
    }
    updateData['realtorProfile.updatedAt'] = admin.firestore.FieldValue.serverTimestamp();
    
    await userRef.update(updateData);
    
    // Clean up temp file
    await fs.unlink(file.filepath).catch(console.error);
    
    console.log(`Uploaded ${imageType} image for user ${userId}: ${publicUrl}`);
    
    return res.status(200).json({
      success: true,
      message: `${imageType === 'profile' ? 'Profile picture' : 'Company logo'} uploaded successfully`,
      url: publicUrl,
      imageType: imageType
    });
    
  } catch (error) {
    console.error('Error uploading profile image:', error);
    
    if (error.code === 'auth/id-token-expired') {
      return res.status(401).json({ error: 'Token expired' });
    }
    
    if (error.code === 'auth/invalid-id-token') {
      return res.status(401).json({ error: 'Invalid token' });
    }
    
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File size exceeds 5MB limit' });
    }
    
    return res.status(500).json({ 
      error: 'Failed to upload image',
      details: error.message 
    });
  }
}