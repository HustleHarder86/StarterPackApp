/**
 * Investment Verdict Component Tests
 * Tests for the InvestmentVerdict component and its variants
 */

import { InvestmentVerdict, QuickVerdict, VerdictSummary } from '../../../components/analysis/InvestmentVerdict.js';

describe('InvestmentVerdict Component', () => {
  const mockVerdictData = {
    recommendation: 'recommended',
    confidence: 'High',
    strategy: 'Short-Term Rental',
    monthlyRevenue: 5400,
    monthlyDifference: 2200,
    roi: 12.4,
    score: 8.7,
    insights: [
      { title: 'High Demand', description: 'Strong market demand' },
      { title: 'Premium Location', description: 'Excellent location' },
      { title: 'Revenue Potential', description: 'High revenue potential' }
    ]
  };

  test('renders recommended verdict correctly', () => {
    const html = InvestmentVerdict(mockVerdictData);
    
    expect(html).toContain('✓ RECOMMENDED');
    expect(html).toContain('High Confidence');
    expect(html).toContain('Short-Term Rental');
    expect(html).toContain('$5,400/mo');
    expect(html).toContain('+$2,200 over LTR');
    expect(html).toContain('8.7/10');
    expect(html).toContain('12.4%');
  });

  test('renders caution verdict correctly', () => {
    const cautionData = {
      ...mockVerdictData,
      recommendation: 'caution',
      confidence: 'Medium',
      score: 5.5
    };
    
    const html = InvestmentVerdict(cautionData);
    
    expect(html).toContain('⚠ PROCEED WITH CAUTION');
    expect(html).toContain('Medium Confidence');
    expect(html).toContain('Mixed indicators');
  });

  test('renders not-recommended verdict correctly', () => {
    const notRecommendedData = {
      ...mockVerdictData,
      recommendation: 'not-recommended',
      confidence: 'Low',
      score: 3.2
    };
    
    const html = InvestmentVerdict(notRecommendedData);
    
    expect(html).toContain('✗ NOT RECOMMENDED');
    expect(html).toContain('Low Confidence');
    expect(html).toContain('Poor investment potential');
  });

  test('calculates revenue advantage correctly', () => {
    const html = InvestmentVerdict(mockVerdictData);
    
    // Revenue advantage = (monthlyDifference / (monthlyRevenue - monthlyDifference)) * 100
    // (2200 / (5400 - 2200)) * 100 = (2200 / 3200) * 100 = 68.75% -> 69%
    expect(html).toContain('+69%');
  });

  test('renders key insights', () => {
    const html = InvestmentVerdict(mockVerdictData);
    
    expect(html).toContain('Key Insights:');
    expect(html).toContain('High Demand');
    expect(html).toContain('Premium Location');
    expect(html).toContain('Revenue Potential');
    expect(html).toContain('Strong market demand');
  });

  test('handles missing insights gracefully', () => {
    const dataWithoutInsights = {
      ...mockVerdictData,
      insights: []
    };
    
    const html = InvestmentVerdict(dataWithoutInsights);
    
    expect(html).not.toContain('Key Insights:');
    expect(html).toContain('$5,400/mo');
  });

  test('applies correct CSS classes for recommendation types', () => {
    const recommendedHtml = InvestmentVerdict({ ...mockVerdictData, recommendation: 'recommended' });
    const cautionHtml = InvestmentVerdict({ ...mockVerdictData, recommendation: 'caution' });
    const notRecommendedHtml = InvestmentVerdict({ ...mockVerdictData, recommendation: 'not-recommended' });
    
    expect(recommendedHtml).toContain('border-green-500');
    expect(cautionHtml).toContain('border-yellow-500');
    expect(notRecommendedHtml).toContain('border-red-500');
  });
});

describe('QuickVerdict Component', () => {
  test('renders quick verdict for recommended property', () => {
    const html = QuickVerdict({
      recommendation: 'recommended',
      monthlyRevenue: 5400,
      advantage: 47,
      score: 8.7
    });
    
    expect(html).toContain('Recommended');
    expect(html).toContain('$5,400');
    expect(html).toContain('+47% more revenue');
    expect(html).toContain('8.7/10');
    expect(html).toContain('bg-green-50');
  });

  test('renders quick verdict for caution property', () => {
    const html = QuickVerdict({
      recommendation: 'caution',
      monthlyRevenue: 3800,
      advantage: 15,
      score: 5.5
    });
    
    expect(html).toContain('Proceed with Caution');
    expect(html).toContain('$3,800');
    expect(html).toContain('+15% more revenue');
    expect(html).toContain('bg-yellow-50');
  });

  test('handles zero advantage correctly', () => {
    const html = QuickVerdict({
      recommendation: 'not-recommended',
      monthlyRevenue: 2800,
      advantage: 0,
      score: 3.0
    });
    
    expect(html).toContain('Not Recommended');
    expect(html).toContain('Limited revenue potential');
  });
});

