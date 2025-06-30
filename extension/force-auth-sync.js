// Force auth sync from main app to extension
// Run this in the extension popup console

console.log('=== Forcing Auth Sync ===');

async function forceAuthSync() {
  try {
    // 1. Get main app tab
    const tabs = await chrome.tabs.query({ url: 'https://starter-pack-app.vercel.app/*' });
    if (tabs.length === 0) {
      console.error('❌ No StarterPack tabs found. Please open the main app first.');
      return;
    }
    
    console.log('✅ Found main app tab');
    
    // 2. Extract auth from main app
    const results = await chrome.scripting.executeScript({
      target: { tabId: tabs[0].id },
      func: () => {
        const token = localStorage.getItem('starterpack_auth_token');
        const user = localStorage.getItem('starterpack_user');
        return { token, user };
      }
    });
    
    if (!results || !results[0] || !results[0].result.token) {
      console.error('❌ No auth token found in main app');
      return;
    }
    
    const { token, user } = results[0].result;
    console.log('✅ Got auth token from main app');
    
    // 3. Store in extension (try both storage types)
    const authData = {
      authToken: token,
      userData: user ? JSON.parse(user) : null
    };
    
    // Clear old data first
    await chrome.storage.local.clear();
    await chrome.storage.sync.clear();
    console.log('✅ Cleared old storage');
    
    // Store new data
    await chrome.storage.local.set(authData);
    await chrome.storage.sync.set(authData);
    console.log('✅ Stored auth in both local and sync storage');
    
    // 4. Verify storage
    const localCheck = await chrome.storage.local.get(['authToken']);
    const syncCheck = await chrome.storage.sync.get(['authToken']);
    
    console.log('✅ Verification:');
    console.log('  - Local storage:', localCheck.authToken ? 'Has token' : 'No token');
    console.log('  - Sync storage:', syncCheck.authToken ? 'Has token' : 'No token');
    
    if (localCheck.authToken || syncCheck.authToken) {
      console.log('\n🎉 SUCCESS! Auth synced. Now reload the extension popup.');
      
      // Reload the popup
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } else {
      console.error('❌ Failed to store auth token');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

forceAuthSync();