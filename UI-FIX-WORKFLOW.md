# UI Fix Workflow - Standard Operating Procedure

This workflow should be followed for ALL UI fixes to ensure quality and prevent integration issues.

## 🎯 Workflow Steps

### 1. **Identify the Component** 
- Locate the exact file and component
- Find the specific element(s) to modify
- Note any dependencies (scripts, styles, data)

### 2. **Create a Mock First**
- Build a simple HTML mock of the desired fix
- Include all necessary styles and structure
- Test the mock in isolation to confirm it matches requirements

### 3. **Implement the Fix**
- Apply changes to the actual component
- Ensure data bindings are correct (watch for snake_case vs camelCase)
- Maintain existing functionality while making changes

### 4. **Quick Local Test**
- Create a standalone test HTML file with just the affected component
- Load with mock data that matches production structure
- Verify visually and functionally
- Check browser console for errors

### 5. **Pre-Commit Validation** ⚠️ CRITICAL STEP
- **Run code-reviewer agent** to compare:
  - Mock vs implementation structure
  - CSS class availability
  - Data property mapping
  - Event handler consistency
  - Script dependencies
  
- **Run ui-ux-tester agent** to:
  - Capture screenshots of the fix
  - Validate visual appearance
  - Check for responsive issues
  - Verify no console errors

### 6. **Fix Issues Found**
- Address ALL discrepancies identified by agents
- Re-test after fixes
- Repeat validation if significant changes made

### 7. **Final Commit & Push**
- Only proceed if validation passes
- Use clear commit messages describing the fix
- Push to main branch
- Notify user for live testing

## 🚫 Common Pitfalls to Avoid

1. **Data Structure Mismatches**
   - Mock uses `propertyData.image` but API provides `property_data.image_url`
   - Always verify actual data structure from API

2. **Missing CSS Dependencies**
   - Mock works because styles are inline
   - Component breaks because CSS class doesn't exist
   - Always check design-system.css and component styles

3. **Script Timing Issues**
   - Scripts executing before DOM ready
   - Chart.js or other libraries not loaded
   - Always check initialization order

4. **Event Handler Differences**
   - Mock uses onclick but component needs addEventListener
   - Different function names or scopes
   - Always match existing patterns

## 📋 Pre-Flight Checklist

Before committing any UI fix:
- [ ] Mock created and approved
- [ ] Implementation matches mock structure
- [ ] Local test file works correctly
- [ ] Code-reviewer agent found no issues
- [ ] UI-UX-tester agent validated appearance
- [ ] No console errors
- [ ] Responsive design maintained
- [ ] Existing functionality preserved

## 🎨 When to Use This Workflow

- Any visual component changes
- Layout modifications
- Adding/removing UI elements
- Styling updates
- Interactive feature changes
- Chart/visualization updates

---

**Remember**: It's faster to validate before pushing than to fix after deployment!