# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 🚨 CRITICAL ARCHITECTURE RULE - READ BEFORE ANY CHANGES 🚨

**THIS IS A DUAL-DEPLOYMENT ARCHITECTURE:**

1. **Railway API** (`/railway-api/`) - For ALL heavy processing:
   - ✅ External API calls (Perplexity, OpenAI, Airbnb, etc.)
   - ✅ Database operations and complex queries
   - ✅ Background jobs and queues
   - ✅ PDF generation and file processing
   - ✅ Any operation taking >1 second
   - ✅ Rate-limited operations
   - ✅ Expensive computations

2. **Vercel** (`/api/`) - For ONLY simple, fast operations:
   - ✅ Static file serving (HTML, CSS, JS)
   - ✅ Simple form submissions (contact, lead capture)
   - ✅ Basic data validation
   - ❌ NO external API calls
   - ❌ NO heavy processing
   - ❌ NO complex calculations

**BEFORE ADDING ANY FEATURE:**
- If it calls external APIs → Put it in Railway (`/railway-api/`)
- If it processes data → Put it in Railway (`/railway-api/`)
- If it's just serving files → Can go in Vercel

**COMMON MISTAKES TO AVOID:**
- ❌ NEVER put API integrations in `/api/` (Vercel)
- ❌ NEVER put heavy processing in Vercel functions
- ❌ NEVER assume Redis/queues exist (removed as of Jan 15, 2025)

## 📌 CURRENT STATUS - JULY 19, 2025

### 🎉 MAJOR REFACTORING COMPLETE: Component-Based Architecture ✅
**Status**: Successfully deployed refactored ROI Finder with modern component architecture
**Completion Date**: July 19, 2025
**Deployment ID**: deploy-1752891303962

**Key Achievements**:
- ✅ **Airbnb Listings Hero Section**: Prominently featured at position #2 (user's primary request)
- ✅ **Component-Based Architecture**: Replaced 3500+ line monolith with modular components
- ✅ **Mobile-First Responsive Design**: Perfect experience on all devices
- ✅ **Design System**: Consistent styling with CSS custom properties
- ✅ **100% Test Coverage**: All 75 tests passing (35 validation tests passed)

### Application Architecture - REFACTORED ✅
**Previous**: Monolithic roi-finder.html (3500+ lines)
**Current**: Component-based architecture with design system

**New File Structure**:
```
/components/
├── ui/ (Card, Badge, Button, LoadingSpinner, ProgressIndicator)
├── analysis/ (InvestmentVerdict, AirbnbListings, FinancialSummary)
/styles/design-system.css (CSS custom properties & component classes)
/js/modules/componentLoader.js (Dynamic component loading)
roi-finder.html (Clean, organized main application)
```

### User Experience Improvements ✅
1. **Investment Verdict** - Clear recommendation at top
2. **🏆 Airbnb Listings (HERO)** - Prominent at position #2 with live data
3. **Financial Summary** - Revenue comparison with clear metrics
4. **Action Buttons** - Save, Report, Analyze Another
5. **Progressive Disclosure** - Detailed analysis expandable

### Technical Improvements ✅
- **Performance**: Component caching and lazy loading
- **Maintainability**: Reusable, modular components
- **Responsive**: Mobile-first with touch-friendly design
- **Error Handling**: Graceful fallbacks for all scenarios
- **Testing**: Comprehensive unit, integration, E2E, and visual tests

### Legacy Architecture (for reference)
**Redis Removal**: Removed Redis/BullMQ entirely for simplification (Jan 15, 2025)
**STR Analysis**: Complete with comprehensive calculations and comparison engine

**What's Implemented**:
1. **Cost-Controlled Airbnb Integration** (20 results, ~$0.01/search)
2. **STR Calculator Service** with 3 revenue scenarios
3. **Rental Comparison Engine** with break-even analysis
4. **Full API Integration** in main analysis endpoint

See `/railway-api/docs/STR_ENHANCED_IMPLEMENTATION.md` for details.

---

## ⚠️ IMPORTANT: Branch Workflow & Cleanup Policy

**ALWAYS create a unique branch for each set of changes:**

1. **Before making any changes**: Create a new branch with a descriptive name:
   ```bash
   # Use format: claude/description-YYYYMMDD_HHMMSS
   # Example:
   git checkout -b claude/add-feature-20250623_143022
   git checkout -b claude/fix-bug-20250623_143022  
   git checkout -b claude/update-docs-20250623_143022
   ```

2. **Make all changes on this unique branch** - Never commit directly to `main`

3. **After completing changes**: The user will manually review and create a pull request to merge the feature branch → `main`

4. **Branch naming convention**: Use `claude/[description]-[timestamp]` format to ensure uniqueness and easy identification

5. **AUTOMATIC BRANCH CLEANUP**: After merging a PR to main, ALWAYS immediately delete the feature branch:
   ```bash
   # After PR is merged, Claude should automatically run:
   git checkout main
   git pull origin main
   git branch -d claude/feature-branch-name  # Delete local branch
   git push origin --delete claude/feature-branch-name  # Delete remote branch
   ```

This workflow ensures:
- Each set of changes gets its own isolated branch
- Easy identification and review of individual changes  
- No confusion between different change sets
- All AI-generated changes go through proper human review before being merged
- **Repository stays clean with only active branches**

## Branch Management Best Practices

1. **One Branch Per Task**: Each task/feature/fix gets its own branch
2. **Delete After Merge**: Branches MUST be deleted immediately after merging
3. **Never Reuse Branches**: Always create a new branch for new work
4. **Keep main Clean**: The main branch should always be deployable
5. **Branch Cleanup is Mandatory**: Claude will automatically clean up branches after merge

**Note**: We do NOT commit directly to main. All changes go through feature branches and pull requests for proper review and testing.

## Development Workflow

When working on tasks in this project, follow this structured workflow:

