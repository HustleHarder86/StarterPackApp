/**
 * LTR Parser - Extracts rental comparables from enhanced Perplexity responses
 */

/**
 * Build enhanced prompt for LTR comparables
 */
function buildEnhancedLTRPrompt(propertyData) {
  const { address, city, bedrooms, bathrooms, sqft, propertyType } = propertyData;
  
  return `Find rental comparables for investment property analysis:

TARGET PROPERTY:
${address}, ${city}, ON
${bedrooms} bed, ${bathrooms} bath, ${sqft || 'N/A'} sqft ${propertyType || 'Property'}

REQUIREMENTS:
1. Find 8-10 current rental listings (active or recently rented)
2. Prioritize properties within 1km of target address
3. Match bedroom count exactly or ±1 bedroom
4. Match square footage within ±30% if known
5. Include listings from last 60 days only
6. Search Rentals.ca, MLS, Kijiji, Facebook Marketplace, Zumper, and other Canadian rental sites

Return in this EXACT markdown table format:

## Summary
Average Monthly Rent: $[amount]
Median Monthly Rent: $[amount]
Total Comparables Found: [number]
Data Confidence: [High/Medium/Low]

## Comparable Properties (sorted by relevance)
| Address | Rent/Month | Beds | Baths | SqFt | Distance (km) | Days on Market | Match Score | Source |
|---------|------------|------|-------|------|---------------|----------------|-------------|---------|
| [full address] | $[rent] | [#] | [#] | [sqft or N/A] | [km] | [days] | [85-100]% | [website name] |

Include 8-10 rows sorted by match score (highest first).
Match score calculation: Location (40%) + Size match (30%) + Bedroom match (20%) + Freshness (10%)

## Market Insights
[2-3 sentences about rental market conditions for this area]

## Data Sources
List the websites/platforms where these listings were found.`;
}

/**
 * Parse the markdown table response from Perplexity
 */
