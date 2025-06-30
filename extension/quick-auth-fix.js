// Quick fix to sync auth - run this in the extension popup console

console.log('=== Quick Auth Sync ===');

// Get auth from main app tab
chrome.tabs.query({ url: 'https://starter-pack-app.vercel.app/*' }, async (tabs) => {
  if (tabs.length === 0) {
    console.error('❌ No StarterPack tabs open');
    return;
  }
  
  const results = await chrome.scripting.executeScript({
    target: { tabId: tabs[0].id },
    func: () => {
      return {
        token: localStorage.getItem('starterpack_auth_token'),
        user: localStorage.getItem('starterpack_user')
      };
    }
  });
  
  if (results && results[0] && results[0].result.token) {
    const { token, user } = results[0].result;
    await chrome.storage.local.set({
      authToken: token,
      userData: user ? JSON.parse(user) : null
    });
    console.log('✅ Auth synced! Reload the popup.');
    window.location.reload();
  } else {
    console.error('❌ No auth token found');
  }
});