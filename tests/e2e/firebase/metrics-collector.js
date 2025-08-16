/**
 * Firebase Metrics Collector
 * Stores test results and metrics in Firebase for analysis
 */

class FirebaseMetricsCollector {
  constructor(testRunId) {
    this.testRunId = testRunId || `test-${Date.now()}`;
    this.metrics = {
      testRun: {
        id: this.testRunId,
        startTime: new Date().toISOString(),
        endTime: null,
        duration: 0,
        environment: process.env.NODE_ENV || 'test'
      },
      personas: [],
      validations: [],
      visualFeedback: [],
      performance: [],
      errors: []
    };
  }

  /**
   * Store test run metadata in Firestore
   */
  async storeTestRun(summary) {
    const testRunData = {
      runId: this.testRunId,
      timestamp: new Date().toISOString(),
      personas: summary.personas,
      mockupsTested: summary.mockups,
      totalTests: summary.totalTests,
      passed: summary.passed,
      failed: summary.failed,
      accuracy: {
        financial: summary.financialAccuracy || 0,
        dataConsistency: summary.dataConsistency || 0,
        businessLogic: summary.businessLogic || 0,
        visualQuality: summary.visualQuality || 0,
        overall: summary.overallAccuracy || 0
      },
      duration: Date.now() - Date.parse(this.metrics.testRun.startTime),
      environment: this.metrics.testRun.environment
    };

    // Using Firebase MCP to store in Firestore
    console.log(`📊 Storing test run ${this.testRunId} in Firebase`);
    
    // This would use the Firebase MCP tool:
    // await mcp.firestore.addDocument('test_runs', testRunData);
    
    return testRunData;
  }

  /**
   * Store validation results
   */
  async storeValidation(validation) {
    const validationData = {
      testId: `${this.testRunId}-${Date.now()}`,
      runId: this.testRunId,
      timestamp: new Date().toISOString(),
      persona: validation.persona,
      mockup: validation.mockup,
      validationType: validation.type,
      expected: validation.expected,
      actual: validation.actual,
      passed: validation.passed,
      tolerance: validation.tolerance,
      difference: validation.difference,
      percentDiff: validation.percentDiff,
      message: validation.message,
      screenshot: validation.screenshot || null
    };

    this.metrics.validations.push(validationData);
    
    // Store in Firestore
    // await mcp.firestore.addDocument('test_validations', validationData);
    
    return validationData;
  }

  /**
   * Store visual feedback
   */
  async storeVisualFeedback(feedback) {
    const visualData = {
      feedbackId: `visual-${this.testRunId}-${Date.now()}`,
      runId: this.testRunId,
      timestamp: new Date().toISOString(),
      mockup: feedback.mockup,
      section: feedback.section,
      score: feedback.score,
      issues: feedback.issues || [],
      screenshots: feedback.screenshots || [],
      accessibility: {
        contrastRatio: feedback.contrastRatio,
        focusIndicators: feedback.focusIndicators,
        keyboardNav: feedback.keyboardNav,
        screenReaderCompliant: feedback.screenReaderCompliant
      },
      responsive: {
        mobile: feedback.responsiveMobile,
        tablet: feedback.responsiveTablet,
        desktop: feedback.responsiveDesktop,
        overflow: feedback.hasOverflow
      },
      layout: {
        alignment: feedback.alignment,
        spacing: feedback.spacing,
        consistency: feedback.consistency
      }
    };

    this.metrics.visualFeedback.push(visualData);
    
    // Store in Firestore
    // await mcp.firestore.addDocument('visual_feedback', visualData);
    
    return visualData;
  }

  /**
   * Store performance metrics
   */
  async storePerformanceMetrics(metrics) {
    const perfData = {
      metricId: `perf-${this.testRunId}-${Date.now()}`,
      runId: this.testRunId,
      timestamp: new Date().toISOString(),
      persona: metrics.persona,
      mockup: metrics.mockup,
      pageLoadTime: metrics.pageLoadTime,
      apiResponseTime: metrics.apiResponseTime,
      pdfGenerationTime: metrics.pdfGenerationTime,
      firebaseOperationTime: metrics.firebaseOperationTime,
      memoryUsage: metrics.memoryUsage,
      cpuUsage: metrics.cpuUsage,
      errorRate: metrics.errorRate,
      retryCount: metrics.retryCount
    };

    this.metrics.performance.push(perfData);
    
    // Store in Firestore
    // await mcp.firestore.addDocument('performance_metrics', perfData);
    
    return perfData;
  }

