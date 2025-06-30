// Debug script for StarterPack extension

document.getElementById('checkStorage').addEventListener('click', async () => {
  const result = document.getElementById('storageResult');
  try {
    const data = await chrome.storage.local.get(['authToken', 'userData', 'showWelcome']);
    result.innerHTML = `<pre class="info">${JSON.stringify(data, null, 2)}</pre>`;
  } catch (error) {
    result.innerHTML = `<p class="error">Error: ${error.message}</p>`;
  }
});

document.getElementById('checkTabs').addEventListener('click', async () => {
  const result = document.getElementById('tabsResult');
  try {
    const tabs = await chrome.tabs.query({ url: 'https://starter-pack-app.vercel.app/*' });
    result.innerHTML = `
      <p class="info">Found ${tabs.length} tab(s)</p>
      ${tabs.map(tab => `
        <pre class="info">Tab ${tab.id}: ${tab.url}
Active: ${tab.active}
Status: ${tab.status}</pre>
      `).join('')}
    `;
  } catch (error) {
    result.innerHTML = `<p class="error">Error: ${error.message}</p>`;
  }
});

document.getElementById('tryScript').addEventListener('click', async () => {
  const result = document.getElementById('scriptResult');
  try {
    const tabs = await chrome.tabs.query({ url: 'https://starter-pack-app.vercel.app/*' });
    if (tabs.length === 0) {
      result.innerHTML = `<p class="error">No StarterPack tabs found</p>`;
      return;
    }
    
    const scriptResults = await chrome.scripting.executeScript({
      target: { tabId: tabs[0].id },
      func: () => {
        const token = localStorage.getItem('starterpack_auth_token');
        const user = localStorage.getItem('starterpack_user');
        return {
          token: token ? token.substring(0, 50) + '...' : null,
          user: user,
          allKeys: Object.keys(localStorage),
          url: window.location.href
        };
      }
    });
    
    if (scriptResults && scriptResults[0]) {
      result.innerHTML = `<pre class="success">${JSON.stringify(scriptResults[0].result, null, 2)}</pre>`;
    }
  } catch (error) {
    result.innerHTML = `<p class="error">Error: ${error.message}</p>`;
  }
});

document.getElementById('tryMessage').addEventListener('click', async () => {
  const result = document.getElementById('messageResult');
  try {
    const tabs = await chrome.tabs.query({ url: 'https://starter-pack-app.vercel.app/*' });
    if (tabs.length === 0) {
      result.innerHTML = `<p class="error">No StarterPack tabs found</p>`;
      return;
    }
    
    const response = await chrome.tabs.sendMessage(tabs[0].id, {
      action: 'getAuthFromLocalStorage'
    });
    
    result.innerHTML = `<pre class="success">${JSON.stringify(response, null, 2)}</pre>`;
  } catch (error) {
    result.innerHTML = `<p class="error">Error: ${error.message}</p>`;
  }
});

document.getElementById('clearStorage').addEventListener('click', async () => {
  const result = document.getElementById('clearResult');
  try {
    await chrome.storage.local.clear();
    result.innerHTML = `<p class="success">Storage cleared!</p>`;
  } catch (error) {
    result.innerHTML = `<p class="error">Error: ${error.message}</p>`;
  }
});

document.getElementById('fullCheck').addEventListener('click', async () => {
  const result = document.getElementById('fullResult');
  let html = '<h4>Running full auth check...</h4>';
  
  try {
    // 1. Check storage
    const storage = await chrome.storage.local.get(['authToken', 'userData']);
    html += `<p>1. Extension storage: ${storage.authToken ? '✅ Has token' : '❌ No token'}</p>`;
    
    // 2. Check tabs
    const tabs = await chrome.tabs.query({ url: 'https://starter-pack-app.vercel.app/*' });
    html += `<p>2. Main app tabs: ${tabs.length > 0 ? '✅ Found ' + tabs.length : '❌ None found'}</p>`;
    
    if (tabs.length > 0) {
      // 3. Try script execution
      try {
        const scriptResults = await chrome.scripting.executeScript({
          target: { tabId: tabs[0].id },
          func: () => {
            return {
              hasToken: !!localStorage.getItem('starterpack_auth_token'),
              hasUser: !!localStorage.getItem('starterpack_user')
            };
          }
        });
        
        if (scriptResults && scriptResults[0] && scriptResults[0].result) {
          const { hasToken, hasUser } = scriptResults[0].result;
          html += `<p>3. Script execution: ${hasToken ? '✅ Token found' : '❌ No token'}, ${hasUser ? '✅ User found' : '❌ No user'}</p>`;
        }
      } catch (e) {
        html += `<p>3. Script execution: ❌ Failed - ${e.message}</p>`;
      }
      
      // 4. Try content script
      try {
        const response = await chrome.tabs.sendMessage(tabs[0].id, {
          action: 'getAuthFromLocalStorage'
        });
        html += `<p>4. Content script: ${response && response.token ? '✅ Got token' : '❌ No token'}</p>`;
      } catch (e) {
        html += `<p>4. Content script: ❌ Failed - ${e.message}</p>`;
      }
    }
    
    html += '<p><strong>Diagnosis:</strong></p>';
    if (!storage.authToken && tabs.length > 0) {
      html += '<p class="info">Token exists in main app but not synced to extension. Click "Execute Script" above to sync.</p>';
    } else if (storage.authToken) {
      html += '<p class="success">Auth token is properly stored in extension!</p>';
    } else {
      html += '<p class="error">No auth token found anywhere. Please login to the main app first.</p>';
    }
    
  } catch (error) {
    html += `<p class="error">Error during check: ${error.message}</p>`;
  }
  
  result.innerHTML = html;
});