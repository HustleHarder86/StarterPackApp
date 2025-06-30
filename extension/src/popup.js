// Popup script for StarterPack extension

const API_BASE = 'https://starter-pack-app.vercel.app/api';
const APP_BASE = 'https://starter-pack-app.vercel.app';

// State management
let currentUser = null;

// DOM elements
const welcomeState = document.getElementById('welcomeState');
const loginState = document.getElementById('loginState');
const loggedInState = document.getElementById('loggedInState');
const loadingState = document.getElementById('loadingState');
const errorState = document.getElementById('errorState');
const loginForm = document.getElementById('loginForm');
const logoutBtn = document.getElementById('logoutBtn');
const retryBtn = document.getElementById('retryBtn');
const continueBtn = document.getElementById('continueBtn');
const syncAuthBtn = document.getElementById('syncAuthBtn');

// Initialize popup
document.addEventListener('DOMContentLoaded', async () => {
  await checkAuthStatus();
});

// Check authentication status
async function checkAuthStatus() {
  showState('loading');
  
  // Add debug logging
  console.log('[StarterPack] Starting auth check...');
  
  try {
    // Check if we should show welcome screen
    const { showWelcome } = await chrome.storage.local.get('showWelcome');
    console.log('[StarterPack] Show welcome?', showWelcome);
    
    if (showWelcome) {
      showState('welcome');
      return;
    }

    // First check if we can get auth from the main app via localStorage
    // This works when both are on the same domain
    let authToken = null;
    let userData = null;
    
    // Try to access the main app's localStorage
    console.log('[StarterPack] Looking for main app tabs...');
    const tabs = await chrome.tabs.query({ url: 'https://starter-pack-app.vercel.app/*' });
    console.log('[StarterPack] Found tabs:', tabs.length);
    
    if (tabs.length > 0) {
      // Try direct script execution first (more reliable)
      console.log('[StarterPack] Using direct script execution on tab:', tabs[0].url);
      try {
        const results = await chrome.scripting.executeScript({
          target: { tabId: tabs[0].id },
          func: () => {
            return {
              token: localStorage.getItem('starterpack_auth_token'),
              user: localStorage.getItem('starterpack_user')
            };
          }
        });
        
        if (results && results[0] && results[0].result) {
          const { token, user } = results[0].result;
          console.log('[StarterPack] Direct execution got token:', !!token, 'user:', !!user);
          
          if (token) {
            authToken = token;
            userData = user ? JSON.parse(user) : null;
            
            // Store in extension storage with verification
            try {
              await chrome.storage.local.set({ 
                authToken: authToken,
                userData: userData 
              });
              
              // Verify it was actually stored
              const verify = await chrome.storage.local.get(['authToken']);
              if (verify.authToken) {
                console.log('[StarterPack] Successfully stored and verified auth token in extension storage');
              } else {
                console.error('[StarterPack] Failed to verify token storage!');
                throw new Error('Token storage verification failed');
              }
            } catch (storageError) {
              console.error('[StarterPack] Storage error:', storageError);
              // Try alternative storage method
              await chrome.storage.sync.set({ 
                authToken: authToken,
                userData: userData 
              });
              console.log('[StarterPack] Stored auth using sync storage as fallback');
            }
          }
        }
      } catch (scriptError) {
        console.log('[StarterPack] Direct script execution failed:', scriptError.message);
        
        // Fallback to content script messaging
        try {
          console.log('[StarterPack] Trying content script messaging...');
          const result = await chrome.tabs.sendMessage(tabs[0].id, {
            action: 'getAuthFromLocalStorage'
          });
          console.log('[StarterPack] Got result from content script:', result);
          
          if (result && result.token) {
            authToken = result.token;
            userData = result.user;
            await chrome.storage.local.set({ 
              authToken: authToken,
              userData: userData 
            });
            console.log('[StarterPack] Stored auth from content script');
          }
        } catch (messageError) {
          console.log('[StarterPack] Content script messaging also failed:', messageError.message);
        }
      }
    }
    
    // Fall back to stored token
    if (!authToken) {
      // Try local storage first
      let stored = await chrome.storage.local.get(['authToken', 'userData']);
      console.log('[StarterPack] Checking local storage:', stored);
      
      // If not in local, try sync storage
      if (!stored.authToken) {
        stored = await chrome.storage.sync.get(['authToken', 'userData']);
        console.log('[StarterPack] Checking sync storage:', stored);
      }
      
      authToken = stored.authToken;
      userData = stored.userData;
    }
    
    if (!authToken) {
      console.log('[StarterPack] No auth token found, showing login');
      showState('login');
      return;
    }
    
    console.log('[StarterPack] Found auth token, verifying...');

    // Skip API verification for now since the endpoint isn't deployed
    // Just decode the token locally
    if (userData) {
      currentUser = userData;
      console.log('[StarterPack] Using stored user data');
    } else if (authToken) {
      // Decode the JWT to get basic user info (this is safe for client-side)
      try {
        const tokenParts = authToken.split('.');
        const payload = JSON.parse(atob(tokenParts[1]));
        currentUser = {
          uid: payload.user_id || payload.sub,
          email: payload.email,
          displayName: payload.name || payload.email
        };
        console.log('[StarterPack] Decoded user from token:', currentUser.email);
      } catch (e) {
        console.log('[StarterPack] Could not decode token:', e);
        currentUser = { email: 'User' }; // Fallback
      }
    }

    // Optional: Verify token expiration
    if (authToken) {
      try {
        const tokenParts = authToken.split('.');
        const payload = JSON.parse(atob(tokenParts[1]));
        const exp = payload.exp;
        const now = Math.floor(Date.now() / 1000);
        
        if (exp && exp < now) {
          console.log('[StarterPack] Token is expired');
          throw new Error('Token expired');
        }
      } catch (e) {
        // Continue anyway if we can't check expiration
        console.log('[StarterPack] Could not check token expiration');
      }
    }
    
    updateUserInterface();
    showState('loggedIn');
  } catch (error) {
    console.error('Auth check failed:', error);
    await chrome.storage.local.remove(['authToken', 'userData']);
    
    // If it's a network error, show error state
    if (error.message.includes('fetch')) {
      showError('Network error. Please check your connection.');
    } else {
      showState('login');
    }
  }
}

