# Amy's To-Do's - InvestorProps Testing Guide

*Created: 2025-06-29*

---

## 🎯 Priority 1: Core Functionality Testing (30 mins)

### ✅ Test the Rebranding
- [ ] Visit https://starter-pack-app.vercel.app/
- [ ] Verify "InvestorProps" appears everywhere (not StarterPackApp)
- [ ] Check that the purple/indigo color scheme is consistent

### 🏠 Test ROI Finder (Main Product)
- [ ] Go to ROI Finder from homepage
- [ ] Log in with your existing account
- [ ] Try analyzing a property with sample data:
  - **Address:** 123 Main St, Toronto, ON
  - **Price:** $800,000
  - **Bedrooms:** 3, **Bathrooms:** 2
  - **Square feet:** 1,500
- [ ] Verify the analysis results display properly
- [ ] Check if STR (Airbnb) analysis is working

### 📊 Test Portfolio Page
- [ ] Click "Portfolio" in navigation
- [ ] Check if your previous analyses show up
- [ ] Verify the charts display correctly
- [ ] Test the export to CSV feature

---

## 🆕 Priority 2: New Features Testing (20 mins)

### 🎨 Test Realtor Branding Feature
- [ ] Go to "Branding" in navigation
- [ ] Fill out your branding info:
  - Your name
  - Phone number
  - Email
  - Upload a logo (optional)
  - Pick brand colors
- [ ] Save and verify it saves successfully
- [ ] Check if the preview updates live

### 📝 Test Blog Section
- [ ] Click "Blog" in navigation
- [ ] Verify sample blog posts appear
- [ ] Test search functionality
- [ ] Try filtering by category
- [ ] Click on a blog post to read it

---

## 🔧 Priority 3: Admin Features (15 mins)

### 🔥 Set Up Firebase Admin (Required for Blog Admin)

**You need to do this first:**

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project: `rental-roi-calculator-ddce2`
3. Go to **Project Settings** → **Service Accounts**
4. Click **"Generate New Private Key"**
5. Open the downloaded JSON file
6. Go to [Vercel Dashboard](https://vercel.com/dashboard)
7. Select your project → **Settings** → **Environment Variables**
8. Add these variables from the JSON:

| Variable Name | Value |
|--------------|-------|
| `FIREBASE_PROJECT_ID` | rental-roi-calculator-ddce2 |
| `FIREBASE_CLIENT_EMAIL` | (copy from JSON) |
| `FIREBASE_PRIVATE_KEY` | (copy from JSON, include the \n characters) |

### ✍️ Test Blog Admin (After Firebase Setup)
- [ ] Go to https://starter-pack-app.vercel.app/blog-admin.html
- [ ] Log in with your account
- [ ] Try creating a test blog post:
  - **Title:** "Test Post - Delete Later"
  - **Category:** Market Analysis
  - Write some test content
- [ ] Save as draft first
- [ ] Then publish it
- [ ] Go back to the public blog page and verify it appears

---

## 🧩 Priority 4: Browser Extension Testing (15 mins)

### 📥 Install the Browser Extension

**Step-by-step instructions:**

1. **Open Chrome or Edge browser**

2. **Navigate to extension settings:**
   - **Chrome:** Type `chrome://extensions` in address bar
   - **Edge:** Type `edge://extensions` in address bar

3. **Enable Developer Mode:**
   - Look for toggle switch in top right
   - Turn it ON (should be blue)

4. **Load the extension:**
   - Click **"Load unpacked"** button
   - Navigate to: `StarterPackApp/extension`
   - Click **"Select Folder"**

5. **Verify installation:**
   - Should see "InvestorProps Extension" in list
   - Check for error messages (red text)
   - Extension icon appears in toolbar

### 🏘️ Test Extension on Realtor.ca

1. Go to [Realtor.ca](https://www.realtor.ca)
2. Search for any property (e.g., "Toronto condos")
3. Click on any property listing
4. Look for extension features:
   - Extension icon shows active state
   - InvestorProps button on page
5. Click extension icon in toolbar:
   - Popup should say "InvestorProps"
   - Look for "Analyze Property" button
6. Try analyzing the property:
   - Should send data to ROI finder
   - Or show login message
   - Note any errors

### 🔍 Extension Troubleshooting

If extension doesn't work:
- Right-click extension icon → **"Inspect popup"**
- Check Console tab for errors
- Common issues to ignore:
  - Manifest version warnings
  - Minor console warnings

---

## ✓ Quick Verification Checklist

### Navigation Consistency
- [ ] "Blog" link appears on all pages when logged in
- [ ] All navigation links work properly
- [ ] No broken links or 404 errors

### Mobile Check (Optional - 5 mins)
- [ ] Open site on phone
- [ ] Verify homepage looks good
- [ ] Test blog on mobile

---

## ⚠️ Known Issues to Ignore

1. **Blog API Error** - Fixed after Firebase Admin setup
2. **Sample Blog Posts** - Placeholders until you create content
3. **Email Newsletter** - Shows "coming soon"

---

## ❌ What NOT to Test

- Reports page (not fully implemented)
- Payment/subscription features (not configured)
- User registration (uses existing auth system)

---

## 🎯 Success Metrics

Your core product is working if:
1. ✅ Can analyze properties in ROI Finder
2. ✅ Can save and view properties in Portfolio
3. ✅ Can customize realtor branding
4. ✅ Blog displays content
5. ✅ Can create blog posts (after Firebase setup)
6. ✅ Browser extension installs and shows on Realtor.ca

---

## ⏱️ Time Estimate: 60-75 minutes total

**💡 Tip:** Test in this order - it follows the natural user flow

---

## 🆘 Need Help?

If something isn't working:
1. Check if you're logged in
2. Try refreshing the page
3. Check browser console (F12 → Console)
4. Main issue will likely be Firebase Admin setup