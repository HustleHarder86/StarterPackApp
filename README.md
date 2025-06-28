# StarterPackApp - Advanced Real Estate Investment Analysis Platform

A sophisticated real estate investment analysis SaaS platform that combines AI-powered property analysis with automated data extraction from property listings. Features both traditional rental and short-term rental (Airbnb) analysis with professional reporting.

## 🚀 Key Features

### Core Features
- 🔐 **User Authentication** - Firebase Auth with subscription tiers
- 📊 **Comprehensive Dashboard** - Track all property analyses and portfolio performance
- 🌍 **Canadian Market Focus** - Optimized for Canadian real estate with international support
- 🤖 **AI-Powered Analysis** - Perplexity AI for market research + intelligent recommendations
- 🏠 **Browser Extension** - One-click analysis from Realtor.ca listings

### Analysis Capabilities
- 💰 **AI-Powered Rental Discovery** - Uses Perplexity AI to find current long-term rental rates
- 🏨 **Short-Term Rental Analysis** - Airbnb revenue projections with comparable matching
- 🔊 **STR vs LTR Comparison** - Side-by-side comparison of both rental strategies
- 📈 **Visual Analytics** - Interactive charts comparing rental income potential
- 🔄 **Real-time Data** - Current market values, rental rates, and neighborhood trends
- 📑 **Professional Reports** - Export detailed PDF reports with both rental strategies

### Platform Features
- 💳 **Subscription Tiers** - Free tier + Pro tier with STR analysis
- 🎯 **Smart Comparable Matching** - Intelligent algorithm for finding similar properties
- 📱 **Mobile Responsive** - Full functionality on all devices
- 🔍 **Saved Searches** - Monitor markets with custom alerts
- 📊 **Portfolio Tracking** - Analyze multiple properties and track performance

## 🛠️ Tech Stack

### Current Stack (Production)
- **Frontend**: HTML5, CSS3, JavaScript (ES6+), React (CDN), Tailwind CSS
- **Backend**: Vercel Serverless Functions (Node.js)
- **Database**: Firebase Firestore
- **Authentication**: Firebase Auth
- **Caching**: Vercel Edge Cache + Firebase
- **File Storage**: Firebase Storage (reports)

### External Services
- **AI APIs**: 
  - Perplexity AI - Market research and real-time data
  - OpenAI GPT-4 - Data structuring (optional fallback)
  - Airbnb Scraper API - STR comparable data ($0.05/100 results)
- **Payments**: Stripe (subscription management)
- **Email**: Vercel Email API / SendGrid
- **Deployment**: Vercel

### Browser Extension
- **Platform**: Chrome/Edge WebExtensions API
- **Target**: Realtor.ca property listings
- **Communication**: REST API to backend

## 📋 Prerequisites

### Required
- Node.js 18+ installed
- Vercel account (free tier works)
- Firebase project (Auth + Firestore)
- Perplexity AI API key
- Chrome or Edge browser (for extension development)

### Optional but Recommended
- OpenAI API key (fallback for data structuring)
- Airbnb Scraper API account (for STR analysis)
- Stripe account (for paid subscriptions)
- SendGrid account (for transactional emails)

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/investorprops.git
cd investorprops
npm install
```

### 2. Set Up Firebase

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create a new project
3. Enable Authentication > Email/Password
4. Create Firestore database
5. Download service account key (Project Settings > Service Accounts)

### 3. Configure Environment Variables

Create `.env` file:

```bash
# Firebase Configuration (REQUIRED)
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id

# Firebase Admin (REQUIRED)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour private key\n-----END PRIVATE KEY-----\n"

# AI APIs
PERPLEXITY_API_KEY=pplx-your-api-key  # REQUIRED
OPENAI_API_KEY=sk-your-openai-key     # OPTIONAL (recommended)

