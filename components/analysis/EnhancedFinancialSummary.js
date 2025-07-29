/**
 * Enhanced Financial Summary Component
 * Includes revenue comparison, interactive calculator, and key metrics with indicators
 */

import { Card } from '../ui/Card.js';
import { MetricBadge } from '../ui/Badge.js';
import { Button } from '../ui/Button.js';
import { EnhancedFinancialCalculator } from '../calculator/EnhancedFinancialCalculator.js';
import { RatingTooltip, InfoTooltip } from '../ui/Tooltip.js';

// Store analysis data globally for script access
window.analysisData = {
  strRevenue: 0,
  ltrRevenue: 0,
  monthlyExpenses: 0,
  propertyPrice: 0,
  downPayment: 0,
  expenses: {}
};

export const EnhancedFinancialSummary = ({ 
  analysis = {},
  className = ''
}) => {
  // Debug logging to trace data flow
  console.log('=== EnhancedFinancialSummary Data Flow Debug ===');
  console.log('Full analysis object:', analysis);
  console.log('analysis.propertyData:', analysis.propertyData);
  console.log('analysis.property_data:', analysis.property_data);
  console.log('analysis.data?.property_data:', analysis.data?.property_data);
  console.log('analysis.costs:', analysis.costs);
  console.log('analysis.expenses:', analysis.expenses);
  console.log('==============================================');
  // Extract values from analysis data
  const strRevenue = analysis.strAnalysis?.monthlyRevenue || analysis.short_term_rental?.monthly_revenue || 0;
  const ltrRevenue = analysis.longTermRental?.monthlyRent || analysis.long_term_rental?.monthly_rent || 0;
  const monthlyExpenses = analysis.costs?.totalMonthly || analysis.costs?.total_monthly_expenses || 0;
  const netCashFlow = strRevenue - monthlyExpenses;
  
  // Extract property price from various possible locations in the response
  const propertyPrice = analysis.propertyDetails?.estimatedValue || 
                       analysis.property_details?.estimated_value ||
                       analysis.propertyData?.price || 
                       analysis.property_data?.price ||
                       analysis.property?.price || 
                       analysis.purchase?.price ||
                       850000;
  const downPayment = analysis.purchase?.downPayment || analysis.purchase?.down_payment || (propertyPrice * 0.2);
  
  // Calculate metrics
  const annualNetIncome = netCashFlow * 12;
  const capRate = (annualNetIncome / propertyPrice) * 100;
  const cashOnCashReturn = (annualNetIncome / downPayment) * 100;
  const breakEvenOccupancy = (monthlyExpenses / strRevenue) * 100;
  
  const monthlyDifference = strRevenue - ltrRevenue;
  const annualDifference = monthlyDifference * 12;

  // Extract expense data from analysis with proper data source priority
  // 1. First check for actual property data from extension
  // 2. Then use analysis costs
  // 3. Finally fall back to calculated defaults
  
  // propertyData can be at different locations depending on API response structure
  // Check all possible locations where propertyData might exist
  const propertyData = 
    analysis.propertyData || 
    analysis.property_data || 
    analysis.property || 
    analysis.data?.propertyData ||
    analysis.data?.property_data ||
    window.analysisData?.propertyData ||
    window.extractedPropertyData || // From browser extension
    {};
    
  const costs = 
    analysis.costs || 
    analysis.expenses || 
    analysis.data?.costs ||
    analysis.data?.expenses ||
    {};
  
  // Log what data we have for debugging
  console.log('EnhancedFinancialSummary - propertyData found:', propertyData);
  console.log('  - propertyTaxes:', propertyData.propertyTaxes || propertyData.property_taxes);
  console.log('  - condoFees:', propertyData.condoFees || propertyData.condo_fees);
  console.log('  - propertyType:', propertyData.propertyType || propertyData.property_type);
  console.log('EnhancedFinancialSummary - costs found:', costs);
  console.log('  - property_tax_annual:', costs.property_tax_annual);
  console.log('  - calculation_method:', costs.calculation_method);
  console.log('  - hoa_monthly:', costs.hoa_monthly);
  console.log('EnhancedFinancialSummary - Full analysis object structure:');
  console.log('  - analysis.propertyData:', analysis.propertyData);
  console.log('  - analysis.property:', analysis.property);
  console.log('  - analysis.data:', analysis.data);
  
  // Property tax: Use actual from listing first
  const propertyTaxAnnual = propertyData.propertyTaxes || propertyData.property_taxes || costs.property_tax_annual || (propertyPrice * 0.01);
  
  // Calculate STR-specific expenses based on market data
  const strOccupancy = analysis.strAnalysis?.occupancy_rate || analysis.short_term_rental?.occupancy_rate || 0.7;
  
  // More realistic assumptions for cleaning
  // Average stay length varies by property type
  const avgStayLength = (() => {
    const propType = (propertyData.propertyType || propertyData.property_type || '').toLowerCase();
    if (propType.includes('condo') || propType.includes('apartment')) {
      return 5; // Urban condos: shorter stays
    } else if (propType.includes('house') || propType.includes('detached')) {
      return 7; // Houses: family vacations
    }
    return 6; // Default
  })();
  
  const turnoversPerMonth = Math.round((30 * strOccupancy) / avgStayLength);
  
  // Cleaning fee based on property size
  const bedrooms = analysis.propertyDetails?.bedrooms || propertyData.bedrooms || 3;
  const avgCleaningFee = (() => {
    if (bedrooms <= 2) return 75;
    if (bedrooms <= 3) return 100;
    if (bedrooms <= 4) return 125;
    return 150; // 5+ bedrooms
  })();
  
  const expenses = {
    propertyTax: Math.round(propertyTaxAnnual / 12),
    insurance: Math.round((costs.insurance_annual || propertyPrice * 0.004 * 1.25) / 12), // STR insurance is 25% higher
    hoaFees: (() => {
      // Check if condoFees exists (including 0 value)
      if ('condoFees' in propertyData) return propertyData.condoFees;
      if ('condo_fees' in propertyData) return propertyData.condo_fees;
      if ('hoa_monthly' in costs) return costs.hoa_monthly;
      return 0; // Default to 0 for houses
    })(), // Use actual condo fees or 0 for houses
    propertyMgmt: Math.round(strRevenue * 0.10), // 10% management fee
    utilities: costs.utilities_monthly || Math.round(200 * 1.4), // 40% higher for STR
    cleaning: avgCleaningFee * turnoversPerMonth, // More realistic based on property size and stay length
    maintenance: Math.round((costs.maintenance_annual || propertyPrice * 0.015) / 12), // 1.5% for STR
    supplies: Math.round(strRevenue * 0.04), // 4% for consumables
    platformFees: Math.round(strRevenue * 0.03), // 3% Airbnb fee
    otherExpenses: 150 // Internet, utilities premium, misc
  };

  // Store data globally for scripts
  window.analysisData.strRevenue = strRevenue;
  window.analysisData.ltrRevenue = ltrRevenue;
  window.analysisData.monthlyExpenses = monthlyExpenses;
  window.analysisData.propertyPrice = propertyPrice;
  window.analysisData.downPayment = downPayment;
  window.analysisData.expenses = expenses;
  window.analysisData.propertyData = propertyData;
  window.analysisData.costs = costs;

  return `
    <div class="space-y-2xl">
      <!-- Enhanced Financial Calculator -->
      <div class="mb-xl">
        ${EnhancedFinancialCalculator({ analysisData: analysis })}
      </div>

      <!-- Action Buttons with Share -->
      ${Card({
        children: `
          <div class="flex flex-col sm:flex-row flex-wrap gap-md lg:gap-lg justify-center">
            <button onclick="saveAnalysis()" class="btn btn-primary flex-1 sm:flex-none">
              💾 Save This Analysis
            </button>
            <button onclick="generateReport()" class="btn btn-secondary flex-1 sm:flex-none">
              📊 Generate Full Report
            </button>
            <button onclick="shareAnalysis()" class="btn btn-secondary flex-1 sm:flex-none">
              🔗 Share Analysis
            </button>
            <button onclick="analyzeAnother()" class="btn btn-secondary flex-1 sm:flex-none">
              🔍 Analyze Another Property
            </button>
          </div>
        `
      })}
    </div>

    <!-- Styles -->

    <style>
      /* Responsive metric cards */
      @media (max-width: 1024px) {
        #capRateValue, #roiValue, #cashFlowValue, #breakEvenValue {
          font-size: 1.25rem;
        }
      }
      
      @media (max-width: 768px) {
        #capRateValue, #roiValue, #cashFlowValue, #breakEvenValue {
          font-size: 1.125rem;
        }
      }
    </style>
    
    <!-- Script to load enhanced calculator with tooltips -->
    <script type="module">
      import { initializeFinancialCalculatorWithTooltips, updateFinancialCalculations, resetCalculatorEnhanced, updateInterestRate, updateDownPayment, toggleMethodology } from '/js/modules/financialCalculatorWithTooltips.js';
      
      // Make functions available globally
      window.updateFinancialCalculations = updateFinancialCalculations;
      window.resetCalculator = resetCalculatorEnhanced;
      window.updateInterestRate = updateInterestRate;
      window.updateDownPayment = updateDownPayment;
      window.toggleMethodology = toggleMethodology;
      window.initializeFinancialCalculatorWithTooltips = initializeFinancialCalculatorWithTooltips;
      
      // Initialize when DOM is ready
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeFinancialCalculatorWithTooltips);
      } else {
        initializeFinancialCalculatorWithTooltips();
      }
    </script>
  `;
};


// Export helper function to convert analysis data
export const FinancialSummaryFromAnalysis = ({ analysis }) => {
  return EnhancedFinancialSummary({ analysis });
};

// Initialize function to be called after component is rendered
export const initializeEnhancedFinancialSummary = () => {
  // Initialize financial calculator
  if (typeof initializeFinancialCalculator === 'function') {
    initializeFinancialCalculator();
  }

  // Update metric indicators with enhanced tooltips
  if (typeof updateMetricIndicatorsWithTooltips === 'function') {
    // Use enhanced version with tooltips
    updateMetricIndicatorsWithTooltips();
  } else if (typeof updateMetricIndicators === 'function') {
    // Fallback to regular version
    updateMetricIndicators();
  }
};