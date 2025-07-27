const puppeteer = require('puppeteer');

async function inspectForm() {
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    
    const url = 'https://starter-pack-cpl95dq4b-hustleharder86s-projects.vercel.app/roi-finder.html?e2e_test_mode=true';
    
    console.log('📍 Navigating to:', url);
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
    
    // Get all input fields
    const inputs = await page.evaluate(() => {
      const inputs = document.querySelectorAll('input');
      return Array.from(inputs).map(input => ({
        id: input.id,
        name: input.name,
        placeholder: input.placeholder,
        type: input.type,
        value: input.value,
        className: input.className
      }));
    });
    
    console.log('\n📝 Input fields found:');
    inputs.forEach(input => {
      console.log(`- ${input.id || input.name || 'unnamed'}: placeholder="${input.placeholder}", value="${input.value}"`);
    });
    
    // Get all select fields
    const selects = await page.evaluate(() => {
      const selects = document.querySelectorAll('select');
      return Array.from(selects).map(select => ({
        id: select.id,
        name: select.name,
        className: select.className,
        options: Array.from(select.options).map(opt => opt.text)
      }));
    });
    
    console.log('\n📋 Select fields found:');
    selects.forEach(select => {
      console.log(`- ${select.id || select.name || 'unnamed'}: ${select.options.join(', ')}`);
    });
    
    // Get all buttons
    const buttons = await page.evaluate(() => {
      const buttons = document.querySelectorAll('button');
      return Array.from(buttons).map(button => ({
        text: button.textContent.trim(),
        type: button.type,
        className: button.className
      }));
    });
    
    console.log('\n🔘 Buttons found:');
    buttons.forEach(button => {
      console.log(`- "${button.text}" (type: ${button.type})`);
    });

  } catch (error) {
    console.error('❌ Inspection failed:', error);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

inspectForm();