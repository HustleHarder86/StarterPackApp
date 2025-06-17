# Migration Guide: Upgrading to InvestorProps 2.0

## What's New in Version 2.0

### ✅ Fixed Issues
- **Input field typing issue** - Resolved with proper React state management
- **Address fields** - Now broken down into street, city, state/province, country, postal code
- **Real analysis processing** - Actually calls AI APIs instead of just demo data
- **User authentication** - Complete sign up/sign in system
- **User dashboard** - View and manage all your analyses

### 🚀 New Features
- User accounts with Firebase Auth
- Dashboard to view analysis history
- International property support
- Proper API integration for real data
- Monthly analysis limits and tracking
- Improved error handling

## Migration Steps

### 1. Update Your Files

Replace these files with the new versions:
- `roi-finder.html` - Complete rewrite with authentication
- `api/analyze-property.js` - Enhanced with better error handling
- `package.json` - Updated version and description

### 2. Update Environment Variables

No new required variables, but ensure these are set:
```bash
# These should already exist
PERPLEXITY_API_KEY=your_key
OPENAI_API_KEY=your_key
```

### 3. Firebase Configuration

The app now uses authentication, so ensure:
1. Email/Password auth is enabled in Firebase Console
2. Firestore security rules are updated (see README)

### 4. Database Migration

If you have existing data in Firebase:

```javascript
// No migration needed - new collections:
// - users (new)
// - analyses (existing, enhanced)
// - leads (existing)
```

### 5. Test the New Features

1. **Test Authentication**
   - Go to `/roi-finder.html`
   - Create a new account
   - Verify email/password sign in works

2. **Test Property Analysis**
   - Use the new multi-field address form
   - Enter a real address
   - Verify you get actual analysis data (not demo)

3. **Test Dashboard**
   - Check that analyses appear in dashboard
   - Verify you can click to view past analyses
   - Check analysis counter works

## Breaking Changes

### API Response Format
The analysis API now returns:
```json
{
  "success": true,
  "analysisId": "analysis_xxx", 
  "data": {
    // Full analysis data
  }
}
```

### Frontend Structure
- Now requires authentication before analysis
- Address is split into multiple fields
- Results tied to user account

## Rollback Plan

If you need to rollback:
1. Keep your old `roi-finder.html` as `roi-finder-v1.html`
2. Can run both versions side by side
3. Old data remains compatible

## Common Migration Issues

### "Cannot find Firebase config"
- Run `/api/config` to verify configuration
- Check environment variables in Vercel

### "Authentication not working"
- Enable Email/Password in Firebase Console
- Check Firebase configuration in environment

### "Analyses not saving"
- Update Firestore security rules
- Check Firebase Admin SDK credentials

## Support

If you encounter issues during migration:
1. Check `/debug-test.html` for diagnostics
2. Review Vercel function logs
3. Check browser console for errors

## Next Steps

After successful migration:
1. Delete old demo-only code
2. Update any documentation
3. Notify users of new features
4. Consider implementing subscription tiers
