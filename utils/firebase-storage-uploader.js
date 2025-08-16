// Firebase Storage Uploader Utility
import admin from './firebase-admin.js';

export class FirebaseStorageUploader {
  constructor() {
    this.bucket = admin.storage().bucket();
  }
  
  /**
   * Upload PDF to Firebase Storage
   * @param {Buffer|Uint8Array} pdfBuffer - PDF file buffer
   * @param {string} fileName - Name for the file
   * @param {Object} metadata - Additional metadata
   * @returns {Promise<Object>} Upload result with download URL
   */
  async uploadPDF(pdfBuffer, fileName, metadata = {}) {
    try {
      // Create file reference
      const file = this.bucket.file(`reports/${fileName}`);
      
      // Upload options
      const options = {
        metadata: {
          contentType: 'application/pdf',
          metadata: {
            ...metadata,
            uploadedAt: new Date().toISOString()
          }
        },
        public: false, // Keep files private
        validation: 'crc32c'
      };
      
      // Upload the file
      await file.save(pdfBuffer, options);
      
      // Generate a signed URL that doesn't expire (or expires in 100 years)
      const [url] = await file.getSignedUrl({
        action: 'read',
        expires: '01-01-2125' // Far future expiration
      });
      
      // Get file metadata
      const [fileMetadata] = await file.getMetadata();
      
      return {
        success: true,
        fileName: fileName,
        fileUrl: url,
        fileSize: fileMetadata.size,
        contentType: fileMetadata.contentType,
        bucket: fileMetadata.bucket,
        path: `reports/${fileName}`,
        createdAt: fileMetadata.timeCreated,
        updatedAt: fileMetadata.updated,
        md5Hash: fileMetadata.md5Hash,
        metadata: fileMetadata.metadata
      };
      
    } catch (error) {
      console.error('Error uploading PDF to Firebase Storage:', error);
      throw new Error(`Failed to upload PDF: ${error.message}`);
    }
  }
  
  /**
   * Upload profile image to Firebase Storage
   * @param {Buffer} imageBuffer - Image file buffer
   * @param {string} userId - User ID
   * @param {string} imageType - 'profile' or 'logo'
   * @param {string} extension - File extension (jpg, png, etc)
   * @returns {Promise<string>} Public download URL
   */
  async uploadProfileImage(imageBuffer, userId, imageType, extension) {
    try {
      const fileName = `profiles/${userId}/${imageType}.${extension}`;
      const file = this.bucket.file(fileName);
      
      const options = {
        metadata: {
          contentType: `image/${extension}`,
          metadata: {
            userId: userId,
            imageType: imageType,
            uploadedAt: new Date().toISOString()
          }
        },
        public: true, // Make profile images public
        validation: 'crc32c'
      };
      
      await file.save(imageBuffer, options);
      
      // Get the public URL
      const publicUrl = `https://storage.googleapis.com/${this.bucket.name}/${fileName}`;
      
      return publicUrl;
      
    } catch (error) {
      console.error('Error uploading profile image:', error);
      throw new Error(`Failed to upload profile image: ${error.message}`);
    }
  }
  
  /**
   * Delete a file from Firebase Storage
   * @param {string} filePath - Path to the file in storage
   * @returns {Promise<boolean>} Success status
   */
  async deleteFile(filePath) {
    try {
      const file = this.bucket.file(filePath);
      await file.delete();
      return true;
    } catch (error) {
      console.error('Error deleting file:', error);
      if (error.code === 404) {
        console.log('File not found, already deleted');
        return true;
      }
      throw error;
    }
  }
  
  /**
   * Check if a file exists in storage
   * @param {string} filePath - Path to the file
   * @returns {Promise<boolean>} Existence status
   */
  async fileExists(filePath) {
    try {
      const file = this.bucket.file(filePath);
      const [exists] = await file.exists();
      return exists;
    } catch (error) {
      console.error('Error checking file existence:', error);
      return false;
    }
  }
  
  /**
   * Get file metadata
   * @param {string} filePath - Path to the file
   * @returns {Promise<Object>} File metadata
   */
  async getFileMetadata(filePath) {
    try {
      const file = this.bucket.file(filePath);
      const [metadata] = await file.getMetadata();
      return metadata;
    } catch (error) {
      console.error('Error getting file metadata:', error);
      throw error;
    }
  }
  
  /**
   * List all reports for a user
   * @param {string} userId - User ID
   * @returns {Promise<Array>} List of report files
   */
  async listUserReports(userId) {
    try {
      const [files] = await this.bucket.getFiles({
        prefix: `reports/${userId}/`,
        delimiter: '/'
      });
      
      const reports = await Promise.all(
        files.map(async (file) => {
          const [metadata] = await file.getMetadata();
          const [url] = await file.getSignedUrl({
            action: 'read',
            expires: '01-01-2125'
          });
          
          return {
            name: file.name,
            url: url,
            size: metadata.size,
            created: metadata.timeCreated,
            updated: metadata.updated,
            metadata: metadata.metadata
          };
        })
      );
      
      return reports;
      
    } catch (error) {
      console.error('Error listing user reports:', error);
      throw error;
    }
  }
  
  /**
   * Generate a unique file name for a report
   * @param {string} userId - User ID
   * @param {string} propertyId - Property ID
   * @returns {string} Unique file name
   */
  generateReportFileName(userId, propertyId) {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `${userId}/${propertyId}_${timestamp}_${random}.pdf`;
  }
}

// Export singleton instance
export const storageUploader = new FirebaseStorageUploader();

export default storageUploader;