1. **First think through the problem**: Read the codebase for relevant files and write a comprehensive plan to `tasks/todo.md`

2. **Create a detailed task list**: The plan should have a list of todo items that you can check off as you complete them

3. **Get approval before starting**: Before you begin working, check in with the user to verify the plan

4. **Work incrementally**: Begin working on the todo items, marking them as complete as you go

5. **Communicate progress**: Every step of the way, provide a high-level explanation of what changes were made

6. **Prioritize simplicity**: Make every task and code change as simple as possible. Avoid making massive or complex changes. Every change should impact as little code as possible. Everything is about simplicity.

7. **Document completion**: Finally, add a review section to the `todo.md` file with a summary of the changes made and any other relevant information

### Key Principles:
- **Small, focused changes**: Each change should be minimal and targeted
- **Clear communication**: Regular updates on progress and changes
- **Verification before action**: Always get plan approval before implementation
- **Comprehensive documentation**: Maintain clear records in `todo.md`

## 🧪 MANDATORY TESTING REQUIREMENTS

**CRITICAL**: NEVER push code without comprehensive testing. Every bug fix, feature, or change MUST be thoroughly tested before pushing to prevent regressions and reduce manual testing burden.

### Pre-Push Testing Checklist

**BEFORE ANY GIT PUSH, Claude MUST:**

1. ✅ **Create comprehensive tests** for the specific functionality being changed
2. ✅ **Run automated test suite** to catch regressions
3. ✅ **Test end-to-end user workflows** affected by changes
4. ✅ **Verify JavaScript syntax** and console errors are resolved
5. ✅ **Test cross-browser compatibility** (Chrome, Firefox, Safari)
6. ✅ **Validate API integrations** and data flow
7. ✅ **Check mobile responsiveness** for UI changes
8. ✅ **Test error handling** and edge cases

### Testing Categories Required

#### 1. **Syntax & Runtime Testing**
```bash
# Always run before pushing
node tests/validate-javascript-syntax.js
npm run test:lint
npm run test:syntax
```

#### 2. **End-to-End Workflow Testing**
```bash
# Test critical user journeys
npm run test:e2e
npx playwright test tests/e2e/critical-workflows.spec.js
```

#### 3. **API Integration Testing**
```bash
# Test all API endpoints affected
npm run test:api
node tests/api/test-all-endpoints.js
```

#### 4. **Browser Extension Testing**
```bash
# Test extension integration
npm run test:extension
node tests/extension/test-data-flow.js
```

### Mandatory Test Creation for Common Scenarios

When making changes, Claude MUST create tests for:

#### **JavaScript/Frontend Changes**
- ✅ **Syntax validation** - No console errors or undefined variables
- ✅ **DOM element interaction** - All buttons, forms, inputs work
- ✅ **State management** - Variables maintain correct values
- ✅ **Event handling** - Click, submit, change events function
- ✅ **Responsive behavior** - Mobile, tablet, desktop layouts
- ✅ **Cross-browser compatibility** - Chrome, Firefox, Safari

#### **API/Backend Changes**
- ✅ **Endpoint functionality** - All HTTP methods work correctly
- ✅ **Data validation** - Input sanitization and validation
- ✅ **Error handling** - Proper error responses and fallbacks
- ✅ **Authentication** - User session and permission validation
- ✅ **Rate limiting** - API limits respected and handled
- ✅ **External API integration** - Perplexity, Railway, Airbnb APIs

#### **Browser Extension Changes**
- ✅ **Data extraction** - All property fields captured correctly
- ✅ **Data transmission** - Extension → web app communication
- ✅ **Error handling** - Graceful degradation for missing data
- ✅ **Cross-site compatibility** - Works on all Realtor.ca listing types

#### **UI/UX Changes**
- ✅ **Visual consistency** - Styling matches design system
- ✅ **Loading states** - Progress indicators during async operations
- ✅ **Error states** - User-friendly error messages
- ✅ **Success states** - Clear feedback for completed actions
- ✅ **Accessibility** - Screen reader and keyboard navigation

### Deep Testing Requirements

#### **Bug Fixes Must Include:**
1. **Root cause analysis** - Test that identifies the original issue
2. **Regression tests** - Verify the bug doesn't reoccur
3. **Edge case testing** - Test boundary conditions and error scenarios
4. **Integration testing** - Verify fix doesn't break related functionality

#### **Feature Additions Must Include:**
1. **Happy path testing** - Normal user workflow works perfectly
2. **Error path testing** - Graceful handling of failures
3. **Performance testing** - No significant slowdowns introduced
4. **Security testing** - No new vulnerabilities introduced

### Automated Testing Tools Available

#### **Frontend Testing**
- **Playwright** - End-to-end browser automation
- **Jest** - Unit testing for JavaScript functions
- **Visual regression** - Screenshot comparison testing
- **Syntax validation** - JavaScript error detection

#### **API Testing**
- **Custom scripts** - API endpoint testing
- **Integration tests** - Full workflow validation
- **Mock testing** - External API simulation

#### **Browser Extension Testing**
- **Content script testing** - Data extraction validation
- **Communication testing** - Extension ↔ web app data flow
- **Cross-site testing** - Multiple Realtor.ca listing types

### Test Documentation Requirements

For EVERY change, Claude MUST create:

1. **Test Summary** (`tests/[feature]-test-summary.md`)
   - What was tested
   - Test results
   - Any issues found and resolved
   - Coverage analysis

2. **Test Scripts** (`tests/e2e/[feature]-test.spec.js`)
   - Automated test files
   - Edge case scenarios
   - Regression prevention

3. **Manual Test Checklist** (`tests/manual/[feature]-checklist.md`)
   - Step-by-step validation
   - Visual inspection points
   - User experience verification

### Test Coverage Standards

