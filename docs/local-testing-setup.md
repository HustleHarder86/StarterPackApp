# Local Testing Environment Setup Guide

This guide will help you set up a complete local testing environment for StarterPackApp, including all necessary dependencies for running unit tests, E2E tests, and the full application stack.

## Prerequisites

### System Requirements
- **OS**: Ubuntu 20.04+ / macOS 12+ / Windows 11 with WSL2
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher
- **Git**: Latest version
- **Memory**: At least 4GB RAM
- **Storage**: At least 2GB free space

## Step 1: Install System Dependencies

### For Ubuntu/Debian/WSL2:
```bash
# Update package list
sudo apt update

# Install Playwright browser dependencies
sudo npx playwright install-deps

# Alternative manual installation:
sudo apt-get install -y \
    libnspr4 \
    libnss3 \
    libasound2t64 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libcups2 \
    libdrm2 \
    libxkbcommon0 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxrandr2 \
    libgbm1 \
    libpango-1.0-0 \
    libcairo2 \
    libasound2

# Install Redis (for Railway API testing)
sudo apt-get install -y redis-server

# Install build tools (if needed)
sudo apt-get install -y build-essential
```

### For macOS:
```bash
# Install Homebrew if not already installed
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install Redis
brew install redis

# Playwright will auto-install browser dependencies on macOS
```

### For Windows (Native):
```powershell
# Install Chocolatey if not already installed
Set-ExecutionPolicy Bypass -Scope Process -Force
[System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))

# Install Redis
choco install redis-64

# Install Visual C++ Redistributables (required for Playwright)
choco install vcredist-all
```

## Step 2: Install Node.js Dependencies

```bash
# In the project root directory
cd /home/amy/StarterPackApp

# Install all dependencies
npm install

# Install Playwright browsers
npx playwright install

# Verify installations
npx playwright --version
npm test -- --version
```

## Step 3: Set Up Environment Variables

### Create `.env.local` file:
```bash
# Copy the example env file
cp .env.example .env.local
```

### Edit `.env.local` with your credentials:
```env
# Firebase Configuration (Required)
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id

# Firebase Admin SDK (Required for API)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour-Private-Key\n-----END PRIVATE KEY-----\n"

# AI APIs (Required)
PERPLEXITY_API_KEY=pplx-xxxxx
OPENAI_API_KEY=sk-xxxxx  # Optional but recommended

# Airbnb Scraper (Required for STR features)
AIRBNB_SCRAPER_API_KEY=your-key
AIRBNB_SCRAPER_API_URL=https://api.example.com/v1

# Stripe (Required for payments)
STRIPE_SECRET_KEY=sk_test_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx

# Redis (For local Railway API testing)
REDIS_URL=redis://localhost:6379

# Email Service (Optional)
SENDGRID_API_KEY=SG.xxxxx
FROM_EMAIL=noreply@starterpackapp.com

# Testing Configuration
TEST_USER_EMAIL=test@example.com
TEST_USER_PASSWORD=testpassword123
TEST_REALTOR_URL=https://www.realtor.ca/real-estate/12345/test-property
```

## Step 4: Start Local Services

### Terminal 1: Start Redis
```bash
# Ubuntu/WSL2
sudo service redis-server start

# macOS
brew services start redis

# Windows
redis-server

# Verify Redis is running
redis-cli ping
# Should return: PONG
```

### Terminal 2: Start Railway API
```bash
cd railway-api
npm install
npm run dev:all  # Starts both API server and worker
```

### Terminal 3: Start Frontend Dev Server
```bash
# In project root
npm run dev
# Frontend will be available at http://localhost:5173
```

### Terminal 4: Start Vercel Dev (for serverless functions)
```bash
# In project root
vercel dev
# Will start on http://localhost:3000
```

## Step 5: Run Tests

### Unit Tests
```bash
# Run all unit tests
npm test

# Run with coverage
npm test -- --coverage

# Run specific test file
npm test -- auth-middleware.test.js

# Run in watch mode
npm test -- --watch
```

