# CLAUDE.md - Project Configuration & Guidelines

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

## File Organization

### Directory Structure
```
/
├── api/                    # Vercel API routes
├── components/             # Reusable JSX components
├── utils/                  # Utility functions
├── assets/                 # Static assets (images, icons)
├── data/                   # Static data files
├── i18n/                   # Internationalization
├── tests/                  # Test files
├── *.html                  # Page templates
├── *.js                    # Core application files
└── styles.css              # Global styles
```

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
```bash
# Firebase
FIREBASE_API_KEY=
FIREBASE_AUTH_DOMAIN=
FIREBASE_PROJECT_ID=
FIREBASE_STORAGE_BUCKET=
FIREBASE_MESSAGING_SENDER_ID=
FIREBASE_APP_ID=

# External APIs
PERPLEXITY_API_KEY=pplx-*
OPENAI_API_KEY=sk-* (optional)

# Stripe (for payments)
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
```

### Build & Deploy
- **Development**: `npm run dev` (Vercel dev server)
- **Production**: `npm run deploy` (Vercel production)
- **Testing**: Currently no automated tests configured

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