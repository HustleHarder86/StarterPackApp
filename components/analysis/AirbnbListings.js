/**
 * Airbnb Listings Component - HERO SECTION
 * Prominent display of live market comparables
 */

import { Card, ComparableCard } from '../ui/Card.js';
import { LiveDataBadge, PerformanceBadge, MetricBadge } from '../ui/Badge.js';
import { Button } from '../ui/Button.js';

export const AirbnbListings = ({ 
  comparables = [],
  marketData = {},
  lastUpdated = 'just now',
  className = ''
}) => {
  if (!comparables || comparables.length === 0) {
    return AirbnbListingsEmpty();
  }

  const topComparables = comparables.slice(0, 6);
  const averageRate = marketData.averageRate || Math.round(comparables.reduce((sum, comp) => sum + comp.nightly_rate, 0) / comparables.length);
  const averageOccupancy = marketData.averageOccupancy || Math.round(comparables.reduce((sum, comp) => sum + comp.occupancy_rate, 0) / comparables.length);
  const averageRevenue = marketData.averageRevenue || Math.round(comparables.reduce((sum, comp) => sum + comp.monthly_revenue, 0) / comparables.length);

  return Card({
    children: `
      <!-- Header Section -->
      <div class="flex items-center justify-between mb-2xl">
        <div>
          <h2 class="text-2xl font-bold text-gray-900 mb-sm">Live Airbnb Market Data</h2>
          <div class="flex items-center gap-md">
            <div class="flex items-center gap-sm text-green-600">
              <div class="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span class="text-sm font-medium">${comparables.length} active listings found</span>
            </div>
            <span class="text-gray-300">•</span>
            <span class="text-sm text-gray-600">Updated ${lastUpdated}</span>
          </div>
        </div>
        ${LiveDataBadge({ lastUpdated })}
      </div>

      <!-- Market Summary Stats -->
      <div class="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-lg mb-2xl">
        <div class="grid grid-cols-2 md:grid-cols-4 gap-lg text-center">
          ${MetricBadge({ label: 'Avg Nightly Rate', value: `$${averageRate}` })}
          ${MetricBadge({ label: 'Avg Occupancy', value: `${averageOccupancy}%` })}
          ${MetricBadge({ label: 'Avg Revenue', value: `$${averageRevenue.toLocaleString()}` })}
          ${MetricBadge({ label: 'Active Properties', value: comparables.length })}
        </div>
      </div>

      <!-- Comparable Properties Grid -->
      <div class="grid grid-responsive gap-lg mb-xl">
        ${topComparables.map(comparable => ComparableCard({ comparable })).join('')}
      </div>

      <!-- View More Section -->
      ${comparables.length > 6 ? `
        <div class="text-center">
          ${Button({
            children: `View All ${comparables.length} Properties`,
            variant: 'outline',
            onclick: 'showAllComparables()',
            icon: '👁️'
          })}
        </div>
      ` : ''}

      <!-- Market Insights -->
      ${generateMarketInsights(comparables, marketData)}
    `,
    className: `bg-gradient-to-r from-white to-blue-50 ${className}`,
    elevated: true
  });
};

export const AirbnbListingsEmpty = () => {
  return Card({
    children: `
      <div class="text-center p-2xl">
        <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-lg">
          <span class="text-2xl">🏠</span>
        </div>
        <h3 class="text-lg font-semibold text-gray-900 mb-sm">No Airbnb Data Available</h3>
        <p class="text-gray-600 mb-lg">We couldn't find comparable Airbnb properties in this area.</p>
        ${Button({
          children: 'Retry Search',
          variant: 'primary',
          onclick: 'retryAirbnbSearch()',
          icon: '🔄'
        })}
      </div>
    `,
    className: 'border-2 border-dashed border-gray-300'
  });
};

