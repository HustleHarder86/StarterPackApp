const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = 3001;
const MOCK_DIR = path.join(__dirname, 'public', 'api-mocks');

// Mock responses mapping
const mockResponses = {
  '/api/config': 'config.json',
  '/api/blog/posts': 'blog-posts.json',
  '/api/monitor-usage': 'monitor-usage.json',
  '/api/realtor/branding': {
    GET: 'realtor-branding-get.json',
    POST: 'realtor-branding-post.json'
  }
};

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }
  
  console.log(`${req.method} ${pathname}`);
  
  // Find mock response
  let mockFile = mockResponses[pathname];
  
  if (typeof mockFile === 'object') {
    mockFile = mockFile[req.method];
  }
  
  if (!mockFile) {
    // Default responses for common endpoints
    if (pathname === '/api/analyze-property' && req.method === 'POST') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: true,
        data: {
          longTermRental: {
            monthlyRent: 3500,
            monthlyCashFlow: -905,
            annualCashFlow: -10860,
            capRate: 2.8,
            totalROI: 8.5
          },
          strAnalysis: {
            averageNightlyRate: 289,
            occupancyRate: 70,
            monthlyCashFlow: -301,
            annualCashFlow: -3612,
            capRate: 5.2,
            totalROI: 12.3
          },
          comparison: {
            betterOption: 'str',
            cashFlowDifference: 7248
          }
        }
      }));
      return;
    }
    
    // 404 for unknown endpoints
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found' }));
    return;
  }
  
  // Read and serve mock file
  const filePath = path.join(MOCK_DIR, mockFile);
  
  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      if (err.code === 'ENOENT') {
        // File doesn't exist, return generic response
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
          success: true, 
          message: 'Mock response',
          timestamp: new Date().toISOString()
        }));
      } else {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Internal server error' }));
      }
      return;
    }
    
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(data);
  });
});

server.listen(PORT, () => {
  console.log(`Mock API server running on http://localhost:${PORT}`);
  console.log('Available endpoints:');
  Object.keys(mockResponses).forEach(endpoint => {
    console.log(`  ${endpoint}`);
  });
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down mock server...');
  server.close(() => {
    process.exit(0);
  });
});