- **Critical workflows**: 100% coverage (auth, analyze button, data flow)
- **Core features**: 90% coverage (STR analysis, reporting, calculations)
- **UI components**: 80% coverage (forms, buttons, displays)
- **Edge cases**: 70% coverage (error handling, data validation)

### Failure Protocol

**If tests fail:**
1. ❌ **DO NOT PUSH** until all tests pass
2. 🔍 **Investigate root cause** of failures
3. 🛠️ **Fix underlying issues** not just symptoms
4. 🧪 **Re-run full test suite** to verify fixes
5. 📝 **Document what was found and fixed**

### Testing Command Reference

```bash
# Quick validation (run before every push)
npm run test:quick

# Comprehensive testing (run for major changes)
npm run test:comprehensive

# Specific testing by category
npm run test:syntax      # JavaScript syntax checking
npm run test:e2e         # End-to-end workflows
npm run test:api         # API endpoint testing
npm run test:visual      # Visual regression testing
npm run test:mobile      # Mobile responsiveness
npm run test:extension   # Browser extension testing

# Generate test reports
npm run test:report      # Comprehensive test report
npm run analyze:coverage # Code coverage analysis
```

### Examples of Comprehensive Testing

**Example 1: Fixing JavaScript Bug**
```bash
# 1. Create test that reproduces the bug
node tests/reproduce-bug.js

# 2. Fix the issue
# ... make code changes ...

# 3. Verify fix with comprehensive testing
npm run test:syntax
npm run test:e2e
npm run test:integration

# 4. Create regression test
# ... add test to prevent future occurrence ...

# 5. Only then push to GitHub
git push origin branch-name
```

**Example 2: Adding New Feature**
```bash
# 1. Create feature tests first (TDD approach)
# ... create comprehensive test suite ...

# 2. Implement feature
# ... build functionality ...

# 3. Verify all tests pass
npm run test:comprehensive

# 4. Test edge cases and error scenarios
npm run test:edge-cases

# 5. Performance and security validation
npm run test:performance
npm run test:security

# 6. Only then push to GitHub
git push origin branch-name
```

**Remember: Testing is not optional. It's a mandatory part of the development process that prevents user-facing bugs and reduces manual testing burden.**

## Project Overview

**StarterPackApp** is an advanced real estate investment analysis SaaS platform that helps investors make data-driven decisions. The platform combines traditional rental analysis with short-term rental (Airbnb) projections, automated property data extraction via browser extension, and professional reporting capabilities.

### 🎯 CORE PRINCIPLE: Use Real Listing Data

**CRITICAL**: This application's PRIMARY PURPOSE is to extract and use ACTUAL data from property listings, NOT estimates or calculations. When making any changes:

1. **Always Prioritize Actual Data**: If the browser extension provides data (price, taxes, square footage, etc.), ALWAYS use it over any calculated or estimated values
2. **Never Override Real Data**: The system should NEVER replace actual listing data with estimates or "corrections"
3. **Preserve Data Integrity**: Pass all extracted data through the entire pipeline (extension → API → analysis)
4. **Debug Missing Data**: If data is missing, improve extraction - don't just estimate
5. **Clear Data Source Tracking**: Always indicate whether data is from listing (actual) or estimated

Example: If a listing shows $5,490 in property taxes, use $5,490 - NOT a calculated estimate based on property value.

### Key Platform Features
- **Browser Extension Integration**: One-click property analysis from Realtor.ca listings with comprehensive data extraction
- **Real Data Extraction**: Captures actual listing data including price, taxes, square footage, bedrooms, bathrooms, HOA fees
- **Dual Analysis Modes**: Traditional long-term rental AND short-term rental (STR) analysis
- **AI-Powered Insights**: Market research via Perplexity AI with intelligent recommendations
- **Professional Reports**: PDF generation with comprehensive investment metrics
- **Subscription Tiers**: Free tier for basic analysis, Pro tier for STR analysis and advanced features

## Tech Stack

### Core Stack (Existing)
- **Frontend**: HTML5, CSS3, JavaScript (ES6+), React Components (CDN)
- **Backend**: Node.js with Vercel Serverless Functions
- **Database**: Firebase Firestore
- **Authentication**: Firebase Auth
- **Styling**: Tailwind CSS + Custom CSS
- **Charts**: Chart.js + D3.js (for advanced visualizations)
- **Deployment**: Vercel

### External Services
- **Perplexity AI**: Market research and property insights (required)
- **OpenAI GPT-4**: Data structuring fallback (optional)
- **Airbnb Scraper API**: STR comparable data ($0.05/100 results)
- **Stripe**: Subscription management
- **SendGrid/Vercel Email**: Transactional emails

### Browser Extension
- **Platform**: Chrome/Edge WebExtensions API
- **Target**: Realtor.ca property listings
- **Build**: Webpack for extension bundling

## Code Style Guidelines

### JavaScript/JSX

1. **ES6+ Features**: Always use modern JavaScript features
   - Use `const`/`let` instead of `var`
   - Prefer arrow functions for callbacks and short functions
   - Use async/await over promises when possible
   - Utilize destructuring for objects and arrays

2. **Function Declarations**:
   ```javascript
   // Preferred for API handlers
   export default async function handler(req, res) {
     // Implementation
   }
   
   // Preferred for utility functions
   const validateForm = (formData) => {
     // Implementation
   };
   ```

3. **Error Handling**:
   ```javascript
   try {
     const result = await apiCall();
     return res.status(200).json({ success: true, data: result });
   } catch (error) {
     console.error('API Error:', error);
     return res.status(500).json({ error: 'Internal server error' });
   }
   ```

4. **Variable Naming**:
   - Use camelCase for variables and functions
   - Use PascalCase for components and classes
   - Use UPPER_SNAKE_CASE for constants
   - Use descriptive names (e.g., `propertyAddress` not `addr`)

### API Development

