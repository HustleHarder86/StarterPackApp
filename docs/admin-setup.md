# Admin Setup Guide

## Setting Up Admin Access

To grant yourself unlimited STR trials and full admin access:

### Option 1: Using the Create Admin Script (Recommended)

1. Run the admin creation script:
```bash
node scripts/create-admin.js
```

2. Enter your admin details when prompted:
   - Email: your-email@example.com
   - Password: your-secure-password
   - Display Name: Your Name

This will create an admin account with:
- ✅ Unlimited STR analyses
- ✅ No trial restrictions
- ✅ Enterprise tier features
- ✅ Admin dashboard access

### Option 2: Manual Firestore Update

If you already have an account, update it to admin status:

1. Go to Firebase Console > Firestore Database
2. Find your user document in the `users` collection
3. Add/update these fields:
```json
{
  "role": "admin",
  "isAdmin": true,
  "subscriptionTier": "enterprise",
  "strAnalysisEnabled": true,
  "monthlyAnalysisLimit": -1
}
```

### Option 3: Using Firebase Admin SDK

```javascript
// Update existing user to admin
const admin = require('firebase-admin');
const userId = 'YOUR_USER_ID';

// Set custom claims
await admin.auth().setCustomUserClaims(userId, {
  role: 'admin',
  tier: 'enterprise'
});

// Update Firestore document
await admin.firestore().collection('users').doc(userId).update({
  role: 'admin',
  isAdmin: true,
  subscriptionTier: 'enterprise',
  strAnalysisEnabled: true
});
```

## Verifying Admin Access

1. Login to the app
2. Go to Property Confirmation screen
3. You should see "👑 Admin - Unlimited access" instead of trial counts
4. All STR analysis options will be available without restrictions

## Admin Features

As an admin, you have:
- **Unlimited STR analyses** - No trial limits
- **All premium features** - Full platform access
- **No usage restrictions** - Analyze as many properties as needed
- **Priority processing** - Your requests are never rate-limited
- **Admin badge** - Visual indicator of admin status

## Security Note

Admin accounts should only be created for:
- Platform owners
- Trusted administrators
- Development/testing purposes

Keep your admin credentials secure and don't share them.