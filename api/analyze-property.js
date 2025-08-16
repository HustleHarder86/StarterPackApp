// api/analyze-property.js
// Proxy to Railway API for heavy property analysis processing

const https = require('https');
const http = require('http');

module.exports = async function handler(req, res) {
  // Apply CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  return new Promise((resolve) => {
    console.log('[Vercel Proxy] Forwarding property analysis request to Railway API');
    
    const postData = JSON.stringify(req.body);
    
    // Use Railway URL in production, localhost in development
    const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL_ENV;
    const railwayUrl = process.env.RAILWAY_API_URL || 'https://real-estate-app-production-ba5c.up.railway.app';
    
    let options;
    let requestModule;
    
    if (isProduction) {
      // Production: Use Railway URL
      const url = new URL(`${railwayUrl}/api/analysis/property`);
      options = {
        hostname: url.hostname,
        port: url.port || 443,
        path: url.pathname,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData),
          'Authorization': req.headers.authorization || '',
          'X-Service': 'vercel',
          'X-Request-ID': req.headers['x-request-id'] || `req-${Date.now()}`
        }
      };
      requestModule = https;
    } else {
      // Development: Use localhost
      options = {
        hostname: 'localhost',
        port: 3001,
        path: '/api/analysis/property',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData),
          'Authorization': req.headers.authorization || '',
          'X-Service': 'vercel',
          'X-Request-ID': req.headers['x-request-id'] || `req-${Date.now()}`
        }
      };
      requestModule = http;
    }
    
    console.log(`[Vercel Proxy] Connecting to ${options.hostname}:${options.port}${options.path}`);

    // Set a timeout for the request
    const timeoutId = setTimeout(() => {
      railwayReq.destroy();
      console.log('[Vercel Proxy] Request timeout after 10 seconds');
      res.status(200).json({
        warning: 'Request timeout - returning limited demo data',
        propertyDetails: req.body.propertyData || {},
        longTermRental: {
          monthlyRent: 3200,
          monthlyExpenses: 1800,
          cashFlow: 1400,
          capRate: 0.0512,
          cashOnCash: 0.0672,
          totalInvestment: req.body.propertyData?.price ? req.body.propertyData.price * 0.25 : 187500
        },
        shortTermRental: {
          monthlyRevenue: 6500,
          monthlyExpenses: 2800,
          netMonthlyIncome: 3700,
          occupancyRate: 0.72,
          nightlyRate: 289,
          annualRevenue: 78000
        },
        isDemo: true,
        error: 'Request timeout'
      });
      resolve();
    }, 10000); // 10 second timeout
    
    const railwayReq = requestModule.request(options, (railwayRes) => {
      clearTimeout(timeoutId);
      let data = '';

      railwayRes.on('data', (chunk) => {
        data += chunk;
      });

      railwayRes.on('end', () => {
        try {
          const responseData = JSON.parse(data);
          
          if (railwayRes.statusCode !== 200) {
            console.error('[Vercel Proxy] Railway API error:', railwayRes.statusCode, responseData);
            res.status(railwayRes.statusCode).json(responseData);
            resolve();
            return;
          }
          
          console.log('[Vercel Proxy] Successfully received analysis from Railway');
          
          // Simple snake_case to camelCase conversion
          const convertSnakeToCamel = (obj) => {
            if (Array.isArray(obj)) {
              return obj.map(convertSnakeToCamel);
            }
            if (obj !== null && typeof obj === 'object') {
              return Object.keys(obj).reduce((result, key) => {
                const camelKey = key.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
                result[camelKey] = convertSnakeToCamel(obj[key]);
                return result;
              }, {});
            }
            return obj;
          };
          
          const convertedData = convertSnakeToCamel(responseData);
          
          // Return the converted Railway response
          res.status(200).json(convertedData);
          resolve();
        } catch (error) {
          console.error('[Vercel Proxy] Error parsing Railway response:', error);
          res.status(500).json({ 
            error: 'Failed to parse Railway response',
            details: error.message 
          });
          resolve();
        }
      });
    });

    railwayReq.on('error', (error) => {
      console.error('[Vercel Proxy] Error forwarding to Railway:', error);
      
      // Return a fallback response with limited data
      console.log('[Vercel Proxy] Returning fallback response due to Railway API error');
      res.status(200).json({
        warning: 'Railway API unavailable - returning limited demo data',
        propertyDetails: req.body.propertyData || {},
        longTermRental: {
          monthlyRent: 3200,
          monthlyExpenses: 1800,
          cashFlow: 1400,
          capRate: 0.0512,
          cashOnCash: 0.0672,
          totalInvestment: req.body.propertyData?.price ? req.body.propertyData.price * 0.25 : 187500
        },
        shortTermRental: {
          monthlyRevenue: 6500,
          monthlyExpenses: 2800,
          netMonthlyIncome: 3700,
          occupancyRate: 0.72,
          nightlyRate: 289,
          annualRevenue: 78000
        },
        isDemo: true,
        error: 'Railway API temporarily unavailable'
      });
      resolve();
    });

    railwayReq.write(postData);
    railwayReq.end();
  });
};