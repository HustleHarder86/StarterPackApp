/**
 * Consolidated Investment Verdict Component
 * Combines the best features from all versions:
 * - Clean structure from base version
 * - Visual design from Enhanced version
 * - Flexible recommendation system from Mockup version
 */

import { Card } from '../ui/Card.js';
import { StatusBadge, MetricBadge } from '../ui/Badge.js';

/**
 * Main InvestmentVerdict Component
 * @param {Object} props - Component properties
 * @param {string} props.recommendation - 'recommended', 'caution', or 'not-recommended'
 * @param {string} props.confidence - Confidence level ('High', 'Medium', 'Low')
 * @param {string} props.strategy - Investment strategy (e.g., 'Short-Term Rental')
 * @param {number} props.monthlyRevenue - Projected monthly revenue
 * @param {number} props.monthlyDifference - Difference vs alternative strategy
 * @param {number} props.roi - Return on investment percentage
 * @param {number} props.score - Overall investment score
 * @param {Array} props.insights - Key insights array
 * @param {boolean} props.enhanced - Use enhanced visual mode
 * @param {Object} props.propertyData - Property details for header
 * @returns {string} HTML string for the component
 */
export const InvestmentVerdict = ({ 
  recommendation = 'recommended',
  confidence = 'High',
  strategy = 'Short-Term Rental',
  monthlyRevenue = 0,
  monthlyDifference = 0,
  roi = 0,
  score = 0,
  insights = [],
  enhanced = true,
  propertyData = {}
}) => {
  const verdictConfig = getVerdictConfig(recommendation);
  
  if (enhanced && propertyData.address) {
    return renderEnhancedVerdict({
      recommendation,
      confidence,
      strategy,
      monthlyRevenue,
      monthlyDifference,
      roi,
      score,
      insights,
      propertyData,
      verdictConfig
    });
  }
  
  return renderStandardVerdict({
    recommendation,
    confidence,
    strategy,
    monthlyRevenue,
    monthlyDifference,
    roi,
    score,
    insights,
    verdictConfig
  });
};

/**
 * Render enhanced verdict with gradient header
 */
function renderEnhancedVerdict(props) {
  const {
    recommendation,
    confidence,
    strategy,
    monthlyRevenue,
    monthlyDifference,
    roi,
    propertyData,
    verdictConfig
  } = props;
  
  return `
    <div class="investment-verdict-enhanced">
      <!-- Gradient header -->
      <div class="bg-gradient-to-r from-purple-600 to-purple-700 text-white px-6 py-6 rounded-t-xl">
        <div class="max-w-7xl mx-auto">
          <h1 class="text-3xl font-bold mb-2">Property Investment Analysis</h1>
          <div class="text-purple-100">${propertyData.address || 'Property Analysis'}</div>
        </div>
      </div>
      
      <!-- Main verdict card -->
      <div class="bg-white rounded-b-xl shadow-lg p-6 relative">
        <!-- Recommendation badges -->
        <div class="flex items-center gap-2 mb-4">
          <span class="px-3 py-1 bg-${verdictConfig.color}-500 text-white text-xs font-bold rounded-full">
            ${verdictConfig.icon} ${verdictConfig.title}
          </span>
          <span class="px-3 py-1 bg-${getConfidenceColor(confidence)}-500 text-white text-xs font-bold rounded-full">
            ${confidence.toUpperCase()} CONFIDENCE
          </span>
        </div>
        
        <!-- Title and stats -->
        <div class="flex items-center justify-between">
          <div>
            <h2 class="text-2xl font-bold text-gray-900 mb-1">${strategy}</h2>
            <p class="text-gray-600">${verdictConfig.subtitle}</p>
          </div>
          <div class="text-right">
            <div class="bg-gradient-to-r from-${verdictConfig.gradientFrom} to-${verdictConfig.gradientTo} text-white px-6 py-4 rounded-lg">
              <div class="text-sm font-medium mb-1">Projected Revenue</div>
              <div class="text-3xl font-bold">$${monthlyRevenue.toLocaleString()}/mo</div>
              ${monthlyDifference ? `
                <div class="text-xs mt-1">
                  ${monthlyDifference > 0 ? '+' : ''}$${Math.abs(monthlyDifference).toLocaleString()} vs LTR
                </div>
              ` : ''}
            </div>
          </div>
        </div>
        
        <!-- Key metrics -->
        ${roi || score ? `
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            ${roi ? MetricBadge({ label: 'ROI', value: `${roi}%`, variant: verdictConfig.variant }) : ''}
            ${score ? MetricBadge({ label: 'Investment Score', value: `${score}/100`, variant: verdictConfig.variant }) : ''}
          </div>
        ` : ''}
      </div>
    </div>
  `;
}

