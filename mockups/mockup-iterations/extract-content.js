const fs = require('fs');

// Extract main content from both files
const file1 = fs.readFileSync('/home/amy/StarterPackApp/mockups/mockup-iterations/base-mockup-integrated.html', 'utf8');
const file2 = fs.readFileSync('/home/amy/StarterPackApp/mockups/mockup-iterations/base-mockup2-integrated.html', 'utf8');

// Extract content between <body> tags
const extractBodyContent = (html) => {
    const bodyStart = html.indexOf('<body>');
    const bodyEnd = html.indexOf('</body>');
    if (bodyStart === -1 || bodyEnd === -1) return '';
    return html.substring(bodyStart + 6, bodyEnd).trim();
};

// Extract CSS styles
const extractStyles = (html) => {
    const styleStart = html.indexOf('<style>');
    const styleEnd = html.indexOf('</style>');
    if (styleStart === -1 || styleEnd === -1) return '';
    return html.substring(styleStart + 7, styleEnd).trim();
};

// Extract scripts
const extractScripts = (html) => {
    const scripts = [];
    let searchFrom = 0;
    while (true) {
        const scriptStart = html.indexOf('<script', searchFrom);
        if (scriptStart === -1) break;
        const scriptEnd = html.indexOf('</script>', scriptStart);
        if (scriptEnd === -1) break;
        scripts.push(html.substring(scriptStart, scriptEnd + 9));
        searchFrom = scriptEnd + 9;
    }
    return scripts;
};

const file1Body = extractBodyContent(file1);
const file1Styles = extractStyles(file1);
const file1Scripts = extractScripts(file1);

const file2Body = extractBodyContent(file2);
const file2Styles = extractStyles(file2);
const file2Scripts = extractScripts(file2);

console.log('='.repeat(50));
console.log('FILE 1 (base-mockup-integrated.html) ANALYSIS:');
console.log('='.repeat(50));
console.log(`Body content length: ${file1Body.length} characters`);
console.log(`CSS styles length: ${file1Styles.length} characters`);
console.log(`Number of scripts: ${file1Scripts.length}`);

console.log('\n' + '='.repeat(50));
console.log('FILE 2 (base-mockup2-integrated.html) ANALYSIS:');
console.log('='.repeat(50));
console.log(`Body content length: ${file2Body.length} characters`);
console.log(`CSS styles length: ${file2Styles.length} characters`);
console.log(`Number of scripts: ${file2Scripts.length}`);

// Write extracted content to separate files for easier handling
fs.writeFileSync('/home/amy/StarterPackApp/mockups/mockup-iterations/file1-body.html', file1Body);
fs.writeFileSync('/home/amy/StarterPackApp/mockups/mockup-iterations/file1-styles.css', file1Styles);
fs.writeFileSync('/home/amy/StarterPackApp/mockups/mockup-iterations/file2-body.html', file2Body);
fs.writeFileSync('/home/amy/StarterPackApp/mockups/mockup-iterations/file2-styles.css', file2Styles);

console.log('\n✅ Extracted content saved to separate files for analysis');
console.log('  - file1-body.html (Simple view content)');
console.log('  - file1-styles.css (Simple view styles)');
console.log('  - file2-body.html (Detailed view content)');  
console.log('  - file2-styles.css (Detailed view styles)');