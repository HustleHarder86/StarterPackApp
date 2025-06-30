// Diagnostic script to understand auth failure
// Run this in the extension popup console

console.log('=== Extension Auth Diagnosis ===');

async function diagnoseAuth() {
  console.log('\n1. Checking extension storage...');
  const storage = await chrome.storage.local.get(['authToken', 'userData']);
  console.log('Storage contents:', {
    hasToken: !!storage.authToken,
    tokenLength: storage.authToken ? storage.authToken.length : 0,
    hasUserData: !!storage.userData,
    userData: storage.userData
  });
  
  console.log('\n2. Checking for main app tabs...');
  const tabs = await chrome.tabs.query({ url: 'https://starter-pack-app.vercel.app/*' });
  console.log('Found tabs:', tabs.length);
  
  if (tabs.length > 0) {
    console.log('\n3. Checking localStorage in main app...');
    try {
      const results = await chrome.scripting.executeScript({
        target: { tabId: tabs[0].id },
        func: () => {
          const token = localStorage.getItem('starterpack_auth_token');
          const user = localStorage.getItem('starterpack_user');
          return {
            hasToken: !!token,
            tokenLength: token ? token.length : 0,
            user: user ? JSON.parse(user) : null,
            allLocalStorageKeys: Object.keys(localStorage)
          };
        }
      });
      console.log('Main app localStorage:', results[0].result);
    } catch (e) {
      console.error('Script execution error:', e);
    }
  }
  
  console.log('\n4. Testing API call...');
  if (storage.authToken) {
    try {
      const response = await fetch('https://starter-pack-app.vercel.app/api/properties/list', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${storage.authToken}`
        }
      });
      console.log('API response:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      });
      
      if (!response.ok) {
        const text = await response.text();
        console.log('Response body:', text);
      }
    } catch (e) {
      console.error('API call error:', e);
    }
  } else {
    console.log('No token to test API with');
  }
  
  console.log('\n=== Diagnosis Complete ===');
}

diagnoseAuth();