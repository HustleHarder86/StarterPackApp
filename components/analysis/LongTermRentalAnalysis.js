/**
 * Long-Term Rental Analysis Component
 * Displays comprehensive LTR market analysis matching STR design
 */

import { Card } from '../ui/Card.js';
import { MetricBadge, LiveDataBadge } from '../ui/Badge.js';

export const LongTermRentalAnalysis = ({ 
  analysis = {},
  className = '' 
}) => {
  // Extract LTR data from analysis
  const ltrData = analysis.longTermRental || analysis.long_term_rental || {};
  const comparables = ltrData.comparableProperties || ltrData.comparable_properties || [];
  const marketInsights = ltrData.marketInsights || ltrData.market_insights || {};
  
  // Property details for context
  const propertyData = analysis.propertyData || analysis.property_data || {};
  const address = propertyData.address || 'Property';
  const bedrooms = propertyData.bedrooms || 3;
  const propertyType = propertyData.propertyType || propertyData.property_type || 'Property';
  
  // Key metrics
  const monthlyRent = ltrData.monthlyRent || ltrData.monthly_rent || 3100;
  const annualRent = ltrData.annualRent || ltrData.annual_rent || (monthlyRent * 12);
  const vacancyRate = ltrData.vacancyRate || ltrData.vacancy_rate || 2.1;
  const avgRent = marketInsights.average_rent || marketInsights.averageRent || monthlyRent;
  const rentGrowth = marketInsights.rent_growth || marketInsights.rentGrowth || 5.2;
  const demandLevel = marketInsights.demand_level || marketInsights.demandLevel || 'High';
  const typicalTenant = marketInsights.typical_tenant || marketInsights.typicalTenant || 'Young families and professionals';
  
  // Calculate metrics
  const effectiveRent = monthlyRent * (1 - vacancyRate / 100);
  const annualGrowthValue = monthlyRent * (rentGrowth / 100) * 12;
  
  return `
    <div class="${className} space-y-xl">
      <!-- Header Section -->
      <div class="text-center mb-xl">
        <h2 class="text-3xl font-bold text-gray-900 mb-md">Long-Term Rental Analysis</h2>
        <p class="text-lg text-gray-600">
          Market analysis for ${bedrooms}-bedroom ${propertyType.toLowerCase()} in ${address.split(',')[1] || 'this area'}
        </p>
        ${LiveDataBadge({ text: 'AI Market Analysis • Updated April 2024' })}
      </div>

      <!-- Key Metrics Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-lg mb-xl">
        ${MetricCard({
          title: 'Monthly Rent',
          value: `$${monthlyRent.toLocaleString()}`,
          subtitle: 'Market rate',
          icon: '🏠',
          trend: rentGrowth > 0 ? 'up' : 'stable'
        })}
        ${MetricCard({
          title: 'Annual Income',
          value: `$${annualRent.toLocaleString()}`,
          subtitle: 'Before expenses',
          icon: '📈',
          trend: 'up'
        })}
        ${MetricCard({
          title: 'Vacancy Rate',
          value: `${vacancyRate}%`,
          subtitle: demandLevel + ' demand',
          icon: '📊',
          trend: vacancyRate < 3 ? 'up' : 'down'
        })}
        ${MetricCard({
          title: 'Rent Growth',
          value: `${rentGrowth}%`,
          subtitle: 'Year over year',
          icon: '🚀',
          trend: rentGrowth > 3 ? 'up' : 'stable'
        })}
      </div>

      <!-- Market Comparables Section -->
      ${Card({
        children: `
          <h3 class="text-xl font-bold text-gray-900 mb-lg">Comparable Rentals</h3>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-md mb-lg">
            ${comparables.map((comp, index) => ComparableCard({
              ...comp,
              index: index + 1,
              avgRent: avgRent
            })).join('')}
          </div>
          <div class="bg-blue-50 rounded-lg p-md">
            <p class="text-sm text-blue-800">
              <strong>Note:</strong> These are market-based estimates from AI analysis. For real listings, check Rentals.ca, Kijiji, or local property management companies.
            </p>
          </div>
        `,
        className: 'mb-xl'
      })}

      <!-- Market Insights Section -->
      ${Card({
        children: `
          <h3 class="text-xl font-bold text-gray-900 mb-lg">Market Insights</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-lg">
            <div>
              <h4 class="font-semibold text-gray-800 mb-sm">Rental Market Conditions</h4>
              <div class="space-y-sm">
                ${InsightRow('Market Demand', demandLevel, getDemandColor(demandLevel))}
                ${InsightRow('Typical Tenant', typicalTenant, 'blue')}
                ${InsightRow('Average Stay', '12-24 months', 'green')}
                ${InsightRow('Competition', vacancyRate < 3 ? 'High' : 'Moderate', 'yellow')}
              </div>
            </div>
            <div>
              <h4 class="font-semibold text-gray-800 mb-sm">Financial Projections</h4>
              <div class="space-y-sm">
                ${InsightRow('Effective Monthly Rent', `$${Math.round(effectiveRent).toLocaleString()}`, 'green')}
                ${InsightRow('Annual Growth Potential', `+$${Math.round(annualGrowthValue).toLocaleString()}`, 'purple')}
                ${InsightRow('5-Year Rent Estimate', `$${Math.round(monthlyRent * Math.pow(1 + rentGrowth/100, 5)).toLocaleString()}`, 'blue')}
                ${InsightRow('Market Stability', 'Excellent', 'green')}
              </div>
            </div>
          </div>
        `,
        className: 'mb-xl'
      })}

      <!-- Advantages & Considerations -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-lg mb-xl">
        ${Card({
          children: `
            <h4 class="font-semibold text-green-800 mb-md flex items-center">
              <span class="text-2xl mr-2">✅</span> Long-Term Rental Advantages
            </h4>
            <ul class="space-y-2 text-sm text-gray-700">
              <li class="flex items-start">
                <span class="text-green-500 mr-2">•</span>
                <span>Stable, predictable monthly income</span>
              </li>
              <li class="flex items-start">
                <span class="text-green-500 mr-2">•</span>
                <span>Lower management requirements (10-20 hours/year)</span>
              </li>
              <li class="flex items-start">
                <span class="text-green-500 mr-2">•</span>
                <span>Minimal furnishing costs</span>
              </li>
              <li class="flex items-start">
                <span class="text-green-500 mr-2">•</span>
                <span>Lower insurance and utility costs</span>
              </li>
              <li class="flex items-start">
                <span class="text-green-500 mr-2">•</span>
                <span>Tenant pays utilities in most cases</span>
              </li>
            </ul>
          `,
          className: 'h-full'
        })}
        ${Card({
          children: `
            <h4 class="font-semibold text-orange-800 mb-md flex items-center">
              <span class="text-2xl mr-2">⚠️</span> Considerations
            </h4>
            <ul class="space-y-2 text-sm text-gray-700">
              <li class="flex items-start">
                <span class="text-orange-500 mr-2">•</span>
                <span>Lower revenue potential vs STR</span>
              </li>
              <li class="flex items-start">
                <span class="text-orange-500 mr-2">•</span>
                <span>Subject to rent control regulations</span>
              </li>
              <li class="flex items-start">
                <span class="text-orange-500 mr-2">•</span>
                <span>Harder to adjust pricing</span>
              </li>
              <li class="flex items-start">
                <span class="text-orange-500 mr-2">•</span>
                <span>Potential for problem tenants</span>
              </li>
              <li class="flex items-start">
                <span class="text-orange-500 mr-2">•</span>
                <span>Wear and tear from long-term use</span>
              </li>
            </ul>
          `,
          className: 'h-full'
        })}
      </div>

      <!-- Data Sources -->
      <div class="bg-gray-50 rounded-lg p-lg">
        <h4 class="font-semibold text-gray-800 mb-sm">Data Sources & Methodology</h4>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-md text-sm text-gray-600">
          <div>
            <p class="font-medium text-gray-700 mb-1">AI Analysis Based On:</p>
            <ul class="space-y-1 ml-4">
              <li>• CMHC rental market reports</li>
              <li>• Local real estate board statistics</li>
              <li>• Census and demographic data</li>
              <li>• Historical rental trends (2020-2024)</li>
            </ul>
          </div>
          <div>
            <p class="font-medium text-gray-700 mb-1">Analysis Includes:</p>
            <ul class="space-y-1 ml-4">
              <li>• ${bedrooms}-bedroom ${propertyType.toLowerCase()} comparables</li>
              <li>• Local market conditions</li>
              <li>• Population & employment growth</li>
              <li>• Transit accessibility factors</li>
            </ul>
          </div>
        </div>
        <p class="text-xs text-gray-500 mt-md italic">
          Estimates generated by Perplexity AI using aggregated market data. Actual rents may vary based on specific property conditions and features.
        </p>
      </div>
    </div>
  `;
};

