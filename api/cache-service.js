// api/cache-service.js
import { db } from './firebase-admin-init';

class CacheService {
  async getCachedAnalysis(addressHash) {
    try {
      const doc = await db.collection('analysis_cache')
        .doc(addressHash)
        .get();
      
      if (doc.exists) {
        const data = doc.data();
        const age = Date.now() - data.timestamp;
        
        // Cache valid for 7 days
        if (age < 7 * 24 * 60 * 60 * 1000) {
          return data.analysis;
        }
      }
    } catch (error) {
      console.error('Cache read error:', error);
    }
    return null;
  }
  
  async setCachedAnalysis(addressHash, analysis) {
    try {
      await db.collection('analysis_cache')
        .doc(addressHash)
        .set({
          analysis,
          timestamp: Date.now()
        });
    } catch (error) {
      console.error('Cache write error:', error);
    }
  }
}

export default new CacheService();
