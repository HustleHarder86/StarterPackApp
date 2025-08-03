# CSS Migration Guide - StarterPackApp

This guide helps migrate remaining pages to the unified CSS design system.

## 🎯 Migration Status

### ✅ Completed Pages
- roi-finder.html
- index.html
- admin-dashboard.html
- payment-success.html
- blog.html
- blog-admin.html
- blog/[slug].html

### ⏳ Remaining Pages
- extension-welcome.html
- contact.html
- client-view.html
- monitor-dashboard.html
- realtor-settings.html
- Various test HTML files in /tests/

## 📋 Migration Checklist

For each HTML file:

### 1. Update HTML Head
Replace all existing CSS imports with:

```html
<!-- Remove these -->
<link rel="stylesheet" href="styles.css" />
<link rel="stylesheet" href="styles/design-system.css">
<link rel="stylesheet" href="styles/compact-modern-design-system.css">
<link rel="stylesheet" href="styles/gradient-theme.css">

<!-- Add these instead -->
<!-- Fonts -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap" rel="stylesheet">

<!-- Tailwind CSS -->
<script src="https://cdn.tailwindcss.com"></script>

<!-- Unified Design System -->
<link rel="stylesheet" href="/styles/unified-design-system.css">
```

### 2. Remove Inline Style Overrides
Remove any `<style>` blocks that force fonts or override CSS:

```html
<!-- Remove this -->
<style>
    /* Force Manrope font for Compact Modern design */
    body {
        font-family: 'Manrope', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
    }
</style>
```

### 3. Update Class Names
Replace deprecated class names:

| Old Class | New Class |
|-----------|-----------|
| `cm-sidebar` | `sidebar` |
| `cm-sidebar-link` | `sidebar-link` |
| `cm-sidebar-link.active` | `sidebar-link.active` |
| `glass-override` | `glass-card` |
| `gradient-theme` | Use CSS variables |

### 4. Validate the Migration

After updating each file, run:

```bash
# Check CSS imports are correct
npm run css:validate

# Verify CSS classes exist
npm run css:check-classes

# Run visual tests
npm run test:visual
```

## 🔄 Common Migration Patterns

### Pattern 1: Simple Page
```html
<!-- Before -->
<link rel="stylesheet" href="styles.css" />

<!-- After -->
<link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<script src="https://cdn.tailwindcss.com"></script>
<link rel="stylesheet" href="/styles/unified-design-system.css">
```

### Pattern 2: Page with Multiple CSS Files
```html
<!-- Before -->
<link rel="stylesheet" href="styles.css" />
<link rel="stylesheet" href="styles/compact-modern-design-system.css">
<link rel="stylesheet" href="styles/gradient-theme.css">

<!-- After -->
<link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<script src="https://cdn.tailwindcss.com"></script>
<link rel="stylesheet" href="/styles/unified-design-system.css">
```

### Pattern 3: React Components
For pages using React components, ensure they use the unified CSS classes:

```javascript
// Update component to use new classes
const Sidebar = () => (
  <div className="sidebar"> {/* Not cm-sidebar */}
    <nav className="sidebar-nav">
      <a href="#" className="sidebar-link active">Dashboard</a>
    </nav>
  </div>
);
```

## ⚠️ Special Cases

### 1. Test Files
Test files in `/tests/` may use different CSS for isolation. Consider:
- Keep them separate if they test specific CSS scenarios
- Migrate if they test actual UI components

### 2. Email Templates
Email templates may need inline styles for compatibility. Skip migration for:
- Email notification templates
- PDF generation templates

### 3. Extension Files
Browser extension files (`/extension/`) may have different requirements:
- Check extension manifest for CSS injection
- Test in browser after migration

## 🛠️ Troubleshooting

### Issue: Styles Not Applied
```bash
# Check if file is importing correct CSS
grep -n "unified-design-system.css" yourfile.html

# Verify CSS file exists and is accessible
ls -la styles/unified-design-system.css
```

### Issue: Font Not Loading
Ensure Manrope font link comes before CSS:
```html
<!-- Correct order -->
<link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/styles/unified-design-system.css">
```

### Issue: Missing Classes After Migration
Check the CSS class map for new names:
```bash
cat tests/css-class-map.json | grep "your-old-class"
```

## 📊 Migration Progress Tracking

Track progress with:
```bash
# Count files still using old CSS
find . -name "*.html" -exec grep -l "styles\.css\|design-system\.css\|gradient-theme\.css" {} \; | wc -l

# List files needing migration
find . -name "*.html" -exec grep -l "styles\.css\|design-system\.css\|gradient-theme\.css" {} \;
```

## 🚀 Automated Migration Script

For bulk migration, use this script:

```bash
#!/bin/bash
# migrate-css.sh

files=$(find . -name "*.html" -not -path "./node_modules/*" -not -path "./coverage/*")

for file in $files; do
  echo "Migrating $file..."
  
  # Backup original
  cp "$file" "$file.bak"
  
  # Replace CSS imports
  sed -i 's|<link rel="stylesheet" href="styles\.css".*/>|<!-- Fonts -->\n<link rel="preconnect" href="https://fonts.googleapis.com">\n<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n<link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap" rel="stylesheet">\n\n<!-- Tailwind CSS -->\n<script src="https://cdn.tailwindcss.com"></script>\n\n<!-- Unified Design System -->\n<link rel="stylesheet" href="/styles/unified-design-system.css">|g' "$file"
  
  # Remove old CSS files
  sed -i '/<link.*compact-modern-design-system\.css/d' "$file"
  sed -i '/<link.*gradient-theme\.css/d' "$file"
  sed -i '/<link.*design-system\.css/d' "$file"
  
  echo "✅ Migrated $file"
done

# Validate all files
npm run css:validate
```

## 📝 Post-Migration Checklist

After migrating all files:

1. **Run Full Test Suite**
   ```bash
   npm run test:comprehensive
   ```

2. **Update Documentation**
   - Update README if CSS setup changed
   - Remove references to old CSS files
   - Update developer onboarding docs

3. **Clean Up Old Files**
   ```bash
   # After confirming all migrations work
   git rm styles/styles.css
   git rm styles/design-system.css
   git rm styles/compact-modern-design-system.css
   git rm styles/gradient-theme.css
   ```

4. **Update CI/CD**
   - Add CSS validation to CI pipeline
   - Update deployment scripts if needed

## 🎉 Migration Complete!

Once all pages are migrated:
- Consistent design across all pages
- Single source of CSS truth
- Easier maintenance
- Better performance (single CSS file)
- Automated validation prevents regressions