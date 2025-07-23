# Analysis Type Flow - Manual Test Checklist

## Test Setup
1. Start local server: `python3 -m http.server 8080`
2. Open: http://localhost:8080/tests/test-analysis-type-flow.html

## Test Cases

### 1. Property Confirmation Component
- [ ] Component renders with property details
- [ ] Analysis type radio buttons are visible
- [ ] Each option shows correct description

### 2. User Type: Free User (5 trials)
- [ ] Select "Free User (5 STR trials)" from dropdown
- [ ] Click "Run Test"
- [ ] Verify "5/5 free trials remaining" shows for STR options
- [ ] All analysis types are selectable

### 3. User Type: Free User (0 trials)
- [ ] Select "Free User (0 trials left)" from dropdown
- [ ] Click "Run Test"
- [ ] Verify upgrade prompt shows instead of trial count
- [ ] STR options are disabled (grayed out)
- [ ] Only LTR option is selectable

### 4. User Type: Premium User
- [ ] Select "Premium User" from dropdown
- [ ] Click "Run Test"
- [ ] No trial notices should appear
- [ ] All options are available

### 5. Tab Switching (Analysis Type: Both)
- [ ] Select "Both STR & LTR" analysis type
- [ ] Click "Run Test"
- [ ] Verify both tabs appear
- [ ] Click "Long-Term Rental Analysis" tab
- [ ] Verify LTR content shows, STR content hides
- [ ] Click "Short-Term Rental Analysis" tab
- [ ] Verify STR content shows, LTR content hides

### 6. Single Analysis Views
- [ ] Select "LTR Only" analysis type
- [ ] Click "Run Test"
- [ ] Verify NO tabs appear (single view)
- [ ] Only LTR content is shown
- [ ] Repeat for "STR Only"

### 7. API Integration Test
Open: http://localhost:8080/roi-finder.html
1. Login with test account
2. Use browser extension or manual entry
3. On property confirmation:
   - [ ] Select "Long-Term Rental Only"
   - [ ] Confirm analysis runs with only LTR data
   - [ ] No STR tab appears in results
4. Repeat with "Both" option:
   - [ ] Both tabs appear
   - [ ] Can switch between STR and LTR views

## Expected Results
- ✅ All radio buttons functional
- ✅ Trial counting works correctly
- ✅ Tab switching works when "both" selected
- ✅ Single view (no tabs) when one type selected
- ✅ API respects analysisType parameter
- ✅ Results display matches user selection