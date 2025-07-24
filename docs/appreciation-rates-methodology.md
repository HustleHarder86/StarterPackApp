# Property Appreciation Rates Methodology

## Overview
The StarterPackApp uses location-specific appreciation rates based on historical Canadian real estate data to provide accurate property value projections.

## Data Sources & Rates

### Major Markets

1. **Toronto: 5.5% annually**
   - Based on: Toronto Real Estate Board (TREB) 20-year average
   - Accounts for: GTA's strong population growth and economic fundamentals

2. **Vancouver: 6.0% annually**
   - Based on: Real Estate Board of Greater Vancouver data
   - Reflects: International demand and supply constraints

3. **Montreal: 4.0% annually**
   - Based on: Quebec Professional Association of Real Estate Brokers data
   - Considers: Steady growth with rent control impacts

4. **Calgary: 3.5% annually**
   - Based on: Calgary Real Estate Board historical data
   - Factors in: Energy sector influence on housing

5. **Ottawa: 4.5% annually**
   - Based on: Ottawa Real Estate Board data
   - Reflects: Government employment stability

6. **Edmonton: 3.3% annually**
   - Based on: Realtors Association of Edmonton data
   - Energy sector dependent with moderate growth

### High Growth GTA Markets
- **Hamilton: 6.5%** - Exceptional growth from Toronto spillover
- **Brampton: 6.2%** - One of Canada's fastest growing cities
- **Oshawa: 6.0%** - Eastern GTA expansion
- **Markham: 5.9%** - Tech hub with strong appreciation
- **Whitby: 5.9%** - Durham region growth
- **Mississauga: 5.8%** - Mature GTA suburb
- **Vaughan: 5.8%** - Subway access driving growth
- **Ajax: 5.8%** - Eastern GTA expansion
- **Richmond Hill: 5.7%** - Affluent GTA suburb
- **Pickering: 5.7%** - Future airport proximity
- **Oakville: 5.6%** - Premium GTA market
- **Burlington: 5.4%** - Golden Horseshoe location
- **Barrie: 5.4%** - Cottage country gateway

### BC Markets
- **Surrey: 6.1%** - Rapidly growing Metro Vancouver
- **Coquitlam: 5.9%** - Strong Metro Vancouver growth
- **Burnaby: 5.8%** - Metro Vancouver growth
- **Richmond: 5.7%** - Vancouver suburb with strong demand
- **Kelowna: 5.5%** - BC's interior growth market
- **Victoria: 5.2%** - Capital city steady growth

### Ontario Secondary Markets
- **St. Catharines: 5.8%** - Niagara region growth
- **Niagara Falls: 5.6%** - Tourism and Toronto spillover
- **Waterloo: 5.4%** - Tech hub appreciation
- **Kitchener: 5.3%** - Tech corridor growth
- **Cambridge: 5.2%** - Part of tech triangle
- **London: 5.1%** - University city growth
- **Guelph: 5.0%** - University city near GTA
- **Peterborough: 4.9%** - Retiree and student market
- **Windsor: 4.7%** - Border city growth
- **Kingston: 4.6%** - University and government

### Atlantic Canada
- **Halifax: 4.8%** - Maritime hub with tech growth
- **Charlottetown: 4.7%** - PEI capital growth
- **Moncton: 4.5%** - Growing Atlantic market
- **Fredericton: 4.2%** - New Brunswick capital
- **St. John's: 3.8%** - Steady Newfoundland market

### Prairie Markets
- **Winnipeg: 3.6%** - Stable Prairie market
- **Regina: 3.4%** - Saskatchewan capital
- **Saskatoon: 3.2%** - Resource-based economy

### Quebec Markets
- **Gatineau: 4.3%** - Ottawa spillover effect
- **Laval: 4.1%** - Montreal suburb growth
- **Longueuil: 4.0%** - South shore Montreal
- **Quebec City: 3.8%** - Steady provincial capital
- **Sherbrooke: 3.7%** - Eastern Townships

### Remote Work Boom Markets
- **Muskoka: 7.2%** - Cottage country explosion
- **Collingwood: 6.8%** - Ski town remote work boom
- **Prince Edward County: 6.3%** - Wine country growth
- **Canmore: 5.8%** - Mountain resort town
- **Whistler: 5.5%** - World-class ski resort

### Northern Markets
- **Sudbury: 3.1%** - Mining city recovery
- **Sault Ste. Marie: 2.9%** - Border city stability
- **Thunder Bay: 2.8%** - Northern Ontario

### Canadian National Average: 4.0%
- Used for markets not specifically listed

## Property Type Adjustments

The appreciation rate is further adjusted based on property type, reflecting historical performance differences:

### Premium Appreciation (+10-15%)
- **Detached Houses: +15%**
  - Own land, highest demand from families
  - Limited supply in urban areas
  - Best long-term appreciation historically

### Above Average (+5-10%)
- **Duplex/Triplex/Fourplex: +10%**
  - Investment property appeal
  - Rental income offsets costs
  - Strong demand from investors

- **Semi-Detached: +5%**
  - Balance of affordability and space
  - Popular with first-time buyers
  - Good appreciation potential

### Average Appreciation (0%)
- **Townhouses: 0%**
  - Market average performance
  - Good middle-ground option
  - Steady appreciation

### Below Average (-10-15%)
- **Lofts: -10%**
  - Niche market appeal
  - Often conversion properties
  - Limited buyer pool

- **Condos/Apartments: -15%**
  - Monthly maintenance fees impact value
  - No land ownership
  - Higher supply in most markets
  - Slower appreciation historically

## Combined Rate Calculation

**Final Appreciation Rate = Base Market Rate × Property Type Multiplier**

Examples:
- Toronto Detached House: 5.5% × 1.15 = 6.3%
- Vancouver Condo: 6.0% × 0.85 = 5.1%
- Hamilton Townhouse: 6.5% × 1.0 = 6.5%

## Implementation Details

### Automatic Detection
- The system detects the market based on the property address
- Falls back to national average if city not recognized

### User Adjustability
- Slider allows rates from 1% (conservative) to 10% (optimistic)
- Default to market-specific rate based on location

### Visual Representation
- 10-year projection with annual bars
- Highlights at 5 and 10-year milestones
- Shows both dollar amounts and percentage gains

## Important Disclaimers

1. **Historical ≠ Future**: Past performance doesn't guarantee future results
2. **Market Cycles**: Real estate markets are cyclical
3. **Local Factors**: Neighborhood-specific factors can vary significantly
4. **Economic Conditions**: Interest rates, employment, and policy changes affect appreciation

## Recommended Usage

- Use as a **planning tool**, not a guarantee
- Consider multiple scenarios (conservative/moderate/optimistic)
- Factor in local market conditions and property-specific attributes
- Update projections regularly as market conditions change

## Future Enhancements

1. **Neighborhood-Level Data**: More granular appreciation rates
2. **AI-Powered Predictions**: Machine learning models for better accuracy
3. **Market Condition Adjustments**: Real-time adjustments based on current market
4. **Property Type Factors**: Different rates for condos vs. houses

## References

- Canadian Real Estate Association (CREA): crea.ca
- Toronto Real Estate Board (TREB): trreb.ca
- Real Estate Board of Greater Vancouver (REBGV): rebgv.org
- Quebec Professional Association of Real Estate Brokers (QPAREB): apciq.ca
- Calgary Real Estate Board (CREB): creb.ca
- Ottawa Real Estate Board (OREB): oreb.ca

---

*Note: All rates are approximations based on historical averages and should be used for planning purposes only. Consult with real estate professionals for specific investment advice.*