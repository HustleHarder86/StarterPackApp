// api/monitor-usage.js
// Monitor API usage and data freshness

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

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
    
    const analysesSnapshot = await db.collection('analyses')
      .where('createdAt', '>=', yesterday)
      .orderBy('createdAt', 'desc')
      .limit(100)
      .get();
    
    const analyses = [];
    let realTimeCount = 0;
    let demoCount = 0;
    let totalResponseTime = 0;
    
    analysesSnapshot.forEach(doc => {
      const data = doc.data();
      analyses.push({
        id: doc.id,
        address: data.property_address,
        timestamp: data.createdAt?.toDate?.() || new Date(data.analysis_timestamp),
        dataSource: data.dataSource || 'unknown',
        hasRealTimeData: data.data_freshness?.data_recency === 'REAL_TIME',
        responseTime: data.responseTime || null,
        sourcesCount: data.data_sources?.length || 0
      });
      
      if (data.data_freshness?.data_recency === 'REAL_TIME' || data.dataSource === 'REAL_TIME_API_DATA') {
        realTimeCount++;
      } else if (data.dataSource === 'DEMO_DATA' || data.data_freshness?.data_recency === 'DEMO_DATA') {
        demoCount++;
      }
      
      if (data.responseTime) {
        totalResponseTime += data.responseTime;
      }
    });
    
    // Calculate statistics
    const stats = {
      totalAnalyses24h: analyses.length,
      realTimeAnalyses: realTimeCount,
      demoAnalyses: demoCount,
      averageResponseTime: analyses.length > 0 ? (totalResponseTime / analyses.length / 1000).toFixed(2) : 0,
      realTimePercentage: analyses.length > 0 ? ((realTimeCount / analyses.length) * 100).toFixed(1) : 0,
      lastAnalysis: analyses[0] || null,
      hourlyCounts: calculateHourlyCounts(analyses)
    };
    
    // Check API key status
    const apiStatus = {
      perplexity: {
        configured: !!process.env.PERPLEXITY_API_KEY && 
                   process.env.PERPLEXITY_API_KEY.startsWith('pplx-'),
        keyPrefix: process.env.PERPLEXITY_API_KEY ? 
                   process.env.PERPLEXITY_API_KEY.substring(0, 7) + '...' : 'NOT SET'
      },
      openai: {
        configured: !!process.env.OPENAI_API_KEY && 
                   process.env.OPENAI_API_KEY.startsWith('sk-'),
        keyPrefix: process.env.OPENAI_API_KEY ? 
                   process.env.OPENAI_API_KEY.substring(0, 7) + '...' : 'NOT SET'
      }
    };
    
    return res.status(200).json({
      success: true,
      timestamp: new Date().toISOString(),
      stats,
      apiStatus,
      recentAnalyses: analyses.slice(0, 10),
      healthCheck: {
        firebaseConnected: true,
        apisConfigured: apiStatus.perplexity.configured,
        dataFreshness: realTimePercentage > 50 ? 'GOOD' : 'NEEDS_ATTENTION'
      }
    });
    
  } catch (error) {
    console.error('Monitor error:', error);
    return res.status(500).json({ 
      error: 'Failed to get monitoring data', 
      details: error.message 
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
    const hour = analysis.timestamp.toISOString().substring(0, 13);
    if (counts.hasOwnProperty(hour)) {
      counts[hour]++;
    }
  });
  
  return counts;
}
