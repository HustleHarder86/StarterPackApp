const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');

async function directROIFinderTest() {
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
    args: ['--start-maximized']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1366, height: 768 });

  try {
    console.log('🚀 Testing ROI Finder directly...');
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const screenshotDir = path.join(__dirname, `direct-roi-test-${timestamp}`);
    await fs.mkdir(screenshotDir, { recursive: true });
    console.log(`📁 Screenshots: ${screenshotDir}`);

    // Navigate directly to roi-finder.html
    console.log('🌐 Navigating to http://localhost:3000/roi-finder.html...');
    await page.goto('http://localhost:3000/roi-finder.html', { 
      waitUntil: 'domcontentloaded',
      timeout: 10000
    });
    
    // Wait for components to load
    await new Promise(resolve => setTimeout(resolve, 5000));

    console.log('📄 Current URL:', await page.url());

    // Take full page screenshot
    await page.screenshot({ 
      path: path.join(screenshotDir, '01-full-page.png'),
      fullPage: true 
    });
    console.log('📸 Full page screenshot captured');

    // Take viewport screenshot
    await page.screenshot({ 
      path: path.join(screenshotDir, '02-viewport.png')
    });
    console.log('📸 Viewport screenshot captured');

    // Comprehensive sidebar search
    const sidebarAnalysis = await page.evaluate(() => {
      console.log('Starting sidebar analysis...');
      
      // Multiple strategies to find sidebar
      const strategies = {
        byId: document.querySelector('#sidebar'),
        byClass: document.querySelector('.sidebar'),
        byClassContains: document.querySelector('[class*="sidebar"]'),
        byNav: document.querySelector('nav:not(.nav-bar)'),
        byLeftPanel: document.querySelector('.left-panel, .side-panel'),
        byNavigation: document.querySelector('.navigation')
      };

      const found = {};
      Object.keys(strategies).forEach(key => {
        const element = strategies[key];
        if (element) {
          const rect = element.getBoundingClientRect();
          const style = window.getComputedStyle(element);
          found[key] = {
            tagName: element.tagName,
            id: element.id,
            className: element.className,
            position: {
              top: rect.top,
              left: rect.left,
              width: rect.width,
              height: rect.height,
              bottom: rect.bottom
            },
            styles: {
              display: style.display,
              position: style.position,
              overflow: style.overflow
            },
            childrenCount: element.children.length,
            innerHTML: element.innerHTML.substring(0, 500)
          };
        }
      });

      // Look for all elements that might contain navigation
      const allNavElements = Array.from(document.querySelectorAll('*')).filter(el => {
        const text = el.textContent || '';
        const hasNavText = ['ROI Finder', 'Portfolio', 'Analysis', 'Settings', 'Logout'].some(term => 
          text.includes(term)
        );
        const hasNavClasses = el.className && (
          el.className.includes('nav') || 
          el.className.includes('sidebar') ||
          el.className.includes('menu')
        );
        return (hasNavText || hasNavClasses) && el.offsetParent !== null;
      }).map(el => {
        const rect = el.getBoundingClientRect();
        return {
          tagName: el.tagName,
          id: el.id,
          className: el.className,
          textContent: el.textContent.trim().substring(0, 100),
          position: {
            top: rect.top,
            left: rect.left,
            width: rect.width,
            height: rect.height,
            bottom: rect.bottom
          }
        };
      });

      return {
        strategies: found,
        allNavElements: allNavElements,
        bodyClasses: document.body.className,
        documentTitle: document.title,
        windowDimensions: {
          innerWidth: window.innerWidth,
          innerHeight: window.innerHeight
        }
      };
    });

    console.log('📊 Sidebar Analysis Results:');
    console.log('Document title:', sidebarAnalysis.documentTitle);
    console.log('Body classes:', sidebarAnalysis.bodyClasses);
    console.log('Window dimensions:', sidebarAnalysis.windowDimensions);
    console.log();

    console.log('🔍 Sidebar Search Strategies:');
    Object.keys(sidebarAnalysis.strategies).forEach(strategy => {
      const result = sidebarAnalysis.strategies[strategy];
      if (result) {
        console.log(`✅ ${strategy}: ${result.tagName}#${result.id}.${result.className}`);
        console.log(`   Position: ${result.position.left}x${result.position.top}, Size: ${result.position.width}x${result.position.height}`);
        console.log(`   Display: ${result.styles.display}, Children: ${result.childrenCount}`);
        console.log();
      } else {
        console.log(`❌ ${strategy}: Not found`);
      }
    });

    console.log('🧭 All Navigation Elements Found:');
    sidebarAnalysis.allNavElements.forEach((el, i) => {
      console.log(`${i + 1}. ${el.tagName}#${el.id}.${el.className}`);
      console.log(`   Position: ${el.position.left}x${el.position.top}, Size: ${el.position.width}x${el.position.height}`);
      console.log(`   Text: "${el.textContent}"`);
      console.log();
    });

    // If we found a sidebar, do detailed analysis
    const mainSidebar = sidebarAnalysis.strategies.byId || 
                       sidebarAnalysis.strategies.byClass || 
                       sidebarAnalysis.strategies.byClassContains;

    if (mainSidebar) {
      console.log('🎯 Found main sidebar! Analyzing sections...');
      
      const sectionAnalysis = await page.evaluate(() => {
        const sidebar = document.querySelector('#sidebar') || 
                       document.querySelector('.sidebar') || 
                       document.querySelector('[class*="sidebar"]');
        
        if (!sidebar) return null;

        const sections = [];
        
        // Look for section headers or groupings
        const sectionElements = sidebar.querySelectorAll('[data-section], .section, .nav-section');
        
        if (sectionElements.length === 0) {
          // Fallback: look for common navigation items
          const navItems = sidebar.querySelectorAll('a, button');
          navItems.forEach(item => {
            const rect = item.getBoundingClientRect();
            sections.push({
              type: 'nav-item',
              text: item.textContent?.trim(),
              position: {
                top: rect.top,
                bottom: rect.bottom,
                left: rect.left,
                right: rect.right,
                width: rect.width,
                height: rect.height
              },
              visible: rect.top >= 0 && rect.bottom <= window.innerHeight,
              element: `${item.tagName}.${item.className}`
            });
          });
        } else {
          sectionElements.forEach(section => {
            const rect = section.getBoundingClientRect();
            sections.push({
              type: 'section',
              name: section.getAttribute('data-section') || section.className,
              text: section.textContent?.trim().substring(0, 100),
              position: {
                top: rect.top,
                bottom: rect.bottom,
                left: rect.left,
                right: rect.right,
                width: rect.width,
                height: rect.height
              },
              visible: rect.top >= 0 && rect.bottom <= window.innerHeight,
              element: `${section.tagName}.${section.className}`
            });
          });
        }

        // Check for size indicators
        const sizeInfo = {
          iconBoxes: Array.from(sidebar.querySelectorAll('[class*="icon"]')).map(icon => {
            const rect = icon.getBoundingClientRect();
            const style = window.getComputedStyle(icon);
            return {
              size: `${rect.width}x${rect.height}`,
              cssSize: `${style.width} x ${style.height}`
            };
          }),
          fontSizes: Array.from(sidebar.querySelectorAll('a, button, span')).slice(0, 5).map(el => {
            const style = window.getComputedStyle(el);
            return {
              fontSize: style.fontSize,
              text: el.textContent?.trim().substring(0, 20)
            };
          })
        };

        return {
          sections: sections,
          sizeInfo: sizeInfo,
          sidebarRect: {
            top: sidebar.getBoundingClientRect().top,
            bottom: sidebar.getBoundingClientRect().bottom,
            height: sidebar.getBoundingClientRect().height,
            scrollHeight: sidebar.scrollHeight,
            clientHeight: sidebar.clientHeight
          }
        };
      });

      if (sectionAnalysis) {
        console.log('📋 Section Analysis:');
        console.log(`Sidebar height: ${sectionAnalysis.sidebarRect.height}px (scroll: ${sectionAnalysis.sidebarRect.scrollHeight}px)`);
        console.log(`Sidebar position: top=${sectionAnalysis.sidebarRect.top}, bottom=${sectionAnalysis.sidebarRect.bottom}`);
        console.log();

        sectionAnalysis.sections.forEach((section, i) => {
          const status = section.visible ? '✅ VISIBLE' : '❌ CUT OFF';
          console.log(`${i + 1}. ${status} ${section.type.toUpperCase()}: ${section.name || 'unnamed'}`);
          console.log(`   Text: "${section.text}"`);
          console.log(`   Position: top=${section.position.top}, bottom=${section.position.bottom}`);
          console.log(`   Element: ${section.element}`);
          console.log();
        });

        console.log('📏 Size Information:');
        console.log('Icon sizes:', sectionAnalysis.sizeInfo.iconBoxes);
        console.log('Font sizes:', sectionAnalysis.sizeInfo.fontSizes);

        // Final verdict
        const allVisible = sectionAnalysis.sections.every(section => section.visible);
        const settingsVisible = sectionAnalysis.sections.some(section => 
          section.text && (section.text.toLowerCase().includes('settings') || section.text.toLowerCase().includes('preferences'))
        );

        console.log('\n🎯 FINAL VERDICT:');
        console.log('='.repeat(50));
        console.log(`✅ All sections visible: ${allVisible}`);
        console.log(`✅ Settings section visible: ${settingsVisible}`);
        console.log(`📊 Total sections found: ${sectionAnalysis.sections.length}`);
        console.log(`📐 Sidebar fits in viewport: ${sectionAnalysis.sidebarRect.height <= sidebarAnalysis.sidebarRect.clientHeight}`);
        console.log('='.repeat(50));
      }
    } else {
      console.log('❌ No sidebar found using any strategy');
    }

    // Save comprehensive report
    const report = {
      timestamp: new Date().toISOString(),
      url: await page.url(),
      sidebarAnalysis: sidebarAnalysis,
      sectionAnalysis: mainSidebar ? sectionAnalysis : null,
      screenshotDir: screenshotDir
    };

    await fs.writeFile(
      path.join(screenshotDir, 'comprehensive-report.json'),
      JSON.stringify(report, null, 2)
    );

  } catch (error) {
    console.error('❌ Error during testing:', error);
    // Take error screenshot
    try {
      await page.screenshot({ 
        path: path.join(__dirname, `error-screenshot-${Date.now()}.png`)
      });
    } catch (e) {
      console.error('Failed to take error screenshot:', e);
    }
  } finally {
    await browser.close();
    console.log('🏁 Testing completed');
  }
}

directROIFinderTest().catch(console.error);