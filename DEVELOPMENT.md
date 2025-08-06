# Development Environment Setup

## ⚡ Quick Start

```bash
# 1. Switch to development environment
./scripts/switch-env.sh dev

# 2. Start both servers (recommended: use 2 terminals)
# Terminal 1 - Frontend (Vercel)
npm run dev:frontend    # Runs on http://localhost:3000

# Terminal 2 - Backend (Railway API)
npm run dev:backend     # Runs on http://localhost:3001

# OR use one command (but harder to debug)
npm run dev
```

## 🔄 Development Workflow Benefits

### Before (Your Old Workflow)
- Change code → Deploy to Vercel (3 min) → Test → Find bug → Repeat
- **Each iteration: 3-5 minutes** ❌
- Can't debug properly
- Environment differences cause "works locally" bugs

### Now (With Vercel Dev)
- Change code → Save → See instantly (< 1 second)
- **Each iteration: seconds** ✅
- Full debugging with DevTools
- Exact production environment locally

## 🏗️ Architecture Overview

```
┌─────────────────┐         ┌──────────────────┐
│                 │         │                  │
│  Vercel Dev     │  ────>  │  Railway API     │
│  localhost:3000 │         │  localhost:3001  │
│                 │         │                  │
└─────────────────┘         └──────────────────┘
     Frontend                    Backend
  (React, HTML, CSS)         (Express, APIs)
```

## 📁 Environment Files

### `.env.development` - Local Development
- Uses `http://localhost:3001` for Railway API
- All services run locally

### `.env.production` - Production Testing
- Uses production Railway API
- Test against live services

### Switching Environments
```bash
# Use local services
./scripts/switch-env.sh dev

# Use production services
./scripts/switch-env.sh prod
```

## 🚀 Available Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start both servers (uses concurrently) |
| `npm run dev:frontend` | Start only Vercel dev server |
| `npm run dev:backend` | Start only Railway API |
| `npm run build:local` | Build for production locally |
| `npm run deploy:preview` | Deploy preview to Vercel |
| `npm run deploy:prod` | Deploy to production |
| `npm run deploy:fast` | Build and deploy with --prebuilt flag |

## 🧪 Testing Your Setup

1. **Check Frontend**: http://localhost:3000
   - Should see the homepage
   - Check browser console for errors

2. **Check Backend**: http://localhost:3001/health
   - Should return JSON health status

3. **Test Analysis Flow**:
   - Go to ROI Finder
   - Fill in property details
   - Submit analysis
   - Should complete without deployment

## 🔍 Debugging Tips

### Port Already in Use
```bash
# Find what's using the port
lsof -i :3000   # Frontend
lsof -i :3001   # Backend

# Kill the process
kill -9 <PID>
```

### Hot Reload Not Working
- Make sure you're editing files in WSL filesystem (`/home/amy/`)
- NOT in Windows filesystem (`/mnt/c/`)

### API Calls Failing
```javascript
// Check in browser console
console.log(process.env.RAILWAY_API_URL)  // Should be http://localhost:3001
```

### Environment Variables Not Loading
```bash
# Verify .env.local exists and has correct values
cat .env.local | grep RAILWAY_API_URL
```

## 🎯 Common Development Tasks

### Add a New Component
1. Create component file in `/components/`
2. Import in HTML or main JS
3. Save → See immediately (no deploy needed!)

### Test API Changes
1. Edit Railway API code
2. Nodemon auto-restarts server
3. Test immediately at localhost:3001

### Debug Frontend Issues
1. Open Chrome DevTools (F12)
2. Set breakpoints in Sources tab
3. Full debugging with source maps

### Test Production Build Locally
```bash
npm run build:local
vercel dev --prod
```

## 🔧 VS Code Integration

### Recommended Extensions
- **Vercel for VS Code** - Deploy from editor
- **Thunder Client** - Test APIs
- **Live Server** - For static files

### Port Forwarding (WSL)
VS Code automatically forwards ports from WSL to Windows. You can access:
- Frontend: `http://localhost:3000` from Windows browser
- Backend: `http://localhost:3001` from API clients

## 📊 Performance Monitoring

### Check Build Size
```bash
vercel build
# Look at function sizes and warnings
```

### Monitor API Response Times
```javascript
// In browser console
console.time('api-call');
fetch('http://localhost:3001/api/endpoint')
  .then(() => console.timeEnd('api-call'));
```

## 🚨 Troubleshooting

### "vercel dev" recursive error
- This happens if `package.json` "dev" script calls itself
- Fixed by using `dev:vercel` and `dev:railway` scripts

### CORS Errors
- Railway API already configured for localhost:3000
- Check `railway-api/src/config/index.js` for allowed origins

### Firebase Auth Issues
- Make sure Firebase config is in .env.local
- Check browser console for Firebase errors

### Component Not Loading
- Check script tags in HTML
- Verify component exports properly
- Look for console errors

## 📈 Monitoring Your Improvements

### Before Metrics
- Deploy time: ~3 minutes
- Iteration cycle: 5+ minutes
- Debug capability: Limited
- Confidence: Low

### After Metrics
- Deploy time: 0 (local testing)
- Iteration cycle: < 10 seconds
- Debug capability: Full
- Confidence: High

## 🎉 Tips for Maximum Productivity

1. **Use Two Terminals**: Easier to see logs from each server
2. **Keep DevTools Open**: Catch errors immediately
3. **Use Hot Reload**: Don't refresh manually - let it auto-reload
4. **Test Locally First**: Only deploy when feature is complete
5. **Switch Environments**: Test against production API before deploying

## 📚 Additional Resources

- [Vercel Dev Documentation](https://vercel.com/docs/cli/dev)
- [Nodemon Documentation](https://nodemon.io/)
- [WSL2 Best Practices](https://docs.microsoft.com/en-us/windows/wsl/best-practices)

---

## 🎯 Quick Checklist

- [ ] Installed concurrently: `npm install`
- [ ] Environment configured: `./scripts/switch-env.sh dev`
- [ ] Frontend works: `http://localhost:3000`
- [ ] Backend works: `http://localhost:3001/health`
- [ ] Hot reload working: Edit a file and see changes instantly
- [ ] Can debug in DevTools: Set a breakpoint and hit it

If all checked ✅, you're ready for **10x faster development!** 🚀