### E2E Tests
```bash
# Run all E2E tests
npm run test:e2e

# Run in headed mode (see browser)
npm run test:e2e -- --headed

# Run specific test
npm run test:e2e -- test-firebase-auth.spec.js

# Run with debug mode
npm run test:e2e -- --debug

# Run only in Chrome
npm run test:e2e -- --project=chromium

# Generate HTML report
npm run test:e2e -- --reporter=html
```

### Visual Debugging Tests
```bash
# Run tests with screenshot capture
npm run test:e2e -- fixed-roi-finder.spec.js

# Analyze screenshots after failure
node tests/e2e/screenshot-analyzer.js report

# View screenshots
ls tests/e2e/screenshots/
```

## Step 6: Test Browser Extension

### Load Extension in Chrome:
1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" (top right)
3. Click "Load unpacked"
4. Select the `/extension` directory
5. The extension should appear in your toolbar

### Test Extension:
1. Navigate to a Realtor.ca property listing
2. Click the extension icon
3. Verify data extraction in popup
4. Check console for debug logs (F12)

## Step 7: Database Setup (Firebase)

### Create Test Project:
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create a new project for testing
3. Enable Authentication (Email/Password)
4. Enable Firestore Database
5. Enable Storage (for reports)

### Set Security Rules (for testing):
```javascript
// Firestore Rules (WARNING: Only for testing!)
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

## Step 8: Common Testing Commands

```bash
# Full test suite
npm run test:all

# Quick smoke test
npm test -- simple.test.js && npm run test:e2e -- --project=chromium property-analysis.spec.js

# Test with auto-fix
node scripts/run-tests.js

# Check Railway API health
curl http://localhost:8080/health

# Check Redis
redis-cli
> PING
> INFO
> KEYS *

# Clear test data
redis-cli FLUSHALL
```

## Troubleshooting

### Issue: Playwright browsers not installing
```bash
# Force reinstall
npx playwright install --force
sudo npx playwright install-deps --force
```

### Issue: Redis connection refused
```bash
# Check if Redis is running
ps aux | grep redis

# Start Redis manually
redis-server --daemonize yes

# Check Redis logs
tail -f /var/log/redis/redis-server.log
```

### Issue: Port already in use
```bash
# Find process using port
lsof -i :5173  # Frontend
lsof -i :3000  # Vercel
lsof -i :8080  # Railway API

# Kill process
kill -9 <PID>
```

### Issue: Firebase auth errors
- Verify Firebase project configuration
- Check that service account key is properly formatted
- Ensure Firebase project has required services enabled

## VS Code Setup (Recommended)

### Install Extensions:
- Playwright Test for VSCode
- Jest Runner
- ESLint
- Prettier
- GitLens

### Add to `.vscode/settings.json`:
```json
{
  "jest.autoRun": {
    "watch": true,
    "onStartup": ["all-tests"]
  },
  "playwright.reuseBrowser": true,
  "playwright.showTrace": true
}
```

## Testing Checklist

- [ ] Redis is running (`redis-cli ping`)
- [ ] Railway API is accessible (`curl http://localhost:8080/health`)
- [ ] Frontend loads (`http://localhost:5173`)
- [ ] Environment variables are set (`.env.local`)
- [ ] Firebase project is configured
- [ ] Browser extension loads in Chrome
- [ ] Unit tests pass (`npm test`)
- [ ] E2E tests can run (`npx playwright test --list`)

## Next Steps

Once everything is set up:
1. Run through the comprehensive todo list tests
2. Test each user journey end-to-end
3. Verify data pipeline accuracy
4. Test browser extension on multiple properties
5. Load test the Railway API
6. Test subscription flows with Stripe test cards

---

**Note**: This setup enables full local testing of all StarterPackApp features. For production testing, use staging environments with separate Firebase projects and test API keys.