# CLAUDE.md - Detailed Examples and Extended Documentation

This file contains detailed examples and extended documentation referenced by CLAUDE.md.

## Development Workflow - Detailed

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

## Testing - Detailed Examples

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

### Self-Debugging Test System - Extended

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

## Code Style - Detailed Examples

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

## External API Integration - Detailed

### Perplexity AI Guidelines

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

## Full Directory Structure

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

## Database Schema - Full Details

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

## Implementation Phases - Detailed

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

## Recent Major Enhancements - Extended Details

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