describe('VerdictSummary Component', () => {
  const mockAnalysisData = {
    strAnalysis: {
      monthlyRevenue: 5400
    },
    longTermRental: {
      monthlyRent: 3200,
      roi: 12.4
    },
    overallScore: 8.7,
    recommendations: [
      { title: 'Market Insight', description: 'Strong demand' },
      { title: 'Location Advantage', description: 'Premium area' }
    ]
  };

  test('renders verdict summary from analysis data', () => {
    const html = VerdictSummary({ analysis: mockAnalysisData });
    
    expect(html).toContain('Short-Term Rental');
    expect(html).toContain('High Confidence');
    expect(html).toContain('$5,400');
    expect(html).toContain('$2,200'); // monthlyDifference
    expect(html).toContain('12.4%');
    expect(html).toContain('8.7');
  });

  test('determines recommendation based on overall score', () => {
    const highScoreAnalysis = { ...mockAnalysisData, overallScore: 8.5 };
    const mediumScoreAnalysis = { ...mockAnalysisData, overallScore: 6.0 };
    const lowScoreAnalysis = { ...mockAnalysisData, overallScore: 4.0 };
    
    const highHtml = VerdictSummary({ analysis: highScoreAnalysis });
    const mediumHtml = VerdictSummary({ analysis: mediumScoreAnalysis });
    const lowHtml = VerdictSummary({ analysis: lowScoreAnalysis });
    
    expect(highHtml).toContain('✓ RECOMMENDED');
    expect(mediumHtml).toContain('⚠ PROCEED WITH CAUTION');
    expect(lowHtml).toContain('✗ NOT RECOMMENDED');
  });

  test('handles missing analysis data gracefully', () => {
    const html = VerdictSummary({ analysis: null });
    
    expect(html).toBe('');
  });

  test('chooses correct strategy based on revenue comparison', () => {
    const ltrBetterAnalysis = {
      ...mockAnalysisData,
      strAnalysis: { monthlyRevenue: 2800 },
      longTermRental: { monthlyRent: 3200, roi: 8.5 }
    };
    
    const html = VerdictSummary({ analysis: ltrBetterAnalysis });
    
    expect(html).toContain('Long-Term Rental');
  });

  test('handles missing revenue data', () => {
    const incompleteAnalysis = {
      overallScore: 7.5,
      recommendations: []
    };
    
    const html = VerdictSummary({ analysis: incompleteAnalysis });
    
    expect(html).toContain('$0'); // Should handle missing revenue gracefully
  });
});

describe('InvestmentVerdict Integration Tests', () => {
  test('all verdict components work together', () => {
    const analysisData = {
      strAnalysis: { monthlyRevenue: 5400 },
      longTermRental: { monthlyRent: 3200, roi: 12.4 },
      overallScore: 8.7,
      recommendations: [
        { title: 'High Demand', description: 'Strong market' }
      ]
    };

    const fullVerdict = VerdictSummary({ analysis: analysisData });
    const quickVerdict = QuickVerdict({
      recommendation: 'recommended',
      monthlyRevenue: 5400,
      advantage: 69,
      score: 8.7
    });

    expect(fullVerdict).toContain('card-elevated');
    expect(fullVerdict).toContain('Short-Term Rental');
    expect(quickVerdict).toContain('Recommended');
    
    // Both should be valid HTML
    expect(fullVerdict).toContain('<div');
    expect(fullVerdict).toContain('</div>');
    expect(quickVerdict).toContain('<div');
    expect(quickVerdict).toContain('</div>');
  });

  test('handles edge cases gracefully', () => {
    const edgeCaseData = {
      recommendation: 'unknown',
      confidence: null,
      strategy: '',
      monthlyRevenue: 0,
      monthlyDifference: 0,
      roi: 0,
      score: 0,
      insights: null
    };

    const html = InvestmentVerdict(edgeCaseData);
    
    // Should not crash and should render something
    expect(html).toContain('card');
    expect(html).toContain('$0');
  });
});