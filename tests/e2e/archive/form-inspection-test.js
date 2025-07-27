const puppeteer = require('puppeteer');
const path = require('path');

async function inspectForm() {
    console.log('🔍 Starting Form Inspection Test');
    
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    try {
        const page = await browser.newPage();
        await page.setViewport({ width: 1920, height: 1080 });
        
        // Navigate to the app with E2E test mode
        console.log('\n📍 Navigating to app with E2E test mode...');
        await page.goto('https://starter-pack-app.vercel.app/roi-finder.html?e2e_test_mode=true', {
            waitUntil: 'networkidle2',
            timeout: 30000
        });
        
        // Wait a bit for any dynamic content
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Check if form is visible
        const formVisible = await page.$('#property-analysis-form') !== null;
        console.log(`\n✅ Form visible: ${formVisible}`);
        
        if (formVisible) {
            // Get all input fields
            console.log('\n📝 Inspecting form inputs:');
            
            const inputs = await page.evaluate(() => {
                const allInputs = document.querySelectorAll('#property-analysis-form input, #property-analysis-form select, #property-analysis-form textarea');
                return Array.from(allInputs).map(input => ({
                    type: input.tagName.toLowerCase(),
                    inputType: input.type || 'N/A',
                    name: input.name || 'N/A',
                    id: input.id || 'N/A',
                    placeholder: input.placeholder || 'N/A',
                    value: input.value || 'N/A',
                    className: input.className || 'N/A',
                    required: input.required || false,
                    visible: input.offsetParent !== null
                }));
            });
            
            console.log('\nFound inputs:');
            inputs.forEach((input, index) => {
                console.log(`\n${index + 1}. ${input.type.toUpperCase()}`);
                console.log(`   Type: ${input.inputType}`);
                console.log(`   Name: ${input.name}`);
                console.log(`   ID: ${input.id}`);
                console.log(`   Placeholder: ${input.placeholder}`);
                console.log(`   Value: ${input.value}`);
                console.log(`   Classes: ${input.className}`);
                console.log(`   Required: ${input.required}`);
                console.log(`   Visible: ${input.visible}`);
            });
            
            // Get all buttons
            console.log('\n\n📝 Inspecting buttons:');
            const buttons = await page.evaluate(() => {
                const allButtons = document.querySelectorAll('#property-analysis-form button, #property-analysis-form input[type="submit"]');
                return Array.from(allButtons).map(button => ({
                    type: button.tagName.toLowerCase(),
                    text: button.textContent.trim(),
                    onclick: button.onclick ? 'Has onclick' : 'No onclick',
                    id: button.id || 'N/A',
                    className: button.className || 'N/A',
                    visible: button.offsetParent !== null
                }));
            });
            
            console.log('\nFound buttons:');
            buttons.forEach((button, index) => {
                console.log(`\n${index + 1}. ${button.type.toUpperCase()}`);
                console.log(`   Text: ${button.text}`);
                console.log(`   ID: ${button.id}`);
                console.log(`   Classes: ${button.className}`);
                console.log(`   Visible: ${button.visible}`);
            });
            
            // Check for expandable sections
            console.log('\n\n📝 Looking for expandable sections:');
            const expandables = await page.evaluate(() => {
                // Look for elements that might expand/collapse
                const possibleExpanders = document.querySelectorAll('button, a, div[onclick], span[onclick]');
                return Array.from(possibleExpanders)
                    .filter(el => el.textContent.toLowerCase().includes('more') || 
                                 el.textContent.toLowerCase().includes('details') ||
                                 el.textContent.toLowerCase().includes('optional'))
                    .map(el => ({
                        tag: el.tagName.toLowerCase(),
                        text: el.textContent.trim(),
                        id: el.id || 'N/A',
                        className: el.className || 'N/A'
                    }));
            });
            
            if (expandables.length > 0) {
                console.log('\nFound expandable elements:');
                expandables.forEach((el, index) => {
                    console.log(`${index + 1}. ${el.tag}: ${el.text} (id: ${el.id}, class: ${el.className})`);
                });
            } else {
                console.log('No expandable sections found');
            }
            
        } else {
            console.log('❌ Form not found!');
            
            // Check what's on the page
            const pageContent = await page.evaluate(() => {
                return {
                    title: document.title,
                    bodyText: document.body.textContent.substring(0, 500),
                    visibleSections: Array.from(document.querySelectorAll('section, div[id], main'))
                        .filter(el => el.offsetParent !== null)
                        .map(el => ({
                            tag: el.tagName.toLowerCase(),
                            id: el.id || 'N/A',
                            className: el.className || 'N/A'
                        }))
                };
            });
            
            console.log('\nPage content:');
            console.log('Title:', pageContent.title);
            console.log('Body preview:', pageContent.bodyText);
            console.log('\nVisible sections:');
            pageContent.visibleSections.forEach(section => {
                console.log(`- ${section.tag} (id: ${section.id}, class: ${section.className})`);
            });
        }
        
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await browser.close();
    }
}

// Run the inspection
inspectForm().catch(console.error);