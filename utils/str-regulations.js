// STR Regulation Checker - Uses Perplexity AI to find current rental rules for specific cities

class STRRegulationChecker {
  constructor(perplexityApiKey) {
    this.perplexityApiKey = perplexityApiKey;
    
    // Static database of known regulations for major Canadian cities
    this.knownRegulations = {
      'toronto': {
        allowed: true,
        requiresLicense: true,
        primaryResidenceOnly: true,
        maxDays: 180,
        summary: 'STR allowed in primary residence only, max 180 days/year, license required',
        licenseUrl: 'https://www.google.com/search?q=Toronto+short+term+rental+license+2024',
        restrictions: [
          'Must be your primary residence',
          'Maximum 180 days per year',
          'Municipal license required ($53.28/year)',
          'Must register with the city',
          'Cannot rent entire home if not primary residence'
        ],
        lastUpdated: '2024-12-01'
      },
      'mississauga': {
        allowed: true,
        requiresLicense: true,
        primaryResidenceOnly: true,
        maxDays: null,
        summary: 'STR allowed in primary residence only, license required, portion of home only',
        licenseUrl: 'https://www.mississauga.ca/services-and-payments/property-and-development/short-term-accommodation/',
        restrictions: [
          'Must be your primary residence',
          'Can only rent a portion of your home (not entire property)',
          'Business license required',
          'Maximum 4 guests at a time',
          'Must live on premises during rental',
          'Parking must be provided for guests'
        ],
        lastUpdated: '2024-12-01'
      },
      'vancouver': {
        allowed: true,
        requiresLicense: true,
        primaryResidenceOnly: true,
        maxDays: null,
        summary: 'STR allowed in primary residence only, strict licensing required',
        licenseUrl: 'https://vancouver.ca/home-property-development/short-term-rentals.aspx',
        restrictions: [
          'Must be your primary residence',
          'Business license required ($1,000+ per year)',
          'Strict enforcement and penalties',
          'Limited to principal residence only',
          'Regular inspections required'
        ],
        lastUpdated: '2024-12-01'
      },
      'ottawa': {
        allowed: true,
        requiresLicense: false,
        primaryResidenceOnly: false,
        maxDays: null,
        summary: 'STR generally allowed, fewer restrictions than other major cities',
        licenseUrl: 'https://ottawa.ca/en/planning-development-and-construction/residential-zoning/short-term-accommodation',
        restrictions: [
          'Must comply with zoning bylaws',
          'Some residential areas may restrict STR',
          'Fire safety requirements',
          'Noise and parking considerations'
        ],
        lastUpdated: '2024-12-01'
      }
    };
  }

  /**
   * Check STR regulations for a specific city
   * @param {string} city - City name
   * @param {string} province - Province name
   * @returns {Promise<Object>} Regulation information
   */
  async checkRegulations(city, province = 'Ontario') {
    const cityKey = city.toLowerCase().replace(/\s+/g, '');
    
    // Check if we have static data for this city
    if (this.knownRegulations[cityKey]) {
      console.log(`Found cached regulations for ${city}`);
      return {
        source: 'cached',
        city: city,
        province: province,
        ...this.knownRegulations[cityKey]
      };
    }
    
    // Use Perplexity AI to research current regulations
    if (this.perplexityApiKey) {
      try {
        console.log(`Researching STR regulations for ${city}, ${province} using Perplexity AI...`);
        const aiResult = await this.searchRegulationsWithPerplexity(city, province);
        return aiResult;
      } catch (error) {
        console.error('Perplexity AI regulation search failed:', error.message);
        return this.getGenericRegulationAdvice(city, province);
      }
    }
    
    // Fallback to generic advice
    return this.getGenericRegulationAdvice(city, province);
  }

