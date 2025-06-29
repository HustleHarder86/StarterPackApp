// Simple debugging script to check page structure
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs').promises;

async function debugPages() {
  console.log('Starting page debugging...\n');
  
  // Create reports directory
  const reportsDir = path.join(__dirname, 'debug-reports');
  await fs.mkdir(reportsDir, { recursive: true });
  
  // Check if HTML files exist
  const htmlFiles = ['roi-finder.html', 'portfolio.html', 'reports.html'];
  const projectRoot = path.join(__dirname, '..', '..');
  
  for (const file of htmlFiles) {
    const filePath = path.join(projectRoot, file);
    try {
      await fs.access(filePath);
      console.log(`✓ Found ${file}`);
      
      // Read and analyze HTML structure
      const content = await fs.readFile(filePath, 'utf8');
      
      // Extract form elements using regex
      const inputs = content.match(/<input[^>]*>/g) || [];
      const buttons = content.match(/<button[^>]*>.*?<\/button>/gs) || [];
      
      console.log(`\n${file} Analysis:`);
      console.log(`- Inputs found: ${inputs.length}`);
      console.log(`- Buttons found: ${buttons.length}`);
      
      // Look for specific IDs our tests expect
      const expectedIds = ['propertyAddress', 'analyze-btn', 'results-container'];
      expectedIds.forEach(id => {
        const found = content.includes(`id="${id}"`) || content.includes(`id='${id}'`);
        console.log(`- Element with id="${id}": ${found ? '✓ Found' : '✗ Not found'}`);
      });
      
      // Extract actual IDs
      const idMatches = content.match(/id=["']([^"']+)["']/g) || [];
      const ids = idMatches.map(match => match.replace(/id=["']|["']/g, ''));
      
      console.log('\nActual IDs found:');
      ids.forEach(id => console.log(`  - ${id}`));
      
      // Save analysis
      const analysis = {
        file,
        inputs: inputs.map(input => {
          const id = input.match(/id=["']([^"']+)["']/)?.[1];
          const name = input.match(/name=["']([^"']+)["']/)?.[1];
          const type = input.match(/type=["']([^"']+)["']/)?.[1];
          const placeholder = input.match(/placeholder=["']([^"']+)["']/)?.[1];
          return { id, name, type, placeholder };
        }),
        buttons: buttons.map(button => {
          const id = button.match(/id=["']([^"']+)["']/)?.[1];
          const text = button.match(/>([^<]+)</)?.[1]?.trim();
          return { id, text };
        }),
        allIds: ids
      };
      
      await fs.writeFile(
        path.join(reportsDir, `${file}-analysis.json`),
        JSON.stringify(analysis, null, 2)
      );
      
    } catch (error) {
      console.log(`✗ Error with ${file}: ${error.message}`);
    }
  }
  
  // Now let's check for React components
  console.log('\n\nChecking React Components:');
  
  const componentFiles = await fs.readdir(path.join(projectRoot, 'components'));
  console.log('Component files found:', componentFiles);
  
  // Check if components are being loaded in HTML
  for (const file of htmlFiles) {
    const filePath = path.join(projectRoot, file);
    try {
      const content = await fs.readFile(filePath, 'utf8');
      
      console.log(`\n${file} React usage:`);
      const hasReactRoot = content.includes('id="root"') || content.includes("id='root'");
      const hasReactScript = content.includes('react.production.min.js');
      const hasComponentScript = content.includes('<script type="text/babel"');
      
      console.log(`- React root element: ${hasReactRoot ? '✓' : '✗'}`);
      console.log(`- React library loaded: ${hasReactScript ? '✓' : '✗'}`);
      console.log(`- Babel components: ${hasComponentScript ? '✓' : '✗'}`);
      
    } catch (error) {
      console.log(`Error reading ${file}: ${error.message}`);
    }
  }
}

// Run the debug script
debugPages().then(() => {
  console.log('\n✓ Debugging complete! Check tests/e2e/debug-reports/ for detailed analysis.');
}).catch(console.error);