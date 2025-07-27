// api/admin/metrics.js
// Performance metrics and monitoring dashboard endpoint

import { authenticate, requireSubscription } from '../../utils/auth-middleware.js';
import { getMetricsSummary, metricsEndpoint } from '../../utils/performance-monitor.js';
import { getCacheStats } from '../../utils/cache-manager.js';
import { queryLogs } from '../../utils/logger.js';
import { withCors } from '../../utils/cors-config.js';
import { getFirestore } from 'firebase-admin/firestore';

import { apiLimits } from '../utils/rate-limiter.js';
const db = getFirestore();

export default async function handler(req, res) {
  // Apply CORS
  await withCors(req, res);
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // Apply rate limiting
  await new Promise((resolve, reject) => {
    apiLimits.read(req, res, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    // Authenticate user - admin only
    await authenticate(req, res, async () => {
      // Check if user is admin
      const userDoc = await db.collection('users').doc(req.user.uid).get();
      const userData = userDoc.data();
      
      if (!userData?.isAdmin) {
        return res.status(403).json({ error: 'Admin access required' });
      }
      
      // Get metrics based on query params
      const { type = 'all' } = req.query;
      
      const metrics = {};
      
      // Performance metrics
      if (type === 'all' || type === 'performance') {
        metrics.performance = getMetricsSummary();
      }
      
      // Cache statistics
      if (type === 'all' || type === 'cache') {
        metrics.cache = await getCacheStats();
      }
      
      // Recent errors
      if (type === 'all' || type === 'errors') {
        const oneHourAgo = new Date(Date.now() - 3600000).toISOString();
        metrics.recentErrors = await queryLogs({
          level: 'ERROR',
          startTime: oneHourAgo,
          limit: 20
        });
      }
      
      // API usage stats
      if (type === 'all' || type === 'usage') {
        metrics.usage = await getAPIUsageStats();
      }
      
      // System info
      metrics.system = {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        nodeVersion: process.version,
        platform: process.platform,
        timestamp: new Date().toISOString()
      };
      
      res.status(200).json({
        success: true,
        metrics
      });
    });
  } catch (error) {
    console.error('Metrics error:', error);
    res.status(500).json({ 
      error: 'Failed to retrieve metrics',
      message: error.message 
    });
  }
}

async function getAPIUsageStats() {
  try {
    const now = new Date();
    const oneDayAgo = new Date(now - 24 * 60 * 60 * 1000);
    const oneWeekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
    
    // Get daily analysis count
    const dailyAnalyses = await db.collection('analyses')
      .where('createdAt', '>=', oneDayAgo.toISOString())
      .get();
    
    // Get weekly analysis count
    const weeklyAnalyses = await db.collection('analyses')
      .where('createdAt', '>=', oneWeekAgo.toISOString())
      .get();
    
    // Get user activity
    const activeUsers = new Set();
    dailyAnalyses.forEach(doc => {
      const data = doc.data();
      if (data.userId) activeUsers.add(data.userId);
    });
    
    // API calls by type
    const apiCallsByType = {};
    dailyAnalyses.forEach(doc => {
      const data = doc.data();
      const type = data.analysisType || 'traditional';
      apiCallsByType[type] = (apiCallsByType[type] || 0) + 1;
    });
    
    return {
      daily: {
        analyses: dailyAnalyses.size,
        activeUsers: activeUsers.size
      },
      weekly: {
        analyses: weeklyAnalyses.size
      },
      byType: apiCallsByType,
      averagePerDay: (weeklyAnalyses.size / 7).toFixed(1)
    };
  } catch (error) {
    console.error('Error getting API usage stats:', error);
    return null;
  }
}