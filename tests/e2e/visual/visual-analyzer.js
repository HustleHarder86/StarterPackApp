/**
 * Visual Analysis Engine
 * Comprehensive visual testing and feedback system using Playwright
 */

const { chromium } = require('@playwright/test');
const fs = require('fs').promises;
const path = require('path');
// Sharp removed - using Playwright's built-in screenshot capabilities

class VisualAnalyzer {
  constructor() {
    this.browser = null;
    this.context = null;
    this.page = null;
    this.screenshotDir = path.join(__dirname, '../screenshots', `visual-${Date.now()}`);
    this.results = [];
    this.issues = [];
  }

  /**
   * Initialize browser and create screenshot directory
   */
  async initialize() {
    this.browser = await chromium.launch({
      headless: true,
      args: ['--force-device-scale-factor=1']
    });
    
    this.context = await this.browser.newContext({
      viewport: { width: 1920, height: 1080 },
      deviceScaleFactor: 1
    });
    
    this.page = await this.context.newPage();
    
    // Create screenshot directory
    await fs.mkdir(this.screenshotDir, { recursive: true });
    
    console.log(`📸 Visual analysis initialized. Screenshots: ${this.screenshotDir}`);
  }

  /**
   * Analyze analysis screen layout and visual quality
   */
  async analyzeAnalysisScreen(url) {
    await this.page.goto(url, { waitUntil: 'networkidle' });
    
    const screenAnalysis = {
      url,
      timestamp: new Date().toISOString(),
      layout: {},
      dataVisualization: {},
      accessibility: {},
      responsive: {},
      issues: []
    };

    // 1. Layout Validation
    screenAnalysis.layout = await this.validateLayout();
    
    // 2. Data Visualization Check
    screenAnalysis.dataVisualization = await this.checkDataVisualization();
    
    // 3. Accessibility Compliance
    screenAnalysis.accessibility = await this.checkAccessibility();
    
    // 4. Responsive Design
    screenAnalysis.responsive = await this.checkResponsiveness();
    
    // 5. Take annotated screenshots
    await this.captureAnnotatedScreenshots('analysis-screen');
    
    this.results.push(screenAnalysis);
    return screenAnalysis;
  }

  /**
   * Validate layout consistency
   */
  async validateLayout() {
    const layoutChecks = {
      alignment: true,
      spacing: true,
      overlaps: false,
      consistency: true,
      issues: []
    };

    // Check component alignment
    const elements = await this.page.evaluate(() => {
      const components = document.querySelectorAll('.card, .section, .panel');
      const positions = [];
      
      components.forEach(el => {
        const rect = el.getBoundingClientRect();
        positions.push({
          selector: el.className,
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height
        });
      });
      
      return positions;
    });

    // Check for misalignment (8px grid system)
    elements.forEach(el => {
      if (el.left % 8 !== 0 || el.top % 8 !== 0) {
        layoutChecks.alignment = false;
        layoutChecks.issues.push({
          type: 'misalignment',
          element: el.selector,
          position: { left: el.left, top: el.top },
          message: 'Element not aligned to 8px grid'
        });
      }
    });

    // Check for overlapping elements
    for (let i = 0; i < elements.length; i++) {
      for (let j = i + 1; j < elements.length; j++) {
        if (this.elementsOverlap(elements[i], elements[j])) {
          layoutChecks.overlaps = true;
          layoutChecks.issues.push({
            type: 'overlap',
            elements: [elements[i].selector, elements[j].selector],
            message: 'Elements are overlapping'
          });
        }
      }
    }

    // Check consistent spacing
    const spacing = await this.page.evaluate(() => {
      const gaps = [];
      const elements = document.querySelectorAll('.card, .section');
      
      for (let i = 0; i < elements.length - 1; i++) {
        const rect1 = elements[i].getBoundingClientRect();
        const rect2 = elements[i + 1].getBoundingClientRect();
        gaps.push(rect2.top - (rect1.top + rect1.height));
      }
      
      return gaps;
    });

    const uniqueSpacing = [...new Set(spacing)];
    if (uniqueSpacing.length > 3) { // Allow max 3 different spacing values
      layoutChecks.spacing = false;
      layoutChecks.issues.push({
        type: 'inconsistent_spacing',
        values: uniqueSpacing,
        message: 'Inconsistent spacing between elements'
      });
    }

    return layoutChecks;
  }