  /**
   * Store PDF analysis results
   */
  async storePDFAnalysis(analysis) {
    const pdfData = {
      analysisId: `pdf-${this.testRunId}-${Date.now()}`,
      runId: this.testRunId,
      timestamp: new Date().toISOString(),
      persona: analysis.persona,
      mockup: analysis.mockup,
      generated: analysis.generated,
      fileSize: analysis.fileSize,
      pageCount: analysis.pageCount,
      sections: analysis.sections || [],
      formatting: {
        margins: analysis.margins,
        fontSize: analysis.fontSize,
        lineSpacing: analysis.lineSpacing,
        pageBreaks: analysis.pageBreaks
      },
      content: {
        allSectionsPresent: analysis.allSectionsPresent,
        dataAccurate: analysis.dataAccurate,
        chartsRendered: analysis.chartsRendered,
        noMissingValues: analysis.noMissingValues
      },
      quality: {
        resolution: analysis.resolution,
        professionalAppearance: analysis.professionalAppearance,
        brandingConsistent: analysis.brandingConsistent
      },
      storageUrl: analysis.storageUrl || null
    };

    // Upload PDF to Firebase Storage if available
    if (analysis.pdfBuffer) {
      // const storageUrl = await this.uploadPDFToStorage(analysis.pdfBuffer, analysisId);
      // pdfData.storageUrl = storageUrl;
    }

    // Store metadata in Firestore
    // await mcp.firestore.addDocument('pdf_analyses', pdfData);
    
    return pdfData;
  }

  /**
   * Store error/issue
   */
  async storeError(error) {
    const errorData = {
      errorId: `error-${this.testRunId}-${Date.now()}`,
      runId: this.testRunId,
      timestamp: new Date().toISOString(),
      persona: error.persona,
      mockup: error.mockup,
      type: error.type,
      severity: error.severity || 'medium',
      message: error.message,
      stack: error.stack,
      context: error.context,
      screenshot: error.screenshot || null
    };

    this.metrics.errors.push(errorData);
    
    // Store in Firestore
    // await mcp.firestore.addDocument('test_errors', errorData);
    
    return errorData;
  }

  /**
   * Get aggregated metrics
   */
  getAggregatedMetrics() {
    const aggregated = {
      testRunId: this.testRunId,
      duration: Date.now() - Date.parse(this.metrics.testRun.startTime),
      totalValidations: this.metrics.validations.length,
      passedValidations: this.metrics.validations.filter(v => v.passed).length,
      failedValidations: this.metrics.validations.filter(v => !v.passed).length,
      visualIssues: this.metrics.visualFeedback.reduce((sum, f) => sum + (f.issues?.length || 0), 0),
      averageVisualScore: this.calculateAverageScore(this.metrics.visualFeedback),
      performanceMetrics: this.aggregatePerformance(),
      errorCount: this.metrics.errors.length,
      criticalErrors: this.metrics.errors.filter(e => e.severity === 'high').length
    };

    // Calculate accuracy percentages
    aggregated.validationAccuracy = aggregated.totalValidations > 0 
      ? (aggregated.passedValidations / aggregated.totalValidations) * 100 
      : 0;

    return aggregated;
  }

  /**
   * Calculate average visual score
   */
  calculateAverageScore(feedbackArray) {
    if (feedbackArray.length === 0) return 0;
    const totalScore = feedbackArray.reduce((sum, f) => sum + (f.score || 0), 0);
    return Math.round(totalScore / feedbackArray.length);
  }

  /**
   * Aggregate performance metrics
   */
  aggregatePerformance() {
    if (this.metrics.performance.length === 0) return null;
    
    const perf = this.metrics.performance;
    return {
      avgPageLoadTime: this.average(perf.map(p => p.pageLoadTime)),
      avgApiResponseTime: this.average(perf.map(p => p.apiResponseTime)),
      avgPdfGenerationTime: this.average(perf.map(p => p.pdfGenerationTime)),
      avgFirebaseOperationTime: this.average(perf.map(p => p.firebaseOperationTime)),
      totalErrors: perf.reduce((sum, p) => sum + (p.errorRate || 0), 0),
      totalRetries: perf.reduce((sum, p) => sum + (p.retryCount || 0), 0)
    };
  }

