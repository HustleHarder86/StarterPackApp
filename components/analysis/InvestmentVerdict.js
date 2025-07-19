/**
 * Investment Verdict Component
 * Main recommendation section with clear investment guidance
 */

import { Card } from '../ui/Card.js';
import { StatusBadge, MetricBadge } from '../ui/Badge.js';

export const InvestmentVerdict = ({ 
  recommendation = 'recommended',
  confidence = 'High',
  strategy = 'Short-Term Rental',
  monthlyRevenue = 0,
  monthlyDifference = 0,
  roi = 0,
  score = 0,
  insights = []
}) => {
  const verdictConfig = {
    recommended: {
      color: 'green',
      icon: '✓',
      title: 'RECOMMENDED INVESTMENT',
      subtitle: 'Strong potential for positive returns'
    },
    caution: {
      color: 'yellow',
      icon: '⚠',
      title: 'PROCEED WITH CAUTION',
      subtitle: 'Mixed indicators, requires careful consideration'
    },
    'not-recommended': {
      color: 'red',
      icon: '✗',
      title: 'NOT RECOMMENDED',
      subtitle: 'Poor investment potential identified'
    }
  };

  const config = verdictConfig[recommendation] || verdictConfig.recommended;

  return Card({
    children: `
      <div class="flex items-center justify-between mb-xl">
        <div>
          ${StatusBadge({ status: recommendation, confidence })}
          <h2 class="text-2xl font-bold text-gray-900 mt-md mb-sm">${strategy}</h2>
          <p class="text-gray-600">${config.subtitle}</p>
        </div>
        <div class="text-right">
          <div class="bg-${config.color}-50 px-xl py-lg rounded-xl border border-${config.color}-200">
            <div class="text-sm text-${config.color}-700 font-medium">Projected Revenue</div>
            <div class="text-3xl font-bold text-${config.color}-600">$${monthlyRevenue.toLocaleString()}/mo</div>
            ${monthlyDifference > 0 ? `<div class="text-xs text-${config.color}-600">+$${monthlyDifference.toLocaleString()} over LTR</div>` : ''}
          </div>
        </div>
      </div>
      
      <!-- Key Metrics Grid -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-lg mb-xl">
        <div class="bg-gray-50 rounded-lg p-lg text-center">
          ${MetricBadge({ 
            label: 'Investment Score', 
            value: `${score}/10`,
            trend: score >= 7 ? 'up' : score <= 4 ? 'down' : null
          })}
        </div>
        <div class="bg-gray-50 rounded-lg p-lg text-center">
          ${MetricBadge({ 
            label: 'Annual ROI', 
            value: `${roi}%`,
            trend: roi >= 10 ? 'up' : roi <= 5 ? 'down' : null
          })}
        </div>
        <div class="bg-gray-50 rounded-lg p-lg text-center">
          ${MetricBadge({ 
            label: 'Revenue Advantage', 
            value: `+${Math.round((monthlyDifference / (monthlyRevenue - monthlyDifference)) * 100)}%`,
            trend: 'up'
          })}
        </div>
      </div>

      <!-- Key Insights -->
      ${insights.length > 0 ? `
        <div class="space-y-md">
          <h4 class="font-semibold text-gray-900">Key Insights:</h4>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-lg">
            ${insights.slice(0, 3).map(insight => `
              <div class="bg-gray-50 rounded-lg p-lg">
                <div class="flex items-center gap-md mb-sm">
                  <div class="w-3 h-3 bg-${config.color}-500 rounded-full"></div>
                  <span class="font-semibold text-gray-900">${insight.title}</span>
                </div>
                <div class="text-sm text-gray-600">${insight.description}</div>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}
    `,
    className: `border-l-4 border-${config.color}-500`,
    elevated: true
  });
};

export const QuickVerdict = ({ 
  recommendation = 'recommended',
  monthlyRevenue = 0,
  advantage = 0,
  score = 0 
}) => {
  const isRecommended = recommendation === 'recommended';
  const color = isRecommended ? 'green' : recommendation === 'caution' ? 'yellow' : 'red';
  
  return `
    <div class="bg-${color}-50 border border-${color}-200 rounded-xl p-lg mb-xl">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-md">
          <div class="w-8 h-8 bg-${color}-500 rounded-full flex items-center justify-center text-white font-bold">
            ${isRecommended ? '✓' : recommendation === 'caution' ? '⚠' : '✗'}
          </div>
          <div>
            <div class="font-bold text-${color}-800 text-lg">
              ${isRecommended ? 'Recommended' : recommendation === 'caution' ? 'Proceed with Caution' : 'Not Recommended'}
            </div>
            <div class="text-sm text-${color}-700">
              ${advantage > 0 ? `+${advantage}% more revenue than LTR` : 'Limited revenue potential'}
            </div>
          </div>
        </div>
        <div class="text-right">
          <div class="text-2xl font-bold text-${color}-600">$${monthlyRevenue.toLocaleString()}</div>
          <div class="text-sm text-${color}-700">${score}/10 score</div>
        </div>
      </div>
    </div>
  `;
};

export const VerdictSummary = ({ analysis }) => {
  if (!analysis) return '';
  
  const monthlyRevenue = analysis.strAnalysis?.monthlyRevenue || 0;
  const ltrRevenue = analysis.longTermRental?.monthlyRent || 0;
  const advantage = ltrRevenue > 0 ? Math.round(((monthlyRevenue - ltrRevenue) / ltrRevenue) * 100) : 0;
  
  return InvestmentVerdict({
    recommendation: analysis.overallScore >= 7 ? 'recommended' : analysis.overallScore >= 5 ? 'caution' : 'not-recommended',
    confidence: analysis.overallScore >= 8 ? 'High' : analysis.overallScore >= 6 ? 'Medium' : 'Low',
    strategy: monthlyRevenue > ltrRevenue ? 'Short-Term Rental (Airbnb)' : 'Long-Term Rental',
    monthlyRevenue,
    monthlyDifference: Math.max(0, monthlyRevenue - ltrRevenue),
    roi: analysis.longTermRental?.roi || 0,
    score: analysis.overallScore || 0,
    insights: analysis.recommendations?.slice(0, 3).map(rec => ({
      title: rec.title || 'Market Insight',
      description: rec.description || rec
    })) || []
  });
};