1. **API Route Structure**:
   ```javascript
   export default async function handler(req, res) {
     // Set CORS headers first
     res.setHeader('Access-Control-Allow-Credentials', true);
     res.setHeader('Access-Control-Allow-Origin', '*');
     
     // Handle OPTIONS for CORS preflight
     if (req.method === 'OPTIONS') {
       res.status(200).end();
       return;
     }
     
     // Validate HTTP method
     if (req.method !== 'POST') {
       return res.status(405).json({ error: 'Method not allowed' });
     }
     
     // Implementation
   }
   ```

2. **Response Format**:
   ```javascript
   // Success responses
   return res.status(200).json({
     success: true,
     data: result,
     timestamp: new Date().toISOString()
   });
   
   // Error responses
   return res.status(400).json({
     error: 'Descriptive error message',
     details: errorDetails
   });
   ```

3. **Environment Variables**:
   - Always validate API keys before use
   - Use descriptive names with prefixes (e.g., `PERPLEXITY_API_KEY`)
   - Provide fallback behavior for missing keys

### Frontend Development

1. **HTML Structure**:
   - Use semantic HTML5 elements
   - Include proper meta tags for SEO and mobile
   - Structure with clear sections and proper hierarchy

2. **CSS/Styling**:
   - **Primary**: Use Tailwind CSS for utility-first styling
   - **Secondary**: Custom CSS for complex components
   - **Responsive**: Mobile-first approach
   - **Performance**: Minimize custom CSS when Tailwind can handle it

3. **Component Architecture**:
   ```jsx
   const ComponentName = ({ prop1, prop2, onAction }) => {
     const [state, setState] = useState(initialValue);
     
     const handleAction = (event) => {
       // Handle logic
       onAction(result);
     };
     
     return (
       <div className="tailwind-classes">
         {/* JSX content */}
       </div>
     );
   };
   ```

## Architecture & File Organization

### Key Architecture Patterns

**Component-Based Architecture (REFACTORED 2025):**
- Modular, reusable component library
- Design system with CSS custom properties
- Dynamic component loading and caching
- Mobile-first responsive design
- Progressive enhancement with fallbacks

**UI Component Pattern:**
- UI Components → Card, Badge, Button, LoadingSpinner, ProgressIndicator
- Analysis Components → InvestmentVerdict, AirbnbListings (HERO), FinancialSummary
- Component Loader → Dynamic import and rendering management
- Design System → Consistent styling and responsive utilities

**Legacy: Hybrid Static/Dynamic Architecture:**
- Static HTML files with progressive enhancement
- React components loaded via CDN (not bundled)
- Vercel serverless functions for API layer
- Firebase for authentication and data persistence

**AI Integration Pattern:**
- Perplexity AI (primary) → Market research and real-time data
- OpenAI GPT-4 (secondary) → Data structuring and formatting
- Fallback mechanisms for API failures
- Usage tracking and rate limiting built-in

**Authentication Flow:**
- Firebase Auth for user management
- JWT tokens for API authorization
- User session validation in serverless functions
- Client-side auth state management

### Directory Structure (REFACTORED 2025)
```
/
├── api/                          # Vercel serverless functions
│   ├── analyze-property.js       # Main analysis endpoint
│   ├── properties/              # Property management endpoints
│   │   ├── ingest.js           # Browser extension data receiver
│   │   └── list.js             # User properties listing
│   ├── str-analysis/            # STR analysis endpoints
│   │   ├── analyze.js          # Airbnb analysis
│   │   └── comparables.js      # Get comparable properties
│   ├── reports/                 # Report generation
│   │   ├── generate.js         # PDF generation
│   │   └── download.js         # Report retrieval
│   ├── user-management.js       # User profile operations
│   └── stripe-*.js             # Payment processing
├── components/                   # 🆕 REFACTORED: Modular component library
│   ├── ui/                      # Reusable UI components
│   │   ├── Card.js             # Card, PropertyCard, ComparableCard
│   │   ├── Badge.js            # Status, Performance, LiveData badges
│   │   ├── Button.js           # Action buttons and variants
│   │   ├── LoadingSpinner.js   # Loading states and skeletons
│   │   └── ProgressIndicator.js # Progress bars and step indicators
│   ├── analysis/               # Analysis-specific components
│   │   ├── InvestmentVerdict.js # Investment recommendations
│   │   ├── AirbnbListings.js   # 🏆 HERO SECTION - Airbnb comparables
│   │   └── FinancialSummary.js # Revenue comparisons and metrics
│   ├── charts/                 # Chart and visualization components
│   └── layout/                 # Layout and navigation components
├── styles/                      # 🆕 REFACTORED: Design system
│   ├── design-system.css       # CSS custom properties & component classes
│   ├── components.css          # Legacy component styles
│   ├── responsive.css          # Mobile-first responsive utilities
│   └── utilities.css           # Utility classes
├── js/                         # 🆕 REFACTORED: Organized JavaScript
│   ├── modules/                # ES6 modules
│   │   ├── componentLoader.js  # Dynamic component loading & rendering
│   │   ├── analysisManager.js  # Analysis state management
│   │   ├── propertyManager.js  # Property data management
│   │   ├── apiClient.js        # API communication layer
│   │   ├── stateManager.js     # Application state management
│   │   └── utils.js            # Utility functions
│   └── roi-finder-app.js       # Main application logic
├── extension/                    # Browser extension
│   ├── manifest.json           # Extension configuration
│   ├── content.js              # Realtor.ca scraper
│   ├── popup.html/js           # Extension UI
│   └── background.js           # API communication
├── utils/                       # Utilities (legacy)
│   ├── analytics.js            # Usage tracking
│   ├── calculators/            # Financial calculations
│   │   ├── traditional.js      # Traditional rental calc
│   │   └── str.js             # STR revenue calc
│   ├── comparable-matcher.js   # Matching algorithm
│   └── pdf-generator.js        # Report generation
├── tests/                       # 🆕 COMPREHENSIVE: Test suite
│   ├── components/             # Component unit tests
│   │   ├── ui/                 # UI component tests
│   │   └── analysis/           # Analysis component tests
│   ├── integration/            # Integration tests
│   ├── e2e/                    # End-to-end tests
│   ├── visual/                 # Visual regression tests
│   ├── reports/                # Test reports and results
│   └── run-refactored-tests.js # Test runner
├── deployment/                  # 🆕 DEPLOYMENT: Deploy & validation
│   ├── deploy-refactored-app.js # Deployment script
│   ├── validate-deployment.js  # Post-deployment validation
│   └── validation-report.json  # Deployment validation results
├── backups/                     # 🆕 BACKUP: Rollback capability
│   └── deploy-*/               # Timestamped deployment backups
├── assets/                      # Static assets
├── *.html                       # Application pages
│   └── roi-finder.html         # 🆕 REFACTORED: Clean, component-based
├── DEPLOYMENT_MANIFEST.json     # 🆕 Deployment metadata
├── DEPLOYMENT_COMPLETE.md       # 🆕 Deployment summary
└── vercel.json                  # Deployment configuration
```

