/**
 * Consolidated Airbnb Listings Component
 * Combines the best features from all versions:
 * - Hero section prominence from base version
 * - Visual card design from Enhanced version
 * - Real property data structure from Mockup version
 */

import { Card } from '../ui/Card.js';
import { LiveDataBadge, PerformanceBadge, MetricBadge } from '../ui/Badge.js';
import { Button } from '../ui/Button.js';

/**
 * Main AirbnbListings Component
 * @param {Object} props - Component properties
 * @param {Array} props.comparables - Array of comparable properties
 * @param {Object} props.marketData - Market statistics
 * @param {string} props.lastUpdated - Last update timestamp
 * @param {boolean} props.enhanced - Use enhanced visual mode
 * @param {string} props.className - Additional CSS classes
 * @returns {string} HTML string for the component
 */
export const AirbnbListings = ({ 
  comparables = [],
  marketData = {},
  lastUpdated = 'just now',
  enhanced = true,
  className = ''
}) => {
  // Use default data if none provided
  if (!comparables || comparables.length === 0) {
    comparables = getDefaultComparables();
  }

  const topComparables = comparables.slice(0, 6);
  const stats = calculateMarketStats(comparables, marketData);

  return Card({
    className: `airbnb-listings-hero ${className}`,
    elevated: true,
    children: `
      <!-- Header Section -->
      <div class="flex items-center justify-between mb-6">
        <div>
          <h2 class="text-2xl font-bold text-gray-900 mb-2">Live Airbnb Market Data</h2>
          <div class="flex items-center gap-4">
            <div class="flex items-center gap-2 text-green-600">
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
      <div class="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 mb-6">
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          ${MetricBadge({ label: 'Avg Nightly Rate', value: `$${stats.averageRate}`, trend: stats.rateTrend })}
          ${MetricBadge({ label: 'Avg Occupancy', value: `${stats.averageOccupancy}%`, trend: stats.occupancyTrend })}
          ${MetricBadge({ label: 'Avg Revenue', value: `$${stats.averageRevenue.toLocaleString()}`, trend: stats.revenueTrend })}
          ${MetricBadge({ label: 'Active Properties', value: comparables.length, trend: 'neutral' })}
        </div>
      </div>

      <!-- Comparable Properties Grid -->
      <div class="space-y-4 mb-6">
        <h3 class="text-lg font-semibold text-gray-800">Top Performing Comparables</h3>
        <div class="grid gap-4 ${enhanced ? 'md:grid-cols-2 lg:grid-cols-3' : 'md:grid-cols-1'}">
          ${topComparables.map((comp, index) => 
            enhanced ? renderEnhancedComparable(comp, index) : renderSimpleComparable(comp, index)
          ).join('')}
        </div>
      </div>

      <!-- View More Button -->
      ${comparables.length > 6 ? `
        <div class="text-center">
          ${Button({ 
            text: `View All ${comparables.length} Listings`,
            variant: 'secondary',
            onClick: 'showAllComparables()'
          })}
        </div>
      ` : ''}
    `
  });
};

/**
 * Render enhanced comparable with image
 */
function renderEnhancedComparable(comp, index) {
  const performanceClass = getPerformanceClass(comp);
  const badge = getPerformanceBadge(comp, index);
  
  return `
    <div class="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 overflow-hidden">
      <!-- Property Image -->
      ${comp.imageUrl ? `
        <div class="relative h-48 bg-gray-200">
          <img src="${comp.imageUrl}" alt="${comp.title}" class="w-full h-full object-cover">
          ${badge ? `<div class="absolute top-2 right-2">${badge}</div>` : ''}
        </div>
      ` : ''}
      
      <!-- Property Details -->
      <div class="p-4">
        <div class="flex justify-between items-start mb-2">
          <div>
            <h4 class="font-semibold text-gray-900">${comp.title || `${comp.bedrooms}BR • ${comp.property_type}`}</h4>
            <p class="text-sm text-gray-600">${comp.distance || 'Nearby'}</p>
          </div>
          <div class="text-right">
            <div class="text-lg font-bold text-gray-900">$${comp.nightly_rate || comp.price}/night</div>
            <div class="text-sm text-gray-600">${comp.occupancy_rate || comp.occupancy}% booked</div>
          </div>
        </div>
        
        <!-- Revenue Info -->
        <div class="border-t pt-2 mt-2">
          <div class="flex justify-between items-center">
            <span class="text-sm text-gray-600">Monthly Revenue</span>
            <span class="font-semibold ${performanceClass}">
              $${(comp.monthly_revenue || comp.revenue || 0).toLocaleString()}
            </span>
          </div>
          ${comp.rating ? `
            <div class="flex items-center mt-1">
              <span class="text-yellow-500">★</span>
              <span class="text-sm text-gray-700 ml-1">${comp.rating}</span>
              ${comp.reviews ? `<span class="text-sm text-gray-500 ml-1">(${comp.reviews})</span>` : ''}
            </div>
          ` : ''}
        </div>
        
        <!-- View Listing Link -->
        ${comp.url ? `
          <a href="${comp.url}" target="_blank" rel="noopener noreferrer" 
             class="text-blue-600 hover:text-blue-800 text-sm mt-2 inline-flex items-center">
            View on Airbnb →
          </a>
        ` : ''}
      </div>
    </div>
  `;
}

