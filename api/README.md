# Vercel API Directory

## 🚨 STOP! READ BEFORE ADDING FILES HERE 🚨

**This directory is for SIMPLE Vercel serverless functions ONLY!**

### ✅ What CAN go here:
- Simple form submissions (contact, lead capture)
- Basic data validation (<100ms)
- Simple redirects
- Static responses

### ❌ What CANNOT go here:
- **External API calls** (Perplexity, OpenAI, Airbnb, etc.)
- **Heavy processing** (>1 second operations)
- **PDF generation**
- **Complex calculations**
- **Database queries**
- **File processing**

### Where heavy processing goes:
All heavy processing MUST go in the Railway API:
- Directory: `/railway-api/src/routes/`
- Endpoint: `https://real-estate-app-production-ba5c.up.railway.app/api/*`

### Current files (correct usage):
- `submit-lead.js` - ✅ Simple form to Firebase
- `submit-contact.js` - ✅ Simple form to Firebase

### If you're adding:
- Property analysis → Railway API
- STR analysis → Railway API  
- AI integration → Railway API
- Report generation → Railway API
- Any external API → Railway API

**When in doubt, use Railway!**

See `/ARCHITECTURE.md` for full details.