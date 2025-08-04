#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Production HTML files that need updating (excluding test files)
const productionFiles = [
  'roi-finder-test.html',
  'roi-finder-broken.html',
  'roi-finder-broken-original.html',
  'roi-finder-fixed.html',
  'roi-finder-before-e2e.html',
  'roi-finder-e2e.html',
  'roi-finder-v2.html',
  'roi-finder-test-simple.html',
  'roi-finder-test-working.html'
];

// Test and mockup files should be excluded
const excludePatterns = [
  /^test-/,
  /^mockup/,
  /^browser-test/,
  /\/tests\//,
  /\/mockups\//
];

function updateCSSImports(filePath) {
  console.log(`\nProcessing: ${filePath}`);
  
  let content = fs.readFileSync(filePath, 'utf8');
  const originalContent = content;
  
  // Remove old CSS imports
  const oldCSSPatterns = [
    /<link[^>]*href=["']styles\/compact-modern-design-system\.css["'][^>]*>/gi,
    /<link[^>]*href=["']styles\/gradient-theme\.css["'][^>]*>/gi,
    /<link[^>]*href=["']styles\/mobile-fixes\.css["'][^>]*>/gi,
    /<link[^>]*href=["']styles\/glass-override\.css["'][^>]*>/gi,
    /<link[^>]*href=["']styles\/design-system\.css["'][^>]*>/gi,
    /<link[^>]*href=["']styles\/loading-enhancements\.css["'][^>]*>/gi
  ];
  
  // Remove each old CSS import
  oldCSSPatterns.forEach(pattern => {
    content = content.replace(pattern, '');
  });
  
  // Clean up extra blank lines
  content = content.replace(/\n\s*\n\s*\n/g, '\n\n');
  
  // Find where to insert new CSS (after fonts or before </head>)
  const fontLinkMatch = content.match(/<link[^>]*href=["'][^"']*fonts\.googleapis[^"']*["'][^>]*>/);
  const headMatch = content.match(/<\/head>/i);
  
  // New CSS imports
  const newCSSImports = `    <!-- Unified Design System -->
    <link rel="stylesheet" href="/styles/unified-design-system.css">
    <link rel="stylesheet" href="/styles/property-confirmation.css">
    <link rel="stylesheet" href="/styles/analysis-progress.css">`;
  
  if (fontLinkMatch) {
    // Insert after the last font link
    const lastFontIndex = content.lastIndexOf(fontLinkMatch[0]) + fontLinkMatch[0].length;
    content = content.slice(0, lastFontIndex) + '\n    \n' + newCSSImports + content.slice(lastFontIndex);
  } else if (headMatch) {
    // Insert before </head>
    const headIndex = content.indexOf(headMatch[0]);
    content = content.slice(0, headIndex) + newCSSImports + '\n    ' + content.slice(headIndex);
  }
  
  // Fix relative paths to absolute paths
  content = content.replace(/href="styles\//g, 'href="/styles/');
  
  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✓ Updated CSS imports in ${filePath}`);
    return true;
  } else {
    console.log(`✗ No changes needed for ${filePath}`);
    return false;
  }
}

// Process files
console.log('Starting CSS consolidation...\n');
let updatedCount = 0;

productionFiles.forEach(file => {
  const filePath = path.join(__dirname, '..', file);
  if (fs.existsSync(filePath)) {
    if (updateCSSImports(filePath)) {
      updatedCount++;
    }
  } else {
    console.log(`✗ File not found: ${file}`);
  }
});

console.log(`\n✅ CSS consolidation complete! Updated ${updatedCount} files.`);
console.log('\nNext steps:');
console.log('1. Test the updated files to ensure they still work');
console.log('2. Delete the deprecated CSS files when confirmed');
console.log('3. Update any remaining references in JavaScript files');