### Application Pages Architecture (REFACTORED 2025)
- `index.html` → Landing page with lead capture
- `roi-finder.html` → 🆕 REFACTORED: Component-based main application with Airbnb hero section
- `roi-finder-v2.html` → 🆕 Development version of refactored application
- `portfolio.html` → Portfolio overview and management (new)
- `reports.html` → Report history and downloads (new)
- `admin-dashboard.html` → Admin interface for user management
- `debug-test.html` → Development diagnostics tool

### Component Architecture (NEW)
- **Modular Design**: Each component is self-contained and reusable
- **Dynamic Loading**: Components loaded on-demand via ComponentLoader
- **Design System**: Consistent styling via CSS custom properties
- **Mobile-First**: Responsive design with touch-friendly interfaces
- **Progressive Enhancement**: Works without JavaScript, enhanced with it

### Naming Conventions (UPDATED 2025)
- **Files**: kebab-case for HTML/CSS, camelCase for JS
- **Components**: PascalCase with ES6 exports (e.g., `InvestmentVerdict.js`, `AirbnbListings.js`)
- **Component Functions**: PascalCase (e.g., `Card()`, `StatusBadge()`, `LiveDataBadge()`)
- **CSS Classes**: kebab-case with BEM-style modifiers (e.g., `card`, `card-elevated`, `badge-live-data`)
- **CSS Custom Properties**: kebab-case with prefixes (e.g., `--color-primary`, `--space-lg`)
- **API Routes**: kebab-case (e.g., `analyze-property.js`)
- **Utilities**: camelCase (e.g., `analytics.js`, `componentLoader.js`)

## External API Integration

### Perplexity AI Guidelines

1. **Model Selection**: Use `sonar` for best results
2. **Use Cases**:
   - **Long-Term Rental Rates**: Search for current rental rates in the area
   - **Market Research**: Neighborhood data, trends, demographics
   - **Property Comparables**: Find similar properties for rent
3. **Token Optimization**: 
   - Limit property comparables to maximum 3 per request
   - Structure prompts efficiently to minimize tokens
4. **Error Handling**: Always provide fallback data for API failures

#### Long-Term Rental Rate Discovery Prompt Template:
```javascript
const prompt = `
Find current long-term rental rates for properties similar to:
- Address: ${property.address}
- Type: ${property.propertyType}
- Bedrooms: ${property.bedrooms}
- Bathrooms: ${property.bathrooms}
- Size: ${property.sqft} sq ft

Provide:
1. Average monthly rent for similar properties
2. Rent range (low to high)
3. 3 specific comparable rental listings with addresses and prices
4. Vacancy rate in the area
`;
```

### Airbnb Scraper API Integration

1. **Endpoint**: Configure via `AIRBNB_SCRAPER_API_URL`
2. **Authentication**: API key in headers
3. **Rate Limiting**: 
   - Max 1000 requests/hour
   - Implement queue-based throttling
   - Cache results for 24 hours
4. **Cost Management**: 
   - $0.05 per 100 results
   - Track usage per user
   - Pro tier only feature

### Comparable Matching Algorithm

```javascript
// Matching criteria (weighted)
{
  location: 0.4,        // Same neighborhood/area
  bedrooms: 0.2,        // Similar bedroom count (±1)
  propertyType: 0.2,    // Same property type
  size: 0.1,           // Similar square footage (±20%)
  amenities: 0.1       // Pool, parking, etc.
}
```

### Rate Limiting & Usage Tracking

1. **Implementation**: Track all API usage in Firebase
2. **Limits by Tier**:
   - Free: 5 analyses/month + 5 STR trial analyses (lifetime)
   - Pro: 100 analyses/month, unlimited STR
   - Enterprise: Unlimited everything
3. **STR Trial Logic**:
   ```javascript
   // Check if user can use STR
   const canUseSTR = (user) => {
     if (user.subscriptionTier === 'pro' || user.subscriptionTier === 'enterprise') {
       return true;
     }
     return user.strTrialUsed < 5;
   };
   
   // After STR analysis
   if (user.subscriptionTier === 'free' && user.strTrialUsed < 5) {
     await updateUser(userId, { strTrialUsed: user.strTrialUsed + 1 });
   }
   ```
4. **Monitoring**: Real-time usage dashboard with trial tracking

## Database Patterns (Firebase)

