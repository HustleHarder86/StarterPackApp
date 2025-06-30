// Authentication bridge between main app and extension
// This script helps sync authentication state

// Listen for messages from the main app
window.addEventListener('message', async (event) => {
  // Verify origin
  if (event.origin !== 'https://starterpackapp.vercel.app' && 
      event.origin !== 'http://localhost:3000') {
    return;
  }

  // Handle auth token updates
  if (event.data.type === 'AUTH_TOKEN_UPDATE') {
    const { token, user } = event.data;
    
    // Send to extension
    chrome.runtime.sendMessage({
      action: 'updateAuth',
      token: token,
      user: user
    }, (response) => {
      // Notify the app that sync is complete
      window.postMessage({
        type: 'AUTH_SYNC_COMPLETE',
        success: true
      }, event.origin);
    });
  }
});

// Request current auth state from main app
function requestAuthState() {
  // Try both production and development origins
  const origins = [
    'https://starterpackapp.vercel.app',
    'http://localhost:3000'
  ];
  
  origins.forEach(origin => {
    window.postMessage({
      type: 'REQUEST_AUTH_STATE',
      source: 'starterpack-extension'
    }, origin);
  });
}

// Auto-request auth state when loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', requestAuthState);
} else {
  requestAuthState();
}