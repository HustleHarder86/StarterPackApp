import { applyCorsHeaders } from '../../utils/cors-config.js';

import { apiLimits } from '../utils/rate-limiter.js';
// api/monitor-usage.js
// Fixed API usage monitor with proper error handling

export default async function handler(req, res) {
  // Apply proper CORS headers
  applyCorsHeaders(req, res);
  // Set CORS headers
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
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
    // Initialize Firebase Admin
    const adminModule = await import('firebase-admin');
    const admin = adminModule.default;
    
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
        })
      });
    }

    const db = admin.firestore();
    
    // Get recent analyses (last 24 hours)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    // Query without orderBy if it causes issues
    let analysesSnapshot;
    try {
      analysesSnapshot = await db.collection('analyses')
        .where('createdAt', '>=', yesterday)
        .orderBy('createdAt', 'desc')
        .limit(100)
        .get();
    } catch (queryError) {
      console.log('OrderBy query failed, trying simple query:', queryError.message);
      // Fallback to simple query without orderBy
      analysesSnapshot = await db.collection('analyses')
        .limit(100)
        .get();
    }
    
    const analyses = [];
    let realTimeCount = 0;
    let demoCount = 0;
    let totalResponseTime = 0;
    let validResponseTimes = 0;
    let totalCost = 0;
    let totalPerplexityCost = 0;
    let totalOpenAICost = 0;
    let totalTokens = 0;
    
    analysesSnapshot.forEach(doc => {
      const data = doc.data();
      
      // Handle different timestamp formats
      let timestamp;
      if (data.createdAt?.toDate) {
        timestamp = data.createdAt.toDate();
      } else if (data.analysis_timestamp) {
        timestamp = new Date(data.analysis_timestamp);
      } else {
        timestamp = new Date();
      }
      
      // Check if within 24 hours for fallback query
      if (timestamp < yesterday) {
        return; // Skip old entries
      }
      
      // Extract API cost information
      const apiCosts = data.api_usage_costs || {};
      const totalApiCost = apiCosts.total_cost_usd || 0;
      const perplexityCost = apiCosts.input_cost_usd + apiCosts.output_cost_usd || 0;
      const openaiCost = apiCosts.secondary_api_call?.total_cost_usd || 0;
      const totalTokens = apiCosts.total_tokens || 0;
      
      analyses.push({
        id: doc.id,
        address: data.property_address || data.propertyAddress || 'Unknown',
        timestamp: timestamp,
        dataSource: data.dataSource || 'unknown',
        hasRealTimeData: data.data_freshness?.data_recency === 'REAL_TIME' || data.dataSource === 'REAL_TIME_API_DATA',
        responseTime: data.responseTime || null,
        sourcesCount: data.data_sources?.length || 0,
        roi: data.roi_percentage || 'N/A',
        apiCost: totalApiCost,
        perplexityCost: perplexityCost,
        openaiCost: openaiCost,
        totalTokens: totalTokens
      });
      
      // Count data types
      if (data.data_freshness?.data_recency === 'REAL_TIME' || data.dataSource === 'REAL_TIME_API_DATA') {
        realTimeCount++;
      } else if (data.dataSource === 'DEMO_DATA' || data.data_freshness?.data_recency === 'DEMO_DATA') {
        demoCount++;
      }
      
      // Calculate average response time
      if (data.responseTime && typeof data.responseTime === 'number') {
        totalResponseTime += data.responseTime;
        validResponseTimes++;
      }
      
      // Accumulate cost data
      totalCost += totalApiCost;
      totalPerplexityCost += perplexityCost;
      totalOpenAICost += openaiCost;
      totalTokens += (apiCosts.total_tokens || 0);
    });
    
    // Sort by timestamp (newest first) after collection
    analyses.sort((a, b) => b.timestamp - a.timestamp);
    
    // Calculate statistics
    const stats = {
      totalAnalyses24h: analyses.length,
      realTimeAnalyses: realTimeCount,
      demoAnalyses: demoCount,
      unknownAnalyses: analyses.length - realTimeCount - demoCount,
      averageResponseTime: validResponseTimes > 0 ? (totalResponseTime / validResponseTimes / 1000).toFixed(2) : 'N/A',
      realTimePercentage: analyses.length > 0 ? ((realTimeCount / analyses.length) * 100).toFixed(1) : 0,
      lastAnalysis: analyses[0] || null,
      hourlyCounts: calculateHourlyCounts(analyses),
      // Cost statistics
      totalCost24h: parseFloat(totalCost.toFixed(6)),
      totalPerplexityCost: parseFloat(totalPerplexityCost.toFixed(6)),
      totalOpenAICost: parseFloat(totalOpenAICost.toFixed(6)),
      averageCostPerAnalysis: analyses.length > 0 ? parseFloat((totalCost / analyses.length).toFixed(6)) : 0,
      totalTokens: totalTokens,
      projectedMonthlyCost: parseFloat((totalCost * 30).toFixed(2))
    };
    
    // Check API key status
    const apiStatus = {
      perplexity: {
        configured: !!process.env.PERPLEXITY_API_KEY && 
                   process.env.PERPLEXITY_API_KEY.startsWith('pplx-') &&
                   process.env.PERPLEXITY_API_KEY !== 'your_perplexity_api_key',
        keyPrefix: process.env.PERPLEXITY_API_KEY ? 
                   process.env.PERPLEXITY_API_KEY.substring(0, 7) + '...' : 'NOT SET'
      },
      openai: {
        configured: !!process.env.OPENAI_API_KEY && 
                   process.env.OPENAI_API_KEY.startsWith('sk-') &&
                   process.env.OPENAI_API_KEY !== 'your_openai_api_key',
        keyPrefix: process.env.OPENAI_API_KEY ? 
                   process.env.OPENAI_API_KEY.substring(0, 7) + '...' : 'NOT SET'
      },
      firebase: {
        configured: !!process.env.FIREBASE_PROJECT_ID && !!process.env.FIREBASE_CLIENT_EMAIL,
        projectId: process.env.FIREBASE_PROJECT_ID || 'NOT SET'
      }
    };
    
    // Format response
    const response = {
      success: true,
      timestamp: new Date().toISOString(),
      stats,
      apiStatus,
      recentAnalyses: analyses.slice(0, 10).map(a => ({
        ...a,
        timestamp: a.timestamp.toISOString()
      })),
      healthCheck: {
        firebaseConnected: true,
        perplexityConfigured: apiStatus.perplexity.configured,
        openaiConfigured: apiStatus.openai.configured,
        dataFreshness: stats.realTimePercentage > 50 ? 'GOOD' : 'NEEDS_ATTENTION',
        recommendation: !apiStatus.perplexity.configured 
          ? 'Configure Perplexity API key for real-time data'
          : stats.realTimePercentage < 50 
          ? 'Check API keys and credits'
          : 'System operating normally'
      }
    };
    
    return res.status(200).json(response);
    
  } catch (error) {
    console.error('Monitor error:', error);
    
    // Return a more informative error response
    return res.status(200).json({ 
      success: false,
      error: 'Monitoring service error', 
      details: error.message,
      timestamp: new Date().toISOString(),
      apiStatus: {
        perplexity: {
          configured: !!process.env.PERPLEXITY_API_KEY && process.env.PERPLEXITY_API_KEY.startsWith('pplx-'),
          keyPrefix: process.env.PERPLEXITY_API_KEY ? process.env.PERPLEXITY_API_KEY.substring(0, 7) + '...' : 'NOT SET'
        },
        openai: {
          configured: !!process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.startsWith('sk-'),
          keyPrefix: process.env.OPENAI_API_KEY ? process.env.OPENAI_API_KEY.substring(0, 7) + '...' : 'NOT SET'
        },
        firebase: {
          configured: !!process.env.FIREBASE_PROJECT_ID,
          error: error.message.includes('Firebase') ? error.message : null
        }
      },
      healthCheck: {
        firebaseConnected: false,
        recommendation: 'Check Firebase configuration and Firestore indexes'
      }
    });
  }
}

function calculateHourlyCounts(analyses) {
  const counts = {};
  const now = new Date();
  
  // Initialize last 24 hours
  for (let i = 0; i < 24; i++) {
    const hour = new Date(now);
    hour.setHours(hour.getHours() - i);
    const key = hour.toISOString().substring(0, 13); // YYYY-MM-DDTHH
    counts[key] = 0;
  }
  
  // Count analyses per hour
  analyses.forEach(analysis => {
    if (analysis.timestamp instanceof Date) {
      const hour = analysis.timestamp.toISOString().substring(0, 13);
      if (counts.hasOwnProperty(hour)) {
        counts[hour]++;
      }
    }
  });
  
  // Convert to array for easier display
  const hourlyArray = Object.entries(counts)
    .sort((a, b) => b[0].localeCompare(a[0]))
    .slice(0, 24)
    .map(([hour, count]) => ({
      hour: new Date(hour + ':00:00Z').toLocaleTimeString('en-US', { hour: 'numeric' }),
      count
    }));
  
  return hourlyArray;
}