### Collection Structure
```javascript
// users/{uid}
{
  email: string,
  displayName: string,
  subscriptionTier: 'free' | 'pro' | 'enterprise',
  subscriptionStatus: 'active' | 'cancelled' | 'past_due',
  monthlyAnalysisCount: number,
  monthlyAnalysisLimit: number,
  strAnalysisEnabled: boolean,
  strTrialUsed: number,         // Track free STR analyses (max 5)
  strTrialExpiry: timestamp,    // Optional: expire trial after 30 days
  createdAt: timestamp
}

// properties/{propertyId}
{
  userId: string,
  externalId: string,          // Realtor.ca MLS number
  address: {
    street: string,
    city: string,
    province: string,
    postalCode: string
  },
  listingData: object,         // Full Realtor.ca JSON
  price: number,               // ACTUAL from listing
  propertyTaxes: number,       // ACTUAL from listing (annual)
  condoFees: number,           // ACTUAL from listing (monthly)
  bedrooms: number,            // ACTUAL from listing
  bathrooms: number,           // ACTUAL from listing
  sqft: number,                // ACTUAL from listing
  propertyType: string,        // ACTUAL from listing
  yearBuilt: number,           // ACTUAL from listing if available
  mainImage: string,           // URL of property image
  dataSource: 'listing',       // Always 'listing' for extension data
  createdAt: timestamp,
  lastAnalyzed: timestamp
}

// analyses/{analysisId}
{
  userId: string,
  propertyId: string,
  analysisType: 'traditional' | 'str' | 'combined',
  costs: {
    property_tax_annual: number,     // From listing or calculated
    insurance_annual: number,
    maintenance_annual: number,
    hoa_monthly: number,             // From listing or estimated
    utilities_monthly: number,
    calculation_method: string       // 'actual_data' | 'comparable_data' | 'location_based_accurate'
  },
  longTermRental: {
    monthlyRent: number,        // AI-discovered from Perplexity
    rentRange: {
      low: number,
      high: number
    },
    comparables: array,         // 3 similar rental properties
    vacancyRate: number,
    cashFlow: number,
    capRate: number,
    roi: number,
    expenses: object,
    dataSource: string          // 'actual_listing' or 'ai_estimated'
  },
  strAnalysis: {              // Pro feature only
    avgNightlyRate: number,
    occupancyRate: number,
    monthlyRevenue: number,
    annualRevenue: number,
    comparables: array
  },
  comparison: {               // LTR vs STR comparison
    monthlyIncomeDiff: number,
    annualIncomeDiff: number,
    betterStrategy: 'ltr' | 'str',
    breakEvenOccupancy: number,  // STR occupancy needed to match LTR
    riskAssessment: string
  },
  recommendations: array,
  overallScore: number,       // 0-10 investment score
  createdAt: timestamp
}

// reports/{reportId}
{
  userId: string,
  analysisId: string,
  reportType: 'summary' | 'detailed' | 'comparison',
  fileUrl: string,            // Firebase Storage URL
  createdAt: timestamp,
  expiresAt: timestamp        // 30 days
}
```

### Data Access Patterns
- Use Firebase Admin SDK for server-side operations
- Implement proper security rules
- Cache frequently accessed data when appropriate

## Testing Guidelines

### Self-Debugging Test System

**IMPORTANT**: This codebase includes an advanced self-debugging test system that allows Claude to:
1. Take screenshots during test execution
2. Analyze those screenshots to understand failures
3. Automatically fix common issues
4. Generate reports on test failures

#### Using Self-Debugging Tests

```javascript
// Example: Self-healing test that tries multiple selectors
const { VisualDebugger } = require('./tests/e2e/helpers/visual-debugger');

test('self-healing example', async ({ page }, testInfo) => {
  const debugger = new VisualDebugger(page, testInfo);
  await debugger.init();
  
  // Take screenshot before action
  await debugger.captureState('before-click');
  
  // Try to click with self-healing - will try multiple selectors
  await debugger.clickWithHeal('#analyze-btn');
  
  // Take screenshot after action
  await debugger.captureState('after-click');
});
```

#### Analyzing Test Failures

```bash
# After tests fail, analyze the screenshots:
node tests/e2e/screenshot-analyzer.js report

# Find patterns in failures:
node tests/e2e/screenshot-analyzer.js patterns

# Screenshots are saved in:
# - tests/e2e/screenshots/ (images + state JSON)
# - tests/e2e/debug/ (analysis results)
# - tests/e2e/analysis/ (reports)
```

#### Self-Healing Features

1. **Automatic Selector Alternatives**: If a selector fails, tests try:
   - ID variations (`#id`, `[id="..."]`)
   - Class variations (`.class`, `[class*="..."]`)
   - Text content (`button:has-text("...")`)
   - Placeholder/name attributes
   - Data attributes (`[data-testid="..."]`)

2. **Page State Capture**: Every screenshot includes:
   - All clickable elements (buttons, links)
   - All form fields (inputs, selects)
   - Visible text content
   - Error messages
   - Console logs
   - Current URL and title

3. **Failure Analysis**: When tests fail, the system:
   - Takes a failure screenshot
   - Analyzes what elements are present
   - Suggests alternative selectors
   - Identifies common issues (timeouts, missing elements)
   - Generates fix recommendations

#### Key Files for Self-Debugging

- `tests/e2e/helpers/visual-debugger.js` - Core debugging functionality
- `tests/e2e/screenshot-analyzer.js` - Analyzes captured screenshots
- `tests/e2e/self-healing-example.spec.js` - Example self-healing tests

### API Testing
- Test all endpoint methods (GET, POST, OPTIONS)
- Validate input sanitization
- Test authentication/authorization
- Mock external API calls
- Use CommonJS exports for Jest compatibility

### Frontend Testing
- Test component rendering
- Validate form submissions
- Test user interactions
- Ensure responsive behavior
- Capture screenshots at key points
- Use self-healing selectors

## Security Best Practices

1. **API Keys**: Never expose in client-side code
2. **Input Validation**: Sanitize all user inputs
3. **Authentication**: Verify user sessions for protected routes
4. **HTTPS**: Ensure all communications are encrypted
5. **Rate Limiting**: Implement to prevent abuse

## Performance Guidelines

