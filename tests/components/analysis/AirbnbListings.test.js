/**
 * Airbnb Listings Component Tests
 * Tests for the AirbnbListings component and its variants
 */

import { AirbnbListings, AirbnbListingsEmpty, AirbnbListingsMobile, AirbnbHeroSection } from '../../../components/analysis/AirbnbListings.js';

describe('AirbnbListings Component', () => {
  const mockComparables = [
    {
      nightly_rate: 220,
      bedrooms: 2,
      area: 'King West',
      rating: 4.9,
      monthly_revenue: 6400,
      occupancy_rate: 98,
      performance: 'top',
      image: '/property1.jpg'
    },
    {
      nightly_rate: 185,
      bedrooms: 2,
      area: 'Downtown',
      rating: 4.7,
      monthly_revenue: 5200,
      occupancy_rate: 85,
      performance: 'match',
      image: '/property2.jpg'
    },
    {
      nightly_rate: 165,
      bedrooms: 2,
      area: 'Midtown',
      rating: 4.5,
      monthly_revenue: 4100,
      occupancy_rate: 72,
      performance: 'value',
      image: '/property3.jpg'
    }
  ];

  const mockMarketData = {
    averageRate: 180,
    averageOccupancy: 85,
    averageRevenue: 5100
  };

  test('renders airbnb listings with market data', () => {
    const html = AirbnbListings({
      comparables: mockComparables,
      marketData: mockMarketData,
      lastUpdated: '2 minutes ago'
    });
    
    expect(html).toContain('Live Airbnb Market Data');
    expect(html).toContain('3 active listings found');
    expect(html).toContain('Updated 2 minutes ago');
    expect(html).toContain('LIVE DATA');
  });

  test('calculates market averages when not provided', () => {
    const html = AirbnbListings({
      comparables: mockComparables,
      marketData: {}
    });
    
    // Should calculate averages from comparables
    // Average rate: (220 + 185 + 165) / 3 = 190
    // Average occupancy: (98 + 85 + 72) / 3 = 85
    // Average revenue: (6400 + 5200 + 4100) / 3 = 5233
    expect(html).toContain('190'); // Average rate
    expect(html).toContain('85'); // Average occupancy
    expect(html).toContain('5,233'); // Average revenue
  });

  test('renders comparable properties correctly', () => {
    const html = AirbnbListings({
      comparables: mockComparables,
      marketData: mockMarketData
    });
    
    // Should contain all three properties
    expect(html).toContain('$220/night');
    expect(html).toContain('$185/night');
    expect(html).toContain('$165/night');
    
    expect(html).toContain('King West');
    expect(html).toContain('Downtown');
    expect(html).toContain('Midtown');
    
    expect(html).toContain('$6,400');
    expect(html).toContain('$5,200');
    expect(html).toContain('$4,100');
  });

  test('shows view more button when more than 6 properties', () => {
    const manyComparables = Array(10).fill(mockComparables[0]);
    
    const html = AirbnbListings({
      comparables: manyComparables,
      marketData: mockMarketData
    });
    
    expect(html).toContain('View All 10 Properties');
    expect(html).toContain('showAllComparables()');
  });

  test('does not show view more button for 6 or fewer properties', () => {
    const html = AirbnbListings({
      comparables: mockComparables,
      marketData: mockMarketData
    });
    
    expect(html).not.toContain('View All');
  });

  test('generates market insights based on data', () => {
    const highQualityComparables = mockComparables.map(comp => ({
      ...comp,
      occupancy_rate: 88,
      nightly_rate: 200,
      rating: 4.8
    }));

    const html = AirbnbListings({
      comparables: highQualityComparables,
      marketData: mockMarketData
    });
    
    expect(html).toContain('Market Insights');
    expect(html).toContain('High Demand Market');
    expect(html).toContain('Premium Pricing Zone');
    expect(html).toContain('High Guest Satisfaction');
  });

  test('applies gradient background styling', () => {
    const html = AirbnbListings({
      comparables: mockComparables,
      marketData: mockMarketData
    });
    
    expect(html).toContain('bg-gradient-to-r');
    expect(html).toContain('from-white');
    expect(html).toContain('to-blue-50');
    expect(html).toContain('card-elevated');
  });
});

describe('AirbnbListingsEmpty Component', () => {
  test('renders empty state correctly', () => {
    const html = AirbnbListingsEmpty();
    
    expect(html).toContain('No Airbnb Data Available');
    expect(html).toContain('We couldn\'t find comparable Airbnb properties');
    expect(html).toContain('Retry Search');
    expect(html).toContain('retryAirbnbSearch()');
  });

  test('applies dashed border styling', () => {
    const html = AirbnbListingsEmpty();
    
    expect(html).toContain('border-2');
    expect(html).toContain('border-dashed');
    expect(html).toContain('border-gray-300');
  });

  test('includes house emoji', () => {
    const html = AirbnbListingsEmpty();
    
    expect(html).toContain('🏠');
  });
});

