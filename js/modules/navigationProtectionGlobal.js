/**
 * Navigation Protection Module - Global Version
 * Warns users before leaving the page when analysis data is present
 */

(function() {
  'use strict';

  function initNavigationProtection() {
    let hasAnalysisData = false;
    let isNavigatingToNewTab = false;

    // Check if we have analysis data
    const checkAnalysisData = () => {
      return window.appState?.currentAnalysis || window.analysisData || 
             (document.querySelector('#analysisResults') && 
              !document.querySelector('#analysisResults').classList.contains('hidden'));
    };

    // Handle beforeunload event
    const handleBeforeUnload = (e) => {
      // Skip warning if clicking link that opens in new tab
      if (isNavigatingToNewTab) {
        isNavigatingToNewTab = false;
        return;
      }

      hasAnalysisData = checkAnalysisData();
      
      if (hasAnalysisData) {
        const message = 'You have unsaved analysis data. Are you sure you want to leave?';
        e.preventDefault();
        e.returnValue = message;
        return message;
      }
    };

    // Track clicks on external links
    const handleLinkClick = (e) => {
      const link = e.target.closest('a');
      if (link && link.target === '_blank') {
        isNavigatingToNewTab = true;
        // Reset flag after a short delay
        setTimeout(() => {
          isNavigatingToNewTab = false;
        }, 100);
      }
    };

    // Initialize protection
    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('click', handleLinkClick);

    // Public API
    return {
      enable: () => {
        window.addEventListener('beforeunload', handleBeforeUnload);
      },
      disable: () => {
        window.removeEventListener('beforeunload', handleBeforeUnload);
      },
      setHasData: (hasData) => {
        hasAnalysisData = hasData;
      }
    };
  }

  // Export to global scope
  window.navigationProtection = {
    init: initNavigationProtection
  };
})();