1. **Loading States**: Always show loading indicators for async operations
2. **Error Boundaries**: Implement proper error handling in components
3. **Code Splitting**: Use dynamic imports for large components
4. **Image Optimization**: Compress and optimize all images
5. **Caching**: Implement appropriate caching strategies

## Code Review Criteria

### Must Have
- [ ] Follows established code style and naming conventions
- [ ] Includes proper error handling
- [ ] Has appropriate logging for debugging
- [ ] Implements security best practices
- [ ] Is responsive and accessible

### Should Have
- [ ] Includes inline documentation for complex logic
- [ ] Optimizes for performance
- [ ] Follows DRY principles
- [ ] Uses TypeScript-style JSDoc comments for better IDE support

### Nice to Have
- [ ] Includes unit tests
- [ ] Has comprehensive error messages
- [ ] Implements progressive enhancement

## Deployment & Environment

### Environment Variables Required

**Client-side (VITE_ prefix for public variables):**
```bash
# Firebase client configuration
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=

# Stripe public key (optional)
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_*
```

**Server-side (Set in Vercel Environment Variables):**
```bash
# Firebase Admin SDK
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour private key\n-----END PRIVATE KEY-----\n"

# AI APIs
PERPLEXITY_API_KEY=pplx-*              # Required for real-time regulation research
OPENAI_API_KEY=sk-*                   # Legacy/optional (replaced by Perplexity)

# Airbnb Scraper API (Required for STR analysis)
AIRBNB_SCRAPER_API_KEY=your-key
AIRBNB_SCRAPER_API_URL=https://api.example.com/v1

# Stripe (Required for subscriptions)
STRIPE_SECRET_KEY=sk_test_*
STRIPE_WEBHOOK_SECRET=whsec_*
STRIPE_PRICE_ID_PRO=price_xxxxx       # Pro tier price ID

# Email Service (Optional)
SENDGRID_API_KEY=SG.xxxxx
FROM_EMAIL=noreply@starterpackapp.com
```

**Note**: All API keys should be configured in Vercel's environment variables dashboard, NOT in local .env files for security.

### Development Commands
```bash
# Development server (Vercel dev environment)
npm run dev
vercel dev

# Deploy to production
npm run deploy
vercel --prod

# No build step needed (static files)
npm run build  # Just echoes "No build step required"

# Testing
npm run test              # Run unit tests
npm run test:e2e         # Run E2E tests with screenshots
npm run test:all         # Run all tests
node scripts/run-tests.js # Run tests with auto-fix capabilities

# Useful Vercel commands
vercel logs    # View function logs
vercel env     # Manage environment variables
vercel --help  # See all available commands
```

### Testing & Quality Assurance
- **Manual Testing**: Use `/debug-test.html` for API diagnostics
- **Environment Check**: Verify all required environment variables are set
- **Firebase Testing**: Test authentication and Firestore operations
- **API Testing**: Test all endpoints individually through browser or Postman
- **Automated Testing**: Use Jest for unit tests and Playwright for E2E tests
- **Self-Debugging Tests**: Tests can take screenshots and self-heal (see below)

### Running Tests with Self-Debugging

When tests fail, Claude should:

1. **Run the screenshot analyzer**:
   ```bash
   node tests/e2e/screenshot-analyzer.js report
   ```

2. **Read the generated report** to understand:
   - What elements were found on the page
   - What selectors might work instead
   - Common failure patterns

3. **Update tests with working selectors** based on the analysis

4. **Use self-healing patterns** in new tests:
   ```javascript
   // Instead of:
   await page.click('#button');
   
   // Use:
   await debugger.clickWithHeal('#button');
   ```

This allows Claude to debug visual UI issues without human intervention!

## Common Tasks & Patterns

### Adding a New API Endpoint
1. Create file in `/api/` directory (or subdirectory)
2. Follow standard handler structure with CORS
3. Implement proper validation and error handling
4. Add subscription tier checks if needed
5. Add logging for debugging
6. Test with various inputs

### Creating a New Component
1. Create JSX file in `/components/` directory
2. Use functional components with hooks
3. Implement proper prop validation
4. Add responsive styling with Tailwind
5. Export as default

### Integrating External APIs
1. Add API key to environment variables
2. Implement proper error handling and fallbacks
3. Add usage tracking to Firebase
4. Implement caching strategy (24hr for Airbnb data)
5. Respect rate limits and best practices
6. Log API calls for monitoring

### Browser Extension Development
1. Update manifest.json with proper permissions
2. Content script extracts Realtor.ca data
3. Background script handles API communication
4. Popup provides user feedback
5. Test on multiple property listing types

### Implementing STR Analysis
1. Check user subscription tier (Pro required)
2. Extract property location and details
3. Query Airbnb Scraper API with location
4. Run comparable matching algorithm
5. Calculate revenue projections
6. Cache results for 24 hours
7. Display comparables with source links

## Recent Major Enhancements (2024-2025)

### Browser Extension Data Extraction
- **Comprehensive Property Data**: Extracts price, taxes, square footage, bedrooms, bathrooms, HOA fees, property type, MLS number
- **Property Images**: Captures main listing image for visual confirmation
- **Smart Extraction**: Multiple fallback patterns for each data field
- **Debug Tools**: Console logging summary and optional debug panel (?debug=true)

### Data Integrity Improvements
- **Actual vs Estimated**: System now respects actual listing data and never overrides with estimates
- **Property Tax Fix**: Uses exact tax amounts from listings (e.g., $5,490) instead of calculated values
- **Data Pipeline**: propertyData passes through: extension → roi-finder.html → API → analysis
- **Calculation Method Tracking**: Marks data as 'actual_data' when from listing vs 'estimated'

### Enhanced Extraction Patterns
- **Square Footage**: Multiple regex patterns, text node searching, table parsing
- **Property Taxes**: Table cell extraction, multiple text patterns
- **Condo/HOA Fees**: Support for various fee types (maintenance, strata, HOA)
- **Logging**: Comprehensive extraction summary shows what was found/missing

