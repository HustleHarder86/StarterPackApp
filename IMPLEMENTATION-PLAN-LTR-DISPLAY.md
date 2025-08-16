# LTR Comparables Display Implementation Plan

## 📍 Display Locations Already Exist!

Both mockups have pre-built sections for LTR comparables that just need real data:

### Base-mockup.html
- **Location**: Line 2425-2500
- **Container ID**: `rental-comparables-container`
- **Current**: Shows 3 hardcoded examples (Liberty Village, King West, etc.)
- **Grid Layout**: 3 columns with cards

### Base-mockup2.html  
- **Location**: Line 1224-1280
- **Container ID**: `rental-comparables-container`
- **Current**: Shows 3 hardcoded examples with images
- **Grid Layout**: Expandable section with comparable cards

## 🎯 Implementation Strategy

### Step 1: Update api-integration.js

```javascript
function updateLTRComparables(ltrData) {
  const container = document.getElementById('rental-comparables-container');
  if (!container || !ltrData.comparables) return;
  
  // Clear existing hardcoded content
  container.innerHTML = '';
  
  // Take top 3-6 comparables (to fit the grid)
  const topComparables = ltrData.comparables.slice(0, 6);
  
  topComparables.forEach(comp => {
    const card = createComparableCard(comp);
    container.appendChild(card);
  });
}

function createComparableCard(comp) {
  // For base-mockup.html style:
  const card = document.createElement('div');
  card.style.cssText = 'border: 1px solid var(--gray-200); border-radius: 12px; overflow: hidden;';
  
  card.innerHTML = `
    <div style="background: linear-gradient(135deg, #f3f4f6, #e5e7eb); height: 160px; position: relative;">
      <div style="position: absolute; bottom: 10px; left: 10px; background: white; padding: 6px 12px; border-radius: 6px; font-weight: 600;">
        $${comp.monthly_rent.toLocaleString()}/mo
      </div>
      ${comp.match_score >= 90 ? 
        '<div style="position: absolute; top: 10px; right: 10px; background: #22c55e; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px;">' + comp.match_score + '% Match</div>' 
        : ''}
    </div>
    <div style="padding: 16px;">
      <h4 style="font-size: 15px; font-weight: 600; margin-bottom: 8px;">
        ${comp.bedrooms}BR • ${comp.address.split(',')[0]}
      </h4>
      <div style="display: flex; gap: 12px; margin-bottom: 12px;">
        <span style="font-size: 13px; color: var(--gray-600);">${comp.bedrooms} Bed</span>
        <span style="font-size: 13px; color: var(--gray-600);">${comp.bathrooms} Bath</span>
        <span style="font-size: 13px; color: var(--gray-600);">${comp.sqft || 'N/A'} sqft</span>
      </div>
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <span style="font-size: 12px; color: ${comp.days_on_market < 7 ? 'var(--success-green)' : 'var(--warning-yellow)'}; font-weight: 500;">
          Listed ${comp.days_on_market} days ago
        </span>
        ${comp.source_url ? 
          `<a href="${comp.source_url}" target="_blank" style="font-size: 12px; color: var(--primary-blue); text-decoration: none;">
            ${comp.source} →
          </a>` :
          `<span style="font-size: 12px; color: var(--gray-500);">${comp.source}</span>`
        }
      </div>
    </div>
  `;
  
  return card;
}
```

### Step 2: Update Data Mapping

In the existing `updateLTRSection` function, add:

