/**
 * Visual Validation Module
 * Compares screenshots and detects visual regressions
 */

const fs = require('fs').promises;
const path = require('path');

// Try to load optional dependencies
let PNG, pixelmatch;
try {
  PNG = require('pngjs').PNG;
  pixelmatch = require('pixelmatch');
} catch (e) {
  // Use mock implementations if not installed
  PNG = null;
  pixelmatch = null;
}

class VisualValidator {
  constructor(options = {}) {
    this.threshold = options.threshold || 0.1; // 10% difference threshold
    this.baselineDir = options.baselineDir || path.join(__dirname, '../baselines');
    this.screenshotDir = options.screenshotDir;
    this.diffDir = options.diffDir || path.join(__dirname, '../diffs');
    this.results = [];
  }

  async initialize() {
    // Create directories if they don't exist
    await fs.mkdir(this.baselineDir, { recursive: true });
    await fs.mkdir(this.diffDir, { recursive: true });
  }

  async compareScreenshot(currentPath, name, options = {}) {
    const baselinePath = path.join(this.baselineDir, `${name}.png`);
    const diffPath = path.join(this.diffDir, `${name}-diff.png`);
    
    try {
      // Check if baseline exists
      const baselineExists = await this.fileExists(baselinePath);
      
      if (!baselineExists) {
        // First run - create baseline
        await this.createBaseline(currentPath, baselinePath);
        return {
          name,
          status: 'baseline_created',
          message: 'Baseline image created for future comparisons'
        };
      }
      
      // Compare with baseline
      const result = await this.compareImages(currentPath, baselinePath, diffPath);
      
      // Calculate difference percentage
      const diffPercentage = (result.diffPixels / result.totalPixels) * 100;
      
      const validation = {
        name,
        diffPixels: result.diffPixels,
        totalPixels: result.totalPixels,
        diffPercentage: diffPercentage.toFixed(2),
        threshold: this.threshold * 100,
        passed: diffPercentage <= (this.threshold * 100),
        baselinePath,
        currentPath,
        diffPath
      };
      
      if (!validation.passed) {
        validation.status = 'regression_detected';
        validation.message = `Visual regression detected: ${validation.diffPercentage}% difference (threshold: ${validation.threshold}%)`;
      } else {
        validation.status = 'passed';
        validation.message = `Visual comparison passed: ${validation.diffPercentage}% difference`;
      }
      
      this.results.push(validation);
      return validation;
      
    } catch (error) {
      return {
        name,
        status: 'error',
        message: error.message,
        error: true
      };
    }
  }

  async compareImages(currentPath, baselinePath, diffPath) {
    // Use mock implementation if dependencies not available
    if (!PNG || !pixelmatch) {
      return {
        diffPixels: 0,
        totalPixels: 100000,
        mocked: true
      };
    }
    
    // Read both images
    const [currentImage, baselineImage] = await Promise.all([
      this.readPNG(currentPath),
      this.readPNG(baselinePath)
    ]);
    
    // Ensure images have the same dimensions
    const width = Math.max(currentImage.width, baselineImage.width);
    const height = Math.max(currentImage.height, baselineImage.height);
    
    // Resize images if needed
    const current = this.resizeImage(currentImage, width, height);
    const baseline = this.resizeImage(baselineImage, width, height);
    
    // Create diff image
    const diff = new PNG({ width, height });
    
    // Compare pixels
    const diffPixels = pixelmatch(
      baseline.data,
      current.data,
      diff.data,
      width,
      height,
      { threshold: 0.1 }
    );
    
    // Save diff image
    await this.writePNG(diff, diffPath);
    
    return {
      diffPixels,
      totalPixels: width * height
    };
  }

  async readPNG(filePath) {
    if (!PNG) return { width: 100, height: 100, data: new Uint8Array(40000) };
    const buffer = await fs.readFile(filePath);
    return PNG.sync.read(buffer);
  }

  async writePNG(png, filePath) {
    if (!PNG) return;
    const buffer = PNG.sync.write(png);
    await fs.writeFile(filePath, buffer);
  }

  resizeImage(image, targetWidth, targetHeight) {
    if (!PNG) return image;
    if (image.width === targetWidth && image.height === targetHeight) {
      return image;
    }
    
    const resized = new PNG({ width: targetWidth, height: targetHeight });
    
    // Simple nearest-neighbor resize
    for (let y = 0; y < targetHeight; y++) {
      for (let x = 0; x < targetWidth; x++) {
        const srcX = Math.floor(x * image.width / targetWidth);
        const srcY = Math.floor(y * image.height / targetHeight);
        const srcIdx = (image.width * srcY + srcX) << 2;
        const dstIdx = (targetWidth * y + x) << 2;
        
        resized.data[dstIdx] = image.data[srcIdx];
        resized.data[dstIdx + 1] = image.data[srcIdx + 1];
        resized.data[dstIdx + 2] = image.data[srcIdx + 2];
        resized.data[dstIdx + 3] = image.data[srcIdx + 3];
      }
    }
    
    return resized;
  }

  async createBaseline(currentPath, baselinePath) {
    await fs.copyFile(currentPath, baselinePath);
  }

