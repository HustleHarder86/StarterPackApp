# 🚀 InvestorProps Deployment Checklist

Follow this checklist to deploy your enhanced InvestorProps application.

## 📋 Pre-Deployment Checklist

### 1. Firebase Setup ✅
- [ ] Created Firebase project
- [ ] Enabled Email/Password authentication
- [ ] Created Firestore database
- [ ] Downloaded service account JSON
- [ ] Added security rules to Firestore
- [ ] Created composite indexes (upload firestore.indexes.json)

### 2. API Keys ✅
- [ ] Obtained Perplexity AI API key
- [ ] Obtained OpenAI API key
- [ ] Added both to `.env` file

### 3. Environment Variables ✅
- [ ] Created `.env` file from `.env.example`
- [ ] Added all Firebase configuration values
- [ ] Added Firebase Admin SDK credentials
- [ ] Added AI API keys
- [ ] (Optional) Added Stripe keys

### 4. Local Testing ✅
- [ ] Run `npm install`
- [ ] Run `vercel dev`
- [ ] Test user registration at `/roi-finder.html`
- [ ] Test property analysis with real address
- [ ] Verify results show actual data (not just demo)
- [ ] Run system tests at `/test-script.html`

## 🌐 Deployment Steps

### Step 1: Install Vercel CLI
```bash
npm install -g vercel
```

### Step 2: Login to Vercel
```bash
vercel login
```

### Step 3: Deploy to Staging
```bash
vercel
# Follow prompts, accept defaults
```

### Step 4: Add Environment Variables
```bash
# Option 1: Use Vercel CLI
vercel env add VITE_FIREBASE_API_KEY
vercel env add VITE_FIREBASE_AUTH_DOMAIN
# ... add all variables from .env

# Option 2: Use Vercel Dashboard
# Go to: https://vercel.com/[your-username]/[project-name]/settings/environment-variables
# Add each variable manually
```

### Step 5: Deploy to Production
```bash
vercel --prod
```

### Step 6: Update Firebase Authorized Domains
1. Go to Firebase Console > Authentication > Settings
2. Add your Vercel domain to Authorized domains:
   - `your-app.vercel.app`
   - `your-custom-domain.com` (if applicable)

### Step 7: Configure Stripe Webhook (Optional)
If using Stripe:
1. Go to Stripe Dashboard > Webhooks
2. Add endpoint: `https://your-app.vercel.app/api/stripe-webhook`
3. Select events:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
4. Copy signing secret to Vercel env vars

## ✅ Post-Deployment Verification

### Functional Tests
- [ ] Homepage loads at `/`
- [ ] ROI Finder loads at `/roi-finder.html`
- [ ] Can create new account
- [ ] Can sign in with existing account
- [ ] Can analyze property with full address
- [ ] Analysis shows real data (check ROI percentage varies)
- [ ] Dashboard shows analysis history
- [ ] Can view previous analyses

### API Tests
- [ ] `/api/config` returns Firebase config
- [ ] `/api/analyze-property` returns analysis data
- [ ] `/api/submit-lead` saves leads
- [ ] Check Vercel Functions logs for errors

### Performance Tests
- [ ] Page load time < 3 seconds
- [ ] Analysis completes in < 60 seconds
- [ ] No console errors in browser

## 🐛 Common Deployment Issues

### "Firebase Auth Domain Not Authorized"
Add Vercel domain to Firebase authorized domains

### "API Keys Not Found"
Ensure all environment variables are added in Vercel dashboard

### "Analysis Returns Only Demo Data"
Check that AI API keys are correctly set in Vercel

### "Cannot Connect to Firebase"
Verify FIREBASE_PRIVATE_KEY has proper line breaks (\n)

## 📊 Monitoring

### Set Up Monitoring
1. **Vercel Analytics**: Automatically included
2. **Function Logs**: Check Vercel dashboard > Functions tab
3. **Error Tracking**: Consider adding Sentry
4. **Uptime Monitoring**: Use UptimeRobot or similar

### Key Metrics to Track
- User registrations per day
- Analyses performed per day
- API response times
- Error rates
- Conversion rate (visitor to user)

## 🔒 Security Checklist

- [ ] All API keys in environment variables (not in code)
- [ ] Firebase security rules restrict user data access
- [ ] HTTPS enforced (automatic with Vercel)
- [ ] Input validation on all forms
- [ ] Rate limiting configured (Vercel automatic)

## 📱 Next Steps

1. **Custom Domain**: Add custom domain in Vercel settings
2. **Email Notifications**: Configure SendGrid for transactional emails
3. **Analytics**: Add Google Analytics or Plausible
4. **Backups**: Set up Firestore automated backups
5. **Scaling**: Monitor usage and upgrade plans as needed

## 🎉 Launch Checklist

- [ ] All tests passing
- [ ] Team members have access
- [ ] Documentation updated
- [ ] Support email configured
- [ ] Social media announcements prepared
- [ ] Customer support ready

## 📞 Support Resources

- **Vercel Support**: https://vercel.com/support
- **Firebase Support**: https://firebase.google.com/support
- **Your Docs**: Update README.md with your support info

---

**Congratulations!** Your InvestorProps app is now live and ready for users! 🚀
