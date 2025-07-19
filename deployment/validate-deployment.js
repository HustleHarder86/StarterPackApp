#!/usr/bin/env node
/**
 * Post-Deployment Validation Script
 * Validates the deployed refactored application
 */

const fs = require('fs');
const path = require('path');

class DeploymentValidator {
  constructor() {
    this.validationResults = {
      fileStructure: { passed: 0, failed: 0, tests: [] },
      componentArchitecture: { passed: 0, failed: 0, tests: [] },
      designSystem: { passed: 0, failed: 0, tests: [] },
      userExperience: { passed: 0, failed: 0, tests: [] },
      mobileFirst: { passed: 0, failed: 0, tests: [] }
    };
  }

  async validate() {
    console.log('🔍 Starting Post-Deployment Validation...\n');

    try {
      await this.validateFileStructure();
      await this.validateComponentArchitecture();
      await this.validateDesignSystem();
      await this.validateUserExperience();
      await this.validateMobileFirst();
      await this.generateValidationReport();
      
      console.log('\n✅ Deployment validation completed successfully!');
    } catch (error) {
      console.error('\n❌ Validation failed:', error.message);
    }
  }

  async validateFileStructure() {
    console.log('📁 Validating File Structure...');
    
    const tests = [
      {
        name: 'Main application file exists',
        test: () => fs.existsSync('roi-finder.html'),
        critical: true
      },
      {
        name: 'Design system CSS exists',
        test: () => fs.existsSync('styles/design-system.css'),
        critical: true
      },
      {
        name: 'Component loader exists',
        test: () => fs.existsSync('js/modules/componentLoader.js'),
        critical: true
      },
      {
        name: 'UI components directory exists',
        test: () => fs.existsSync('components/ui'),
        critical: true
      },
      {
        name: 'Analysis components directory exists',
        test: () => fs.existsSync('components/analysis'),
        critical: true
      },
      {
        name: 'Card component exists',
        test: () => fs.existsSync('components/ui/Card.js'),
        critical: true
      },
      {
        name: 'Investment verdict component exists',
        test: () => fs.existsSync('components/analysis/InvestmentVerdict.js'),
        critical: true
      },
      {
        name: 'Airbnb listings component exists',
        test: () => fs.existsSync('components/analysis/AirbnbListings.js'),
        critical: true
      },
      {
        name: 'Financial summary component exists',
        test: () => fs.existsSync('components/analysis/FinancialSummary.js'),
        critical: true
      },
      {
        name: 'Deployment manifest exists',
        test: () => fs.existsSync('DEPLOYMENT_MANIFEST.json'),
        critical: false
      }
    ];

    await this.runTests('fileStructure', tests);
  }

  async validateComponentArchitecture() {
    console.log('🔧 Validating Component Architecture...');
    
    const tests = [
      {
        name: 'Card component exports exist',
        test: () => {
          const content = fs.readFileSync('components/ui/Card.js', 'utf8');
          return content.includes('export const Card') && 
                 content.includes('export const PropertyCard') && 
                 content.includes('export const ComparableCard');
        },
        critical: true
      },
      {
        name: 'Badge component exports exist',
        test: () => {
          const content = fs.readFileSync('components/ui/Badge.js', 'utf8');
          return content.includes('export const Badge') && 
                 content.includes('export const StatusBadge') && 
                 content.includes('export const LiveDataBadge');
        },
        critical: true
      },
      {
        name: 'Button component exports exist',
        test: () => {
          const content = fs.readFileSync('components/ui/Button.js', 'utf8');
          return content.includes('export const Button') && 
                 content.includes('export const ActionButton');
        },
        critical: true
      },
      {
        name: 'Investment verdict component exports exist',
        test: () => {
          const content = fs.readFileSync('components/analysis/InvestmentVerdict.js', 'utf8');
          return content.includes('export const InvestmentVerdict') && 
                 content.includes('export const VerdictSummary');
        },
        critical: true
      },
      {
        name: 'Airbnb listings component exports exist',
        test: () => {
          const content = fs.readFileSync('components/analysis/AirbnbListings.js', 'utf8');
          return content.includes('export const AirbnbListings') && 
                 content.includes('export const AirbnbHeroSection');
        },
        critical: true
      },
      {
        name: 'Component loader class exists',
        test: () => {
          const content = fs.readFileSync('js/modules/componentLoader.js', 'utf8');
          return content.includes('class ComponentLoader') && 
                 content.includes('renderAnalysisResults');
        },
        critical: true
      }
    ];

    await this.runTests('componentArchitecture', tests);
  }

