#!/usr/bin/env node

/**
 * CSS Import Validation Script
 * Ensures only the unified-design-system.css is imported
 * and no conflicting CSS files are loaded
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Configuration
const config = {
  // The only allowed CSS files (after reversion to original design)
  allowedCSS: [
    '/styles/design-system.css',
    'styles/design-system.css',
    '../styles/design-system.css',
    '/styles/mobile-fixes.css',
    'styles/mobile-fixes.css',
    '/styles.css',
    'styles.css',
    'https://cdn.tailwindcss.com', // Tailwind CDN is allowed as base utility
    'https://cdn.jsdelivr.net/npm/tailwindcss', // Versioned Tailwind CDN
    'https://fonts.googleapis.com', // Google Fonts allowed
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome', // Font Awesome allowed
    'popup.css' // Extension popup styles
  ],
  
  // Deprecated CSS files that should not be imported
  deprecatedCSS: [
    'gradient-theme.css',
    'compact-modern-design-system.css',
    'compact-modern.css',
    'glass-override.css',
    'loading-enhancements.css',
    'unified-design-system.css',
    'property-confirmation.css',
    'analysis-progress.css'
  ],
  
  // Patterns to search for CSS imports
  htmlPatterns: [
    '**/*.html',
    '!node_modules/**',
    '!coverage/**',
    '!dist/**',
    '!build/**',
    '!mocks/**', // Exclude mocks directory
    '!mockups/**' // Exclude mockups directory
  ],
  
  // Patterns that indicate CSS imports
  cssImportPatterns: [
    /<link[^>]+rel=["']stylesheet["'][^>]*>/gi,
    /<style[^>]*>[\s\S]*?<\/style>/gi,
    /import\s+["'].*\.css["']/gi,
    /@import\s+["'].*\.css["']/gi
  ]
};

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m'
};

// Results tracking
const results = {
  totalFiles: 0,
  validFiles: 0,
  filesWithIssues: [],
  deprecatedImports: [],
  unauthorizedImports: [],
  inlineStyles: []
};

/**
 * Check if a CSS import is allowed
 */
function isAllowedCSS(cssPath) {
  // Check for exact matches or partial matches
  return config.allowedCSS.some(allowed => {
    // For external URLs, check if cssPath starts with allowed
    if (allowed.startsWith('http')) {
      return cssPath.startsWith(allowed);
    }
    // For local paths, check various forms
    const normalizedCss = cssPath.replace(/^\.\//, '').replace(/^\//, '');
    const normalizedAllowed = allowed.replace(/^\.\//, '').replace(/^\//, '');
    return normalizedCss === normalizedAllowed || cssPath.endsWith(normalizedAllowed);
  });
}

/**
 * Check if a CSS import is deprecated
 */
function isDeprecatedCSS(cssPath) {
  // First check if it's an allowed CSS file - if so, it's not deprecated
  if (isAllowedCSS(cssPath)) {
    return false;
  }
  
  return config.deprecatedCSS.some(deprecated => {
    // Extract just the filename from the path
    const filename = cssPath.split('/').pop();
    return filename === deprecated;
  });
}

/**
 * Extract CSS file path from link tag
 */
function extractCSSPath(linkTag) {
  const hrefMatch = linkTag.match(/href=["']([^"']+)["']/);
  return hrefMatch ? hrefMatch[1] : null;
}

/**
 * Validate a single HTML file
 */
function validateHTMLFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const issues = [];
  
  // Check for link tags
  const linkTags = content.match(config.cssImportPatterns[0]) || [];
  linkTags.forEach(tag => {
    const cssPath = extractCSSPath(tag);
    if (cssPath && cssPath.endsWith('.css')) {
      if (isDeprecatedCSS(cssPath)) {
        issues.push({
          type: 'deprecated',
          path: cssPath,
          line: getLineNumber(content, tag)
        });
        results.deprecatedImports.push({ file: filePath, css: cssPath });
      } else if (!isAllowedCSS(cssPath)) {
        issues.push({
          type: 'unauthorized',
          path: cssPath,
          line: getLineNumber(content, tag)
        });
        results.unauthorizedImports.push({ file: filePath, css: cssPath });
      }
    }
  });
  
  // Check for inline styles with @import
  const styleTags = content.match(config.cssImportPatterns[1]) || [];
  styleTags.forEach(tag => {
    if (tag.includes('@import') || tag.includes('!important')) {
      issues.push({
        type: 'inline-style',
        content: tag.substring(0, 100) + '...',
        line: getLineNumber(content, tag)
      });
      results.inlineStyles.push({ file: filePath, style: tag.substring(0, 100) });
    }
  });
  
  // Check for JavaScript CSS imports
  const jsImports = content.match(config.cssImportPatterns[2]) || [];
  jsImports.forEach(importStatement => {
    const cssPath = importStatement.match(/["']([^"']+\.css)["']/)?.[1];
    if (cssPath && !isAllowedCSS(cssPath)) {
      issues.push({
        type: 'js-import',
        path: cssPath,
        line: getLineNumber(content, importStatement)
      });
      results.unauthorizedImports.push({ file: filePath, css: cssPath });
    }
  });
  
  return issues;
}

/**
 * Get line number for a match in content
 */
function getLineNumber(content, match) {
  const index = content.indexOf(match);
  return content.substring(0, index).split('\n').length;
}

/**
 * Format file path for display
 */
function formatPath(filePath) {
  return path.relative(process.cwd(), filePath);
}

/**
 * Print validation results
 */
function printResults() {
  console.log('\n' + colors.blue + '===== CSS Import Validation Results =====' + colors.reset);
  console.log(`Total files scanned: ${results.totalFiles}`);
  console.log(`Valid files: ${colors.green}${results.validFiles}${colors.reset}`);
  console.log(`Files with issues: ${colors.red}${results.filesWithIssues.length}${colors.reset}`);
  
  if (results.deprecatedImports.length > 0) {
    console.log('\n' + colors.yellow + '⚠️  Deprecated CSS Imports:' + colors.reset);
    results.deprecatedImports.forEach(item => {
      console.log(`  ${formatPath(item.file)}: ${colors.yellow}${item.css}${colors.reset}`);
    });
  }
  
  if (results.unauthorizedImports.length > 0) {
    console.log('\n' + colors.red + '❌ Unauthorized CSS Imports:' + colors.reset);
    results.unauthorizedImports.forEach(item => {
      console.log(`  ${formatPath(item.file)}: ${colors.red}${item.css}${colors.reset}`);
    });
  }
  
  if (results.inlineStyles.length > 0) {
    console.log('\n' + colors.magenta + '⚠️  Inline Styles with @import or !important:' + colors.reset);
    results.inlineStyles.forEach(item => {
      console.log(`  ${formatPath(item.file)}: ${colors.magenta}${item.style}${colors.reset}`);
    });
  }
  
  if (results.filesWithIssues.length === 0) {
    console.log('\n' + colors.green + '✅ All files are using the unified design system correctly!' + colors.reset);
  } else {
    console.log('\n' + colors.red + '❌ Validation failed. Please fix the issues above.' + colors.reset);
    console.log('\nFiles with issues:');
    results.filesWithIssues.forEach(file => {
      console.log(`  - ${formatPath(file.path)} (${file.issues.length} issues)`);
    });
    
    console.log('\n' + colors.blue + 'Migration Guide:' + colors.reset);
    console.log('1. For application pages (roi-finder.html, etc), use:');
    console.log('   <link rel="stylesheet" href="styles/design-system.css">');
    console.log('   <link rel="stylesheet" href="styles/mobile-fixes.css">');
    console.log('2. For landing pages (index.html, contact.html, etc), use:');
    console.log('   <link rel="stylesheet" href="styles.css">');
    console.log('3. Remove deprecated CSS files (unified-design-system.css, property-confirmation.css, etc)');
    console.log('4. Test files can keep using Tailwind CDN and Font Awesome');
  }
}

/**
 * Main validation function
 */
function validateCSSimports() {
  console.log(colors.blue + 'Starting CSS import validation...' + colors.reset);
  
  // Find all HTML files
  const files = glob.sync(config.htmlPatterns[0], {
    ignore: config.htmlPatterns.slice(1).map(p => p.substring(1))
  });
  
  results.totalFiles = files.length;
  
  // Validate each file
  files.forEach(filePath => {
    const issues = validateHTMLFile(filePath);
    
    if (issues.length === 0) {
      results.validFiles++;
    } else {
      results.filesWithIssues.push({
        path: filePath,
        issues: issues
      });
    }
  });
  
  // Print results
  printResults();
  
  // Exit with error code if issues found
  if (results.filesWithIssues.length > 0) {
    process.exit(1);
  }
}

/**
 * Command line interface
 */
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
CSS Import Validation Script

Usage: node scripts/validate-css-imports.js [options]

Options:
  --help, -h     Show this help message
  --fix          Attempt to auto-fix issues (coming soon)
  --ci           Run in CI mode (no colors)

This script validates that all HTML files are using only the unified design system
and not importing deprecated or unauthorized CSS files.
    `);
    process.exit(0);
  }
  
  if (args.includes('--ci')) {
    // Disable colors for CI
    Object.keys(colors).forEach(key => colors[key] = '');
  }
  
  validateCSSimports();
}

module.exports = { validateCSSimports, config };