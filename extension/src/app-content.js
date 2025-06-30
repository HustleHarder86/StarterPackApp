// Content script for StarterPackApp domain
// This helps the extension access authentication data

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getAuthFromLocalStorage') {
    try {
      const token = localStorage.getItem('starterpack_auth_token');
      const userStr = localStorage.getItem('starterpack_user');
      const user = userStr ? JSON.parse(userStr) : null;
      
      sendResponse({
        token: token,
        user: user
      });
    } catch (error) {
      console.error('Error getting auth data:', error);
      sendResponse({ error: error.message });
    }
  }
  return true; // Keep message channel open for async response
});