export const AirbnbListingsMobile = ({ comparables = [], marketData = {} }) => {
  if (!comparables || comparables.length === 0) {
    return AirbnbListingsEmpty();
  }

  return `
    <div class="bg-white rounded-2xl p-lg mb-lg shadow-md">
      <div class="flex items-center justify-between mb-lg">
        <div>
          <h3 class="font-bold text-gray-900">Live Airbnb Data</h3>
          <div class="flex items-center gap-sm text-sm text-green-600">
            <div class="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span>${comparables.length} active listings</span>
          </div>
        </div>
        ${LiveDataBadge({})}
      </div>

      <!-- Horizontal Scroll Comparables -->
      <div class="relative">
        <div class="flex gap-md overflow-x-auto pb-sm comparable-scroll">
          ${comparables.slice(0, 5).map(comparable => `
            <div class="flex-shrink-0 w-64 border border-gray-200 rounded-lg overflow-hidden">
              ${comparable.image ? `<img src="${comparable.image}" alt="Property" class="w-full h-32 object-cover">` : ''}
              <div class="p-md">
                <div class="flex items-center justify-between mb-xs">
                  <span class="font-bold text-gray-900">$${comparable.nightly_rate}/night</span>
                  <span class="text-xs bg-green-100 text-green-800 px-sm py-xs rounded">${comparable.occupancy_rate}% booked</span>
                </div>
                <div class="text-sm text-gray-600 mb-sm">${comparable.bedrooms}BR • ${comparable.area} • ${comparable.rating}★</div>
                <div class="text-xs text-green-600 font-medium">~$${comparable.monthly_revenue?.toLocaleString()}/month</div>
              </div>
            </div>
          `).join('')}
          
          ${comparables.length > 5 ? `
            <div class="flex-shrink-0 w-32 border border-dashed border-gray-300 rounded-lg flex items-center justify-center">
              <div class="text-center text-gray-500">
                <div class="text-lg mb-xs">+${comparables.length - 5}</div>
                <div class="text-xs">More</div>
              </div>
            </div>
          ` : ''}
        </div>
      </div>

      <!-- Market Summary -->
      <div class="mt-lg bg-gray-50 rounded-lg p-md">
        <div class="grid grid-cols-3 gap-md text-center">
          <div>
            <div class="font-bold text-gray-900">$${Math.round(comparables.reduce((sum, comp) => sum + comp.nightly_rate, 0) / comparables.length)}</div>
            <div class="text-xs text-gray-600">Avg Rate</div>
          </div>
          <div>
            <div class="font-bold text-blue-600">${Math.round(comparables.reduce((sum, comp) => sum + comp.occupancy_rate, 0) / comparables.length)}%</div>
            <div class="text-xs text-gray-600">Occupancy</div>
          </div>
          <div>
            <div class="font-bold text-green-600">${Math.round(comparables.reduce((sum, comp) => sum + comp.rating, 0) / comparables.length * 10) / 10}★</div>
            <div class="text-xs text-gray-600">Rating</div>
          </div>
        </div>
      </div>
    </div>
  `;
};

const generateMarketInsights = (comparables, marketData) => {
  if (!comparables || comparables.length === 0) return '';

  const insights = [];
  
  // High occupancy insight
  const avgOccupancy = Math.round(comparables.reduce((sum, comp) => sum + comp.occupancy_rate, 0) / comparables.length);
  if (avgOccupancy >= 80) {
    insights.push({
      icon: '📈',
      title: 'High Demand Market',
      description: `Average occupancy of ${avgOccupancy}% indicates strong rental demand`
    });
  }

  // Premium pricing insight
  const avgRate = Math.round(comparables.reduce((sum, comp) => sum + comp.nightly_rate, 0) / comparables.length);
  if (avgRate >= 150) {
    insights.push({
      icon: '💰',
      title: 'Premium Pricing Zone',
      description: `Average nightly rate of $${avgRate} suggests upscale market positioning`
    });
  }

  // Guest satisfaction insight
  const avgRating = Math.round(comparables.reduce((sum, comp) => sum + comp.rating, 0) / comparables.length * 10) / 10;
  if (avgRating >= 4.5) {
    insights.push({
      icon: '⭐',
      title: 'High Guest Satisfaction',
      description: `Average rating of ${avgRating} stars shows excellent guest experience`
    });
  }

  if (insights.length === 0) return '';

  return `
    <div class="border-t border-gray-200 pt-xl mt-xl">
      <h4 class="font-semibold text-gray-900 mb-lg">Market Insights</h4>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-lg">
        ${insights.map(insight => `
          <div class="flex items-start gap-md">
            <span class="text-2xl">${insight.icon}</span>
            <div>
              <div class="font-medium text-gray-900 mb-xs">${insight.title}</div>
              <div class="text-sm text-gray-600">${insight.description}</div>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
};

export const AirbnbHeroSection = ({ analysis }) => {
  if (!analysis?.strAnalysis?.comparables) {
    return AirbnbListingsEmpty();
  }

  return AirbnbListings({
    comparables: analysis.strAnalysis.comparables,
    marketData: {
      averageRate: analysis.strAnalysis.avgNightlyRate,
      averageOccupancy: analysis.strAnalysis.occupancyRate,
      averageRevenue: analysis.strAnalysis.monthlyRevenue
    },
    lastUpdated: analysis.createdAt ? formatTimeAgo(analysis.createdAt) : 'just now'
  });
};

const formatTimeAgo = (timestamp) => {
  const now = new Date();
  const created = new Date(timestamp);
  const diffMs = now - created;
  const diffMins = Math.floor(diffMs / 60000);
  
  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins} minutes ago`;
  if (diffMins < 1440) return `${Math.floor(diffMins / 60)} hours ago`;
  return `${Math.floor(diffMins / 1440)} days ago`;
};