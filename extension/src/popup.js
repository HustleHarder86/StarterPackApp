// Popup script for StarterPack extension

const API_BASE = 'https://starterpackapp.vercel.app/api';
const APP_BASE = 'https://starterpackapp.vercel.app';

// State management
let currentUser = null;

// DOM elements
const loginState = document.getElementById('loginState');
const loggedInState = document.getElementById('loggedInState');
const loadingState = document.getElementById('loadingState');
const errorState = document.getElementById('errorState');
const loginForm = document.getElementById('loginForm');
const logoutBtn = document.getElementById('logoutBtn');
const retryBtn = document.getElementById('retryBtn');

// Initialize popup
document.addEventListener('DOMContentLoaded', async () => {
  await checkAuthStatus();
});

// Check authentication status
async function checkAuthStatus() {
  showState('loading');
  
  try {
    const { authToken } = await chrome.storage.local.get('authToken');
    
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
  // In a future update, we could implement Firebase Auth directly in the extension
  showError('Please login through the StarterPack website first');
  
  // Open login page
  chrome.tabs.create({
    url: `${APP_BASE}/roi-finder.html?extension=true`
  });
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

// Show specific state
function showState(state) {
  // Hide all states
  loginState.style.display = 'none';
  loggedInState.style.display = 'none';
  loadingState.style.display = 'none';
  errorState.style.display = 'none';
  
  // Show requested state
  switch (state) {
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