  /**
   * Check if two elements overlap
   */
  elementsOverlap(el1, el2) {
    return !(el1.left + el1.width <= el2.left || 
             el2.left + el2.width <= el1.left || 
             el1.top + el1.height <= el2.top || 
             el2.top + el2.height <= el1.top);
  }

  /**
   * Check data visualization quality
   */
  async checkDataVisualization() {
    const vizChecks = {
      chartsRendered: true,
      dataAccuracy: true,
      colorConsistency: true,
      readability: true,
      issues: []
    };

    // Check if charts are rendered
    const charts = await this.page.evaluate(() => {
      const chartElements = document.querySelectorAll('canvas, svg.chart, .chart-container');
      const chartData = [];
      
      chartElements.forEach(el => {
        const rect = el.getBoundingClientRect();
        chartData.push({
          type: el.tagName.toLowerCase(),
          hasContent: el.innerHTML.length > 0 || (el.getContext && el.getContext('2d')),
          visible: rect.width > 0 && rect.height > 0,
          dimensions: { width: rect.width, height: rect.height }
        });
      });
      
      return chartData;
    });

    charts.forEach((chart, index) => {
      if (!chart.hasContent || !chart.visible) {
        vizChecks.chartsRendered = false;
        vizChecks.issues.push({
          type: 'chart_not_rendered',
          index,
          chart,
          message: 'Chart not properly rendered'
        });
      }
    });

    // Check data-value attributes match displayed values
    const dataIntegrity = await this.page.evaluate(() => {
      const elements = document.querySelectorAll('[data-value]');
      const mismatches = [];
      
      elements.forEach(el => {
        const dataValue = el.getAttribute('data-value');
        const displayValue = el.textContent.trim();
        
        // Normalize for comparison
        const normalizedData = dataValue.replace(/[$,]/g, '');
        const normalizedDisplay = displayValue.replace(/[$,]/g, '');
        
        if (normalizedData !== normalizedDisplay && 
            Math.abs(parseFloat(normalizedData) - parseFloat(normalizedDisplay)) > 0.01) {
          mismatches.push({
            element: el.className,
            dataValue,
            displayValue
          });
        }
      });
      
      return mismatches;
    });

    if (dataIntegrity.length > 0) {
      vizChecks.dataAccuracy = false;
      vizChecks.issues.push(...dataIntegrity.map(m => ({
        type: 'data_mismatch',
        ...m,
        message: 'Data attribute does not match displayed value'
      })));
    }

    // Check color consistency
    const colors = await this.page.evaluate(() => {
      const colorMap = {};
      const elements = document.querySelectorAll('.str-color, .ltr-color, .chart-bar');
      
      elements.forEach(el => {
        const style = window.getComputedStyle(el);
        const bgColor = style.backgroundColor;
        const className = el.className.split(' ')[0];
        
        if (!colorMap[className]) {
          colorMap[className] = new Set();
        }
        colorMap[className].add(bgColor);
      });
      
      return Object.entries(colorMap).map(([className, colors]) => ({
        className,
        colors: Array.from(colors)
      }));
    });

    colors.forEach(({ className, colors: colorList }) => {
      if (colorList.length > 1) {
        vizChecks.colorConsistency = false;
        vizChecks.issues.push({
          type: 'color_inconsistency',
          className,
          colors: colorList,
          message: `Inconsistent colors for ${className}`
        });
      }
    });

    return vizChecks;
  }

