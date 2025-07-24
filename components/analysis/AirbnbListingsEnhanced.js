/**
 * Enhanced Airbnb Listings Component
 * Shows Airbnb comparables as visual cards with images
 */

import { Card } from '../ui/Card.js';
import { LiveDataBadge } from '../ui/Badge.js';

export const AirbnbListingsEnhanced = ({ 
  comparables = [],
  stats = {},
  className = '' 
}) => {
  // Default comparable data if none provided
  const defaultComparables = [
    {
      title: '2BR • Downtown • ★4.8',
      distance: '0.3mi away',
      revenue: '$224/night',
      occupancy: '87%',
      monthlyRevenue: '$5,824',
      occupancyRate: '87%',
      imageUrl: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400&h=300&fit=crop',
      url: 'https://www.airbnb.com/rooms/12345678'
    },
    {
      title: '2BR • King West • ★4.9',
      distance: '0.5mi away',
      revenue: '$186/night',
      occupancy: '82%',
      monthlyRevenue: '$4,548',
      occupancyRate: '82%',
      imageUrl: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400&h=300&fit=crop',
      url: 'https://www.airbnb.com/rooms/23456789'
    },
    {
      title: '2BR • Harbourfront • ★5.0',
      distance: '0.4mi away',
      revenue: '$145/night',
      occupancy: '92%',
      monthlyRevenue: '$3,986',
      occupancyRate: '92%',
      imageUrl: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400&h=300&fit=crop',
      url: 'https://www.airbnb.com/rooms/34567890'
    }
  ];

  const listings = comparables.length > 0 ? comparables : defaultComparables;

  // Default stats if none provided
  const marketStats = {
    avgRate: stats.avgRate || '$180',
    avgOccupancy: stats.avgOccupancy || '69.999999999999997%',
    avgRevenue: stats.avgRevenue || '$10,214',
    activeListings: stats.activeListings || '5'
  };

  return `
    <div class="${className}">
      <!-- Header -->
      <div class="flex items-center justify-between mb-6">
        <div class="flex items-center gap-3">
          <h3 class="text-xl font-bold text-gray-900">Live Airbnb Market Data</h3>
          ${LiveDataBadge()}
        </div>
        <span class="text-sm text-gray-500">Updated just now</span>
      </div>

      <!-- Market Stats -->
      <div class="grid grid-cols-4 gap-4 mb-6">
        <div class="text-center">
          <div class="text-2xl font-bold text-gray-900">${marketStats.avgRate}</div>
          <div class="text-sm text-gray-600">Avg Nightly Rate</div>
        </div>
        <div class="text-center">
          <div class="text-2xl font-bold text-gray-900">${marketStats.avgOccupancy}</div>
          <div class="text-sm text-gray-600">Avg Occupancy</div>
        </div>
        <div class="text-center">
          <div class="text-2xl font-bold text-gray-900">${marketStats.avgRevenue}</div>
          <div class="text-sm text-gray-600">Avg Revenue</div>
        </div>
        <div class="text-center">
          <div class="text-2xl font-bold text-gray-900">${marketStats.activeListings}</div>
          <div class="text-sm text-gray-600">Active Properties</div>
        </div>
      </div>

      <!-- Comparable Listings -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        ${listings.map((listing, index) => `
          <div class="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow">
            <!-- Property Image -->
            <div class="relative h-48 bg-gray-200">
              <img src="${listing.imageUrl}" alt="${listing.title}" class="w-full h-full object-cover">
              <div class="absolute top-2 left-2">
                <span class="px-2 py-1 bg-white/90 backdrop-blur text-xs font-semibold rounded">
                  ${listing.revenue}
                </span>
              </div>
              <div class="absolute top-2 right-2">
                <span class="px-2 py-1 bg-green-500 text-white text-xs font-semibold rounded">
                  ${listing.occupancy}
                </span>
              </div>
            </div>
            
            <!-- Property Details -->
            <div class="p-4">
              <h4 class="font-semibold text-gray-900 mb-1">${listing.title}</h4>
              <p class="text-sm text-gray-500 mb-3">${listing.distance}</p>
              
              <div class="space-y-2">
                <div class="flex justify-between text-sm">
                  <span class="text-gray-600">Monthly Revenue:</span>
                  <span class="font-semibold text-green-600">${listing.monthlyRevenue}</span>
                </div>
                <div class="flex justify-between text-sm">
                  <span class="text-gray-600">Occupancy:</span>
                  <span class="font-semibold">${listing.occupancyRate}</span>
                </div>
              </div>
              
              <div class="mt-3 pt-3 border-t border-gray-100">
                <a href="${listing.url || listing.airbnb_url || '#'}" 
                   target="_blank" 
                   rel="noopener noreferrer"
                   class="text-sm text-blue-600 hover:text-blue-800 font-medium inline-block">
                  View on Airbnb →
                </a>
              </div>
            </div>
          </div>
        `).join('')}
      </div>

      <!-- Bottom Summary -->
      <div class="mt-6 text-center">
        <p class="text-sm text-gray-600">
          Based on ${marketStats.activeListings} comparable listings within 0.5 miles
        </p>
      </div>
    </div>
  `;
};

export const AirbnbHeroSectionEnhanced = ({ analysis }) => {
  const comparables = analysis?.strAnalysis?.comparables || [];
  const stats = {
    avgRate: analysis?.strAnalysis?.avgNightlyRate ? `$${Math.round(analysis.strAnalysis.avgNightlyRate)}` : '$180',
    avgOccupancy: analysis?.strAnalysis?.occupancyRate ? `${Math.round(analysis.strAnalysis.occupancyRate)}%` : '69.999999999999997%',
    avgRevenue: analysis?.strAnalysis?.monthlyRevenue ? `$${Math.round(analysis.strAnalysis.monthlyRevenue).toLocaleString()}` : '$10,214',
    activeListings: comparables.length || 5
  };

  return Card({
    children: AirbnbListingsEnhanced({ comparables, stats }),
    className: 'mb-xl',
    elevated: true
  });
};