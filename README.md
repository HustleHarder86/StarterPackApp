# Real Estate ROI Finder - InvestorProps

A comprehensive real estate investment analysis platform that uses AI to provide detailed property analysis, ROI calculations, and investment recommendations.

## Features

- 🏠 **AI-Powered Property Analysis** - Uses Perplexity AI for market research and OpenAI for data structuring
- 📊 **ROI Calculations** - Compares short-term rental (Airbnb) vs long-term rental potential
- 💰 **Subscription Management** - Integrated Stripe payments with multiple tiers
- 🔐 **User Authentication** - Firebase Auth with free trial and subscription tracking
- 📈 **Real-time Market Data** - Current property values, rental rates, and market conditions
- 🎯 **Investment Recommendations** - AI-generated insights for optimal investment strategies

## Tech Stack

- **Frontend**: HTML, CSS, JavaScript, React (in ROI Finder)
- **Backend**: Vercel Functions (Node.js)
- **Database**: Firebase Firestore
- **Authentication**: Firebase Auth
- **Payments**: Stripe
- **AI APIs**: Perplexity AI, OpenAI GPT-4
- **Deployment**: Vercel

## Setup Instructions

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/investorprops.git
cd investorprops
```

### 2. Environment Variables

Create a `.env` file in the root directory based on `.env.example`:

```bash
cp .env.example .env
```

Fill in the required values (Stripe keys are optional):

#### Required Configuration

##### Firebase Configuration
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create a new project or select existing
3. Go to Project Settings > General
4. Copy the Firebase config values
5. For admin SDK: Go to Project Settings > Service Accounts > Generate New Private Key

##### AI API Keys
1. **Perplexity AI**: Get your API key from [Perplexity AI](https://www.perplexity.ai)
2. **OpenAI**: Get your API key from [OpenAI Platform](https://platform.openai.com)

#### Optional Configuration (Can be added later)

##### Stripe Configuration
The app will work without Stripe keys - payment features will be disabled but all other functionality will work normally.

When ready to enable payments:
1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Copy your publishable and secret keys
3. Create products and price IDs for each tier
4. Set up webhook endpoint: `https://your-domain.com/api/stripe-webhook`
5. Copy the webhook signing secret

### 3. Firebase Setup

1. Enable Authentication in Firebase Console
2. Enable Email/Password sign-in method
3. Create Firestore database with these collections:
   - `users` - User profiles and subscription data
   - `analyses` - Property analysis results
   - `subscriptions` - Subscription records

4. **Stripe Products Setup**

Create the following products and prices in your Stripe Dashboard:

- **Starter Plan**
  - Monthly: $49
  - Yearly: $490 (save ~17%)
  
- **Pro Plan**  
  - Monthly: $99
  - Yearly: $990 (save ~17%)
  
- **Enterprise Plan**
  - Monthly: Custom pricing

After creating, add the price IDs to your `.env` file.

### 5. Deploy to Vercel

1. Install Vercel CLI: `npm i -g vercel`
2. Run `vercel` in the project directory
3. Follow the prompts to deploy
4. Add environment variables in Vercel dashboard

### 5. Configure Stripe Webhook

After deployment, update your Stripe webhook endpoint:
1. Go to Stripe Dashboard > Webhooks
2. Add endpoint: `https://your-vercel-domain.com/api/stripe-webhook`
3. Select events:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`

## Project Structure

```
├── api/                    # Vercel Functions (API endpoints)
│   ├── analyze-property.js # Property analysis endpoint
│   ├── config.js          # Public config endpoint
│   ├── stripe-operations.js # Stripe payment operations
│   ├── stripe-webhook.js  # Stripe webhook handler
│   └── user-management.js # User operations
├── assets/                # Images and icons
├── data/                  # Static data files
├── *.html                 # HTML pages
├── *.js                   # Service files and utilities
├── styles.css            # Global styles
└── .env.example          # Environment variables template
```

## API Endpoints

- `POST /api/analyze-property` - Analyze a property using AI
- `POST /api/stripe-operations` - Handle Stripe operations
- `POST /api/stripe-webhook` - Stripe webhook handler
- `GET/POST /api/user-management` - User profile operations
- `GET /api/config` - Public configuration
- `POST /api/submit-analysis` - Submit demo analysis request
- `POST /api/submit-contact` - Submit contact form
- `POST /api/submit-lead` - Submit lead form (homepage)

## Development

To run locally:

```bash
# Install dependencies
npm install

# Run development server
vercel dev
```

The app will be available at `http://localhost:3000`

### Running Without Stripe

The app is designed to work without Stripe configuration:
- All analysis features work normally
- Users can sign up and use the 7-day trial (3 analyses)
- Payment buttons will show demo mode alerts
- You can add Stripe keys later without any code changes

### Running With Full Features

To enable payment processing:
1. Add Stripe keys to `.env`
2. Create products in Stripe Dashboard
3. Update price IDs in `.env`
4. Restart the development server

## Pricing Tiers

- **Trial**: 3 free analyses (7 days)
- **Starter**: $49/month - 100 analyses
- **Pro**: $99/month - 250 analyses
- **Enterprise**: Custom pricing - Unlimited analyses

## Security Notes

- Never commit `.env` file
- Keep API keys secure
- Use environment variables in production
- Enable CORS only for your domain in production
- Implement rate limiting for API endpoints

## Missing Files to Add

The following files need to be created in your project:

1. **Firebase Admin Service Account Key**
   - Download from Firebase Console > Project Settings > Service Accounts
   - Add the values to your `.env` file

2. **Stripe Products and Prices**
   - Create in Stripe Dashboard
   - Add price IDs to `.env` file

## Common Issues

1. **"Firebase Admin initialization error"**
   - Ensure `FIREBASE_PRIVATE_KEY` in `.env` has proper line breaks (`\n`)
   - Check that all Firebase Admin credentials are correct

2. **"Stripe webhook signature verification failed"**
   - Make sure `STRIPE_WEBHOOK_SECRET` matches the one from Stripe Dashboard
   - Ensure raw body parsing for webhook endpoint

3. **"API endpoint not found"**
   - Check that all files in `/api` directory have `.js` extension
   - Verify Vercel deployment includes all API files

## Summary

I've successfully converted your Make.com workflow to use direct API calls. Here's what changed:

### 🔄 Major Changes:
1. **Removed Make.com Dependencies** - All webhooks replaced with Vercel API functions
2. **Removed Airtable** - All data now stored in Firebase Firestore
3. **Direct AI Integration** - Perplexity and OpenAI APIs called directly from backend
4. **Simplified Architecture** - Everything runs on Vercel with Firebase
5. **Stripe Optional** - App works without Stripe keys (payment features disabled)

### 📁 New Files Created:
- `api/analyze-property.js` - Main analysis endpoint
- `api/user-management.js` - User operations
- `api/stripe-operations.js` - Stripe payment handling
- `api/stripe-webhook.js` - Stripe webhook handler
- `api/submit-analysis.js` - Demo analysis submissions
- `package.json` - Node.js dependencies
- `vercel.json` - Vercel configuration
- Updated service files to remove Make.com calls

### ✅ Next Steps:
1. Add your Firebase and AI API keys to `.env` file
2. Set up Firebase Admin SDK credentials
3. Deploy to Vercel
4. (Optional) Add Stripe keys later when ready for payments

The application now runs entirely on your own infrastructure without external workflow dependencies!