function parseLTRResponse(content, citations = []) {
  const result = {
    success: false,
    averageRent: null,
    medianRent: null,
    comparablesCount: 0,
    confidence: null,
    comparables: [],
    insights: null,
    sources: []
  };

  try {
    // Extract summary data
    const avgMatch = content.match(/Average Monthly Rent:\s*\$?([\d,]+)/i);
    const medMatch = content.match(/Median Monthly Rent:\s*\$?([\d,]+)/i);
    const countMatch = content.match(/Total Comparables Found:\s*(\d+)/i);
    const confMatch = content.match(/Data Confidence:\s*(High|Medium|Low)/i);
    
    if (avgMatch) {
      result.averageRent = parseInt(avgMatch[1].replace(/,/g, ''));
      result.success = true;
    }
    if (medMatch) {
      result.medianRent = parseInt(medMatch[1].replace(/,/g, ''));
    }
    if (countMatch) {
      result.comparablesCount = parseInt(countMatch[1]);
    }
    if (confMatch) {
      result.confidence = confMatch[1].toLowerCase();
    }

    // Extract table rows
    const tableSection = content.match(/\|.*Address.*\|[\s\S]*?\n((?:\|[^\n]+\|\n)+)/);
    if (tableSection) {
      const rows = tableSection[1].trim().split('\n');
      
      rows.forEach(row => {
        // Skip separator rows
        if (row.includes('---')) return;
        
        const cols = row.split('|').map(c => c.trim()).filter(c => c);
        if (cols.length >= 8) {
          const comparable = {
            address: cols[0] || 'Unknown',
            monthlyRent: parseInt((cols[1] || '0').replace(/[$,]/g, '')),
            bedrooms: parseInt(cols[2] || '0'),
            bathrooms: parseFloat(cols[3] || '0'),
            sqft: cols[4] === 'N/A' ? null : parseInt((cols[4] || '0').replace(/,/g, '')),
            distanceKm: parseFloat(cols[5] || '0'),
            daysOnMarket: parseInt(cols[6] || '0'),
            matchScore: parseInt((cols[7] || '0').replace(/%/g, '')),
            source: cols[8] || 'Unknown'
          };
          
          // Only include valid comparables
          if (comparable.monthlyRent > 500 && comparable.monthlyRent < 20000) {
            result.comparables.push(comparable);
          }
        }
      });
    }

    // If no table found, try to extract from narrative text
    if (result.comparables.length === 0) {
      console.log('No table found, attempting narrative extraction...');
      
      // Look for rent amounts in the text
      const rentMatches = content.matchAll(/\$?([\d,]+)\s*(?:\/month|per month|monthly)/gi);
      const rents = [];
      
      for (const match of rentMatches) {
        const amount = parseInt(match[1].replace(/,/g, ''));
        if (amount > 500 && amount < 20000) {
          rents.push(amount);
        }
      }
      
      if (rents.length > 0) {
        // Calculate average from found rents
        result.averageRent = Math.round(rents.reduce((a, b) => a + b, 0) / rents.length);
        result.medianRent = rents.sort((a, b) => a - b)[Math.floor(rents.length / 2)];
        result.comparablesCount = rents.length;
        result.confidence = 'low';
        result.success = true;
        
        // Create basic comparables from the rents found
        rents.forEach((rent, i) => {
          result.comparables.push({
            address: `Comparable ${i + 1}`,
            monthlyRent: rent,
            bedrooms: 0,
            bathrooms: 0,
            sqft: null,
            distanceKm: 0,
            daysOnMarket: 0,
            matchScore: 0,
            source: 'Extracted from text'
          });
        });
      }
    }

    // Extract market insights
    const insightsMatch = content.match(/## Market Insights\n([^\n#]+)/);
    if (insightsMatch) {
      result.insights = insightsMatch[1].trim();
    }

    // Map citation URLs to comparables
    if (citations && citations.length > 0) {
      // Look for [1], [2] references in the content
      const references = content.matchAll(/\[(\d+)\]/g);
      const refMap = {};
      
      for (const ref of references) {
        const index = parseInt(ref[1]) - 1;
        if (citations[index]) {
          // Find which comparable this reference is near
          const contextStart = Math.max(0, ref.index - 100);
          const contextEnd = Math.min(content.length, ref.index + 100);
          const context = content.substring(contextStart, contextEnd);
          
          // Try to match this to a comparable
          result.comparables.forEach(comp => {
            if (context.includes(comp.address.split(',')[0]) || 
                context.includes(`$${comp.monthlyRent}`)) {
              comp.sourceUrl = citations[index];
            }
          });
        }
      }
      
      // Store all citations for reference
      result.sources = citations;
    }

    // Log parsing results for debugging
    console.log('LTR Parser Results:', {
      success: result.success,
      averageRent: result.averageRent,
      comparablesCount: result.comparables.length,
      confidence: result.confidence
    });

  } catch (error) {
    console.error('LTR parsing error:', error);
    result.success = false;
    result.error = error.message;
  }

  return result;
}

/**
 * Filter comparables by relevance to target property
 */
function filterComparables(comparables, targetProperty) {
  const { bedrooms, bathrooms, sqft } = targetProperty;
  
  return comparables
    .filter(comp => {
      // Must have valid rent
      if (!comp.monthlyRent || comp.monthlyRent < 500) return false;
      
      // Bedroom count within ±1
      if (bedrooms && comp.bedrooms) {
        const bedroomDiff = Math.abs(comp.bedrooms - bedrooms);
        if (bedroomDiff > 1) return false;
      }
      
      // Square footage within ±40% if both values exist
      if (sqft && comp.sqft) {
        const sqftRatio = comp.sqft / sqft;
        if (sqftRatio < 0.6 || sqftRatio > 1.4) return false;
      }
      
      // Match score above 70% if available
      if (comp.matchScore && comp.matchScore < 70) return false;
      
      return true;
    })
    .sort((a, b) => {
      // Sort by match score first
      if (a.matchScore !== b.matchScore) {
        return b.matchScore - a.matchScore;
      }
      // Then by distance
      return a.distanceKm - b.distanceKm;
    })
    .slice(0, 10); // Take top 10
}

/**
 * Format comparables for API response
 */
function formatComparablesForResponse(comparables) {
  return comparables.map(comp => ({
    address: comp.address,
    monthly_rent: comp.monthlyRent,
    bedrooms: comp.bedrooms,
    bathrooms: comp.bathrooms,
    sqft: comp.sqft,
    distance_km: comp.distanceKm,
    days_on_market: comp.daysOnMarket,
    match_score: comp.matchScore,
    source: comp.source,
    source_url: comp.sourceUrl || null
  }));
}

module.exports = {
  buildEnhancedLTRPrompt,
  parseLTRResponse,
  filterComparables,
  formatComparablesForResponse
};