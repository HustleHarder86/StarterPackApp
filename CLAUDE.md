# CLAUDE.md - StarterPackApp Development Guide

> **Note**: For detailed examples and extended documentation, see [CLAUDE-DETAILED-EXAMPLES.md](./CLAUDE-DETAILED-EXAMPLES.md)

## 🚨 CRITICAL ARCHITECTURE RULE 🚨

**DUAL-DEPLOYMENT ARCHITECTURE:**

1. **Railway API** (`/railway-api/`) - ALL heavy processing:
   - External API calls (Perplexity, OpenAI, Airbnb)
   - Database operations, PDF generation
   - Any operation >1 second

2. **Vercel** (`/api/`) - ONLY fast operations:
   - Static file serving
   - Simple form submissions
   - ❌ NO external APIs or heavy processing

## 📌 CURRENT STATUS - JULY 2025

- **Component-Based Architecture**: Replaced 3500+ line monolith
- **Airbnb Hero Section**: Featured at position #2 (user request fulfilled)
- **100% Test Coverage**: All tests passing

**Key Files:**
- Components: `/components/ui/`, `/components/analysis/`
- Design System: `/styles/design-system.css`
- Main App: `roi-finder.html`

## ⚠️ BRANCH WORKFLOW

**ALWAYS use feature branches:**
```bash
git checkout -b claude/description-YYYYMMDD_HHMMSS
```
- Never commit to main
- Delete branches after merge
- All changes require PR review


## 🚀 LOCAL DEVELOPMENT WORKFLOW - MANDATORY

**ALWAYS test locally BEFORE deploying:**
1. **Start both servers:** `npm run dev`
2. **Test changes instantly** at http://localhost:3000
3. **Hot reload** updates in <1 second (no deployment needed!)
4. **Full debugging** with Chrome DevTools

**Setup (one-time):**
```bash
npm install
./scripts/switch-env.sh dev  # Use local Railway API
```

**Daily workflow:**
```bash
npm run dev                   # Start both servers
# Make changes - see instantly!
# Test thoroughly locally
git commit                    # Auto-runs validation
npm run deploy:fast          # Only when ready for production
```

## 🧪 TESTING REQUIREMENTS

**Automatic Testing (via Git Hooks):**
- Pre-commit hooks validate syntax and environment
- All changes are tested automatically before commit
- Tests run in <10 seconds locally

**Manual Testing:**
1. Local quick test: `npm run test:quick`
2. Comprehensive: `npm run test:comprehensive`
3. E2E with screenshots: `npm run test:e2e`

**Self-Debugging System:**
- Tests can take screenshots and self-heal
- Use `VisualDebugger` for UI debugging
- Run `node tests/e2e/screenshot-analyzer.js report` for analysis

**📚 IMPORTANT: Test Debugging Guide**
- See [TEST-AGENT-LEARNINGS.md](./tests/e2e/TEST-AGENT-LEARNINGS.md) for debugging patterns
- Contains lessons from real debugging sessions
- Includes data structure mismatch solutions, E2E test tips, and common pitfalls

## 🎨 UI FIX WORKFLOW - MANDATORY

**For ALL UI changes, follow the workflow in [UI-FIX-WORKFLOW.md](./UI-FIX-WORKFLOW.md)**
- Create mock first → Implement → Test locally → Validate with agents → Then push
- This prevents UI breakage and ensures quality
- NEVER skip the validation step with code-reviewer and ui-ux-tester agents

## 🎨 STYLE CHANGE GUIDELINES

**For major style/CSS architecture changes, see [STYLE-CHANGE-GUIDELINES.md](./STYLE-CHANGE-GUIDELINES.md)**
- Component-first approach with progressive enhancement
- Includes migration checklist and lessons learned
- Helps prevent breaking changes during UI overhauls

## 🎯 CORE PRINCIPLE: Real Listing Data

**ALWAYS use actual property data from listings:**
- Never override with estimates
- If data missing, fix extraction - don't estimate
- Track data source (listing vs estimated)

Example: Use $5,490 property tax from listing, NOT calculated estimate

## TECH STACK

**Frontend**: HTML5, CSS3, JavaScript (ES6+), React (CDN), Tailwind CSS
**Backend**: Node.js, Vercel Serverless Functions
**Database**: Firebase Firestore
**APIs**: Perplexity AI (required), Airbnb Scraper API
**Extension**: Chrome/Edge WebExtensions for Realtor.ca

## KEY PATTERNS

### API Route Structure
```javascript
export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  
  // Implementation with try/catch
}
```

### Component Pattern
```javascript
const ComponentName = ({ props }) => {
  const [state, setState] = useState();
  return <div className="tailwind-classes">{/* content */}</div>;
};
```



## DATABASE SCHEMA

**users**: email, subscriptionTier, strTrialUsed (max 5)
**properties**: ACTUAL listing data (price, taxes, sqft, bedrooms)
**analyses**: costs, longTermRental, strAnalysis, comparison
**reports**: PDF URLs with 30-day expiry



## ENVIRONMENT VARIABLES

**Client**: `VITE_FIREBASE_*` config
**Server**: 
- `FIREBASE_*` - Admin SDK
- `PERPLEXITY_API_KEY` - Required
- `AIRBNB_SCRAPER_*` - STR analysis
- `STRIPE_*` - Subscriptions

## COMMON TASKS

**New API Endpoint:**
1. Create in `/api/`
2. Add CORS headers
3. Validate inputs
4. Check user tier
5. Handle errors

**New Component:**
1. Create in `/components/`
2. Use functional components
3. Apply Tailwind classes
4. Export as default

**Browser Extension:**
- Extract all listing data
- Send to ingestion endpoint
- Handle multiple property types


## PROJECT RULES

1. Real listing data > estimates
2. Canadian market focus
3. Mobile-first design
4. Free users get 5 STR trials
5. Cost-efficient API usage
6. Follow PIPEDA privacy laws


## TROUBLESHOOTING

- **API Failures**: Check env vars and keys
- **UI Issues**: Use self-debugging tests (see [TEST-AGENT-LEARNINGS.md](./tests/e2e/TEST-AGENT-LEARNINGS.md))
- **Data Missing**: Fix extraction, don't estimate
- **Performance**: Check API calls and images
- **Tab/Content Issues**: Check data mapping - backend uses snake_case, frontend expects camelCase

---

*Condensed guide - Refer to [CLAUDE-DETAILED-EXAMPLES.md](./CLAUDE-DETAILED-EXAMPLES.md) for detailed examples*

