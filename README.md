# InvestorProps - AI-Powered Real Estate Investment Analysis Platform

A comprehensive real estate investment analysis platform that provides AI-powered property analysis with authentication, user dashboard, and worldwide property support.

## 🚀 Key Features

- 🔐 **User Authentication** - Sign up/sign in with email and password
- 📊 **User Dashboard** - View all your property analyses in one place
- 🌍 **International Support** - Analyze properties anywhere in the world
- 🤖 **AI-Powered Analysis** - Uses Perplexity AI and OpenAI GPT-4 for accurate market research
- 💰 **ROI Calculations** - Compare short-term (Airbnb) vs long-term rental potential
- 📈 **Visual Analytics** - Charts and graphs for easy decision making
- 🔄 **Real-time Data** - Current market values, rental rates, and costs
- 💳 **Subscription Management** - Stripe integration for paid plans (optional)

## 🛠️ Tech Stack

- **Frontend**: HTML, CSS, JavaScript, React (CDN)
- **Backend**: Vercel Functions (Node.js)
- **Database**: Firebase Firestore
- **Authentication**: Firebase Auth
- **AI APIs**: Perplexity AI (research) + OpenAI GPT-4 (data structuring)
- **Payments**: Stripe (optional)
- **Deployment**: Vercel

## 📋 Prerequisites

- Node.js 16+ installed
- Vercel account (free tier works)
- Firebase project
- API keys for Perplexity AI and OpenAI
- Stripe account (optional, for payments)

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

# AI APIs (REQUIRED)
PERPLEXITY_API_KEY=pplx-your-api-key
OPENAI_API_KEY=sk-your-openai-key

# Stripe (OPTIONAL - app works without these)
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_key
STRIPE_SECRET_KEY=sk_test_your_key
STRIPE_WEBHOOK_SECRET=whsec_your_secret
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

1. **Sign Up/Sign In**
   - Users create account with email/password
   - 7-day free trial with 3 analyses
   - Profile stored in Firestore

2. **Property Analysis**
   - Enter property address (broken down by street, city, state/province, country)
   - AI researches property using Perplexity (market data, comparables, rental rates)
   - OpenAI structures the data into investment metrics
   - Results saved to user's account

3. **View Results**
   - Comprehensive dashboard with property value, costs, ROI
   - Visual charts comparing rental strategies
   - Investment recommendations
   - Access previous analyses from dashboard

### Data Processing

1. **Address Input** → Structured fields for international support
2. **AI Research** → Perplexity searches real-time market data
3. **Data Structuring** → OpenAI formats research into JSON
4. **Calculations** → ROI, profits, and recommendations
5. **Storage** → Firebase Firestore with user association

## 📊 API Endpoints

- `POST /api/analyze-property` - Main analysis endpoint
- `GET /api/config` - Public configuration
- `POST /api/submit-lead` - Lead capture
- `POST /api/stripe-operations` - Payment operations (if configured)
- `GET/POST /api/user-management` - User profile management

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

- **Free Trial**: 7 days, 3 analyses
- **Starter**: $49/month, 100 analyses
- **Pro**: $99/month, 250 analyses  
- **Enterprise**: Custom pricing, unlimited

## 🔒 Security

- Firebase Auth for user management
- API keys stored as environment variables
- User data isolation in Firestore
- HTTPS enforced on Vercel
- Input validation and sanitization

## 📈 Future Enhancements

- [ ] Mobile app (React Native)
- [ ] Mortgage calculator integration
- [ ] Market trend predictions
- [ ] Portfolio management
- [ ] Email notifications
- [ ] PDF report generation
- [ ] Multi-language support

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

---

**Note**: This app can operate without Stripe configuration. Payment features will be disabled but all analysis functionality remains available.
