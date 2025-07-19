/**
 * Card Component Tests
 * Tests for the Card component and its variants
 */

import { Card, PropertyCard, ComparableCard } from '../../../components/ui/Card.js';

describe('Card Component', () => {
  test('renders basic card with default props', () => {
    const html = Card({ children: 'Test content' });
    
    expect(html).toContain('card');
    expect(html).toContain('Test content');
    expect(html).toContain('class="card');
  });

  test('applies custom className', () => {
    const html = Card({ 
      children: 'Test content', 
      className: 'custom-class' 
    });
    
    expect(html).toContain('custom-class');
  });

  test('applies elevated variant', () => {
    const html = Card({ 
      children: 'Test content', 
      elevated: true 
    });
    
    expect(html).toContain('card-elevated');
  });

  test('applies interactive variant', () => {
    const html = Card({ 
      children: 'Test content', 
      interactive: true 
    });
    
    expect(html).toContain('card-interactive');
  });

  test('applies size variants', () => {
    const smCard = Card({ children: 'Test', variant: 'sm' });
    const lgCard = Card({ children: 'Test', variant: 'lg' });
    
    expect(smCard).toContain('card-sm');
    expect(lgCard).toContain('card-lg');
  });
});

describe('PropertyCard Component', () => {
  const mockProperty = {
    address: '123 Main St',
    city: 'Toronto',
    province: 'ON',
    price: 850000,
    image: '/test-image.jpg'
  };

  test('renders property information correctly', () => {
    const html = PropertyCard({ 
      property: mockProperty, 
      children: 'Property details' 
    });
    
    expect(html).toContain('123 Main St');
    expect(html).toContain('Toronto, ON');
    expect(html).toContain('$850,000');
    expect(html).toContain('Property details');
  });

  test('handles missing price gracefully', () => {
    const propertyWithoutPrice = { ...mockProperty, price: null };
    const html = PropertyCard({ 
      property: propertyWithoutPrice, 
      children: 'Test' 
    });
    
    expect(html).toContain('Price TBD');
  });

  test('includes property image when provided', () => {
    const html = PropertyCard({ 
      property: mockProperty, 
      children: 'Test' 
    });
    
    expect(html).toContain('<img src="/test-image.jpg"');
    expect(html).toContain('alt="Property"');
  });

  test('applies border styling', () => {
    const html = PropertyCard({ 
      property: mockProperty, 
      children: 'Test' 
    });
    
    expect(html).toContain('border-l-4');
    expect(html).toContain('border-primary');
  });
});

describe('ComparableCard Component', () => {
  const mockComparable = {
    nightly_rate: 185,
    bedrooms: 2,
    area: 'Downtown',
    rating: 4.7,
    monthly_revenue: 5200,
    occupancy_rate: 85,
    performance: 'match',
    image: '/comparable-image.jpg'
  };

  test('renders comparable property data correctly', () => {
    const html = ComparableCard({ comparable: mockComparable });
    
    expect(html).toContain('$185/night');
    expect(html).toContain('2BR');
    expect(html).toContain('Downtown');
    expect(html).toContain('4.7★');
    expect(html).toContain('$5,200');
    expect(html).toContain('85%');
  });

  test('applies correct performance badge', () => {
    const topPerformer = { ...mockComparable, performance: 'top' };
    const html = ComparableCard({ comparable: topPerformer });
    
    expect(html).toContain('badge-success');
    expect(html).toContain('TOP');
  });

  test('handles different performance levels', () => {
    const performers = [
      { ...mockComparable, performance: 'top' },
      { ...mockComparable, performance: 'match' },
      { ...mockComparable, performance: 'value' },
      { ...mockComparable, performance: null }
    ];

    performers.forEach(performer => {
      const html = ComparableCard({ comparable: performer });
      expect(html).toContain('card');
      expect(html).toContain('card-interactive');
    });
  });

  test('includes property image when provided', () => {
    const html = ComparableCard({ comparable: mockComparable });
    
    expect(html).toContain('<img src="/comparable-image.jpg"');
    expect(html).toContain('alt="Comparable Property"');
  });

  test('handles missing image gracefully', () => {
    const comparableWithoutImage = { ...mockComparable, image: null };
    const html = ComparableCard({ comparable: comparableWithoutImage });
    
    expect(html).not.toContain('<img');
    expect(html).toContain('$185/night');
  });

  test('formats revenue correctly', () => {
    const html = ComparableCard({ comparable: mockComparable });
    
    expect(html).toContain('text-revenue');
    expect(html).toContain('$5,200');
  });
});

describe('Card Component Integration', () => {
  test('all card variants work together', () => {
    const cards = [
      Card({ children: 'Basic card' }),
      Card({ children: 'Elevated card', elevated: true }),
      Card({ children: 'Interactive card', interactive: true }),
      Card({ children: 'Large card', variant: 'lg' })
    ];

    cards.forEach(card => {
      expect(card).toContain('card');
      expect(card).toContain('<div class="card');
      expect(card).toContain('</div>');
    });
  });

  test('complex property card with all features', () => {
    const complexProperty = {
      address: '456 Oak Avenue',
      city: 'Vancouver',
      province: 'BC',
      price: 1200000,
      image: '/complex-property.jpg'
    };

    const html = PropertyCard({ 
      property: complexProperty, 
      children: `
        <div class="property-stats">
          <div class="stat">3 BR</div>
          <div class="stat">2 BA</div>
          <div class="stat">1,200 sq ft</div>
        </div>
      `,
      className: 'custom-property-card'
    });

    expect(html).toContain('456 Oak Avenue');
    expect(html).toContain('Vancouver, BC');
    expect(html).toContain('$1,200,000');
    expect(html).toContain('property-stats');
    expect(html).toContain('custom-property-card');
    expect(html).toContain('card-elevated');
  });
});