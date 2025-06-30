const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');

class AppDebugger {
  constructor() {
    this.browser = null;
    this.page = null;
    this.results = [];
    this.screenshotDir = path.join(__dirname, 'debug-screenshots');
  }

  async init() {
    // Create screenshots directory
    await fs.mkdir(this.screenshotDir, { recursive: true });
    
    // Launch browser
    console.log('Launching browser...');
    this.browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    this.page = await this.browser.newPage();
    await this.page.setViewport({ width: 1280, height: 800 });
  }

  async screenshot(name) {
    const filepath = path.join(this.screenshotDir, `${name}.png`);
    await this.page.screenshot({ path: filepath, fullPage: true });
    console.log(`  📸 Screenshot saved: ${name}.png`);
  }

  async testPage(url, name) {
    console.log(`\n🔍 Testing ${name}...`);
    const result = { name, url, issues: [], info: [] };
    
    try {
      const response = await this.page.goto(url, { 
        waitUntil: 'networkidle2',
        timeout: 30000 
      });
      
      result.status = response.status();
      result.info.push(`HTTP Status: ${response.status()}`);
      
      if (response.status() !== 200) {
        result.issues.push(`Non-200 status code: ${response.status()}`);
      }
      
      // Wait a bit for any dynamic content
      await this.page.waitForTimeout(2000);
      
      // Check for console errors
      const consoleErrors = [];
      this.page.on('console', msg => {
        if (msg.type() === 'error') {
          consoleErrors.push(msg.text());
        }
      });
      
      // Check page title
      const title = await this.page.title();
      result.info.push(`Page title: ${title}`);
      
      // Check for common error indicators
      const pageContent = await this.page.content();
      if (pageContent.includes('Error:') || pageContent.includes('error:')) {
        const errorText = await this.page.evaluate(() => {
          const errorElements = document.querySelectorAll('*');
          const errors = [];
          errorElements.forEach(el => {
            if (el.textContent && el.textContent.includes('Error:')) {
              errors.push(el.textContent.trim());
            }
          });
          return errors.slice(0, 5); // First 5 errors
        });
        if (errorText.length > 0) {
          result.issues.push(`Error text found: ${errorText.join(', ')}`);
        }
      }
      
      // Take screenshot
      await this.screenshot(`${name.replace(/\s+/g, '-').toLowerCase()}`);
      
      // Page-specific checks
      if (name === 'Homepage') {
        const navLinks = await this.page.$$eval('.nav-links a', links => links.length);
        result.info.push(`Navigation links: ${navLinks}`);
        
        const blogLink = await this.page.$('a[href*="blog"]');
        if (!blogLink) {
          result.issues.push('Blog link not found in navigation');
        }
      }
      
      if (name === 'Blog') {
        const posts = await this.page.$$eval('.blog-card', cards => cards.length);
        result.info.push(`Blog posts displayed: ${posts}`);
        
        if (posts === 0) {
          const noResults = await this.page.$('#no-results');
          if (noResults) {
            result.issues.push('No blog posts found');
          }
        }
      }
      
      if (consoleErrors.length > 0) {
        result.issues.push(`Console errors: ${consoleErrors.join(', ')}`);
      }
      
    } catch (error) {
      result.issues.push(`Page load error: ${error.message}`);
      result.error = error.message;
    }
    
    this.results.push(result);
    return result;
  }

  async testAPI(url, name) {
    console.log(`\n🔌 Testing API: ${name}...`);
    const result = { name, url, issues: [], info: [], type: 'api' };
    
    try {
      const response = await this.page.evaluate(async (url) => {
        const res = await fetch(url);
        const data = await res.json();
        return {
          status: res.status,
          ok: res.ok,
          data: data
        };
      }, url);
      
      result.status = response.status;
      result.info.push(`HTTP Status: ${response.status}`);
      result.data = response.data;
      
      if (!response.ok) {
        result.issues.push(`API returned error status: ${response.status}`);
      }
      
      // Check specific API responses
      if (name === 'Config API' && response.data) {
        if (!response.data.firebase) {
          result.issues.push('Firebase config missing');
        }
      }
      
    } catch (error) {
      result.issues.push(`API error: ${error.message}`);
      result.error = error.message;
    }
    
    this.results.push(result);
    return result;
  }

  async runAllTests() {
    await this.init();
    
    console.log('🚀 Starting comprehensive app debug...\n');
    
    // Test main pages
    await this.testPage('https://starter-pack-app.vercel.app/', 'Homepage');
    await this.testPage('https://starter-pack-app.vercel.app/blog.html', 'Blog');
    await this.testPage('https://starter-pack-app.vercel.app/roi-finder.html', 'ROI Finder');
    await this.testPage('https://starter-pack-app.vercel.app/portfolio.html', 'Portfolio');
    await this.testPage('https://starter-pack-app.vercel.app/realtor-settings.html', 'Realtor Settings');
    await this.testPage('https://starter-pack-app.vercel.app/blog-admin.html', 'Blog Admin');
    
    // Test APIs
    await this.testAPI('https://starter-pack-app.vercel.app/api/config', 'Config API');
    await this.testAPI('https://starter-pack-app.vercel.app/api/blog/posts', 'Blog Posts API');
    
    // Test 404
    await this.testPage('https://starter-pack-app.vercel.app/non-existent.html', '404 Page');
    
    await this.browser.close();
    
    // Generate report
    await this.generateReport();
  }

  async generateReport() {
    console.log('\n📊 Debug Report Summary\n' + '='.repeat(50));
    
    let totalIssues = 0;
    
    for (const result of this.results) {
      console.log(`\n${result.name} (${result.url})`);
      console.log(`Status: ${result.status || 'N/A'}`);
      
      if (result.info.length > 0) {
        console.log('ℹ️  Info:');
        result.info.forEach(info => console.log(`  - ${info}`));
      }
      
      if (result.issues.length > 0) {
        console.log('❌ Issues:');
        result.issues.forEach(issue => console.log(`  - ${issue}`));
        totalIssues += result.issues.length;
      } else {
        console.log('✅ No issues found');
      }
    }
    
    // Save detailed report
    const reportPath = path.join(this.screenshotDir, 'debug-report.json');
    await fs.writeFile(reportPath, JSON.stringify(this.results, null, 2));
    
    console.log('\n' + '='.repeat(50));
    console.log(`Total issues found: ${totalIssues}`);
    console.log(`\nScreenshots saved in: ${this.screenshotDir}`);
    console.log(`Detailed report saved: ${reportPath}`);
  }
}

// Run the debugger
const appDebugger = new AppDebugger();
appDebugger.runAllTests().catch(console.error);