/**
 * Navigation Protection Module
 * Warns users before leaving the page when analysis data is present
 */

export function initNavigationProtection() {
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

    // Only show warning if we have analysis data
    if (checkAnalysisData()) {
      const message = 'You have an active analysis. Are you sure you want to leave this page?';
      e.preventDefault();
      e.returnValue = message;
      return message;
    }
  };

  // Add protection when analysis is loaded
  window.addEventListener('analysisLoaded', () => {
    hasAnalysisData = true;
    window.addEventListener('beforeunload', handleBeforeUnload);
  });

  // Remove protection when analysis is cleared
  window.addEventListener('analysisClosed', () => {
    hasAnalysisData = false;
    window.removeEventListener('beforeunload', handleBeforeUnload);
  });

  // Track clicks on links that open in new tabs
  document.addEventListener('click', (e) => {
    const link = e.target.closest('a');
    if (link && link.target === '_blank') {
      isNavigatingToNewTab = true;
      // Reset flag after a short delay
      setTimeout(() => {
        isNavigatingToNewTab = false;
      }, 100);
    }
  });

  // Initial check
  if (checkAnalysisData()) {
    hasAnalysisData = true;
    window.addEventListener('beforeunload', handleBeforeUnload);
  }
}

// External link handler to ensure all external links open in new tabs
export function ensureExternalLinksOpenInNewTab() {
  // Function to check if URL is external
  const isExternalUrl = (url) => {
    if (!url) return false;
    try {
      const link = new URL(url, window.location.href);
      return link.hostname !== window.location.hostname;
    } catch {
      return false;
    }
  };

  // Process all links on the page
  const processLinks = () => {
    const links = document.querySelectorAll('a[href]');
    links.forEach(link => {
      const href = link.getAttribute('href');
      if (isExternalUrl(href) || href.includes('airbnb.com')) {
        link.setAttribute('target', '_blank');
        link.setAttribute('rel', 'noopener noreferrer');
        
        // Add visual indicator for external links
        if (!link.querySelector('.external-link-icon') && !link.textContent.includes('→')) {
          link.innerHTML += ' <span class="external-link-icon text-xs">↗</span>';
        }
      }
    });
  };

  // Process links on page load
  processLinks();

  // Watch for new content being added to the page
  const observer = new MutationObserver((mutations) => {
    let shouldProcess = false;
    mutations.forEach(mutation => {
      if (mutation.addedNodes.length > 0) {
        shouldProcess = true;
      }
    });
    if (shouldProcess) {
      setTimeout(processLinks, 100);
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
}

// Initialize both features when DOM is ready
export function init() {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      initNavigationProtection();
      ensureExternalLinksOpenInNewTab();
    });
  } else {
    initNavigationProtection();
    ensureExternalLinksOpenInNewTab();
  }
}