# Data Mapping Guide - StarterPackApp Mockup to Real API Data

## Overview
This document maps each section of the mockup to actual data sources from our APIs.

## Data Sources Available

### 1. Perplexity AI API (`perplexityService.js`)
Provides:
- Property value estimates
- Property tax rates and amounts
- Insurance estimates
- Long-term rental rates
- Market comparables
- Citations for all data

### 2. Airbnb Scraper API (`airbnb-scraper.service.js`)
Provides:
- Comparable STR listings (up to 20)
- Nightly rates
- Occupancy estimates
- Property details (bedrooms, bathrooms, property type)
- Reviews and ratings
- Images and URLs
- Seasonal pricing data

### 3. Property Listing Data (Chrome Extension)
Provides:
- Actual listing price
- Property taxes (from listing)
- Condo/HOA fees
- Square footage
- Bedrooms and bathrooms
- Year built
- Property description

### 4. Firebase Database
Stores:
- User profiles
- Analysis history
- Saved properties
- Generated reports

## Section-by-Section Data Mapping

### Property Header
| Field | Data Source | Status |
|-------|------------|---------|
| Property Address | User Input / Listing | ✅ Real |
| Property Price | Listing / Perplexity Estimate | ✅ Real |
| Property Type | Listing / User Input | ✅ Real |
| Bedrooms/Bathrooms | Listing | ✅ Real |
| Square Footage | Listing | ✅ Real |

### STR Analysis Section

#### Key Metrics (Header Cards)
| Metric | Data Source | Calculation | Status |
|--------|------------|-------------|---------|
| Monthly Revenue | Airbnb API | avg_nightly_rate × occupancy_rate × 30 | ✅ Real |
| Net Cash Flow | Calculated | Monthly Revenue - All Expenses | ✅ Real |
| ROI | Calculated | (Annual Net / Initial Investment) × 100 | ✅ Real |
| Occupancy Rate | Airbnb API | Average from comparables | ✅ Real |

#### Revenue Projections
| Field | Data Source | Status |
|-------|------------|---------|
| Conservative Scenario | Airbnb API | ✅ Real (occupancy - 15%) |
| Realistic Scenario | Airbnb API | ✅ Real (average occupancy) |
| Optimistic Scenario | Airbnb API | ✅ Real (occupancy + 10%) |
| Seasonal Variations | Airbnb API | ✅ Real (spring/summer/fall/winter) |

#### Comparable Properties
| Field | Data Source | Status |
|-------|------------|---------|
| Listing Title | Airbnb API | ✅ Real |
| Nightly Rate | Airbnb API | ✅ Real |
| Occupancy Rate | Airbnb API | ✅ Real |
| Monthly Revenue | Calculated | ✅ Real |
| Rating | Airbnb API | ✅ Real |
| Image | Airbnb API | ✅ Real |
| Link | Airbnb API | ✅ Real |

#### Operating Expenses (NEW)
| Expense | Data Source | Status |
|---------|------------|---------|
| Property Tax | Listing/Perplexity | ✅ Real |
| Insurance | Perplexity/Calculated | ✅ Real |
| HOA/Condo Fees | Listing | ✅ Real |
| Utilities | Estimated (% of revenue) | 📊 Calculated |
| Cleaning | Estimated (% of revenue) | 📊 Calculated |
| Management | User Input / 20% default | 📊 Calculated |
| Maintenance | Estimated (1% property value) | 📊 Calculated |
| Platform Fees | 3% of revenue | 📊 Calculated |

#### Regulations & Compliance (NEW)
| Field | Data Source | Status |
|-------|------------|---------|
| License Requirements | Perplexity AI | ✅ Real |
| Max Rental Days | Perplexity AI | ✅ Real |
| Zoning Restrictions | Perplexity AI | ✅ Real |
| Tax Obligations | Perplexity AI | ✅ Real |

### LTR Analysis Section

#### Market Statistics (Header)
| Metric | Data Source | Status |
|--------|------------|---------|
| Average Rent | Perplexity AI | ✅ Real |
| Vacancy Rate | Perplexity AI | ✅ Real |
| Annual Appreciation | Perplexity AI | ✅ Real |
| Rent Growth | Perplexity AI | ✅ Real |

