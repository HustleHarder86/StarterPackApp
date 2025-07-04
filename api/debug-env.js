export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Check environment variables (safely, without exposing full keys)
  const perplexityKey = process.env.PERPLEXITY_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;
  
  const debugInfo = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    perplexityApiKey: {
      exists: !!perplexityKey,
      startsWithPplx: perplexityKey ? perplexityKey.startsWith('pplx-') : false,
      length: perplexityKey ? perplexityKey.length : 0,
      preview: perplexityKey ? `${perplexityKey.substring(0, 10)}...` : 'NOT SET'
    },
    openaiApiKey: {
      exists: !!openaiKey,
      startsWithSk: openaiKey ? openaiKey.startsWith('sk-') : false,
      length: openaiKey ? openaiKey.length : 0,
      preview: openaiKey ? `${openaiKey.substring(0, 7)}...` : 'NOT SET'
    },
    otherEnvVars: {
      firebaseProjectId: !!process.env.FIREBASE_PROJECT_ID,
      firebaseClientEmail: !!process.env.FIREBASE_CLIENT_EMAIL,
      firebasePrivateKey: !!process.env.FIREBASE_PRIVATE_KEY
    }
  };

  return res.status(200).json(debugInfo);
}