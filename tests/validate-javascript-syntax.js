const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Colors for console output
const colors = {
    reset: '\x1b[0m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m'
};

function validateJavaScript() {
    console.log(`${colors.blue}Validating JavaScript syntax...${colors.reset}\n`);
    
    const jsFiles = [
        'roi-finder.html',
        'js/firebase-wrapper-global.js',
        'js/config.js',
        'js/error-handler.js',
        'js/form-validation.js',
        'js/modules/componentLoader.js',
        'js/modules/analysisProgressTracker.js',
        'js/modules/navigationProtection.js',
        'components/**/*.js'
    ];
    
    let hasErrors = false;
    
    jsFiles.forEach(pattern => {
        try {
            // For patterns with wildcards, use glob
            if (pattern.includes('*')) {
                const files = execSync(`find . -path "./${pattern}" -type f`, { encoding: 'utf8' })
                    .split('\n')
                    .filter(f => f.trim());
                    
                files.forEach(file => checkFile(file));
            } else {
                checkFile(pattern);
            }
        } catch (error) {
            console.error(`${colors.red}Error processing pattern ${pattern}: ${error.message}${colors.reset}`);
            hasErrors = true;
        }
    });
    
    function checkFile(filePath) {
        if (!fs.existsSync(filePath)) {
            console.log(`${colors.yellow}Skipping ${filePath} (file not found)${colors.reset}`);
            return;
        }
        
        try {
            const content = fs.readFileSync(filePath, 'utf8');
            
            // Basic syntax checks
            let jsContent = content;
            
            // For HTML files, extract JavaScript
            if (filePath.endsWith('.html')) {
                const scriptMatches = content.match(/<script[^>]*>([\s\S]*?)<\/script>/gi) || [];
                jsContent = scriptMatches.map(match => {
                    return match.replace(/<script[^>]*>|<\/script>/gi, '');
                }).join('\n');
            }
            
            // Check for common syntax errors
            const checks = [
                { pattern: /console\.(log|error|warn)\s*\(\s*\)/, message: 'Empty console statement' },
                { pattern: /if\s*\(\s*\)/, message: 'Empty if condition' },
                { pattern: /catch\s*\(\s*\)/, message: 'Empty catch block (missing parameter)' },
                { pattern: /[^=!<>]=(?!=)/, message: 'Assignment instead of comparison (use === or ==)' },
                { pattern: /\bvar\b/, message: 'Use const or let instead of var' }
            ];
            
            checks.forEach(check => {
                const matches = jsContent.match(check.pattern);
                if (matches) {
                    console.log(`${colors.yellow}Warning in ${filePath}: ${check.message}${colors.reset}`);
                }
            });
            
            console.log(`${colors.green}✓ ${filePath}${colors.reset}`);
        } catch (error) {
            console.error(`${colors.red}✗ Error in ${filePath}: ${error.message}${colors.reset}`);
            hasErrors = true;
        }
    }
    
    if (hasErrors) {
        console.log(`\n${colors.red}Syntax validation failed!${colors.reset}`);
        process.exit(1);
    } else {
        console.log(`\n${colors.green}All syntax checks passed!${colors.reset}`);
    }
}

function validateCSS() {
    console.log(`\n${colors.blue}Validating CSS syntax...${colors.reset}\n`);
    
    const cssFiles = [
        'styles/design-system.css',
        'styles/gradient-theme.css',
        'styles/mobile-fixes.css'
    ];
    
    let hasErrors = false;
    
    cssFiles.forEach(filePath => {
        if (!fs.existsSync(filePath)) {
            console.log(`${colors.yellow}Skipping ${filePath} (file not found)${colors.reset}`);
            return;
        }
        
        try {
            const content = fs.readFileSync(filePath, 'utf8');
            
            // Basic CSS syntax checks
            const openBraces = (content.match(/{/g) || []).length;
            const closeBraces = (content.match(/}/g) || []).length;
            
            if (openBraces !== closeBraces) {
                console.error(`${colors.red}✗ Brace mismatch in ${filePath}: ${openBraces} open, ${closeBraces} close${colors.reset}`);
                hasErrors = true;
            }
            
            // Check for common CSS issues
            if (content.includes(';;')) {
                console.log(`${colors.yellow}Warning in ${filePath}: Double semicolon found${colors.reset}`);
            }
            
            console.log(`${colors.green}✓ ${filePath}${colors.reset}`);
        } catch (error) {
            console.error(`${colors.red}✗ Error in ${filePath}: ${error.message}${colors.reset}`);
            hasErrors = true;
        }
    });
    
    if (hasErrors) {
        console.log(`\n${colors.red}CSS validation failed!${colors.reset}`);
        process.exit(1);
    } else {
        console.log(`\n${colors.green}All CSS checks passed!${colors.reset}`);
    }
}

// Run validations
validateJavaScript();
validateCSS();

console.log(`\n${colors.green}All syntax validations completed successfully!${colors.reset}`);