  /**
   * Use Perplexity AI to research current STR regulations
   * @param {string} city 
   * @param {string} province 
   * @returns {Promise<Object>}
   */
  async searchRegulationsWithPerplexity(city, province) {
    const prompt = `Research the current short-term rental (Airbnb/VRBO) regulations for ${city}, ${province}, Canada as of 2024-2025.

Find the most up-to-date information about:
1. Are short-term rentals allowed in ${city}?
2. Is a license or permit required?
3. Must it be the owner's primary residence?
4. Are there any day limits per year?
5. What are the specific restrictions or requirements?
6. What are the penalties for non-compliance?
7. Official municipal website for licensing information

Please provide accurate, current information and cite official municipal sources where possible.

Format your response as JSON:
{
  "allowed": true/false,
  "requiresLicense": true/false,
  "primaryResidenceOnly": true/false,
  "maxDays": number or null,
  "summary": "Brief summary of the regulations",
  "restrictions": ["list", "of", "key", "restrictions"],
  "penalties": "Description of penalties for violations",
  "officialWebsite": "Official municipal website URL if found",
  "confidence": "high/medium/low",
  "lastUpdated": "2024-XX-XX",
  "sources": ["list", "of", "source", "websites"],
  "notes": "Additional important information"
}`;

    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.perplexityApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'sonar',
        messages: [
          {
            role: 'system',
            content: 'You are an expert researcher specializing in Canadian municipal short-term rental regulations. Provide accurate, current information from official municipal sources.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.1,
        max_tokens: 1000
      })
    });

    if (!response.ok) {
      throw new Error(`Perplexity API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const responseContent = data.choices[0].message.content;
    
    console.log('Raw Perplexity response:', responseContent.substring(0, 200) + '...');
    
    try {
      // Try to extract JSON from the response if it's wrapped in text
      let jsonMatch = responseContent.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        // If no JSON found, create a structured response from the text
        return {
          source: 'perplexity_research_text',
          city: city,
          province: province,
          allowed: null,
          requiresLicense: null,
          primaryResidenceOnly: null,
          maxDays: null,
          summary: `Current research completed for ${city}, ${province}`,
          restrictions: ['Please verify current regulations with municipal office'],
          officialWebsite: null,
          confidence: 'medium',
          lastUpdated: new Date().toISOString().split('T')[0],
          notes: responseContent.substring(0, 500) + (responseContent.length > 500 ? '...' : ''),
          sources: []
        };
      }
      
      const aiData = JSON.parse(jsonMatch[0]);
      return {
        source: 'perplexity_research',
        city: city,
        province: province,
        ...aiData
      };
    } catch (parseError) {
      console.error('Failed to parse Perplexity response:', parseError);
      console.log('Response content:', responseContent);
      
      // Return text-based fallback with Perplexity data
      return {
        source: 'perplexity_research_fallback',
        city: city,
        province: province,
        allowed: null,
        requiresLicense: null,
        primaryResidenceOnly: null,
        maxDays: null,
        summary: `Current research attempted for ${city}, ${province} - please verify locally`,
        restrictions: ['Contact municipal office for current regulations'],
        confidence: 'medium',
        lastUpdated: new Date().toISOString().split('T')[0],
        notes: responseContent.substring(0, 500) + (responseContent.length > 500 ? '...' : ''),
        sources: []
      };
    }
  }

  /**
   * Provide generic regulation advice when specific data isn't available
   * @param {string} city 
   * @param {string} province 
   * @returns {Object}
   */
  getGenericRegulationAdvice(city, province) {
    return {
      source: 'generic',
      city: city,
      province: province,
      allowed: null,
      requiresLicense: null,
      primaryResidenceOnly: null,
      maxDays: null,
      summary: `STR regulations vary by municipality. Research required for ${city}.`,
      restrictions: [
        'Check local zoning bylaws',
        'Verify if business license is required',
        'Confirm primary residence requirements',
        'Review fire safety and building code requirements',
        'Check for day limits or occupancy restrictions'
      ],
      recommendations: [
        `Contact ${city} municipal office directly`,
        'Consult with a local real estate lawyer',
        'Check provincial regulations for short-term rentals',
        'Review condo corporation bylaws if applicable'
      ],
      warning: 'This information is generic. Always verify current regulations with local authorities.',
      researchLinks: [
        `https://www.google.com/search?q="${city}+${province}+short+term+rental+regulations"`,
        `https://www.ontario.ca/page/short-term-rental-regulations` // For Ontario
      ],
      confidence: 'unknown',
      lastUpdated: new Date().toISOString().split('T')[0]
    };
  }

  /**
   * Generate compliance recommendations based on regulation data
   * @param {Object} regulations 
   * @returns {Object}
   */
  generateComplianceAdvice(regulations) {
    const advice = {
      compliant: null,
      riskLevel: 'unknown',
      recommendations: [],
      warnings: []
    };

    if (!regulations.allowed) {
      advice.compliant = false;
      advice.riskLevel = 'high';
      advice.warnings.push('Short-term rentals may not be allowed in this area');
      advice.recommendations.push('Consider long-term rental strategy only');
      return advice;
    }

    if (regulations.primaryResidenceOnly) {
      advice.warnings.push('STR only allowed in primary residence - investment properties may not qualify');
      advice.recommendations.push('Consider this property only if you plan to live there');
    }

    if (regulations.requiresLicense) {
      advice.recommendations.push('Budget for licensing fees and application process');
      advice.recommendations.push('Factor in time for license approval');
    }

    if (regulations.maxDays) {
      advice.recommendations.push(`Plan for maximum ${regulations.maxDays} rental days per year`);
      advice.recommendations.push('Track rental days carefully to avoid violations');
    }

    // Determine risk level
    if (regulations.primaryResidenceOnly && regulations.requiresLicense) {
      advice.riskLevel = 'high';
    } else if (regulations.requiresLicense || regulations.maxDays) {
      advice.riskLevel = 'medium';
    } else {
      advice.riskLevel = 'low';
    }

    return advice;
  }
}

module.exports = {
  STRRegulationChecker
};