// Update user interface with current data
function updateUserInterface() {
  if (!currentUser) return;

  document.getElementById('userEmail').textContent = currentUser.email || 'User';
  document.getElementById('analysisCount').textContent = 
    currentUser.monthlyAnalysisCount || '-';
  
  // Calculate STR trials remaining
  const strTrialLeft = currentUser.strTrialUsed !== undefined 
    ? Math.max(0, 5 - currentUser.strTrialUsed) 
    : '-';
  document.getElementById('strTrialCount').textContent = strTrialLeft;
  
  // Hide STR trial count if user is Pro
  if (currentUser.subscriptionTier === 'pro' || currentUser.subscriptionTier === 'enterprise') {
    const strStat = document.querySelector('.stat:nth-child(2)');
    if (strStat) strStat.style.display = 'none';
  }
}

// Handle login form submission
loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  // For now, redirect to web app for login
  showError('Please sign up or login through the StarterPack website first');
  
  // Open main app
  setTimeout(() => {
    chrome.tabs.create({
      url: `${APP_BASE}/roi-finder.html`
    });
  }, 2000);
});

// Handle logout
logoutBtn.addEventListener('click', async () => {
  try {
    await chrome.storage.local.remove('authToken');
    chrome.runtime.sendMessage({ action: 'logout' });
    currentUser = null;
    showState('login');
  } catch (error) {
    console.error('Logout error:', error);
  }
});

// Handle retry button
retryBtn.addEventListener('click', () => {
  checkAuthStatus();
});

// Continue button handler
if (continueBtn) {
  continueBtn.addEventListener('click', async () => {
    // Remove welcome flag
    await chrome.storage.local.remove('showWelcome');
    // Show login screen
    showState('login');
  });
}

// Sync auth button handler
if (syncAuthBtn) {
  syncAuthBtn.addEventListener('click', async () => {
    showState('loading');
    
    // Open main app in new tab
    const tab = await chrome.tabs.create({ 
      url: `${APP_BASE}/roi-finder.html`,
      active: false
    });
    
    // Wait a bit for page to load
    setTimeout(async () => {
      try {
        const result = await chrome.tabs.sendMessage(tab.id, {
          action: 'getAuthFromLocalStorage'
        });
        
        if (result && result.token) {
          await chrome.storage.local.set({ 
            authToken: result.token,
            userData: result.user 
          });
          
          // Close the tab
          chrome.tabs.remove(tab.id);
          
          // Re-check auth
          await checkAuthStatus();
        } else {
          chrome.tabs.update(tab.id, { active: true });
          showError('Please login to the main app first');
        }
      } catch (error) {
        console.error('Sync error:', error);
        chrome.tabs.update(tab.id, { active: true });
        showError('Please login to the main app in the new tab');
      }
    }, 3000);
  });
}

// Show specific state
function showState(state) {
  // Hide all states
  welcomeState.style.display = 'none';
  loginState.style.display = 'none';
  loggedInState.style.display = 'none';
  loadingState.style.display = 'none';
  errorState.style.display = 'none';
  
  // Show requested state
  switch (state) {
    case 'welcome':
      welcomeState.style.display = 'block';
      break;
    case 'login':
      loginState.style.display = 'block';
      break;
    case 'loggedIn':
      loggedInState.style.display = 'block';
      break;
    case 'loading':
      loadingState.style.display = 'block';
      break;
    case 'error':
      errorState.style.display = 'block';
      break;
  }
}

// Show error message
function showError(message) {
  document.getElementById('errorMessage').textContent = message;
  showState('error');
}

// Note: For development, override the API URLs
// Since these were declared as const, we need a different approach
const getApiBase = () => {
  return window.location.hostname === 'localhost' 
    ? 'http://localhost:3000/api' 
    : API_BASE;
};

const getAppBase = () => {
  return window.location.hostname === 'localhost' 
    ? 'http://localhost:3000' 
    : APP_BASE;
};