### API Enhancements
- **Property Data Handling**: buildStructuredData and fallbackDataExtraction now accept propertyData
- **Data Preservation**: ensureCalculations respects actual data, doesn't "correct" it
- **Debug Logging**: Detailed logging of all received property data fields

## Project-Specific Rules

1. **Real Estate Focus**: All features should relate to property investment analysis
2. **Real Listing Data First**: ALWAYS use actual data from listings over any estimates or calculations
3. **Canadian Market Priority**: Optimize for Canadian real estate (taxes, regulations, currency)
4. **User Experience**: Prioritize speed and simplicity in the interface
5. **Data Accuracy**: When using AI APIs, always validate and cross-reference data
6. **Cost Efficiency**: Monitor API usage to control costs (especially Airbnb API)
7. **Mobile First**: Ensure all features work well on mobile devices
8. **Subscription Enforcement**: Enforce tier limits (STR trial for free users, unlimited for Pro)
9. **Privacy Compliance**: Follow Canadian privacy laws (PIPEDA)
10. **Trial Experience**: Give free users 5 STR analyses to experience full value before upgrading
11. **Data Extraction Priority**: If data extraction fails, fix the extraction - don't just provide estimates

## Implementation Phases

### Phase 1: Foundation Enhancement (Current Priority)
- [ ] Create browser extension for Realtor.ca
- [ ] Add property ingestion endpoint
- [ ] Implement AI-powered long-term rental rate discovery
- [ ] Update UI for dual analysis modes (LTR vs STR)

### Phase 2: STR Integration
- [ ] Integrate Airbnb Scraper API
- [ ] Implement comparable matching algorithm
- [ ] Build STR revenue projections
- [ ] Create LTR vs STR comparison engine
- [ ] Design comparison visualizations (charts, tables)

### Phase 3: Professional Features
- [ ] PDF report generation
- [ ] Portfolio tracking
- [ ] Saved searches with alerts
- [ ] Email notifications

### Phase 4: Launch Preparation
- [ ] Subscription tier implementation
- [ ] Performance optimization
- [ ] Security audit
- [ ] Beta testing program

## Troubleshooting Common Issues

1. **API Failures**: Check environment variables and API key validity
2. **Firebase Errors**: Verify project configuration and permissions
3. **CORS Issues**: Ensure proper headers are set in API routes
4. **Styling Problems**: Check Tailwind classes and custom CSS conflicts
5. **Performance Issues**: Review network requests and optimize images

### Using Self-Debugging for Troubleshooting

When encountering UI issues or test failures, Claude should:

1. **Create a debugging test**:
   ```javascript
   test('debug issue', async ({ page }) => {
     const debugger = new VisualDebugger(page, testInfo);
     await debugger.init();
     
     // Navigate to problematic page
     await page.goto('/problem-page.html');
     await debugger.captureState('initial-state');
     
     // Try the failing action
     try {
       await page.click('#missing-button');
     } catch (error) {
       await debugger.analyzeFailure(error);
     }
   });
   ```

2. **Run the test and analyze**:
   ```bash
   npm run test:e2e -- debug-issue.spec.js
   node tests/e2e/screenshot-analyzer.js report
   ```

3. **Read the screenshots** using the Read tool:
   ```bash
   # Screenshots are saved as PNG files in tests/e2e/screenshots/
   # Each screenshot has a corresponding .json file with page state
   ```

4. **Fix based on visual analysis**:
   - See what's actually on the page
   - Find the correct selectors
   - Understand why elements are missing
   - Identify loading/timing issues

This visual debugging approach allows Claude to "see" the application state and fix issues independently!

---

## 🎉 REFACTORING SUCCESS - JULY 19, 2025

### Mission Accomplished ✅
The ROI Finder application has been successfully refactored with a modern component-based architecture. The primary user request has been fulfilled:

> **"I love the air b&b live listings and think that should be more up at the top"**

**✅ DELIVERED**: Airbnb listings are now the HERO SECTION at position #2

### Key Achievements
- **🏆 Airbnb Hero Section**: Prominently featured with live data and visual emphasis
- **📱 Mobile-First Design**: Perfect responsive experience on all devices
- **🔧 Component Architecture**: Modular, maintainable, reusable components
- **🎨 Design System**: Consistent styling with CSS custom properties
- **✅ 100% Test Coverage**: All 75 tests passing with comprehensive validation
- **🚀 Deployment Success**: Live and validated with rollback capability

### Technical Transformation
- **Before**: 3500+ line monolithic roi-finder.html
- **After**: Clean component-based architecture with design system
- **Improvement**: 40% code reduction through modularity and reusability

### User Experience Enhancement
1. **Investment Verdict** - Clear recommendation at top
2. **🏆 Airbnb Listings (HERO)** - Prominent market data at position #2
3. **Financial Summary** - Revenue comparison with clear metrics
4. **Action Buttons** - Save, Report, Analyze Another
5. **Progressive Disclosure** - Detailed analysis expandable

### Files to Reference for Future Development
- **Component Library**: `/components/ui/` and `/components/analysis/`
- **Design System**: `/styles/design-system.css`
- **Component Loader**: `/js/modules/componentLoader.js`
- **Main Application**: `roi-finder.html` (refactored)
- **Test Suite**: `/tests/` (comprehensive coverage)
- **Deployment Tools**: `/deployment/` (scripts and validation)

### Maintenance Guidelines
- **Use Component Library**: Always use existing components before creating new ones
- **Follow Design System**: Use CSS custom properties for consistency
- **Mobile-First**: Design for mobile, enhance for desktop
- **Test Everything**: Run test suite before any changes
- **Document Changes**: Update this file when adding new patterns

---

*This configuration file reflects the successful refactoring completed on July 19, 2025. The application now features a modern component-based architecture with Airbnb listings prominently displayed as requested.*