#### Rental Income Analysis
| Field | Data Source | Status |
|-------|------------|---------|
| Monthly Rent | Perplexity AI | ✅ Real |
| Annual Income | Calculated | ✅ Real |
| Vacancy Loss | Calculated (5% default) | 📊 Calculated |
| Effective Income | Calculated | ✅ Real |

#### Operating Expenses (NEW)
| Expense | Data Source | Status |
|---------|------------|---------|
| Property Tax | Listing/Perplexity | ✅ Real |
| Insurance | Perplexity/Calculated | ✅ Real |
| Property Management | 8-10% of rent | 📊 Calculated |
| Maintenance | 5-10% of rent | 📊 Calculated |
| HOA/Condo Fees | Listing | ✅ Real |
| Utilities (if included) | Estimated | 📊 Calculated |

#### Rental Comparables (NEW)
| Field | Data Source | Status |
|-------|------------|---------|
| Similar Properties | Perplexity AI | ✅ Real |
| Rent Range | Perplexity AI | ✅ Real |
| Features Comparison | Perplexity AI | ✅ Real |

#### Rent Control Info (NEW)
| Field | Data Source | Status |
|-------|------------|---------|
| Rent Control Status | Perplexity AI | ✅ Real |
| Annual Increase Limits | Perplexity AI | ✅ Real |
| Tenant Rights | Perplexity AI | ✅ Real |

### Financial Calculator Section

#### Financing Options
| Field | Data Source | Status |
|-------|------------|---------|
| Down Payment % | User Input | 👤 User |
| Interest Rate | User Input / Market Rate | 👤 User |
| Amortization | User Input | 👤 User |
| Mortgage Payment | Calculated | ✅ Real |

#### Sensitivity Analysis (NEW)
| Variable | Data Source | Status |
|----------|------------|---------|
| Occupancy Changes | Calculated | ✅ Real |
| Rate Changes | Calculated | ✅ Real |
| Expense Changes | Calculated | ✅ Real |
| Interest Rate Changes | Calculated | ✅ Real |

### STR vs LTR Comparison (NEW)

#### Financial Comparison
| Metric | Data Source | Status |
|--------|------------|---------|
| Gross Revenue | Calculated | ✅ Real |
| Operating Expenses | Calculated | ✅ Real |
| Net Income | Calculated | ✅ Real |
| ROI | Calculated | ✅ Real |
| Cash Flow | Calculated | ✅ Real |

#### Risk Assessment
| Factor | Data Source | Status |
|--------|------------|---------|
| Income Stability | Analysis Logic | 📊 Calculated |
| Management Effort | Predefined Values | 📊 Calculated |
| Regulatory Risk | Perplexity AI | ✅ Real |
| Market Sensitivity | Analysis Logic | 📊 Calculated |

## Data Confidence Indicators

### High Confidence (✅ Real Data)
- Data directly from listings
- Data from API responses
- Calculated from real inputs

### Medium Confidence (📊 Calculated)
- Industry standard percentages
- Regional averages
- Estimated from formulas

### User Provided (👤 User)
- Financing preferences
- Management choices
- Personal assumptions

## Implementation Notes

1. **Data Freshness**: 
   - Perplexity data: Real-time search
   - Airbnb data: Live scraping
   - Listing data: Snapshot at extraction

2. **Fallback Strategy**:
   - If API fails: Use cached data
   - If no listing data: Use Perplexity estimates
   - If no comparables: Use city averages

3. **Accuracy Improvements**:
   - More comparables = better STR estimates
   - Actual listing data > AI estimates
   - User can override any calculated values

4. **Cost Considerations**:
   - Perplexity: ~$0.01 per analysis
   - Airbnb Scraper: ~$0.01 per 20 listings
   - Total cost per analysis: ~$0.02-0.03

## Next Steps for Full Integration

1. Create data service layer to unify all sources
2. Add loading states for each data section
3. Implement error handling and fallbacks
4. Add data source indicators in UI
5. Create refresh mechanism for stale data
6. Add export functionality for all data
7. Implement data validation and sanitization