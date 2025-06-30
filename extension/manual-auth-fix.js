// Manual auth fix - run this in the main app console if auth token isn't being stored automatically

console.log('=== Manual Auth Token Storage ===');

async function storeAuthToken() {
  if (typeof firebase === 'undefined' || !firebase.auth) {
    console.error('❌ Firebase not available');
    return;
  }
  
  const user = firebase.auth().currentUser;
  if (!user) {
    console.error('❌ No user logged in');
    return;
  }
  
  console.log('✅ Found user:', user.email);
  
  try {
    console.log('Getting ID token...');
    const token = await user.getIdToken();
    console.log('✅ Got token:', token.substring(0, 50) + '...');
    
    // Store in localStorage
    localStorage.setItem('starterpack_auth_token', token);
    localStorage.setItem('starterpack_user', JSON.stringify({
      uid: user.uid,
      email: user.email,
      displayName: user.displayName
    }));
    
    console.log('✅ Token stored in localStorage!');
    
    // Verify
    const stored = localStorage.getItem('starterpack_auth_token');
    if (stored) {
      console.log('✅ Verified: Token is in localStorage');
      console.log('\n🎉 SUCCESS! Now reload your extension and it should detect you\'re logged in.');
    } else {
      console.error('❌ Failed to verify token in localStorage');
    }
    
  } catch (error) {
    console.error('❌ Error getting token:', error);
  }
}

// Run the fix
storeAuthToken();