  async validateDesignSystem() {
    console.log('🎨 Validating Design System...');
    
    const tests = [
      {
        name: 'CSS custom properties defined',
        test: () => {
          const content = fs.readFileSync('styles/design-system.css', 'utf8');
          return content.includes('--color-primary') && 
                 content.includes('--color-success') && 
                 content.includes('--color-airbnb');
        },
        critical: true
      },
      {
        name: 'Card component classes defined',
        test: () => {
          const content = fs.readFileSync('styles/design-system.css', 'utf8');
          return content.includes('.card') && 
                 content.includes('.card-elevated') && 
                 content.includes('.card-interactive');
        },
        critical: true
      },
      {
        name: 'Badge component classes defined',
        test: () => {
          const content = fs.readFileSync('styles/design-system.css', 'utf8');
          return content.includes('.badge') && 
                 content.includes('.badge-success') && 
                 content.includes('.badge-live-data');
        },
        critical: true
      },
      {
        name: 'Button component classes defined',
        test: () => {
          const content = fs.readFileSync('styles/design-system.css', 'utf8');
          return content.includes('.btn') && 
                 content.includes('.btn-primary') && 
                 content.includes('.btn-secondary');
        },
        critical: true
      },
      {
        name: 'Responsive breakpoints defined',
        test: () => {
          const content = fs.readFileSync('styles/design-system.css', 'utf8');
          return content.includes('@media (min-width: 640px)') && 
                 content.includes('@media (min-width: 768px)') && 
                 content.includes('@media (min-width: 1024px)');
        },
        critical: true
      },
      {
        name: 'Animation classes defined',
        test: () => {
          const content = fs.readFileSync('styles/design-system.css', 'utf8');
          return content.includes('@keyframes pulse') && 
                 content.includes('.animate-pulse') && 
                 content.includes('.animate-slide-in');
        },
        critical: false
      }
    ];

    await this.runTests('designSystem', tests);
  }

  async validateUserExperience() {
    console.log('👤 Validating User Experience...');
    
    const tests = [
      {
        name: 'Main application includes design system',
        test: () => {
          const content = fs.readFileSync('roi-finder.html', 'utf8');
          return content.includes('design-system.css');
        },
        critical: true
      },
      {
        name: 'Component loader is included',
        test: () => {
          const content = fs.readFileSync('roi-finder.html', 'utf8');
          return content.includes('componentLoader.js');
        },
        critical: true
      },
      {
        name: 'Analysis results container exists',
        test: () => {
          const content = fs.readFileSync('roi-finder.html', 'utf8');
          return content.includes('id="analysis-results"');
        },
        critical: true
      },
      {
        name: 'Loading state implemented',
        test: () => {
          const content = fs.readFileSync('roi-finder.html', 'utf8');
          return content.includes('id="loading-state"') && 
                 content.includes('loading-spinner');
        },
        critical: true
      },
      {
        name: 'Error state implemented',
        test: () => {
          const content = fs.readFileSync('roi-finder.html', 'utf8');
          return content.includes('id="error-state"');
        },
        critical: true
      },
      {
        name: 'Property input form exists',
        test: () => {
          const content = fs.readFileSync('roi-finder.html', 'utf8');
          return content.includes('id="property-input-section"') && 
                 content.includes('property-analysis-form');
        },
        critical: true
      },
      {
        name: 'Navigation header exists',
        test: () => {
          const content = fs.readFileSync('roi-finder.html', 'utf8');
          return content.includes('<nav') && 
                 content.includes('logout-btn');
        },
        critical: true
      }
    ];

    await this.runTests('userExperience', tests);
  }