/**
 * Render standard verdict
 */
function renderStandardVerdict(props) {
  const {
    recommendation,
    confidence,
    strategy,
    monthlyRevenue,
    monthlyDifference,
    roi,
    score,
    insights,
    verdictConfig
  } = props;
  
  return Card({
    elevated: true,
    children: `
      <div class="flex items-center justify-between mb-6">
        <div>
          ${StatusBadge({ status: recommendation, confidence })}
          <h2 class="text-2xl font-bold text-gray-900 mt-3 mb-1">${strategy}</h2>
          <p class="text-gray-600">${verdictConfig.subtitle}</p>
        </div>
        <div class="text-right">
          <div class="bg-gray-50 px-4 py-3 rounded-lg">
            <div class="text-sm text-gray-600 mb-1">Projected Revenue</div>
            <div class="text-2xl font-bold text-${verdictConfig.color}-600">
              $${monthlyRevenue.toLocaleString()}/mo
            </div>
            ${monthlyDifference ? `
              <div class="text-sm text-gray-600 mt-1">
                ${monthlyDifference > 0 ? '+' : ''}$${Math.abs(monthlyDifference).toLocaleString()} vs LTR
              </div>
            ` : ''}
          </div>
        </div>
      </div>
      
      <!-- Key Metrics Grid -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        ${MetricBadge({ 
          label: 'ROI', 
          value: roi ? `${roi}%` : 'N/A',
          variant: verdictConfig.variant 
        })}
        ${MetricBadge({ 
          label: 'Investment Score', 
          value: score ? `${score}/100` : 'N/A',
          variant: verdictConfig.variant 
        })}
        ${MetricBadge({ 
          label: 'Market Strength', 
          value: confidence,
          variant: verdictConfig.variant 
        })}
        ${MetricBadge({ 
          label: 'Risk Level', 
          value: getRiskLevel(recommendation),
          variant: verdictConfig.variant 
        })}
      </div>
      
      <!-- Key Insights -->
      ${insights && insights.length > 0 ? `
        <div class="border-t pt-4">
          <h3 class="font-semibold text-gray-800 mb-3">Key Insights</h3>
          <ul class="space-y-2">
            ${insights.map(insight => `
              <li class="flex items-start">
                <span class="text-${verdictConfig.color}-500 mr-2">•</span>
                <span class="text-gray-700">${insight}</span>
              </li>
            `).join('')}
          </ul>
        </div>
      ` : ''}
    `
  });
}

/**
 * Get verdict configuration based on recommendation
 */
function getVerdictConfig(recommendation) {
  const configs = {
    recommended: {
      color: 'green',
      icon: '✓',
      title: 'RECOMMENDED',
      subtitle: 'Strong potential for positive returns',
      variant: 'success',
      gradientFrom: 'green-500',
      gradientTo: 'emerald-500'
    },
    caution: {
      color: 'yellow',
      icon: '⚠',
      title: 'PROCEED WITH CAUTION',
      subtitle: 'Mixed indicators, requires careful consideration',
      variant: 'warning',
      gradientFrom: 'yellow-500',
      gradientTo: 'orange-500'
    },
    'not-recommended': {
      color: 'red',
      icon: '✗',
      title: 'NOT RECOMMENDED',
      subtitle: 'Poor investment potential identified',
      variant: 'danger',
      gradientFrom: 'red-500',
      gradientTo: 'pink-500'
    }
  };
  
  return configs[recommendation] || configs.recommended;
}

/**
 * Get confidence color
 */
function getConfidenceColor(confidence) {
  const colors = {
    'High': 'blue',
    'Medium': 'yellow',
    'Low': 'red'
  };
  return colors[confidence] || 'gray';
}

/**
 * Get risk level based on recommendation
 */
function getRiskLevel(recommendation) {
  const riskLevels = {
    'recommended': 'Low',
    'caution': 'Medium',
    'not-recommended': 'High'
  };
  return riskLevels[recommendation] || 'Unknown';
}

// Export helper components
export const InvestmentVerdictEmpty = () => {
  return Card({
    children: `
      <div class="text-center py-8">
        <div class="text-gray-400 mb-4">
          <svg class="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <h3 class="text-lg font-semibold text-gray-700 mb-2">Analysis Pending</h3>
        <p class="text-gray-600">Investment recommendation will appear here once analysis is complete.</p>
      </div>
    `
  });
};