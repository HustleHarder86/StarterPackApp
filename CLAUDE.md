# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## ⚠️ IMPORTANT: Branch Workflow

**ALWAYS use the `Claude-Changes` branch for all code changes:**

1. **Before making any changes**: Switch to or create the `Claude-Changes` branch:
   ```bash
   git checkout Claude-Changes
   # or if it doesn't exist:
   git checkout -b Claude-Changes
   ```

2. **Make all changes on this branch** - Never commit directly to `main`

3. **After completing changes**: The user will manually review and create a pull request to merge `Claude-Changes` → `main`

This workflow ensures all AI-generated changes go through proper human review before being merged into the main branch.

## Project Overview

**StarterPackApp** is a real estate investment analysis platform that helps users analyze properties for ROI potential. The application integrates with Perplexity AI for market research and provides comprehensive financial analysis tools.

## Tech Stack

- **Frontend**: HTML5, CSS3, JavaScript (ES6+), JSX Components
- **Backend**: Node.js with Vercel API Routes
- **Database**: Firebase Firestore
- **Authentication**: Firebase Auth
- **Styling**: Tailwind CSS + Custom CSS
- **Charts**: Chart.js
- **External APIs**: Perplexity AI, OpenAI (optional)
- **Deployment**: Vercel

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

**Hybrid Static/Dynamic Architecture:**
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

### Directory Structure
```
/
├── api/                    # Vercel serverless functions
│   ├── analyze-property.js # Main analysis endpoint
│   ├── config.js          # Public app configuration
│   ├── user-management.js # User profile operations
│   └── stripe-*.js        # Payment processing (optional)
├── components/             # React JSX components (CDN-loaded)  
│   ├── PropertyAnalysisForm.jsx
│   └── ComparisonView.jsx
├── utils/                  # Client-side utilities
│   ├── analytics.js       # Usage tracking
│   ├── error-handler.js   # Error handling
│   └── pdf-generator.js   # Report generation
├── assets/                # Static assets
├── tests/                 # Basic API tests
├── *.html                 # Application pages
├── styles.css             # Custom CSS
├── manifest.json          # PWA configuration
└── vercel.json            # Deployment configuration
```

### Application Pages Architecture
- `index.html` → Landing page with lead capture
- `roi-finder.html` → Main authenticated application
- `admin-dashboard.html` → Admin interface for user management
- `debug-test.html` → Development diagnostics tool

### Naming Conventions
- **Files**: kebab-case for HTML/CSS, camelCase for JS
- **Components**: PascalCase (e.g., `PropertyAnalysisForm.jsx`)
- **API Routes**: kebab-case (e.g., `analyze-property.js`)
- **Utilities**: camelCase (e.g., `analytics.js`)

## External API Integration

### Perplexity AI Guidelines

1. **Model Selection**: Use `llama-3.1-sonar-large-128k-online` for best results
2. **Token Optimization**: 
   - Limit property comparables to maximum 3 per request
   - Structure prompts efficiently to minimize tokens
3. **Error Handling**: Always provide fallback data for API failures

### Rate Limiting & Usage Tracking

1. **Implementation**: Track API usage in Firebase
2. **Limits**: Respect user subscription tiers
3. **Monitoring**: Log all API calls with timestamps and usage metrics

## Database Patterns (Firebase)

### Collection Structure
```javascript
// users/{uid}
{
  email: string,
  displayName: string,
  subscriptionStatus: 'trial' | 'active' | 'cancelled',
  monthlyAnalysisCount: number,
  monthlyAnalysisLimit: number
}

// analyses/{analysisId}
{
  userId: string,
  propertyAddress: string,
  createdAt: timestamp,
  propertyValue: number,
  roi: number,
  recommendations: object
}
```

### Data Access Patterns
- Use Firebase Admin SDK for server-side operations
- Implement proper security rules
- Cache frequently accessed data when appropriate

## Testing Guidelines

### API Testing
- Test all endpoint methods (GET, POST, OPTIONS)
- Validate input sanitization
- Test authentication/authorization
- Mock external API calls

### Frontend Testing
- Test component rendering
- Validate form submissions
- Test user interactions
- Ensure responsive behavior

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

**Server-side (API functions only):**
```bash
# Firebase Admin SDK
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour private key\n-----END PRIVATE KEY-----\n"

# AI APIs
PERPLEXITY_API_KEY=pplx-*
OPENAI_API_KEY=sk-* (optional but recommended)

# Stripe secret keys (optional)
STRIPE_SECRET_KEY=sk_test_*
STRIPE_WEBHOOK_SECRET=whsec_*
```

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
npm run test   # Currently echoes "No tests configured"

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

## Common Tasks & Patterns

### Adding a New API Endpoint
1. Create file in `/api/` directory
2. Follow standard handler structure with CORS
3. Implement proper validation and error handling
4. Add logging for debugging
5. Test with various inputs

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
4. Respect rate limits and best practices
5. Log API calls for monitoring

## Project-Specific Rules

1. **Real Estate Focus**: All features should relate to property investment analysis
2. **User Experience**: Prioritize speed and simplicity in the interface
3. **Data Accuracy**: When using AI APIs, always validate and cross-reference data
4. **Cost Efficiency**: Monitor API usage to control costs
5. **Mobile First**: Ensure all features work well on mobile devices

## Troubleshooting Common Issues

1. **API Failures**: Check environment variables and API key validity
2. **Firebase Errors**: Verify project configuration and permissions
3. **CORS Issues**: Ensure proper headers are set in API routes
4. **Styling Problems**: Check Tailwind classes and custom CSS conflicts
5. **Performance Issues**: Review network requests and optimize images

---

*This configuration file should be updated as the project evolves. When adding new patterns or changing conventions, update this file accordingly.*

This is a test update.