// File: api/debug.js
// Simple debug endpoint to test what's deployed

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  const response = {
    timestamp: new Date().toISOString(),
    method: req.method,
    message: 'Debug endpoint working',
    environmentVariables: {
      FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID ? 'EXISTS' : 'MISSING',
      FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL ? 'EXISTS' : 'MISSING', 
      FIREBASE_PRIVATE_KEY: process.env.FIREBASE_PRIVATE_KEY ? 'EXISTS' : 'MISSING'
    },
    nodeVersion: process.version
  };

  return res.status(200).json(response);
}
