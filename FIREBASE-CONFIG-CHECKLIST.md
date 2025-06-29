# ✅ Firebase Configuration Checklist

Use this checklist to ensure Firebase is properly configured for StarterPackApp.

## 🔧 Initial Setup

### Firebase Console
- [ ] Create new Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
- [ ] Project name: `starterpackapp` (or your choice)
- [ ] Enable Google Analytics (optional)
- [ ] Select project location (e.g., `us-central1`)

### Enable Services
- [ ] **Authentication**
  - [ ] Enable Email/Password provider
  - [ ] Add authorized domains (localhost, your-app.vercel.app)
- [ ] **Firestore Database**
  - [ ] Create database in production mode
  - [ ] Select same region as project
- [ ] **Storage**
  - [ ] Initialize in production mode
  - [ ] Select same region as project

## 🔑 Configuration Keys

### Client-Side Config (Web App)
- [ ] Go to Project Settings > General
- [ ] Add new Web app
- [ ] Copy configuration values:
  - [ ] `apiKey`
  - [ ] `authDomain`
  - [ ] `projectId`
  - [ ] `storageBucket`
  - [ ] `messagingSenderId`
  - [ ] `appId`

### Server-Side Config (Service Account)
- [ ] Go to Project Settings > Service Accounts
- [ ] Generate new private key
- [ ] Save JSON file securely
- [ ] Extract from JSON:
  - [ ] `project_id`
  - [ ] `client_email`
  - [ ] `private_key`

## 📝 Environment Variables

### Create `.env.local` file
```bash
# Client-side Firebase config
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=

# Server-side Firebase config
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=""
```

### Vercel Environment Variables
- [ ] Add all variables to Vercel dashboard
- [ ] Set for all environments (Production, Preview, Development)

## 🚀 Deployment

### Install Dependencies
```bash
npm install
npm install -g firebase-tools
```

### Firebase CLI Setup
- [ ] Run `firebase login`
- [ ] Run `firebase init` (select Firestore, Storage, Hosting)
- [ ] Update `.firebaserc` with your project ID

### Deploy Security Rules
- [ ] Run `firebase deploy --only firestore:rules`
- [ ] Run `firebase deploy --only storage:rules`
- [ ] Run `firebase deploy --only firestore:indexes`

### Initialize Database
- [ ] Run `npm run firebase:init`
- [ ] Verify in Firebase Console that collections were created

### Create Admin User
- [ ] Run `npm run firebase:admin`
- [ ] Enter admin email
- [ ] Enter secure password
- [ ] Note the generated UID

## 🧪 Testing

### Test Authentication
- [ ] Open `/roi-finder.html`
- [ ] Try to sign up with new email
- [ ] Try to login with created account
- [ ] Verify user appears in Firebase Console

### Test Firestore
- [ ] Submit a property analysis
- [ ] Check Firestore for new documents in:
  - [ ] `users` collection
  - [ ] `properties` collection
  - [ ] `analyses` collection

### Test Storage (if using reports)
- [ ] Generate a report
- [ ] Check Storage bucket for PDF files

## 🔒 Security Verification

### Firestore Rules
- [ ] Only authenticated users can read their own data
- [ ] Users cannot modify subscription status
- [ ] Admin role cannot be self-assigned

### Storage Rules
- [ ] Users can only access their own files
- [ ] File size limits enforced (10MB)
- [ ] Only allowed file types (images, PDFs)

### Authentication
- [ ] Email verification enabled (optional)
- [ ] Password policy configured
- [ ] Authorized domains updated

## 📊 Monitoring Setup

### Enable Monitoring
- [ ] Go to Firebase Console > Usage
- [ ] Set up billing alerts
- [ ] Review quotas:
  - [ ] Firestore reads/writes
  - [ ] Storage bandwidth
  - [ ] Authentication verifications

### Usage Limits (Free Tier)
- Firestore: 50K reads, 20K writes, 20K deletes/day
- Storage: 5GB storage, 1GB/day download
- Authentication: 10K verifications/month

## 🎯 Production Checklist

### Before Going Live
- [ ] Remove test users (except admin)
- [ ] Clear demo/test data
- [ ] Verify all API keys are production keys
- [ ] Test with real payment flow (if using Stripe)
- [ ] Backup service account key

### Performance
- [ ] Enable Firestore indexes for all queries
- [ ] Set up caching for frequently accessed data
- [ ] Monitor cold start times for functions

### Backup & Recovery
- [ ] Export Firestore backup
- [ ] Document admin access procedures
- [ ] Create disaster recovery plan

## 🆘 Troubleshooting

### Common Issues
- **"Permission Denied"**: Check security rules and user authentication
- **"Index Required"**: Deploy indexes or create in console
- **"Quota Exceeded"**: Check usage limits or upgrade plan
- **"CORS Error"**: Add domain to authorized domains

### Debug Commands
```bash
# Check Firebase project
firebase projects:list

# View deployment history
firebase deploy:list

# Test rules locally
firebase emulators:start --only firestore
```

## 📞 Support Resources

- [Firebase Documentation](https://firebase.google.com/docs)
- [Firebase Status](https://status.firebase.google.com)
- [Stack Overflow Firebase Tag](https://stackoverflow.com/questions/tagged/firebase)
- [Firebase YouTube Channel](https://www.youtube.com/c/firebase)

## ✨ Success Indicators

When properly configured, you should see:
- ✅ Users can sign up and login
- ✅ Property analyses save to Firestore
- ✅ STR trial counter decrements for free users
- ✅ Browser extension can authenticate
- ✅ No permission errors in console
- ✅ Data appears in Firebase Console

## 🎉 Configuration Complete!

Once all items are checked, your Firebase backend is ready for StarterPackApp!