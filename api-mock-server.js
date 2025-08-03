const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Mock Firebase config
app.get('/api/config', (req, res) => {
  res.json({
    apiKey: "AIzaSyMOCK_CONFIG",
    authDomain: "starterpackapp-mock.firebaseapp.com",
    projectId: "starterpackapp-mock",
    storageBucket: "starterpackapp-mock.appspot.com",
    messagingSenderId: "123456789",
    appId: "1:123456789:web:abcdef123456"
  });
});

// Mock blog posts
app.get('/api/blog-posts', (req, res) => {
  const posts = [
    {
      id: 1,
      title: "5 Key Metrics Every Real Estate Investor Should Track",
      excerpt: "Understanding these fundamental metrics will transform how you evaluate investment properties...",
      category: "investment-strategies",
      date: "2025-01-15",
      readTime: "5 min read",
      author: "Sarah Mitchell",
      featured: true
    },
    {
      id: 2,
      title: "Canadian Real Estate Market Outlook 2025",
      excerpt: "An in-depth analysis of trends shaping the Canadian property market this year...",
      category: "market-analysis",
      date: "2025-01-10",
      readTime: "8 min read",
      author: "David Chen"
    },
    {
      id: 3,
      title: "Maximizing ROI with Short-Term Rentals",
      excerpt: "Learn how to leverage platforms like Airbnb to boost your rental income...",
      category: "property-management",
      date: "2025-01-05",
      readTime: "6 min read",
      author: "Emma Rodriguez"
    }
  ];
  
  res.json(posts);
});

// Mock monitor usage data
app.get('/api/monitor/usage', (req, res) => {
  res.json({
    systemStatus: "operational",
    totalAnalyses24h: 156,
    averageResponseTime: "2.3s",
    apiCalls: {
      perplexity: 312,
      airbnb: 78,
      openai: 45
    },
    costToday: 23.45,
    recentAnalyses: [
      {
        timestamp: new Date().toISOString(),
        address: "123 Main St, Toronto",
        dataSource: "Extension",
        apiCost: 0.15,
        sources: ["Perplexity", "Airbnb"],
        roi: "7.2%"
      }
    ]
  });
});

// Mock property analysis (for testing)
app.post('/api/analyze-property', (req, res) => {
  const { propertyData, analysisType } = req.body;
  
  // Simulate processing delay
  setTimeout(() => {
    res.json({
      propertyData,
      analysisType,
      costs: {
        mortgagePayment: 2500,
        propertyManagement: 250,
        insurance: 150,
        maintenance: 200,
        utilities: 100
      },
      longTermRental: {
        monthlyRent: 3200,
        capRate: 6.5,
        cashFlow: 700,
        roi: 8.2
      },
      strAnalysis: {
        monthlyRevenue: 4800,
        occupancyRate: 75,
        nightlyRate: 200,
        comparables: [
          { address: "Similar Property 1", nightlyRate: 185, occupancy: 78 },
          { address: "Similar Property 2", nightlyRate: 210, occupancy: 72 }
        ]
      },
      recommendation: "recommended",
      investmentScore: 8.5,
      insights: [
        "Strong rental demand in this area",
        "Property taxes are below market average",
        "Excellent walkability score"
      ]
    });
  }, 1000);
});

// Mock lead submission
app.post('/api/submit-lead', (req, res) => {
  const { name, email } = req.body;
  console.log(`New lead: ${name} - ${email}`);
  res.json({ success: true, message: "Lead captured successfully" });
});

// Start server
app.listen(PORT, () => {
  console.log(`Mock API server running on http://localhost:${PORT}`);
  console.log('Available endpoints:');
  console.log('  GET  /api/config');
  console.log('  GET  /api/blog-posts');
  console.log('  GET  /api/monitor/usage');
  console.log('  POST /api/analyze-property');
  console.log('  POST /api/submit-lead');
});