```javascript
function updateLTRSection(ltrData, propertyDetails = {}) {
  // Existing code for updating rent values...
  
  // NEW: Update comparables section
  if (ltrData.comparables && ltrData.comparables.length > 0) {
    updateLTRComparables(ltrData);
    
    // Update the average rent display
    const avgRentEl = document.getElementById('ltr-monthly-rent');
    if (avgRentEl && ltrData.average_rent) {
      avgRentEl.textContent = `$${ltrData.average_rent.toLocaleString()}`;
    }
    
    // Add confidence indicator
    const confidenceBadge = document.createElement('span');
    confidenceBadge.className = 'data-source-badge';
    confidenceBadge.style.cssText = `
      background: ${ltrData.confidence === 'high' ? '#22c55e' : 
                   ltrData.confidence === 'medium' ? '#f59e0b' : '#ef4444'};
      color: white;
      margin-left: 8px;
    `;
    confidenceBadge.textContent = `${ltrData.confidence} confidence`;
    
    // Add to section header if not already there
    const sectionHeader = document.querySelector('#ltr-analysis-section h2');
    if (sectionHeader && !sectionHeader.querySelector('.confidence')) {
      confidenceBadge.className += ' confidence';
      sectionHeader.appendChild(confidenceBadge);
    }
  }
}
```

### Step 3: Handle Both Mockup Styles

For base-mockup2.html (with images):

```javascript
function createComparableCardWithImage(comp) {
  const card = document.createElement('div');
  card.className = 'comparable-card';
  
  // Use placeholder image if none provided
  const imageUrl = comp.image_url || 
    `https://images.unsplash.com/photo-${Math.random() > 0.5 ? '1560448204-e02f11c3d0e2' : '1512917774080-9991f1c4c750'}?w=400&h=300&fit=crop`;
  
  card.innerHTML = `
    <div class="comparable-image-container">
      <img src="${imageUrl}" alt="${comp.address}" class="comparable-image">
      <div class="comparable-price">$${comp.monthly_rent.toLocaleString()}/mo</div>
    </div>
    <div class="comparable-details">
      <div class="comparable-title">${comp.bedrooms}BR, ${comp.bathrooms}BA • ${comp.address.split(',')[0]}</div>
      <div class="comparable-stats">
        <span class="comparable-stat">${comp.sqft || 'N/A'} sq ft</span>
        <span class="comparable-stat">${comp.distance_km} km away</span>
      </div>
      <div class="comparable-revenue">
        <span class="revenue-label">Match Score</span>
        <span style="font-weight: 600;">${comp.match_score}%</span>
      </div>
      ${comp.source_url ? 
        `<a href="${comp.source_url}" target="_blank" class="view-listing-link">
          View on ${comp.source} →
        </a>` : ''
      }
    </div>
  `;
  
  return card;
}
```

## 📊 Data Structure Expected

The API will provide:
```javascript
long_term_rental: {
  average_rent: 3225,
  median_rent: 3050,
  confidence: "high",
  comparables: [
    {
      address: "839 Queen Street W, Toronto",
      monthly_rent: 2600,
      bedrooms: 3,
      bathrooms: 2,
      sqft: 1650,
      distance_km: 0.3,
      days_on_market: 3,
      match_score: 92,
      source: "PadMapper",
      source_url: "https://padmapper.com/..."
    },
    // ... more comparables
  ]
}
```

## 🎨 Visual Enhancements

### Add Match Score Badges
- 90-100%: Green badge "Excellent Match"
- 80-89%: Blue badge "Good Match"  
- 70-79%: Yellow badge "Fair Match"

### Add Distance Indicators
- < 0.5km: "Same neighborhood"
- 0.5-1km: "Nearby"
- 1-2km: "Close by"

### Show Data Freshness
- < 7 days: Green "New listing"
- 7-14 days: Yellow "Recent"
- > 14 days: Gray "X days ago"

## 🚀 No New UI Needed!

The beauty of this implementation:
1. **Sections already exist** in both mockups
2. **Grid layouts ready** for 3-6 comparables
3. **Styling matches** existing design
4. Just need to **populate with real data**
5. **Add clickable links** to source listings

## Testing Points

1. ✅ Verify `rental-comparables-container` gets populated
2. ✅ Check match scores display correctly
3. ✅ Test source URLs open in new tabs
4. ✅ Ensure responsive on mobile (grid should stack)
5. ✅ Handle cases with < 3 comparables gracefully
6. ✅ Verify confidence badge appears