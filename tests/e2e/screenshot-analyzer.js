// Screenshot analyzer for self-debugging
const fs = require('fs').promises;
const path = require('path');

class ScreenshotAnalyzer {
  constructor() {
    this.screenshotDir = path.join(__dirname, 'screenshots');
    this.analysisDir = path.join(__dirname, 'analysis');
  }

  /**
   * Analyze all screenshots in a directory
   */
  async analyzeScreenshots() {
    await fs.mkdir(this.analysisDir, { recursive: true });
    
    const files = await fs.readdir(this.screenshotDir);
    const screenshots = files.filter(f => f.endsWith('.png'));
    
    const analysis = {
      timestamp: new Date().toISOString(),
      screenshots: []
    };
    
    for (const screenshot of screenshots) {
      const jsonFile = screenshot.replace('.png', '.json');
      const screenshotPath = path.join(this.screenshotDir, screenshot);
      const statePath = path.join(this.screenshotDir, jsonFile);
      
      let state = null;
      try {
        state = JSON.parse(await fs.readFile(statePath, 'utf8'));
      } catch (e) {
        console.log(`No state file for ${screenshot}`);
      }
      
      const screenshotAnalysis = {
        filename: screenshot,
        path: screenshotPath,
        state: state,
        insights: this.generateInsights(screenshot, state)
      };
      
      analysis.screenshots.push(screenshotAnalysis);
    }
    
    // Save analysis
    const analysisPath = path.join(this.analysisDir, `analysis-${Date.now()}.json`);
    await fs.writeFile(analysisPath, JSON.stringify(analysis, null, 2));
    
    return analysis;
  }

  /**
   * Generate insights from screenshot and state
   */
  generateInsights(filename, state) {
    const insights = [];
    
    if (!state) {
      insights.push({
        type: 'warning',
        message: 'No state data available for this screenshot'
      });
      return insights;
    }
    
    // Check for errors
    if (state.errors && state.errors.length > 0) {
      insights.push({
        type: 'error',
        message: 'Error messages detected on page',
        details: state.errors
      });
    }
    
    // Check if it's a failure screenshot
    if (filename.includes('failure')) {
      insights.push({
        type: 'failure',
        message: 'This is a failure screenshot',
        recommendation: 'Check the clickable elements and form fields for issues'
      });
      
      // Analyze what might be missing
      if (state.clickableElements.length === 0) {
        insights.push({
          type: 'issue',
          message: 'No clickable elements found',
          recommendation: 'Page might not be fully loaded'
        });
      }
      
      if (state.formFields.length === 0) {
        insights.push({
          type: 'issue',
          message: 'No form fields found',
          recommendation: 'Check if the correct page loaded'
        });
      }
    }
    
    // Check for common patterns
    const hasAddressField = state.formFields.some(f => 
      f.id?.includes('address') || 
      f.name?.includes('address') || 
      f.placeholder?.toLowerCase().includes('address')
    );
    
    if (!hasAddressField && filename.includes('initial')) {
      insights.push({
        type: 'missing',
        message: 'No address input field detected',
        recommendation: 'Check if page loaded correctly or selectors changed'
      });
    }
    
    const hasAnalyzeButton = state.clickableElements.some(el => 
      el.text?.toLowerCase().includes('analyze') ||
      el.id?.includes('analyze')
    );
    
    if (!hasAnalyzeButton && filename.includes('initial')) {
      insights.push({
        type: 'missing',
        message: 'No analyze button detected',
        recommendation: 'Button might have different text or be hidden'
      });
    }
    
    // Console log analysis
    if (state.consoleLogs && state.consoleLogs.length > 0) {
      const errors = state.consoleLogs.filter(log => log.type === 'error');
      if (errors.length > 0) {
        insights.push({
          type: 'console-error',
          message: 'JavaScript errors in console',
          details: errors
        });
      }
    }
    
    return insights;
  }

