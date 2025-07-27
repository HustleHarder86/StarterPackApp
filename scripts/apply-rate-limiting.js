#!/usr/bin/env node

/**
 * Script to apply rate limiting to all API endpoints
 * Adds appropriate rate limiters based on endpoint type
 */

const fs = require('fs').promises;
const path = require('path');
const glob = require('glob').promises || require('util').promisify(require('glob'));

// Map of endpoints to their appropriate rate limiter
const ENDPOINT_RATE_LIMITS = {
  // Analysis endpoints - expensive AI operations
  'analyze-property': 'apiLimits.analysis',
  'analyze-property-enhanced': 'apiLimits.analysis',
  'analyze-property-full': 'apiLimits.analysis',
  'submit-analysis': 'apiLimits.analysis',
  
  // Property operations
  'properties/ingest': 'apiLimits.properties',
  'properties/list': 'apiLimits.read',
  'properties/delete': 'apiLimits.properties',
  
  // Report generation
  'reports/generate': 'apiLimits.reports',
  'reports/client-presentation': 'apiLimits.reports',
  
  // Auth operations
  'auth/login': 'apiLimits.auth',
  'auth/verify': 'apiLimits.auth',
  
  // User management
  'user-management': 'apiLimits.properties',
  'user-management-enhanced': 'apiLimits.properties',
  
  // Read operations
  'analyses/list': 'apiLimits.read',
  'blog/posts': 'apiLimits.read',
  'monitor-usage': 'apiLimits.read',
  
  // Default for other endpoints
  'DEFAULT': 'apiLimits.read'
};

async function addRateLimitToFile(filePath) {
  try {
    let content = await fs.readFile(filePath, 'utf8');
    let modified = false;
    
    // Skip if already using rate limiting
    if (content.includes('apiLimits') || content.includes('rateLimit')) {
      console.log(`✓ ${filePath} - already has rate limiting`);
      return false;
    }
    
    // Skip test files and non-handler files
    if (!content.includes('export default') || !content.includes('function handler')) {
      return false;
    }
    
    console.log(`🔧 Adding rate limiting to ${filePath}`);
    
    // Determine the appropriate rate limiter
    const relativePath = path.relative(path.join(__dirname, '../api'), filePath);
    const endpointKey = Object.keys(ENDPOINT_RATE_LIMITS).find(key => 
      relativePath.includes(key.replace('/', path.sep))
    );
    const rateLimiter = ENDPOINT_RATE_LIMITS[endpointKey] || ENDPOINT_RATE_LIMITS.DEFAULT;
    
    // Add import if not present
    if (!content.includes('apiLimits') && !content.includes('rate-limiter')) {
      // Check if file uses ES modules or CommonJS
      const isESM = content.includes('export default') || content.includes('import ');
      
      if (isESM) {
        // Add import after other imports
        const importMatch = content.match(/(import[\s\S]*?from[\s\S]*?;[\s\n]*)+/);
        if (importMatch) {
          const lastImportEnd = importMatch.index + importMatch[0].length;
          content = content.slice(0, lastImportEnd) + 
            "import { apiLimits } from '../utils/rate-limiter.js';\n" +
            content.slice(lastImportEnd);
        } else {
          // Add at the beginning
          content = "import { apiLimits } from '../utils/rate-limiter.js';\n\n" + content;
        }
      } else {
        // CommonJS
        const requireMatch = content.match(/(const[\s\S]*?require[\s\S]*?;[\s\n]*)+/);
        if (requireMatch) {
          const lastRequireEnd = requireMatch.index + requireMatch[0].length;
          content = content.slice(0, lastRequireEnd) + 
            "const { apiLimits } = require('../utils/rate-limiter.js');\n" +
            content.slice(lastRequireEnd);
        } else {
          // Add at the beginning
          content = "const { apiLimits } = require('../utils/rate-limiter.js');\n\n" + content;
        }
      }
      modified = true;
    }
    
    // Add rate limiting after CORS and before main logic
    const handlerMatch = content.match(/export\s+default\s+(?:async\s+)?function\s+handler\s*\([^)]*\)\s*{/);
    if (handlerMatch) {
      // Find where to insert rate limiting (after CORS, before main logic)
      const handlerStart = handlerMatch.index + handlerMatch[0].length;
      const afterHandler = content.slice(handlerStart);
      
      // Look for the end of CORS/OPTIONS handling
      const optionsMatch = afterHandler.match(/if\s*\(\s*req\.method\s*===\s*['"]OPTIONS['"]\s*\)\s*{[\s\S]*?}\s*\n/);
      if (optionsMatch) {
        const insertPoint = handlerStart + optionsMatch.index + optionsMatch[0].length;
        
        // Check if there's already a method check after OPTIONS
        const afterOptions = content.slice(insertPoint);
        const methodCheckMatch = afterOptions.match(/^\s*(?:\/\/.*\n\s*)?if\s*\(\s*req\.method\s*!==\s*['"](?:POST|GET)['"]\s*\)/);
        
        if (methodCheckMatch) {
          // Insert rate limiting before method check
          const indent = methodCheckMatch[0].match(/^\s*/)[0];
          content = content.slice(0, insertPoint) +
            `${indent}// Apply rate limiting\n` +
            `${indent}await new Promise((resolve, reject) => {\n` +
            `${indent}  ${rateLimiter}(req, res, (err) => {\n` +
            `${indent}    if (err) reject(err);\n` +
            `${indent}    else resolve();\n` +
            `${indent}  });\n` +
            `${indent}});\n\n` +
            content.slice(insertPoint);
        } else {
          // Insert rate limiting after OPTIONS
          content = content.slice(0, insertPoint) +
            `\n  // Apply rate limiting\n` +
            `  await new Promise((resolve, reject) => {\n` +
            `    ${rateLimiter}(req, res, (err) => {\n` +
            `      if (err) reject(err);\n` +
            `      else resolve();\n` +
            `    });\n` +
            `  });\n` +
            content.slice(insertPoint);
        }
        modified = true;
      }
    }
    
    if (modified) {
      await fs.writeFile(filePath, content, 'utf8');
      console.log(`✅ Added ${rateLimiter} to ${filePath}`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
    return false;
  }
}

async function main() {
  console.log('🔍 Scanning for API files without rate limiting...\n');
  
  const apiFiles = await glob('api/**/*.js', {
    cwd: path.join(__dirname, '..'),
    absolute: true
  });
  
  console.log(`Found ${apiFiles.length} API files to check\n`);
  
  let addedCount = 0;
  for (const file of apiFiles) {
    if (await addRateLimitToFile(file)) {
      addedCount++;
    }
  }
  
  console.log(`\n✨ Added rate limiting to ${addedCount} files`);
  
  if (addedCount > 0) {
    console.log('\n📋 Next steps:');
    console.log('1. Review the changes to ensure imports and rate limiters are correct');
    console.log('2. Test the endpoints to ensure rate limiting works properly');
    console.log('3. Consider adjusting rate limits based on your needs');
    console.log('4. Commit the security enhancements');
  }
}

main().catch(console.error);