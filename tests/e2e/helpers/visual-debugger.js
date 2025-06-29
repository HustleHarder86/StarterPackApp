// Visual debugger for self-healing tests
const { test } = require('@playwright/test');
const path = require('path');
const fs = require('fs').promises;

class VisualDebugger {
  constructor(page, testInfo) {
    this.page = page;
    this.testInfo = testInfo;
    this.screenshotDir = path.join(__dirname, '..', 'screenshots');
    this.debugDir = path.join(__dirname, '..', 'debug');
  }

  async init() {
    // Create directories if they don't exist
    await fs.mkdir(this.screenshotDir, { recursive: true });
    await fs.mkdir(this.debugDir, { recursive: true });
  }

  /**
   * Take a screenshot and save it with metadata
   */
  async captureState(name, options = {}) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `${this.testInfo.title}-${name}-${timestamp}.png`;
    const filepath = path.join(this.screenshotDir, filename);
    
    // Take screenshot
    const screenshot = await this.page.screenshot({
      fullPage: options.fullPage !== false,
      ...options
    });
    
    await fs.writeFile(filepath, screenshot);
    
    // Capture page state
    const pageState = await this.capturePageState();
    const stateFile = filepath.replace('.png', '.json');
    await fs.writeFile(stateFile, JSON.stringify(pageState, null, 2));
    