describe('AirbnbListingsMobile Component', () => {
  test('renders mobile-optimized layout', () => {
    const html = AirbnbListingsMobile({
      comparables: mockComparables,
      marketData: mockMarketData
    });
    
    expect(html).toContain('Live Airbnb Data');
    expect(html).toContain('3 active listings');
    expect(html).toContain('comparable-scroll');
    expect(html).toContain('flex-shrink-0');
  });

  test('shows horizontal scroll indicator', () => {
    const html = AirbnbListingsMobile({
      comparables: mockComparables,
      marketData: mockMarketData
    });
    
    expect(html).toContain('w-64'); // Fixed width cards for horizontal scroll
    expect(html).toContain('overflow-x-auto');
  });

  test('shows "more" indicator when more than 5 properties', () => {
    const manyComparables = Array(8).fill(mockComparables[0]);
    
    const html = AirbnbListingsMobile({
      comparables: manyComparables,
      marketData: mockMarketData
    });
    
    expect(html).toContain('+3'); // 8 - 5 = 3 more
    expect(html).toContain('More');
  });

  test('includes market summary grid', () => {
    const html = AirbnbListingsMobile({
      comparables: mockComparables,
      marketData: mockMarketData
    });
    
    expect(html).toContain('grid-cols-3');
    expect(html).toContain('Avg Rate');
    expect(html).toContain('Occupancy');
    expect(html).toContain('Rating');
  });

  test('returns empty state when no comparables', () => {
    const html = AirbnbListingsMobile({
      comparables: [],
      marketData: {}
    });
    
    expect(html).toContain('No Airbnb Data Available');
  });
});

describe('AirbnbHeroSection Component', () => {
  const mockAnalysis = {
    strAnalysis: {
      comparables: mockComparables,
      avgNightlyRate: 190,
      occupancyRate: 85,
      monthlyRevenue: 5100
    },
    createdAt: new Date(Date.now() - 180000) // 3 minutes ago
  };

  test('renders hero section from analysis data', () => {
    const html = AirbnbHeroSection({ analysis: mockAnalysis });
    
    expect(html).toContain('Live Airbnb Market Data');
    expect(html).toContain('3 active listings found');
    expect(html).toContain('$190'); // Average rate
    expect(html).toContain('85%'); // Occupancy
    expect(html).toContain('$5,100'); // Revenue
  });

  test('formats time ago correctly', () => {
    const html = AirbnbHeroSection({ analysis: mockAnalysis });
    
    expect(html).toContain('3 minutes ago');
  });

  test('handles recent timestamp', () => {
    const recentAnalysis = {
      ...mockAnalysis,
      createdAt: new Date(Date.now() - 30000) // 30 seconds ago
    };
    
    const html = AirbnbHeroSection({ analysis: recentAnalysis });
    
    expect(html).toContain('just now');
  });

  test('returns empty state when no comparables', () => {
    const analysisWithoutComparables = {
      strAnalysis: { comparables: null }
    };
    
    const html = AirbnbHeroSection({ analysis: analysisWithoutComparables });
    
    expect(html).toContain('No Airbnb Data Available');
  });

  test('handles missing analysis gracefully', () => {
    const html = AirbnbHeroSection({ analysis: null });
    
    expect(html).toContain('No Airbnb Data Available');
  });
});

describe('AirbnbListings Integration Tests', () => {
  test('all airbnb components work together', () => {
    const components = [
      AirbnbListings({ comparables: mockComparables, marketData: mockMarketData }),
      AirbnbListingsEmpty(),
      AirbnbListingsMobile({ comparables: mockComparables, marketData: mockMarketData })
    ];

    components.forEach(component => {
      expect(component).toContain('Live Airbnb');
      expect(component).toContain('<div');
      expect(component).toContain('</div>');
    });
  });

  test('handles edge cases gracefully', () => {
    const edgeCases = [
      { comparables: [], marketData: {} },
      { comparables: null, marketData: null },
      { comparables: [{}], marketData: {} }
    ];

    edgeCases.forEach(testCase => {
      const html = AirbnbListings(testCase);
      expect(html).toContain('No Airbnb Data Available');
    });
  });

  test('performance badge mapping works correctly', () => {
    const testComparables = [
      { ...mockComparables[0], performance: 'top' },
      { ...mockComparables[0], performance: 'match' },
      { ...mockComparables[0], performance: 'value' },
      { ...mockComparables[0], performance: 'average' }
    ];

    testComparables.forEach(comparable => {
      const html = AirbnbListings({ comparables: [comparable], marketData: {} });
      expect(html).toContain('badge-');
    });
  });
});