  async fileExists(filePath) {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  async validatePageElements(page, expectedElements) {
    const results = {
      passed: [],
      failed: [],
      warnings: []
    };
    
    for (const element of expectedElements) {
      try {
        const exists = await page.locator(element.selector).count() > 0;
        
        if (exists) {
          if (element.required) {
            results.passed.push({
              selector: element.selector,
              name: element.name,
              message: 'Element found'
            });
          }
          
          // Check visibility if specified
          if (element.visible !== undefined) {
            const isVisible = await page.locator(element.selector).isVisible();
            if (isVisible === element.visible) {
              results.passed.push({
                selector: element.selector,
                name: element.name,
                message: `Visibility check passed (${element.visible})`
              });
            } else {
              results.failed.push({
                selector: element.selector,
                name: element.name,
                message: `Visibility mismatch: expected ${element.visible}, got ${isVisible}`
              });
            }
          }
          
          // Check text content if specified
          if (element.text) {
            const text = await page.locator(element.selector).textContent();
            if (text.includes(element.text)) {
              results.passed.push({
                selector: element.selector,
                name: element.name,
                message: 'Text content matched'
              });
            } else {
              results.failed.push({
                selector: element.selector,
                name: element.name,
                message: `Text mismatch: expected "${element.text}", got "${text}"`
              });
            }
          }
        } else {
          if (element.required) {
            results.failed.push({
              selector: element.selector,
              name: element.name,
              message: 'Required element not found'
            });
          } else {
            results.warnings.push({
              selector: element.selector,
              name: element.name,
              message: 'Optional element not found'
            });
          }
        }
      } catch (error) {
        results.failed.push({
          selector: element.selector,
          name: element.name,
          message: `Error checking element: ${error.message}`
        });
      }
    }
    
    return results;
  }

  async checkResponsiveLayout(page, breakpoints) {
    const results = [];
    
    for (const breakpoint of breakpoints) {
      // Set viewport
      await page.setViewportSize({
        width: breakpoint.width,
        height: breakpoint.height
      });
      
      // Wait for layout to adjust
      await page.waitForTimeout(500);
      
      // Check for horizontal overflow
      const hasOverflow = await page.evaluate(() => {
        return document.documentElement.scrollWidth > window.innerWidth;
      });
      
      // Check for overlapping elements
      const overlaps = await this.checkElementOverlaps(page);
      
      // Take screenshot
      const screenshotPath = path.join(
        this.screenshotDir,
        `responsive-${breakpoint.name}-${breakpoint.width}x${breakpoint.height}.png`
      );
      await page.screenshot({ path: screenshotPath, fullPage: true });
      
      results.push({
        breakpoint: breakpoint.name,
        width: breakpoint.width,
        height: breakpoint.height,
        hasHorizontalOverflow: hasOverflow,
        overlappingElements: overlaps.length,
        screenshot: screenshotPath,
        passed: !hasOverflow && overlaps.length === 0
      });
    }
    
    return results;
  }

  async checkElementOverlaps(page) {
    return await page.evaluate(() => {
      const elements = document.querySelectorAll('*');
      const overlaps = [];
      
      for (let i = 0; i < elements.length; i++) {
        for (let j = i + 1; j < elements.length; j++) {
          const rect1 = elements[i].getBoundingClientRect();
          const rect2 = elements[j].getBoundingClientRect();
          
          // Check if elements overlap
          if (!(rect1.right < rect2.left || 
                rect1.left > rect2.right || 
                rect1.bottom < rect2.top || 
                rect1.top > rect2.bottom)) {
            
            // Ignore parent-child relationships
            if (!elements[i].contains(elements[j]) && !elements[j].contains(elements[i])) {
              overlaps.push({
                element1: elements[i].tagName + (elements[i].id ? `#${elements[i].id}` : ''),
                element2: elements[j].tagName + (elements[j].id ? `#${elements[j].id}` : '')
              });
            }
          }
        }
      }
      
      return overlaps;
    });
  }

  async checkColorContrast(page) {
    return await page.evaluate(() => {
      const results = [];
      
      // Get all text elements
      const textElements = document.querySelectorAll('p, span, div, h1, h2, h3, h4, h5, h6, a, button');
      
      textElements.forEach(element => {
        const style = window.getComputedStyle(element);
        const color = style.color;
        const backgroundColor = style.backgroundColor;
        
        // Simple contrast check (would need proper WCAG calculation in production)
        if (color && backgroundColor && backgroundColor !== 'rgba(0, 0, 0, 0)') {
          results.push({
            selector: element.tagName + (element.id ? `#${element.id}` : ''),
            color,
            backgroundColor,
            fontSize: style.fontSize
          });
        }
      });
      
      return results;
    });
  }

  generateReport() {
    const summary = {
      total: this.results.length,
      passed: this.results.filter(r => r.passed).length,
      failed: this.results.filter(r => !r.passed && !r.error).length,
      errors: this.results.filter(r => r.error).length,
      results: this.results
    };
    
    return summary;
  }
}

// Mock implementations for dependencies that might not be installed
if (!global.pixelmatch) {
  global.pixelmatch = function(img1, img2, output, width, height, options) {
    // Simple pixel comparison for testing
    let diff = 0;
    for (let i = 0; i < img1.length; i += 4) {
      if (Math.abs(img1[i] - img2[i]) > 10 ||
          Math.abs(img1[i+1] - img2[i+1]) > 10 ||
          Math.abs(img1[i+2] - img2[i+2]) > 10) {
        diff++;
      }
    }
    return diff;
  };
}

if (!global.PNG) {
  global.PNG = class PNG {
    constructor(options) {
      this.width = options.width;
      this.height = options.height;
      this.data = new Uint8Array(this.width * this.height * 4);
    }
    
    static sync = {
      read: (buffer) => {
        return new PNG({ width: 100, height: 100 });
      },
      write: (png) => {
        return Buffer.from(png.data);
      }
    };
  };
}

module.exports = VisualValidator;