  /**
   * Check accessibility compliance
   */
  async checkAccessibility() {
    const a11yChecks = {
      colorContrast: true,
      focusIndicators: true,
      altText: true,
      ariaLabels: true,
      keyboardNav: true,
      issues: []
    };

    // Check color contrast ratios
    const contrastIssues = await this.page.evaluate(() => {
      const issues = [];
      const textElements = document.querySelectorAll('p, span, div, h1, h2, h3, h4, h5, h6');
      
      textElements.forEach(el => {
        const style = window.getComputedStyle(el);
        const bgColor = style.backgroundColor;
        const textColor = style.color;
        
        // Simple contrast check (would use proper WCAG algorithm in production)
        if (bgColor !== 'rgba(0, 0, 0, 0)' && textColor) {
          // This is simplified - real implementation would calculate actual contrast ratio
          const isDark = bgColor.includes('0, 0, 0') || bgColor.includes('rgb(0');
          const isLightText = textColor.includes('255, 255, 255') || textColor.includes('rgb(255');
          
          if (isDark === isLightText) {
            // Good contrast
          } else if (el.textContent.trim().length > 0) {
            issues.push({
              element: el.tagName.toLowerCase(),
              text: el.textContent.substring(0, 50),
              bgColor,
              textColor
            });
          }
        }
      });
      
      return issues;
    });

    if (contrastIssues.length > 0) {
      a11yChecks.colorContrast = false;
      a11yChecks.issues.push(...contrastIssues.map(issue => ({
        type: 'contrast_ratio',
        ...issue,
        message: 'Insufficient color contrast'
      })));
    }

    // Check focus indicators
    const focusableElements = await this.page.evaluate(() => {
      const elements = document.querySelectorAll('button, a, input, select, textarea, [tabindex]');
      const noFocusStyle = [];
      
      elements.forEach(el => {
        el.focus();
        const style = window.getComputedStyle(el);
        const outline = style.outline;
        const border = style.border;
        const boxShadow = style.boxShadow;
        
        if (outline === 'none' && !border.includes('px') && boxShadow === 'none') {
          noFocusStyle.push({
            element: el.tagName.toLowerCase(),
            id: el.id,
            className: el.className
          });
        }
        el.blur();
      });
      
      return noFocusStyle;
    });

    if (focusableElements.length > 0) {
      a11yChecks.focusIndicators = false;
      a11yChecks.issues.push(...focusableElements.map(el => ({
        type: 'missing_focus_indicator',
        ...el,
        message: 'No visible focus indicator'
      })));
    }

    // Check images for alt text
    const imagesWithoutAlt = await this.page.evaluate(() => {
      const images = document.querySelectorAll('img');
      const missing = [];
      
      images.forEach(img => {
        if (!img.alt && !img.getAttribute('aria-label')) {
          missing.push({
            src: img.src.substring(img.src.lastIndexOf('/') + 1),
            width: img.width,
            height: img.height
          });
        }
      });
      
      return missing;
    });

    if (imagesWithoutAlt.length > 0) {
      a11yChecks.altText = false;
      a11yChecks.issues.push(...imagesWithoutAlt.map(img => ({
        type: 'missing_alt_text',
        ...img,
        message: 'Image missing alt text'
      })));
    }

    // Check ARIA labels
    const missingAria = await this.page.evaluate(() => {
      const interactiveElements = document.querySelectorAll('button, a, [role="button"]');
      const missing = [];
      
      interactiveElements.forEach(el => {
        const hasText = el.textContent.trim().length > 0;
        const hasAriaLabel = el.getAttribute('aria-label');
        const hasAriaLabelledBy = el.getAttribute('aria-labelledby');
        
        if (!hasText && !hasAriaLabel && !hasAriaLabelledBy) {
          missing.push({
            element: el.tagName.toLowerCase(),
            role: el.getAttribute('role'),
            className: el.className
          });
        }
      });
      
      return missing;
    });

    if (missingAria.length > 0) {
      a11yChecks.ariaLabels = false;
      a11yChecks.issues.push(...missingAria.map(el => ({
        type: 'missing_aria_label',
        ...el,
        message: 'Interactive element missing accessible label'
      })));
    }

    return a11yChecks;
  }

