const fs = require('fs');
const path = require('path');

// Pages that need updates (from audit results)
const pagesToUpdate = [
  'index.html',
  'admin-dashboard.html',
  'blog-admin.html',
  'blog.html',
  'client-view.html',
  'contact.html',
  'extension-welcome.html',
  'monitor-dashboard.html',
  'payment-success.html',
  'realtor-settings.html'
];

// Common CSS and font imports for Compact Modern design
const compactModernImports = `
    <!-- Fonts - Compact Modern Design -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    
    <!-- Compact Modern Design System -->
    <link rel="stylesheet" href="styles/compact-modern-design-system.css">
    <link rel="stylesheet" href="styles/gradient-theme.css">`;

// Style override to ensure Manrope font
const fontOverrideStyle = `
    <style>
        /* Force Manrope font for Compact Modern design */
        body {
            font-family: 'Manrope', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
        }
    </style>`;

function updatePage(filePath) {
  console.log(`\nUpdating ${filePath}...`);
  
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    // Check if already has Compact Modern imports
    if (content.includes('compact-modern-design-system.css')) {
      console.log('  → Already has Compact Modern CSS');
    } else {
      // Find the </head> tag and insert before it
      const headEndIndex = content.indexOf('</head>');
      if (headEndIndex !== -1) {
        // Remove any existing Inter or Plus Jakarta Sans imports
        content = content.replace(/<link[^>]*fonts\.googleapis[^>]*Inter[^>]*>/gi, '');
        content = content.replace(/<link[^>]*fonts\.googleapis[^>]*Plus\+Jakarta\+Sans[^>]*>/gi, '');
        
        // Remove inline styles with wrong fonts
        content = content.replace(/font-family:\s*['"]?(Inter|Plus Jakarta Sans)[^;]*;/gi, '');
        
        // Add Compact Modern imports before </head>
        content = content.slice(0, headEndIndex) + compactModernImports + fontOverrideStyle + '\n' + content.slice(headEndIndex);
        modified = true;
        console.log('  ✅ Added Compact Modern CSS and Manrope font');
      }
    }
    
    // Fix any remaining font references
    if (content.includes('Inter') || content.includes('Plus Jakarta Sans')) {
      // Replace Inter with Manrope
      content = content.replace(/(['"])Inter\1/g, '$1Manrope$1');
      content = content.replace(/font-family:\s*Inter/g, 'font-family: Manrope');
      
      // Replace Plus Jakarta Sans with Manrope
      content = content.replace(/(['"])Plus Jakarta Sans\1/g, '$1Manrope$1');
      content = content.replace(/font-family:\s*['"]?Plus Jakarta Sans['"]?/g, 'font-family: Manrope');
      
      modified = true;
      console.log('  ✅ Replaced font references with Manrope');
    }
    
    // Special handling for specific pages
    const pageName = path.basename(filePath);
    
    // For admin/dashboard pages, ensure they have proper layout structure
    if (pageName.includes('admin') || pageName.includes('dashboard') || pageName === 'realtor-settings.html') {
      if (!content.includes('cm-sidebar') && !content.includes('compact-modern-layout')) {
        console.log('  ⚠️  Note: This page may need layout restructuring for sidebar');
      }
    }
    
    if (modified) {
      // Create backup
      const backupPath = filePath + '.backup-' + Date.now();
      fs.writeFileSync(backupPath, fs.readFileSync(filePath));
      console.log(`  → Created backup: ${backupPath}`);
      
      // Write updated content
      fs.writeFileSync(filePath, content);
      console.log('  ✅ Page updated successfully');
    } else {
      console.log('  → No changes needed');
    }
    
  } catch (error) {
    console.error(`  ❌ Error updating ${filePath}:`, error.message);
  }
}

// Main execution
console.log('Starting Compact Modern design update for all pages...\n');
console.log('This will:');
console.log('1. Add Manrope font imports');
console.log('2. Add compact-modern-design-system.css');
console.log('3. Add gradient-theme.css');
console.log('4. Replace Inter/Plus Jakarta Sans with Manrope');
console.log('5. Create backups of all modified files\n');

// Update each page
pagesToUpdate.forEach(page => {
  const filePath = path.join(__dirname, '..', page);
  if (fs.existsSync(filePath)) {
    updatePage(filePath);
  } else {
    console.log(`\n❌ File not found: ${page}`);
  }
});

console.log('\n\n=== UPDATE COMPLETE ===');
console.log('\nNext steps:');
console.log('1. Test each page to verify the updates');
console.log('2. For admin/dashboard pages, consider adding sidebar layout');
console.log('3. Run the design audit again to confirm all fixes');
console.log('\nTo restore any page from backup, use the .backup-* files created');