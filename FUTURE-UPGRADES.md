# Future Upgrades & Enhancement Ideas

This document tracks potential future enhancements and features for the StarterPackApp. These are ideas that have been identified but not yet implemented.

## Priority Legend
- 🔴 **High Priority**: Critical for user experience or business value
- 🟡 **Medium Priority**: Would significantly improve the product
- 🟢 **Low Priority**: Nice to have, quality of life improvements

## Planned Enhancements

### 1. STR Regulations Comprehensive Guide 🔴
**Date Added**: 2025-01-29  
**Priority**: High  
**Estimated Effort**: Medium (2-3 days)

**Description**: Create a comprehensive document covering short-term rental regulations across Canadian cities.

**Implementation Plan**:
- Research official government sources for top 10 Canadian cities
- Document licensing requirements, fees, and application processes
- Include zoning restrictions and operational rules
- Add tax obligations and platform-specific requirements
- Maintain with quarterly updates

**Benefits**:
- Users can quickly understand regulatory requirements for their city
- Reduces legal risk for STR operators
- Positions app as authoritative resource

**Technical Requirements**:
- New file: `STR-REGULATIONS-CANADA.md`
- Add navigation link in main app
- Consider future integration with automated regulation checking

---

### 2. Advanced Mortgage Calculator 🟡
**Date Added**: 2025-01-29  
**Priority**: Medium  
**Estimated Effort**: Small (1 day)

**Description**: Add comprehensive mortgage calculation to Investment Analysis tab.

**Features**:
- Down payment percentage slider (5-30%)
- Amortization period selector (15/20/25/30 years)
- Current interest rate input with market defaults
- Monthly payment auto-calculation
- Total interest paid visualization
- Multiple financing scenario comparison

**Location**: Investment Analysis Tab

---

### 3. Market Trends Dashboard 🟡
**Date Added**: 2025-01-29  
**Priority**: Medium  
**Estimated Effort**: Large (1 week)

**Description**: Historical and predictive market analysis.

**Features**:
- Historical price trends by neighborhood
- Seasonal STR rate fluctuations
- Occupancy rate trends
- Market saturation indicators

---

### 4. Automated Property Alerts 🟢
**Date Added**: 2025-01-29  
**Priority**: Low  
**Estimated Effort**: Medium (3 days)

**Description**: Email/SMS alerts for new properties matching criteria.

**Features**:
- Set custom search criteria
- Daily/weekly digest options
- Instant alerts for hot properties
- Price drop notifications

---

### 5. Portfolio Performance Tracking 🟡
**Date Added**: 2025-01-29  
**Priority**: Medium  
**Estimated Effort**: Large (1 week)

**Description**: Track actual vs projected performance for saved properties.

**Features**:
- Import actual revenue/expense data
- Performance comparison charts
- ROI tracking over time
- Tax report generation

---

### 6. Multi-Unit Property Detection 🔴
**Date Added**: 2025-01-29  
**Priority**: High  
**Estimated Effort**: Medium (2-3 days)

**Description**: Intelligent parsing of bedroom descriptions to identify multi-unit rental opportunities.

**Implementation Details**:
- Parse "1 + 1 bedroom" format to detect above/below ground units
- Recognize this indicates potential for two separate rental units
- Calculate enhanced profitability scenarios:
  - Dual STR units (e.g., upstairs Airbnb + basement suite)
  - Mixed STR/LTR strategy
  - House hacking opportunities
- Update UI to show multi-unit analysis when detected

**Example Scenarios**:
- "2 + 1 bedrooms" = Main floor unit (2BR) + basement suite (1BR)
- "3 + 2 bedrooms" = Potential duplex configuration
- Calculate separate revenue streams for each unit

**Benefits**:
- Identifies hidden income potential
- More accurate ROI for multi-unit properties  
- Helps investors find house hacking opportunities
- Better analysis for properties with in-law suites

---

### 7. AI-Powered Property Assistant Chatbot 🔴
**Date Added**: 2025-01-29  
**Priority**: High  
**Estimated Effort**: Large (1-2 weeks)

**Description**: Context-aware AI chatbot that answers property-specific questions using real-time research.

**Core Features**:
- Maintains context of currently analyzed property (address, city, type)
- Answers location-specific regulatory questions
- Provides real-time research using AI APIs (Perplexity, GPT-4)
- Remembers conversation history during session

**Example Use Cases**:
- "What are the requirements for adding a separate entrance in this municipality?"
- "Can I legally create a basement suite at this address?"
- "What permits do I need for STR in this neighborhood?"
- "Are there any upcoming zoning changes in this area?"
- "What's the process for severing this lot?"
- "Can I add a laneway house on this property?"

**Technical Implementation**:
- Floating chat widget on analysis pages
- Pass property context (address, zoning, city) to AI
- Use Perplexity API for real-time municipal research
- Cache common questions per municipality
- Provide source links for all answers

**Benefits**:
- Instant answers to complex regulatory questions
- Reduces need to search multiple government websites
- Personalized to specific property and location
- Helps identify opportunities (suite potential, zoning changes)
- Saves hours of research time

**Integration Points**:
- Appears after property analysis is complete
- Pre-populated with property context
- Can reference analysis data (price, size, current zoning)
- Links to relevant sections of the app

---

## Ideas Under Consideration

### Mobile App Development
- Native iOS/Android apps
- Offline analysis capability
- Camera integration for property photos

### AI-Powered Insights
- Natural language property search
- Automated investment recommendations
- Risk assessment ML model

### Integration Expansions
- Direct MLS integration
- Property management software sync
- Accounting software exports

## Rejected Ideas

_None yet_

## How to Contribute

When adding new ideas:
1. Include date added
2. Assign realistic priority
3. Estimate implementation effort
4. Describe clear benefits
5. Note any technical dependencies

## Review Schedule

This document should be reviewed quarterly:
- Q1 2025: March 31
- Q2 2025: June 30
- Q3 2025: September 30
- Q4 2025: December 31

During reviews:
- Re-prioritize based on user feedback
- Remove completed items
- Archive rejected ideas with reasoning
- Update effort estimates based on learnings