  /**
   * Calculate average
   */
  average(numbers) {
    const filtered = numbers.filter(n => n !== null && n !== undefined);
    if (filtered.length === 0) return 0;
    return Math.round(filtered.reduce((a, b) => a + b, 0) / filtered.length);
  }

  /**
   * Generate Firebase dashboard data
   */
  async generateDashboardData() {
    const dashboard = {
      testRunId: this.testRunId,
      timestamp: new Date().toISOString(),
      summary: this.getAggregatedMetrics(),
      charts: {
        accuracyByPersona: this.getAccuracyByPersona(),
        issuesByType: this.getIssuesByType(),
        performanceTrends: this.getPerformanceTrends(),
        visualScores: this.getVisualScores()
      },
      recommendations: this.generateRecommendations()
    };

    // Store dashboard data
    // await mcp.firestore.addDocument('dashboard_data', dashboard);
    
    return dashboard;
  }

  /**
   * Get accuracy by persona
   */
  getAccuracyByPersona() {
    const byPersona = {};
    
    this.metrics.validations.forEach(v => {
      if (!byPersona[v.persona]) {
        byPersona[v.persona] = { passed: 0, total: 0 };
      }
      byPersona[v.persona].total++;
      if (v.passed) byPersona[v.persona].passed++;
    });

    return Object.entries(byPersona).map(([persona, data]) => ({
      persona,
      accuracy: (data.passed / data.total) * 100,
      total: data.total
    }));
  }

  /**
   * Get issues by type
   */
  getIssuesByType() {
    const byType = {};
    
    this.metrics.errors.forEach(e => {
      byType[e.type] = (byType[e.type] || 0) + 1;
    });
    
    this.metrics.visualFeedback.forEach(f => {
      (f.issues || []).forEach(issue => {
        byType[issue.type] = (byType[issue.type] || 0) + 1;
      });
    });

    return Object.entries(byType).map(([type, count]) => ({ type, count }));
  }

  /**
   * Get performance trends
   */
  getPerformanceTrends() {
    return this.metrics.performance.map(p => ({
      timestamp: p.timestamp,
      pageLoad: p.pageLoadTime,
      apiResponse: p.apiResponseTime,
      pdfGeneration: p.pdfGenerationTime
    }));
  }

  /**
   * Get visual scores
   */
  getVisualScores() {
    return this.metrics.visualFeedback.map(f => ({
      mockup: f.mockup,
      section: f.section,
      score: f.score,
      issues: f.issues?.length || 0
    }));
  }

  /**
   * Generate recommendations
   */
  generateRecommendations() {
    const recommendations = [];
    const metrics = this.getAggregatedMetrics();

    if (metrics.validationAccuracy < 95) {
      recommendations.push({
        priority: 'high',
        category: 'accuracy',
        message: 'Financial calculations need review - accuracy below 95%'
      });
    }

    if (metrics.averageVisualScore < 85) {
      recommendations.push({
        priority: 'medium',
        category: 'visual',
        message: 'Visual quality needs improvement - average score below 85%'
      });
    }

    if (metrics.criticalErrors > 0) {
      recommendations.push({
        priority: 'high',
        category: 'errors',
        message: `Fix ${metrics.criticalErrors} critical errors immediately`
      });
    }

    const perfMetrics = metrics.performanceMetrics;
    if (perfMetrics && perfMetrics.avgPageLoadTime > 3000) {
      recommendations.push({
        priority: 'medium',
        category: 'performance',
        message: 'Page load time exceeds 3 seconds - optimize performance'
      });
    }

    return recommendations;
  }

  /**
   * Export metrics for reporting
   */
  async exportMetrics() {
    const exportData = {
      testRun: this.metrics.testRun,
      summary: this.getAggregatedMetrics(),
      validations: this.metrics.validations,
      visualFeedback: this.metrics.visualFeedback,
      performance: this.metrics.performance,
      errors: this.metrics.errors,
      dashboard: await this.generateDashboardData()
    };

    return exportData;
  }
}

module.exports = FirebaseMetricsCollector;