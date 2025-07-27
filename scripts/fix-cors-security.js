#!/usr/bin/env node

/**
 * Script to fix CORS security issues across all API endpoints
 * Replaces wildcard CORS with proper cors-config utility
 */

const fs = require('fs').promises;
const path = require('path');
const glob = require('glob').promises || require('util').promisify(require('glob'));

async function fixCorsInFile(filePath) {
  try {
    let content = await fs.readFile(filePath, 'utf8');
    let modified = false;
    
    // Skip if already using applyCorsHeaders
    if (content.includes('applyCorsHeaders')) {
      console.log(`✓ ${filePath} - already using applyCorsHeaders`);
      return false;
    }
    
    // Check if file has wildcard CORS
    if (!content.includes("'Access-Control-Allow-Origin', '*'") && 
        !content.includes('"Access-Control-Allow-Origin", "*"') &&
        !content.includes('Access-Control-Allow-Origin\', \'*') &&
        !content.includes('Access-Control-Allow-Origin", "*')) {
      return false;
    }
    
    console.log(`🔧 Fixing ${filePath}`);
    
    // Add import if not present
    if (!content.includes('applyCorsHeaders')) {
      // Check if file uses ES modules or CommonJS
      const isESM = content.includes('export default') || content.includes('import ');
      
      if (isESM) {
        // Add import after other imports
        const importMatch = content.match(/(import[\s\S]*?from[\s\S]*?;[\s\n]*)+/);
        if (importMatch) {
          const lastImportEnd = importMatch.index + importMatch[0].length;
          content = content.slice(0, lastImportEnd) + 
            "import { applyCorsHeaders } from '../../utils/cors-config.js';\n" +
            content.slice(lastImportEnd);
        } else {
          // Add at the beginning
          content = "import { applyCorsHeaders } from '../../utils/cors-config.js';\n\n" + content;
        }
      } else {
        // CommonJS
        const requireMatch = content.match(/(const[\s\S]*?require[\s\S]*?;[\s\n]*)+/);
        if (requireMatch) {
          const lastRequireEnd = requireMatch.index + requireMatch[0].length;
          content = content.slice(0, lastRequireEnd) + 
            "const { applyCorsHeaders } = require('../../utils/cors-config.js');\n" +
            content.slice(lastRequireEnd);
        } else {
          // Add at the beginning
          content = "const { applyCorsHeaders } = require('../../utils/cors-config.js');\n\n" + content;
        }
      }
      modified = true;
    }
    
    // Replace manual CORS headers with applyCorsHeaders
    const corsPatterns = [
      // Pattern 1: Multiple setHeader calls
      /\/\/ Set CORS headers[\s\S]*?res\.setHeader\(['"](Access-Control-Allow-Headers|X-CSRF-Token)[\s\S]*?\);/g,
      // Pattern 2: Individual CORS headers
      /res\.setHeader\(['"]Access-Control-Allow-Origin['"],\s*['"]\*['"]\);[\s\n]*/g,
      /res\.setHeader\(['"]Access-Control-Allow-Credentials['"],\s*true\);[\s\n]*/g,
      /res\.setHeader\(['"]Access-Control-Allow-Methods['"],\s*['"][^'"]+['"]\);[\s\n]*/g,
      /res\.setHeader\(['"]Access-Control-Allow-Headers['"],[\s\S]*?\);[\s\n]*/g,
    ];
    
    // Find where CORS headers are being set
    const handlerMatch = content.match(/(?:export\s+default\s+)?(?:async\s+)?function\s+handler\s*\([^)]*\)\s*{/);
    if (handlerMatch) {
      // Find the first CORS setHeader after handler declaration
      const handlerStart = handlerMatch.index + handlerMatch[0].length;
      const afterHandler = content.slice(handlerStart);
      
      // Look for CORS header section
      const corsMatch = afterHandler.match(/\n(\s*)(?:\/\/.*CORS.*\n\s*)?res\.setHeader\(['"]Access-Control/);
      if (corsMatch) {
        const indent = corsMatch[1] || '  ';
        const corsStart = handlerStart + corsMatch.index;
        
        // Find the end of CORS headers section (before OPTIONS check usually)
        let corsEnd = corsStart;
        const lines = content.slice(corsStart).split('\n');
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          if (line.includes('Access-Control') || line.includes('X-CSRF-Token') || 
              (i === 0) || line.trim() === '' || line.trim() === ');') {
            corsEnd = corsStart + lines.slice(0, i + 1).join('\n').length + 1;
          } else {
            break;
          }
        }
        
        // Replace the CORS section
        content = content.slice(0, corsStart) + 
          `\n${indent}// Apply proper CORS headers\n${indent}applyCorsHeaders(req, res);\n` +
          content.slice(corsEnd);
        modified = true;
      }
    }
    
    // Clean up any remaining CORS headers
    corsPatterns.forEach(pattern => {
      if (content.match(pattern)) {
        content = content.replace(pattern, '');
        modified = true;
      }
    });
    
    // Clean up extra newlines
    content = content.replace(/\n{3,}/g, '\n\n');
    
    if (modified) {
      await fs.writeFile(filePath, content, 'utf8');
      console.log(`✅ Fixed ${filePath}`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
    return false;
  }
}

async function main() {
  console.log('🔍 Scanning for API files with wildcard CORS...\n');
  
  const apiFiles = await glob('api/**/*.js', {
    cwd: path.join(__dirname, '..'),
    absolute: true
  });
  
  console.log(`Found ${apiFiles.length} API files to check\n`);
  
  let fixedCount = 0;
  for (const file of apiFiles) {
    if (await fixCorsInFile(file)) {
      fixedCount++;
    }
  }
  
  console.log(`\n✨ Fixed ${fixedCount} files with CORS security issues`);
  
  if (fixedCount > 0) {
    console.log('\n📋 Next steps:');
    console.log('1. Review the changes to ensure imports are correct');
    console.log('2. Test the endpoints to ensure CORS still works');
    console.log('3. Commit the security fixes');
  }
}

main().catch(console.error);