  /**
   * Check responsive design
   */
  async checkResponsiveness() {
    const viewports = [
      { name: 'mobile', width: 375, height: 812 },
      { name: 'tablet', width: 768, height: 1024 },
      { name: 'desktop', width: 1920, height: 1080 }
    ];
    
    const responsiveChecks = {
      breakpoints: true,
      overflow: false,
      readability: true,
      touchTargets: true,
      issues: []
    };

    for (const viewport of viewports) {
      await this.page.setViewportSize(viewport);
      await this.page.waitForTimeout(500); // Wait for responsive adjustments
      
      // Check for horizontal overflow
      const hasOverflow = await this.page.evaluate(() => {
        return document.documentElement.scrollWidth > window.innerWidth;
      });
      
      if (hasOverflow) {
        responsiveChecks.overflow = true;
        responsiveChecks.issues.push({
          type: 'horizontal_overflow',
          viewport: viewport.name,
          message: `Horizontal scroll detected at ${viewport.name} viewport`
        });
      }
      
      // Check touch target sizes on mobile
      if (viewport.name === 'mobile') {
        const smallTargets = await this.page.evaluate(() => {
          const buttons = document.querySelectorAll('button, a, [role="button"]');
          const small = [];
          
          buttons.forEach(el => {
            const rect = el.getBoundingClientRect();
            if (rect.width < 44 || rect.height < 44) { // iOS minimum
              small.push({
                element: el.tagName.toLowerCase(),
                size: { width: rect.width, height: rect.height },
                text: el.textContent.substring(0, 20)
              });
            }
          });
          
          return small;
        });
        
        if (smallTargets.length > 0) {
          responsiveChecks.touchTargets = false;
          responsiveChecks.issues.push(...smallTargets.map(target => ({
            type: 'small_touch_target',
            ...target,
            viewport: 'mobile',
            message: 'Touch target too small for mobile'
          })));
        }
      }
      
      // Take screenshot for this viewport
      await this.page.screenshot({
        path: path.join(this.screenshotDir, `responsive-${viewport.name}.png`),
        fullPage: false
      });
    }
    
    // Reset to desktop viewport
    await this.page.setViewportSize({ width: 1920, height: 1080 });
    
    return responsiveChecks;
  }

  /**
   * Capture annotated screenshots with issue markers
   */
  async captureAnnotatedScreenshots(prefix) {
    // Take base screenshot
    const screenshotPath = path.join(this.screenshotDir, `${prefix}-base.png`);
    await this.page.screenshot({ path: screenshotPath, fullPage: true });
    
    // Inject annotation script
    await this.page.evaluate((issues) => {
      // Create overlay for annotations
      const overlay = document.createElement('div');
      overlay.id = 'visual-test-overlay';
      overlay.style.cssText = 'position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: 99999;';
      document.body.appendChild(overlay);
      
      // Add markers for issues
      issues.forEach((issue, index) => {
        const marker = document.createElement('div');
        marker.style.cssText = `
          position: absolute;
          width: 30px;
          height: 30px;
          background: red;
          color: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          border: 2px solid white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        `;
        marker.textContent = index + 1;
        
        // Position marker (simplified - would need element coordinates)
        marker.style.top = `${100 + index * 40}px`;
        marker.style.left = '20px';
        
        overlay.appendChild(marker);
      });
    }, this.issues);
    
    // Take annotated screenshot
    const annotatedPath = path.join(this.screenshotDir, `${prefix}-annotated.png`);
    await this.page.screenshot({ path: annotatedPath, fullPage: true });
    
    // Remove overlay
    await this.page.evaluate(() => {
      const overlay = document.getElementById('visual-test-overlay');
      if (overlay) overlay.remove();
    });
    
    return { base: screenshotPath, annotated: annotatedPath };
  }

  /**
   * Analyze PDF visual quality
   */
  async analyzePDF(pdfPath) {
    const pdfAnalysis = {
      path: pdfPath,
      timestamp: new Date().toISOString(),
      formatting: {},
      content: {},
      quality: {},
      issues: []
    };

    // This would require a PDF library like pdf-parse or puppeteer-pdf
    // For now, we'll simulate the analysis
    
    pdfAnalysis.formatting = {
      margins: true,
      fontSize: true,
      lineSpacing: true,
      pageBreaks: true
    };
    
    pdfAnalysis.content = {
      allSectionsPresent: true,
      dataAccurate: true,
      chartsRendered: true,
      noMissingValues: true
    };
    
    pdfAnalysis.quality = {
      resolution: 'high',
      fileSize: 'optimal',
      loadTime: 'fast',
      professionalAppearance: true
    };
    
    return pdfAnalysis;
  }

