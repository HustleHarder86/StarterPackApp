const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');

async function simpleSidebarTest() {
  console.log('🚀 Starting simple sidebar test...');
  
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
    args: ['--start-maximized', '--disable-dev-shm-usage', '--no-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1366, height: 768 });

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
  const screenshotDir = path.join(__dirname, `simple-test-${timestamp}`);
  await fs.mkdir(screenshotDir, { recursive: true });

  try {
    console.log('🌐 Opening http://localhost:3000/roi-finder.html...');
    
    // Use a more lenient approach
    await page.goto('http://localhost:3000/roi-finder.html', { 
      waitUntil: 'domcontentloaded',
      timeout: 30000
    });

    // Wait for page to settle
    console.log('⏳ Waiting for page to load...');
    await new Promise(resolve => setTimeout(resolve, 8000));

    // Check if page loaded
    const url = await page.url();
    const title = await page.title();
    console.log(`📄 Page loaded: ${title} at ${url}`);

    // Take screenshots immediately
    console.log('📸 Taking screenshots...');
    
    await page.screenshot({ 
      path: path.join(screenshotDir, '01-initial-load.png'),
      fullPage: false
    });
    
    await page.screenshot({ 
      path: path.join(screenshotDir, '02-full-page.png'),
      fullPage: true 
    });

    // Quick sidebar check
    const sidebarCheck = await page.evaluate(() => {
      const sidebar = document.querySelector('#app-sidebar') || 
                     document.querySelector('.app-sidebar') || 
                     document.querySelector('aside');
      
      if (!sidebar) return { found: false };

      const rect = sidebar.getBoundingClientRect();
      const style = window.getComputedStyle(sidebar);
      
      // Get all navigation items
      const navItems = Array.from(sidebar.querySelectorAll('.nav-item, .nav-link, a, button'))
        .filter(item => item.textContent && item.textContent.trim())
        .map(item => {
          const itemRect = item.getBoundingClientRect();
          return {
            text: item.textContent.trim(),
            visible: itemRect.top >= 0 && itemRect.bottom <= window.innerHeight,
            position: {
              top: itemRect.top,
              bottom: itemRect.bottom,
              height: itemRect.height
            },
            className: item.className
          };
        });

      // Check for specific sections
      const sections = ['Main', 'Analysis', 'Settings'];
      const sectionsFound = sections.map(section => {
        const found = sidebar.textContent.includes(section);
        return { section, found };
      });

      return {
        found: true,
        position: { top: rect.top, left: rect.left, width: rect.width, height: rect.height },
        styles: { display: style.display, position: style.position },
        navItems: navItems,
        sectionsFound: sectionsFound,
        viewportHeight: window.innerHeight,
        sidebarScrollable: sidebar.scrollHeight > sidebar.clientHeight
      };
    });

    console.log('🔍 Sidebar Analysis:');
    if (sidebarCheck.found) {
      console.log(`✅ Sidebar found at position: ${sidebarCheck.position.left}x${sidebarCheck.position.top}`);
      console.log(`📐 Sidebar size: ${sidebarCheck.position.width}x${sidebarCheck.position.height}`);
      console.log(`📱 Viewport height: ${sidebarCheck.viewportHeight}`);
      console.log(`📜 Sidebar scrollable: ${sidebarCheck.sidebarScrollable}`);
      console.log();

      console.log('📋 Sections found:');
      sidebarCheck.sectionsFound.forEach(s => {
        console.log(`  ${s.found ? '✅' : '❌'} ${s.section}`);
      });
      console.log();

      console.log('🧭 Navigation items:');
      sidebarCheck.navItems.forEach((item, i) => {
        const status = item.visible ? '✅ VISIBLE' : '❌ CUT OFF';
        console.log(`${i + 1}. ${status} "${item.text}"`);
        console.log(`   Position: top=${item.position.top}, bottom=${item.position.bottom}, height=${item.position.height}`);
        if (item.className) console.log(`   Class: ${item.className}`);
        console.log();
      });

      // Summary
      const allVisible = sidebarCheck.navItems.every(item => item.visible);
      const hasSettings = sidebarCheck.navItems.some(item => 
        item.text.toLowerCase().includes('settings') || 
        item.text.toLowerCase().includes('preferences')
      );

      console.log('🎯 COMPACT SIDEBAR TEST RESULTS:');
      console.log('='.repeat(50));
      console.log(`✅ Sidebar found: YES`);
      console.log(`✅ All nav items visible: ${allVisible ? 'YES' : 'NO'}`);
      console.log(`✅ Settings section visible: ${hasSettings ? 'YES' : 'NO'}`);
      console.log(`✅ Fits in viewport: ${!sidebarCheck.sidebarScrollable ? 'YES' : 'NO'}`);
      console.log(`📊 Total navigation items: ${sidebarCheck.navItems.length}`);
      console.log(`📁 Screenshots saved to: ${screenshotDir}`);
      console.log('='.repeat(50));

      // Check specific compact sizing
      const sizingCheck = await page.evaluate(() => {
        const sidebar = document.querySelector('#app-sidebar') || document.querySelector('.app-sidebar');
        if (!sidebar) return null;

        const iconElements = sidebar.querySelectorAll('.nav-icon, [class*="icon"]');
        const navItemElements = sidebar.querySelectorAll('.nav-item');
        
        const iconSizes = Array.from(iconElements).map(icon => {
          const rect = icon.getBoundingClientRect();
          const style = window.getComputedStyle(icon);
          return {
            actualSize: `${Math.round(rect.width)}x${Math.round(rect.height)}`,
            cssSize: `${style.width} x ${style.height}`,
            fontSize: style.fontSize
          };
        });

        const navPadding = Array.from(navItemElements).map(item => {
          const style = window.getComputedStyle(item);
          return {
            padding: style.padding,
            fontSize: style.fontSize,
            height: item.getBoundingClientRect().height
          };
        });

        return { iconSizes, navPadding };
      });

      if (sizingCheck) {
        console.log('📏 SIZING ANALYSIS:');
        console.log('Icon sizes (should be ~32px):');
        sizingCheck.iconSizes.forEach((icon, i) => {
          console.log(`  ${i + 1}. ${icon.actualSize} (CSS: ${icon.cssSize}, Font: ${icon.fontSize})`);
        });
        
        console.log('Nav item padding:');
        sizingCheck.navPadding.slice(0, 3).forEach((item, i) => {
          console.log(`  ${i + 1}. Padding: ${item.padding}, Font: ${item.fontSize}, Height: ${Math.round(item.height)}px`);
        });
      }

    } else {
      console.log('❌ No sidebar found');
    }

    // Save report
    const report = {
      timestamp: new Date().toISOString(),
      url: url,
      title: title,
      sidebarCheck: sidebarCheck,
      sizingCheck: sizingCheck || null,
      screenshotDir: screenshotDir
    };

    await fs.writeFile(
      path.join(screenshotDir, 'report.json'),
      JSON.stringify(report, null, 2)
    );

  } catch (error) {
    console.error('❌ Error:', error);
    try {
      await page.screenshot({ path: path.join(screenshotDir, 'error.png') });
    } catch (e) {}
  } finally {
    await browser.close();
    console.log('🏁 Test completed');
  }
}

simpleSidebarTest().catch(console.error);