  /**
   * Generate a summary report
   */
  async generateReport() {
    const analysis = await this.analyzeScreenshots();
    
    let report = '# Screenshot Analysis Report\n\n';
    report += `Generated: ${analysis.timestamp}\n\n`;
    
    for (const screenshot of analysis.screenshots) {
      report += `## ${screenshot.filename}\n\n`;
      
      if (screenshot.state) {
        report += `- URL: ${screenshot.state.url}\n`;
        report += `- Title: ${screenshot.state.title}\n`;
        report += `- Form Fields: ${screenshot.state.formFields.length}\n`;
        report += `- Clickable Elements: ${screenshot.state.clickableElements.length}\n`;
        report += `- Errors: ${screenshot.state.errors.length}\n\n`;
      }
      
      if (screenshot.insights.length > 0) {
        report += '### Insights\n\n';
        for (const insight of screenshot.insights) {
          report += `- **${insight.type}**: ${insight.message}\n`;
          if (insight.recommendation) {
            report += `  - Recommendation: ${insight.recommendation}\n`;
          }
          if (insight.details) {
            report += `  - Details: ${JSON.stringify(insight.details)}\n`;
          }
        }
        report += '\n';
      }
    }
    
    // Save report
    const reportPath = path.join(this.analysisDir, `report-${Date.now()}.md`);
    await fs.writeFile(reportPath, report);
    
    console.log(`Report saved to: ${reportPath}`);
    return report;
  }

  /**
   * Find patterns across multiple test runs
   */
  async findPatterns() {
    const files = await fs.readdir(this.analysisDir);
    const analyses = [];
    
    for (const file of files) {
      if (file.startsWith('analysis-') && file.endsWith('.json')) {
        const content = await fs.readFile(path.join(this.analysisDir, file), 'utf8');
        analyses.push(JSON.parse(content));
      }
    }
    
    // Find common failures
    const failures = {};
    
    for (const analysis of analyses) {
      for (const screenshot of analysis.screenshots) {
        for (const insight of screenshot.insights) {
          if (insight.type === 'error' || insight.type === 'failure') {
            const key = insight.message;
            failures[key] = (failures[key] || 0) + 1;
          }
        }
      }
    }
    
    return {
      totalRuns: analyses.length,
      commonFailures: failures,
      recommendations: this.generateRecommendations(failures)
    };
  }

  generateRecommendations(failures) {
    const recommendations = [];
    
    Object.entries(failures).forEach(([issue, count]) => {
      if (count > 1) {
        recommendations.push({
          issue,
          frequency: count,
          recommendation: this.getRecommendation(issue)
        });
      }
    });
    
    return recommendations.sort((a, b) => b.frequency - a.frequency);
  }

  getRecommendation(issue) {
    const recommendations = {
      'No address input field detected': 'Update selector to match current HTML structure',
      'No analyze button detected': 'Check if button text or ID has changed',
      'Error messages detected on page': 'Add proper error handling in tests',
      'No clickable elements found': 'Increase wait time for page load',
      'JavaScript errors in console': 'Fix JavaScript errors before running tests'
    };
    
    return recommendations[issue] || 'Investigate the specific failure case';
  }
}

// CLI interface
if (require.main === module) {
  const analyzer = new ScreenshotAnalyzer();
  
  const command = process.argv[2];
  
  switch (command) {
    case 'analyze':
      analyzer.analyzeScreenshots().then(result => {
        console.log('Analysis complete:', result);
      });
      break;
      
    case 'report':
      analyzer.generateReport().then(report => {
        console.log(report);
      });
      break;
      
    case 'patterns':
      analyzer.findPatterns().then(patterns => {
        console.log('Pattern analysis:', JSON.stringify(patterns, null, 2));
      });
      break;
      
    default:
      console.log('Usage: node screenshot-analyzer.js [analyze|report|patterns]');
  }
}

module.exports = { ScreenshotAnalyzer };