# Development Guidelines - StarterPackApp

> **Purpose**: Prevent common errors and ensure smooth feature launches

## 🚨 Module System Guidelines

### Browser vs Node.js Modules
**CRITICAL**: Browser environments don't support CommonJS (`require`/`module.exports`)

#### ✅ DO - Browser-Compatible Approaches:

**Option 1: Global Script Loading**
```html
<!-- In HTML -->
<script src="js/modules/componentLoader.js"></script>
```

```javascript
// In componentLoader.js
class ComponentLoader { ... }
window.ComponentLoader = ComponentLoader;
```

**Option 2: ES6 Modules Throughout**
```javascript
// componentLoader.js
export default class ComponentLoader { ... }

// In HTML
<script type="module">
  import ComponentLoader from './js/modules/componentLoader.js';
  const loader = new ComponentLoader();
</script>
```

#### ❌ DON'T - Common Mistakes:
```javascript
// This will NOT work in browsers:
const ComponentLoader = require('./componentLoader.js');
module.exports = ComponentLoaderCompactModern;
```

## 📋 Pre-Launch Checklist

Before launching any new feature:

### 1. Module Loading
- [ ] All JavaScript files use consistent module system
- [ ] No CommonJS syntax in browser code
- [ ] Dependencies are properly loaded before use

### 2. CSS Namespacing
- [ ] All new CSS classes follow design system conventions
- [ ] CSS variables use consistent naming patterns
- [ ] Styles don't conflict with existing design system

### 3. Testing
- [ ] Run `npm run test:syntax` - Must pass
- [ ] Run `npm run test:e2e` - All tests green
- [ ] Test in development server before production
- [ ] Check browser console for errors

### 4. Component Integration
- [ ] New components follow existing patterns
- [ ] Props/parameters match expected format
- [ ] Error handling for missing data

## 🏗️ Architecture Patterns

### Component Structure
```javascript
// Always check for required data
window.MyComponent = function({ property, analysis }) {
  if (!property) return '<div>No property data</div>';
  
  // Safe property access
  const price = property?.price || 0;
  const address = property?.address || 'Unknown Address';
  
  return `<div>...</div>`;
};
```

### Data Flow
```javascript
// Backend returns snake_case
const backendData = {
  property_data: { ... },
  str_analysis: { ... }
};

// Frontend expects camelCase
const frontendData = {
  propertyData: backendData.property_data,
  strAnalysis: backendData.str_analysis
};
```

## 🐛 Common Issues & Solutions

### Issue 1: "ReferenceError: X is not defined"
**Cause**: Variable used before declaration or module not loaded
**Solution**: Ensure proper load order and check variable scope

### Issue 2: "Cannot read property of undefined"
**Cause**: Accessing nested properties that don't exist
**Solution**: Use optional chaining (`?.`) or default values

### Issue 3: Module Loading Errors
**Cause**: Mixing CommonJS with ES6 modules
**Solution**: Use consistent module system (see guidelines above)

### Issue 4: CSS Conflicts
**Cause**: Global CSS class names colliding
**Solution**: Namespace all CSS (e.g., `.sidebar` → `.cm-sidebar`)

## 🚀 Feature Launch Process

1. **Development**
   - Follow module guidelines
   - Use CSS namespacing
   - Handle edge cases

2. **Testing**
   - Run all test suites
   - Check browser console
   - Test mobile responsiveness

3. **Integration**
   - Create feature branch
   - Test with existing features
   - Run comprehensive tests

4. **Documentation**
   - Update CLAUDE.md if needed
   - Document new patterns
   - Add to component examples

5. **Deployment**
   - Merge to main only after all tests pass
   - Monitor for errors post-deployment
   - Have rollback plan ready

## 📝 Quick Reference

### File Organization
```
/components/
  /ui/          # Reusable UI components
  /analysis/    # Analysis-specific components
  /layout/      # Layout components
/js/
  /modules/     # JavaScript modules
/styles/        # CSS files (namespaced)
```

### Naming Conventions
- **Files**: `ComponentNameDescriptive.js`
- **CSS Classes**: `prefix-component-name`
- **CSS Variables**: `--prefix-variable-name`
- **Functions**: `camelCase`
- **Components**: `PascalCase`

### Testing Commands
```bash
npm run test:syntax      # Check JavaScript syntax
npm run test:e2e         # Run end-to-end tests
npm run test:comprehensive  # Run all tests
```

## 🔧 Development Tools

### Debugging
- Use `console.log` for data flow debugging
- Check Network tab for API calls
- Use browser DevTools for CSS issues

### Error Prevention
- Always use optional chaining for nested properties
- Provide default values for undefined data
- Test with missing/incomplete data

## 📚 Resources

- [CLAUDE.md](./CLAUDE.md) - Main development guide
- [UI-FIX-WORKFLOW.md](./UI-FIX-WORKFLOW.md) - UI debugging process
- [TEST-AGENT-LEARNINGS.md](./tests/e2e/TEST-AGENT-LEARNINGS.md) - Test debugging patterns

---

**Remember**: When in doubt, check existing patterns in the codebase and follow them consistently.