# Airbnb Scraper API (OPTIONAL - for STR analysis)
AIRBNB_SCRAPER_API_KEY=your-scraper-api-key
AIRBNB_SCRAPER_API_URL=https://api.scrapingservice.com/v1

# Stripe (OPTIONAL - for paid subscriptions)
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_key
STRIPE_SECRET_KEY=sk_test_your_key
STRIPE_WEBHOOK_SECRET=whsec_your_secret

# Email Service (OPTIONAL)
SENDGRID_API_KEY=SG.your-api-key
FROM_EMAIL=noreply@starterpackapp.com
```

### 4. Run Development Server

```bash
vercel dev
```

Visit `http://localhost:3000`

### 5. Deploy to Production

```bash
vercel --prod
```

## 🔧 Configuration Details

### Firebase Security Rules

Add these rules to Firestore:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Users can only read their own analyses
    match /analyses/{analysisId} {
      allow read: if request.auth != null && 
        request.auth.uid == resource.data.userId;
      allow create: if request.auth != null;
    }
    
    // Leads collection for demo submissions
    match /leads/{leadId} {
      allow create: if true;
      allow read: if request.auth != null && 
        request.auth.token.admin == true;
    }
  }
}
```

### AI API Configuration

#### Perplexity AI
1. Sign up at [Perplexity AI](https://www.perplexity.ai)
2. Get API key from dashboard
3. Add to `.env` as `PERPLEXITY_API_KEY`

#### OpenAI
1. Sign up at [OpenAI](https://platform.openai.com)
2. Create API key
3. Add to `.env` as `OPENAI_API_KEY`

## 💡 How It Works

### User Flow

1. **Property Discovery**
   - Browse properties on Realtor.ca
   - Click browser extension button to analyze
   - OR manually enter property details in app

2. **Analysis Process**
   - **Long-Term Rental**: AI discovers current rental rates for similar properties
   - **STR Analysis** (Pro): Fetches Airbnb comparables for revenue projections
   - **Comparison Engine**: Calculates ROI for both strategies side-by-side
   - AI generates insights on which strategy yields better returns
   - Results saved to user's portfolio with both rental scenarios

3. **Investment Decision**
   - View comprehensive analysis dashboard
   - Compare traditional vs STR potential
   - See which strategy yields higher returns
   - Generate professional PDF reports
   - Track multiple properties in portfolio

### Trial Experience
- Free users get **5 lifetime STR analyses** to experience the full platform
- After 5 uses, upgrade to Pro for unlimited STR analyses
- Trial includes full comparison features and recommendations

### Technical Flow

1. **Data Ingestion**
   - Browser extension extracts Realtor.ca listing data
   - POST to `/api/properties/ingest` endpoint
   - Property data validated and stored

2. **Analysis Engine**
   - **LTR Discovery**: Perplexity AI searches for long-term rental rates
   - **Financial Calculations**: Mortgage, expenses, cash flow for both strategies
   - **STR Analysis**: Queries Airbnb API for comparable properties
   - **Comparison Algorithm**: Calculates net returns for LTR vs STR
   - **AI Recommendations**: Suggests optimal rental strategy based on data

3. **Report Generation**
   - Compile analysis data and visualizations
   - Generate PDF using templates
   - Store in Firebase Storage
   - Email delivery option

## 📊 API Endpoints

### Core Endpoints
- `POST /api/analyze-property` - Run property analysis
- `POST /api/properties/ingest` - Receive data from browser extension
- `GET /api/properties` - List user's properties
- `GET /api/analyses` - Get user's analysis history

### User Management
- `GET/POST /api/user-management` - Profile management
- `GET /api/subscription` - Subscription status
- `POST /api/subscription/upgrade` - Upgrade to pro

### STR Analysis (Pro Feature)
- `POST /api/str-analysis` - Run Airbnb comparable analysis
- `GET /api/str-comparables/:id` - Get comparable properties

### Reporting
- `POST /api/reports/generate` - Create PDF report
- `GET /api/reports/:id` - Download report

### Admin & Support
- `GET /api/config` - Public configuration
- `POST /api/submit-lead` - Lead capture
- `POST /api/stripe-webhook` - Stripe events
- `GET /api/monitor-usage` - Usage analytics

## 🐛 Troubleshooting

### Common Issues

1. **"Cannot type in address field"**
   - Fixed with proper React state management
   - Uses `useCallback` to prevent re-renders

2. **"Only demo data shows"**
   - Ensure AI API keys are configured
   - Check Vercel environment variables
   - View logs in Vercel dashboard

3. **"Firebase connection error"**
   - Verify Firebase credentials
   - Check private key formatting (needs `\n`)
   - Ensure Firestore is initialized

4. **"Analysis limit reached"**
   - Free trial: 3 analyses
   - Upgrade to paid plan for more
   - Resets monthly for paid users

### Debug Mode

Visit `/debug-test.html` to run diagnostics:
- Tests API endpoints
- Verifies Firebase connection
- Checks environment variables

## 💰 Subscription Tiers

### Free Tier
- 5 property analyses/month
- AI-powered long-term rental discovery
- **5 FREE STR analyses** (trial experience)
- Side-by-side LTR vs STR comparison
- Basic reports (JSON/CSV export)
- Email support

### Pro Tier ($29/month)
- 100 property analyses/month
- Unlimited STR analyses
- Full Airbnb comparable data
- Professional PDF reports
- Saved searches & alerts
- Portfolio tracking
- Priority support

### Enterprise (Custom Pricing)
- Unlimited analyses
- API access
- White-label options
- Custom integrations
- Dedicated support

## 🔒 Security

- Firebase Auth for user management
- API keys stored as environment variables
- User data isolation in Firestore
- HTTPS enforced on Vercel
- Input validation and sanitization

## 🏗️ Implementation Roadmap

### Phase 1: Foundation Enhancement (Week 1-2)
- [x] Existing authentication & dashboard
- [ ] Browser extension MVP for Realtor.ca
- [ ] Property ingestion endpoint
- [ ] Enhanced traditional rental calculations

### Phase 2: STR Integration (Week 3-4)
- [ ] Airbnb Scraper API integration
- [ ] Comparable matching algorithm
- [ ] STR revenue projections
- [ ] Comparison visualizations

### Phase 3: Professional Features (Week 5-6)
- [ ] PDF report generation
- [ ] Saved searches functionality
- [ ] Email notifications
- [ ] Portfolio tracking

### Phase 4: Launch Preparation (Week 7-8)
- [ ] Subscription tier implementation
- [ ] Performance optimization
- [ ] Security audit
- [ ] Beta testing program

## 📈 Future Enhancements

- [ ] Mobile app (React Native)
- [ ] MLS integration for multiple regions
- [ ] AI-powered market predictions
- [ ] Mortgage pre-qualification
- [ ] Property management tools
- [ ] Multi-language support (French priority)

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## 📝 License

MIT License - see LICENSE file for details

## 🙏 Acknowledgments

- Perplexity AI for market research capabilities
- OpenAI for data structuring
- Firebase for authentication and database
- Vercel for seamless deployment

## 📞 Support

- Documentation: Check this README
- Issues: GitHub Issues
- Email: support@investorprops.com

## 🧩 Browser Extension Setup

### Installation (Development)
1. Navigate to `extension/` directory
2. Run `npm install` and `npm run build`
3. Open Chrome/Edge → Extensions → Developer mode ON
4. Click "Load unpacked" → Select `extension/dist` folder

### Usage
1. Navigate to any Realtor.ca property listing
2. Click the StarterPackApp extension icon
3. Review extracted data
4. Click "Analyze Property" to send to app

---

**Note**: The platform operates with a generous free tier. STR analysis and professional reports require a Pro subscription, but core ROI calculations are always available.