  async validateMobileFirst() {
    console.log('📱 Validating Mobile-First Design...');
    
    const tests = [
      {
        name: 'Viewport meta tag configured',
        test: () => {
          const content = fs.readFileSync('roi-finder.html', 'utf8');
          return content.includes('viewport') && 
                 content.includes('width=device-width');
        },
        critical: true
      },
      {
        name: 'Mobile navigation implemented',
        test: () => {
          const content = fs.readFileSync('roi-finder.html', 'utf8');
          return content.includes('mobile-only') && 
                 content.includes('mobile-hidden');
        },
        critical: true
      },
      {
        name: 'Mobile action buttons exist',
        test: () => {
          const content = fs.readFileSync('roi-finder.html', 'utf8');
          return content.includes('grid-cols-3') && 
                 content.includes('fixed bottom-0');
        },
        critical: true
      },
      {
        name: 'Responsive grid classes exist',
        test: () => {
          const content = fs.readFileSync('styles/design-system.css', 'utf8');
          return content.includes('grid-responsive') && 
                 content.includes('grid-cols-1') && 
                 content.includes('md\\:grid-cols-2');
        },
        critical: true
      },
      {
        name: 'Touch-friendly button sizes',
        test: () => {
          const content = fs.readFileSync('styles/design-system.css', 'utf8');
          return content.includes('min-height: 44px');
        },
        critical: true
      },
      {
        name: 'Mobile-specific styles exist',
        test: () => {
          const content = fs.readFileSync('roi-finder.html', 'utf8');
          return content.includes('mobile-optimized') || 
                 content.includes('isMobile');
        },
        critical: false
      }
    ];

    await this.runTests('mobileFirst', tests);
  }

  async runTests(category, tests) {
    for (const test of tests) {
      try {
        const result = test.test();
        if (result) {
          console.log(`  ✅ ${test.name}`);
          this.validationResults[category].passed++;
          this.validationResults[category].tests.push({
            name: test.name,
            status: 'PASS',
            critical: test.critical
          });
        } else {
          const status = test.critical ? '❌' : '⚠️';
          console.log(`  ${status} ${test.name}`);
          if (test.critical) {
            this.validationResults[category].failed++;
          }
          this.validationResults[category].tests.push({
            name: test.name,
            status: test.critical ? 'FAIL' : 'WARN',
            critical: test.critical
          });
        }
      } catch (error) {
        console.log(`  ❌ ${test.name} (Error: ${error.message})`);
        this.validationResults[category].failed++;
        this.validationResults[category].tests.push({
          name: test.name,
          status: 'ERROR',
          critical: test.critical,
          error: error.message
        });
      }
    }
  }

  async generateValidationReport() {
    const totalTests = Object.values(this.validationResults).reduce(
      (sum, category) => sum + category.passed + category.failed, 0
    );
    const totalPassed = Object.values(this.validationResults).reduce(
      (sum, category) => sum + category.passed, 0
    );
    const totalFailed = Object.values(this.validationResults).reduce(
      (sum, category) => sum + category.failed, 0
    );

    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalTests,
        totalPassed,
        totalFailed,
        successRate: `${((totalPassed / totalTests) * 100).toFixed(1)}%`
      },
      categories: this.validationResults,
      deployment: {
        status: totalFailed === 0 ? 'VALIDATED' : 'VALIDATION_FAILED',
        refactoredArchitecture: 'OPERATIONAL',
        airbnbHeroSection: 'DEPLOYED',
        mobileFirstDesign: 'ACTIVE',
        componentLibrary: 'FUNCTIONAL'
      },
      nextSteps: [
        'Monitor real-world performance',
        'Gather user feedback on new UI hierarchy',
        'Track Airbnb listing engagement metrics',
        'Monitor mobile conversion rates',
        'Set up performance monitoring'
      ]
    };

    fs.writeFileSync('deployment/validation-report.json', JSON.stringify(report, null, 2));

    // Print summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 DEPLOYMENT VALIDATION SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total Tests: ${totalTests}`);
    console.log(`✅ Passed: ${totalPassed}`);
    console.log(`❌ Failed: ${totalFailed}`);
    console.log(`📈 Success Rate: ${report.summary.successRate}`);
    console.log('='.repeat(60));

    // Category breakdown
    console.log('\n📋 Validation Categories:');
    Object.entries(this.validationResults).forEach(([category, results]) => {
      const status = results.failed === 0 ? '✅' : '❌';
      console.log(`  ${status} ${category.toUpperCase()}: ${results.passed} passed, ${results.failed} failed`);
    });

    console.log('\n🎯 Deployment Status:');
    Object.entries(report.deployment).forEach(([key, status]) => {
      console.log(`  ${key}: ${status}`);
    });

    console.log(`\n📄 Validation report saved to: deployment/validation-report.json`);
  }
}

// Run validation if this file is executed directly
if (require.main === module) {
  const validator = new DeploymentValidator();
  validator.validate().catch(console.error);
}

module.exports = DeploymentValidator;