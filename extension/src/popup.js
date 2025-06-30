// Popup script for StarterPack extension

const API_BASE = 'https://starterpackapp.vercel.app/api';
const APP_BASE = 'https://starterpackapp.vercel.app';

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

// Initialize popup
document.addEventListener('DOMContentLoaded', async () => {
  await checkAuthStatus();
});

// Check authentication status
async function checkAuthStatus() {
  showState('loading');
  
  try {
    // Check if we should show welcome screen
    const { showWelcome } = await chrome.storage.local.get('showWelcome');
    if (showWelcome) {
      showState('welcome');
      return;
    }

    // First check if we can get auth from the main app via localStorage
    // This works when both are on the same domain
    let authToken = null;
    let userData = null;
    
    try {
      // Try to access the main app's localStorage through a content script
      const tabs = await chrome.tabs.query({ url: 'https://starterpackapp.vercel.app/*' });
      if (tabs.length > 0) {
        const result = await chrome.tabs.sendMessage(tabs[0].id, {
          action: 'getAuthFromLocalStorage'
        });
        if (result && result.token) {
          authToken = result.token;
          userData = result.user;
          // Store in extension storage
          await chrome.storage.local.set({ 
            authToken: authToken,
            userData: userData 
          });
        }
      }
    } catch (e) {
      console.log('Could not get auth from main app tab');
    }
    
    // Fall back to stored token
    if (!authToken) {
      const stored = await chrome.storage.local.get(['authToken', 'userData']);
      authToken = stored.authToken;
      userData = stored.userData;
    }
    
    if (!authToken) {
      showState('login');
      return;
    }

    // Verify token with API
    const response = await fetch(`${API_BASE}/user-management`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    if (!response.ok) {
      throw new Error('Invalid session');
    }

    const userData = await response.json();
    currentUser = userData.user;
    
    updateUserInterface();
    showState('loggedIn');
  } catch (error) {
    console.error('Auth check failed:', error);
    await chrome.storage.local.remove('authToken');
    showState('login');
  }
}

// Update user interface with current data
function updateUserInterface() {
  if (!currentUser) return;

  document.getElementById('userEmail').textContent = currentUser.email;
  document.getElementById('analysisCount').textContent = 
    currentUser.monthlyAnalysisCount || 0;
  
  // Calculate STR trials remaining
  const strTrialLeft = Math.max(0, 5 - (currentUser.strTrialUsed || 0));
  document.getElementById('strTrialCount').textContent = strTrialLeft;
  
  // Hide STR trial count if user is Pro
  if (currentUser.subscriptionTier === 'pro' || currentUser.subscriptionTier === 'enterprise') {
    document.querySelector('.stat:nth-child(2)').style.display = 'none';
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