    console.log(`Screenshot saved: ${filename}`);
    return { screenshot: filepath, state: stateFile };
  }

  /**
   * Capture current page state for debugging
   */
  async capturePageState() {
    const state = {
      url: this.page.url(),
      title: await this.page.title(),
      timestamp: new Date().toISOString(),
      viewport: this.page.viewportSize(),
      
      // Capture visible text
      visibleText: await this.page.evaluate(() => {
        return document.body.innerText;
      }),
      
      // Capture all clickable elements
      clickableElements: await this.page.evaluate(() => {
        const elements = document.querySelectorAll('button, a, input[type="submit"], [onclick]');
        return Array.from(elements).map(el => ({
          tag: el.tagName,
          text: el.innerText || el.value || el.placeholder,
          id: el.id,
          class: el.className,
          href: el.href,
          visible: el.offsetParent !== null
        }));
      }),
      
      // Capture form fields
      formFields: await this.page.evaluate(() => {
        const inputs = document.querySelectorAll('input, textarea, select');
        return Array.from(inputs).map(el => ({
          tag: el.tagName,
          type: el.type,
          name: el.name,
          id: el.id,
          value: el.value,
          placeholder: el.placeholder,
          visible: el.offsetParent !== null
        }));
      }),
      
      // Capture error messages
      errors: await this.page.evaluate(() => {
        const errorSelectors = ['.error', '.error-message', '[class*="error"]', '[id*="error"]'];
        const errors = [];
        errorSelectors.forEach(selector => {
          document.querySelectorAll(selector).forEach(el => {
            if (el.innerText && el.offsetParent !== null) {
              errors.push(el.innerText);
            }
          });
        });
        return errors;
      }),
      
      // Console logs
      consoleLogs: this.consoleLogs || []
    };
    
    return state;
  }

  /**
   * Analyze screenshot and state to find issues
   */
  async analyzeFailure(error) {
    const analysis = {
      error: error.message,
      timestamp: new Date().toISOString(),
      suggestions: []
    };
    
    // Take failure screenshot
    const { screenshot, state } = await this.captureState('failure');
    analysis.screenshot = screenshot;
    
    // Load state data
    const stateData = JSON.parse(await fs.readFile(state, 'utf8'));
    
    // Analyze common issues
    if (error.message.includes('element not found')) {
      analysis.suggestions.push({
        issue: 'Element not found',
        possibleCauses: [
          'Element selector changed',
          'Element not loaded yet',
          'Element is hidden'
        ],
        recommendations: this.findAlternativeSelectors(stateData, error.message)
      });
    }
    
    if (error.message.includes('timeout')) {
      analysis.suggestions.push({
        issue: 'Timeout waiting for element',
        possibleCauses: [
          'Page loading slowly',
          'Element never appears',
          'Wrong page loaded'
        ],
        recommendations: [
          `Current URL: ${stateData.url}`,
          `Visible errors: ${stateData.errors.join(', ') || 'None'}`,
          'Try increasing timeout or adding wait conditions'
        ]
      });
    }
    
    // Save analysis
    const analysisFile = path.join(this.debugDir, `analysis-${Date.now()}.json`);
    await fs.writeFile(analysisFile, JSON.stringify(analysis, null, 2));
    
    return analysis;
  }

  /**
   * Find alternative selectors based on page state
   */
  findAlternativeSelectors(state, errorMessage) {
    const recommendations = [];
    
    // Extract the selector that failed from error message
    const selectorMatch = errorMessage.match(/selector[:\s]+["']([^"']+)["']/i);
    if (selectorMatch) {
      const failedSelector = selectorMatch[1];
      
      // Look for similar elements
      if (failedSelector.includes('#')) {
        // ID selector failed, look for similar IDs
        const targetId = failedSelector.replace('#', '');
        const similarIds = [];
        
        [...state.clickableElements, ...state.formFields].forEach(el => {
          if (el.id && el.id.toLowerCase().includes(targetId.toLowerCase())) {
            similarIds.push(`#${el.id}`);
          }
        });
        
        if (similarIds.length > 0) {
          recommendations.push(`Try these similar IDs: ${similarIds.join(', ')}`);
        }
      }
      
      // Look for text-based selectors
      const textMatch = failedSelector.match(/text[=:]["']([^"']+)["']/i);
      if (textMatch) {
        const targetText = textMatch[1];
        const textElements = state.clickableElements.filter(el => 
          el.text && el.text.toLowerCase().includes(targetText.toLowerCase())
        );
        
        if (textElements.length > 0) {
          recommendations.push(`Found elements with similar text: ${textElements.map(el => el.text).join(', ')}`);
        }
      }
    }
    
    return recommendations;
  }

  /**
   * Self-healing mechanism - try to fix common issues
   */
  async attemptSelfHeal(error) {
    console.log('Attempting self-heal for:', error.message);
    
    const analysis = await this.analyzeFailure(error);
    
    // Try to self-heal based on analysis
    for (const suggestion of analysis.suggestions) {
      if (suggestion.issue === 'Element not found' && suggestion.recommendations.length > 0) {
        // Try alternative selectors
        for (const recommendation of suggestion.recommendations) {
          if (recommendation.startsWith('Try these similar IDs:')) {
            const ids = recommendation.match(/#[\w-]+/g);
            if (ids) {
              for (const id of ids) {
                try {
                  await this.page.waitForSelector(id, { timeout: 1000 });
                  console.log(`Self-heal success: Found element with ${id}`);
                  return id;
                } catch (e) {
                  // Continue trying
                }
              }
            }
          }
        }
      }
    }
    
    return null;
  }

  /**
   * Enhanced click with self-healing
   */
  async clickWithHeal(selector, options = {}) {
    try {
      await this.page.click(selector, options);
    } catch (error) {
      console.log(`Click failed for ${selector}, attempting self-heal...`);
      
      const healed = await this.attemptSelfHeal(error);
      if (healed) {
        await this.page.click(healed, options);
      } else {
        throw error;
      }
    }
  }

  /**
   * Enhanced fill with self-healing
   */
  async fillWithHeal(selector, value, options = {}) {
    try {
      await this.page.fill(selector, value, options);
    } catch (error) {
      console.log(`Fill failed for ${selector}, attempting self-heal...`);
      
      const healed = await this.attemptSelfHeal(error);
      if (healed) {
        await this.page.fill(healed, value, options);
      } else {
        throw error;
      }
    }
  }

  /**
   * Setup console log capture
   */
  setupConsoleCapture() {
    this.consoleLogs = [];
    this.page.on('console', msg => {
      this.consoleLogs.push({
        type: msg.type(),
        text: msg.text(),
        timestamp: new Date().toISOString()
      });
    });
  }

  /**
   * Compare screenshots for visual regression
   */
  async compareScreenshots(baseline, current) {
    // This would integrate with a visual regression tool
    // For now, just save both for manual comparison
    const comparisonDir = path.join(this.debugDir, 'comparisons');
    await fs.mkdir(comparisonDir, { recursive: true });
    
    const timestamp = Date.now();
    await fs.copyFile(baseline, path.join(comparisonDir, `${timestamp}-baseline.png`));
    await fs.copyFile(current, path.join(comparisonDir, `${timestamp}-current.png`));
    
    return {
      baseline,
      current,
      diffPath: path.join(comparisonDir, `${timestamp}-diff.png`)
    };
  }
}

module.exports = { VisualDebugger };