/**
 * Render simple comparable without image
 */
function renderSimpleComparable(comp, index) {
  const performanceClass = getPerformanceClass(comp);
  
  return `
    <div class="bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow">
      <div class="flex justify-between items-start">
        <div>
          <h4 class="font-semibold">${comp.bedrooms}BR • ${comp.property_type}</h4>
          <p class="text-sm text-gray-600">${comp.distance || 'Nearby'}</p>
        </div>
        <div class="text-right">
          <div class="text-lg font-bold">$${comp.nightly_rate}/night</div>
          <div class="text-sm ${performanceClass}">${comp.occupancy_rate}% occupancy</div>
        </div>
      </div>
      <div class="mt-3 pt-3 border-t">
        <div class="flex justify-between">
          <span class="text-sm text-gray-600">Monthly Revenue</span>
          <span class="font-semibold">$${comp.monthly_revenue.toLocaleString()}</span>
        </div>
      </div>
    </div>
  `;
}

/**
 * Calculate market statistics
 */
function calculateMarketStats(comparables, marketData) {
  if (comparables.length === 0) {
    return {
      averageRate: 0,
      averageOccupancy: 0,
      averageRevenue: 0,
      rateTrend: 'neutral',
      occupancyTrend: 'neutral',
      revenueTrend: 'neutral'
    };
  }

  const averageRate = marketData.averageRate || 
    Math.round(comparables.reduce((sum, comp) => sum + (comp.nightly_rate || 0), 0) / comparables.length);
  
  const averageOccupancy = marketData.averageOccupancy || 
    Math.round(comparables.reduce((sum, comp) => sum + (comp.occupancy_rate || 0), 0) / comparables.length);
  
  const averageRevenue = marketData.averageRevenue || 
    Math.round(comparables.reduce((sum, comp) => sum + (comp.monthly_revenue || 0), 0) / comparables.length);

  return {
    averageRate,
    averageOccupancy,
    averageRevenue,
    rateTrend: marketData.rateTrend || 'up',
    occupancyTrend: marketData.occupancyTrend || 'stable',
    revenueTrend: marketData.revenueTrend || 'up'
  };
}

/**
 * Get performance class based on metrics
 */
function getPerformanceClass(comp) {
  if (comp.occupancy_rate > 85) return 'text-green-600';
  if (comp.occupancy_rate > 70) return 'text-blue-600';
  return 'text-gray-600';
}

/**
 * Get performance badge for top performers
 */
function getPerformanceBadge(comp, index) {
  if (index === 0 && comp.occupancy_rate > 90) {
    return PerformanceBadge({ text: 'TOP PERFORMER', variant: 'success' });
  }
  if (comp.rating >= 4.8) {
    return PerformanceBadge({ text: 'SUPERHOST', variant: 'primary' });
  }
  return null;
}

/**
 * Get default comparables for testing/demo
 */
function getDefaultComparables() {
  return [
    {
      title: '2BR • Downtown • ★4.8',
      bedrooms: 2,
      property_type: 'Apartment',
      distance: '0.3mi away',
      nightly_rate: 224,
      occupancy_rate: 87,
      monthly_revenue: 5824,
      rating: 4.8,
      reviews: 327,
      imageUrl: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400&h=300&fit=crop',
      url: 'https://www.airbnb.com/rooms/12345678'
    },
    {
      title: '2BR • King West • ★4.9',
      bedrooms: 2,
      property_type: 'Condo',
      distance: '0.5mi away',
      nightly_rate: 186,
      occupancy_rate: 82,
      monthly_revenue: 4548,
      rating: 4.9,
      reviews: 89,
      imageUrl: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400&h=300&fit=crop',
      url: 'https://www.airbnb.com/rooms/23456789'
    },
    {
      title: '2BR • Harbourfront • ★5.0',
      bedrooms: 2,
      property_type: 'Condo',
      distance: '0.4mi away',
      nightly_rate: 145,
      occupancy_rate: 92,
      monthly_revenue: 3986,
      rating: 5.0,
      reviews: 156,
      imageUrl: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400&h=300&fit=crop',
      url: 'https://www.airbnb.com/rooms/34567890'
    }
  ];
}

// Export empty state component
export const AirbnbListingsEmpty = () => {
  return Card({
    children: `
      <div class="text-center py-8">
        <div class="text-gray-400 mb-4">
          <svg class="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
        </div>
        <h3 class="text-lg font-semibold text-gray-700 mb-2">No Comparables Found</h3>
        <p class="text-gray-600">We couldn't find any similar Airbnb listings in this area.</p>
      </div>
    `
  });
};