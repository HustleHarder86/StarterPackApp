# Refactored Source Code Structure

This directory contains the refactored and consolidated codebase for StarterPackApp.

## Directory Structure

```
src/
├── components/       # Consolidated React components
│   ├── analysis/    # Property analysis components
│   ├── ui/         # Reusable UI components
│   └── index.js    # Central export point
├── api/            # Consolidated API endpoints
│   └── index.js    # Central export point
├── services/       # Business logic and external services
├── utils/          # Utility functions
└── pages/          # Page-level components (future)
```

## Migration Status

### ✅ Completed
- **AirbnbListings**: Consolidated 3 versions into single flexible component
- **InvestmentVerdict**: Merged base, enhanced, and mockup versions
- **FinancialSummary**: Combined standard and enhanced features
- **analyze-property**: Unified 3 endpoints with mode selection
- **user-management**: Merged base and enhanced functionality

### 🚧 In Progress
- Moving consolidated files to src/ directory
- Creating proper import/export structure
- Setting up build configuration

### 📋 To Do
- Migrate remaining components
- Set up bundler (Webpack/Vite)
- Create TypeScript definitions
- Update all imports in existing code

## Usage

Import consolidated components:
```javascript
import { AirbnbListings, InvestmentVerdict, FinancialSummary } from './src/components';
```

Use API endpoints with modes:
```javascript
// Proxy mode (Railway)
fetch('/api/analyze-property', {
  method: 'POST',
  body: JSON.stringify({ mode: 'proxy', ...data })
});

// Enhanced mode (local)
fetch('/api/analyze-property', {
  method: 'POST',
  body: JSON.stringify({ mode: 'enhanced', ...data })
});
```

## Benefits

1. **Reduced Duplication**: Single source of truth for each component
2. **Flexible Features**: Mode/flag-based feature toggling
3. **Better Organization**: Clear module structure
4. **Easier Maintenance**: Consolidated logic in one place
5. **Improved Testing**: Single component to test per feature