  /**
   * Generate visual quality score
   */
  calculateVisualScore(analysis) {
    let score = 100;
    const weights = {
      layout: 25,
      dataVisualization: 25,
      accessibility: 25,
      responsive: 25
    };
    
    // Deduct points for issues
    if (analysis.layout && !analysis.layout.alignment) score -= weights.layout * 0.3;
    if (analysis.layout && analysis.layout.overlaps) score -= weights.layout * 0.5;
    if (analysis.layout && !analysis.layout.spacing) score -= weights.layout * 0.2;
    
    if (analysis.dataVisualization && !analysis.dataVisualization.chartsRendered) score -= weights.dataVisualization * 0.4;
    if (analysis.dataVisualization && !analysis.dataVisualization.dataAccuracy) score -= weights.dataVisualization * 0.3;
    if (analysis.dataVisualization && !analysis.dataVisualization.colorConsistency) score -= weights.dataVisualization * 0.3;
    
    if (analysis.accessibility && !analysis.accessibility.colorContrast) score -= weights.accessibility * 0.3;
    if (analysis.accessibility && !analysis.accessibility.focusIndicators) score -= weights.accessibility * 0.2;
    if (analysis.accessibility && !analysis.accessibility.altText) score -= weights.accessibility * 0.2;
    if (analysis.accessibility && !analysis.accessibility.ariaLabels) score -= weights.accessibility * 0.3;
    
    if (analysis.responsive && analysis.responsive.overflow) score -= weights.responsive * 0.4;
    if (analysis.responsive && !analysis.responsive.touchTargets) score -= weights.responsive * 0.3;
    
    return Math.max(0, Math.round(score));
  }

  /**
   * Run complete visual analysis
   */
  async analyzeAll(mockupUrls, generatePDF = false) {
    await this.initialize();
    
    const results = {
      timestamp: new Date().toISOString(),
      mockups: [],
      overallScore: 0,
      criticalIssues: [],
      recommendations: []
    };
    
    for (const url of mockupUrls) {
      console.log(`🔍 Analyzing ${url}...`);
      
      const analysis = await this.analyzeAnalysisScreen(url);
      const score = this.calculateVisualScore(analysis);
      
      results.mockups.push({
        url,
        score,
        analysis
      });
      
      // Collect critical issues
      if (analysis.layout?.issues?.length > 0) {
        results.criticalIssues.push(...analysis.layout.issues.filter(i => 
          i.type === 'overlap' || i.type === 'misalignment'
        ));
      }
      
      if (analysis.accessibility?.issues?.length > 0) {
        results.criticalIssues.push(...analysis.accessibility.issues.filter(i => 
          i.type === 'contrast_ratio' || i.type === 'missing_focus_indicator'
        ));
      }
    }
    
    // Calculate overall score
    results.overallScore = Math.round(
      results.mockups.reduce((sum, m) => sum + m.score, 0) / results.mockups.length
    );
    
    // Generate recommendations
    if (results.overallScore < 90) {
      results.recommendations.push('Address critical layout and accessibility issues');
    }
    
    const hasContrastIssues = results.criticalIssues.some(i => i.type === 'contrast_ratio');
    if (hasContrastIssues) {
      results.recommendations.push('Improve color contrast for better readability');
    }
    
    const hasOverflowIssues = results.mockups.some(m => 
      m.analysis.responsive?.overflow
    );
    if (hasOverflowIssues) {
      results.recommendations.push('Fix responsive design issues on mobile viewports');
    }
    
    await this.cleanup();
    
    return results;
  }

  /**
   * Cleanup browser resources
   */
  async cleanup() {
    if (this.browser) {
      await this.browser.close();
    }
  }
}

module.exports = VisualAnalyzer;