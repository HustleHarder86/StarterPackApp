# Analysis Saving and Dashboard Issues Investigation

## **Problem Summary**
Analyses are not being saved properly and cannot be viewed in the dashboard. Users complete analyses but can't see them in their portfolio.

## **Root Cause Analysis**

### 1. **Missing Property Creation** ❌
**Issue**: When analysis is completed in `roi-finder.html`, the property is NOT being saved to the `properties` collection.

**Evidence**: 
- Line 3345 in `roi-finder.html`: `displayResults(result.data)` - shows results
- Line 3349: `loadUserAnalyses()` - tries to load analyses 
- **NO PROPERTY SAVING CODE** exists after analysis completion

**Expected Flow**: 
1. User completes analysis
2. Analysis saved to `analyses` collection ✅ (happens in API)
3. Property saved to `properties` collection ❌ (MISSING)
4. Property and analysis linked by `propertyId` ❌ (BROKEN)

### 2. **Analysis-Property Linking Broken** ❌
**Issue**: Analyses are saved with no `propertyId` linking them to properties.

**Evidence**: In `/api/analyze-property.js` line 580:
```javascript
await db.collection('analyses').doc(analysisId).set(analysisData);
```

The `analysisData` object does NOT include a `propertyId` field, breaking the expected schema from CLAUDE.md.

### 3. **Dashboard Query Issues** ❌
**Issue**: Portfolio.html assumes analyses are linked to properties via `propertyId`.

**Evidence**: Lines 294-308 in `portfolio.html`:
```javascript
const analysesSnapshot = await db.collection('analyses')
  .where('propertyId', 'in', chunk)  // This will ALWAYS return empty
  .get();
```

Since analyses don't have `propertyId`, this query returns no results.

### 4. **Missing Integration Between Analysis API and Property Creation** ❌
**Issue**: The browser extension saves properties via `/api/properties/ingest.js`, but the analysis API doesn't link to those properties.

**Current Broken Flow**:
1. Extension → `/api/properties/ingest.js` → Creates property with ID
2. User → `roi-finder.html` → Manual analysis → `/api/analyze-property.js` → Creates analysis with NO propertyId
3. Dashboard → Looks for analyses with propertyId → Finds nothing

## **Specific Issues by File**

### `/home/amy/StarterPackApp/roi-finder.html`
**Lines 3340-3355**: After successful analysis
- ✅ Displays results: `displayResults(result.data)`
- ✅ Reloads analyses: `loadUserAnalyses()`
- ❌ **MISSING**: Property creation/update
- ❌ **MISSING**: Linking analysis to property

### `/home/amy/StarterPackApp/api/analyze-property.js`
**Line 580**: Analysis saving
- ✅ Saves analysis to `analyses` collection
- ❌ **MISSING**: `propertyId` field in analysis data
- ❌ **MISSING**: Property creation if not exists
- ❌ **MISSING**: Analysis-property relationship

### `/home/amy/StarterPackApp/portfolio.html`
**Lines 294-308**: Loading analyses
- ✅ Loads properties correctly
- ❌ **BROKEN**: Queries analyses by `propertyId` but analyses don't have this field
- ❌ **RESULT**: No analyses ever loaded

## **Required Fixes (Priority Order)**

### **Priority 1: Fix Analysis-Property Linking**
1. **Update `/api/analyze-property.js`**:
   - Add `propertyId` field to analysis data before saving
   - Either accept `propertyId` from request or create property first

2. **Update `roi-finder.html`**:
   - Pass `propertyId` to analysis API when available
   - Create property record if analyzing without extension data

### **Priority 2: Fix Property Creation in Analysis Flow**
1. **Modify analysis completion in `roi-finder.html`**:
   - After successful analysis, save/update property record
   - Link analysis to property via `propertyId`

### **Priority 3: Fix Dashboard Queries**
1. **Update `portfolio.html`**:
   - Handle cases where analyses exist without linked properties
   - Show standalone analyses if property linking is missing

### **Priority 4: Add Data Migration**
1. **Create migration script**:
   - Find existing analyses without `propertyId`
   - Create corresponding property records
   - Link analyses to properties

## **Schema Fixes Needed**

### Analysis Schema (Current vs Expected)
**Current** (in `/api/analyze-property.js`):
```javascript
{
  userId: userId || null,
  // propertyId: MISSING ❌
  // ...other fields
}
```

**Expected** (from CLAUDE.md):
```javascript
{
  userId: string,
  propertyId: string, // ❌ MISSING
  analysisType: 'traditional' | 'str' | 'combined',
  // ...other fields
}
```

## **Test Cases to Verify Fixes**

1. **Browser Extension Flow**:
   - Extension saves property → Analysis → View in dashboard

2. **Manual Analysis Flow**:
   - Manual analysis → Property created → View in dashboard

3. **Existing Data**:
   - Orphaned analyses appear in dashboard or get migrated

## **Files That Need Changes**

1. `/home/amy/StarterPackApp/roi-finder.html` - Add property saving
2. `/home/amy/StarterPackApp/api/analyze-property.js` - Add propertyId to analysis
3. `/home/amy/StarterPackApp/portfolio.html` - Handle missing property links (optional)
4. Create migration script for existing data

## **Impact Assessment**

- **Users**: Cannot see completed analyses in dashboard
- **Data**: Analyses are being saved but orphaned
- **Business**: Users may think analyses aren't working, leading to churn
- **Technical Debt**: Data integrity issues that will worsen over time