// Helper component for metric cards
function MetricCard({ title, value, subtitle, icon, trend }) {
  const trendIcon = trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→';
  const trendColor = trend === 'up' ? 'green' : trend === 'down' ? 'red' : 'gray';
  
  return Card({
    children: `
      <div class="text-center">
        <div class="text-3xl mb-2">${icon}</div>
        <div class="text-2xl font-bold text-gray-900">${value}</div>
        <div class="text-sm text-gray-600 mt-1">${title}</div>
        <div class="text-xs text-${trendColor}-600 mt-2 flex items-center justify-center">
          <span class="mr-1">${trendIcon}</span>
          ${subtitle}
        </div>
      </div>
    `,
    className: 'hover:shadow-lg transition-shadow'
  });
}

// Helper component for comparable cards
function ComparableCard({ address, rent, distance, index, avgRent }) {
  const rentDiff = rent - avgRent;
  const diffPercent = Math.round((rentDiff / avgRent) * 100);
  
  return `
    <div class="bg-white border border-gray-200 rounded-lg p-md hover:shadow-md transition-shadow">
      <div class="flex items-start justify-between mb-sm">
        <span class="text-sm font-semibold text-gray-500">Comparable #${index}</span>
        <span class="text-xs text-gray-500">${distance}</span>
      </div>
      <p class="text-sm text-gray-700 mb-sm">${address}</p>
      <div class="flex items-end justify-between">
        <div>
          <p class="text-xl font-bold text-gray-900">$${rent.toLocaleString()}</p>
          <p class="text-xs text-gray-500">per month</p>
        </div>
        ${diffPercent !== 0 ? `
          <span class="text-xs ${rentDiff > 0 ? 'text-green-600' : 'text-red-600'}">
            ${rentDiff > 0 ? '+' : ''}${diffPercent}%
          </span>
        ` : ''}
      </div>
    </div>
  `;
}

// Helper component for insight rows
function InsightRow(label, value, color) {
  return `
    <div class="flex justify-between items-center py-2 border-b border-gray-100">
      <span class="text-sm text-gray-600">${label}:</span>
      <span class="text-sm font-medium text-${color}-600">${value}</span>
    </div>
  `;
}

// Helper function to get demand color
function getDemandColor(demand) {
  const demandLower = demand.toLowerCase();
  if (demandLower.includes('high')) return 'green';
  if (demandLower.includes('moderate')) return 'yellow';
  return 'red';
}