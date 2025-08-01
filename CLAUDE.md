# CLAUDE.md - StarterPackApp Development Guide

> **Note**: For detailed examples and extended documentation, see [CLAUDE-DETAILED-EXAMPLES.md](./CLAUDE-DETAILED-EXAMPLES.md)

## 🎨 DESIGN SYSTEM - COMPACT MODERN (Hybrid Design 3)

**Visual Identity:**
- **Layout**: Dark compact sidebar (224px) + main content area
- **Typography**: Manrope font family (400-800 weights)
- **Colors**: Indigo-purple-pink gradient theme
- **Sidebar**: #111827 (gray-900) background
- **Components**: Glass morphism cards, gradient borders

**Key Design Files:**
```
/styles/compact-modern-design-system.css  # Main design system
/components/layout/CompactModernLayout.js  # Sidebar layout
/components/analysis/*CompactModern.js     # Updated components
```

**Component Pattern:**
- All new components should follow CompactModern design
- Use 12-column grid (8 cols main, 4 cols sidebar)
- Gradient accents: `var(--gradient-accent)`
- Glass cards: `metric-card` class

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
- Design System: `/styles/compact-modern-design-system.css`
- Component Loader: `/js/modules/componentLoaderCompactModern.js`
- Main App: `roi-finder.html`

## ⚠️ BRANCH WORKFLOW

**ALWAYS use feature branches:**
```bash
git checkout -b claude/description-YYYYMMDD_HHMMSS
```
- Never commit to main
- Delete branches after merge
- All changes require PR review


## 🧪 TESTING REQUIREMENTS

**Before EVERY push:**
1. Run tests: `npm run test:comprehensive`
2. Check syntax: `npm run test:syntax`
3. Test E2E: `npm run test:e2e`

**Self-Debugging System Available:**
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

## 📖 DEVELOPMENT GUIDELINES

**CRITICAL**: See [DEVELOPMENT-GUIDELINES.md](./DEVELOPMENT-GUIDELINES.md) for:
- Module system rules (prevent "property is not defined" errors)
- CSS namespacing requirements
- Pre-launch checklist
- Common issues & solutions

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

## 📚 API INTEGRATIONS

**Third-party API documentation**: See `/docs/api-integrations/` for detailed integration guides:
- [Firebase](./docs/api-integrations/firebase.md) - Authentication, Firestore, Storage
- [Perplexity AI](./docs/api-integrations/perplexity.md) - Real-time research and analysis
- [Apify Airbnb Scraper](./docs/api-integrations/apify-airbnb.md) - STR market data collection
- [Stripe](./docs/api-integrations/stripe.md) - Payment processing (optional)
- [OpenAI](./docs/api-integrations/openai.md) - Alternative AI provider

These guides contain API keys, usage patterns, error handling, and integration examples specific to the StarterPackApp architecture.

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

