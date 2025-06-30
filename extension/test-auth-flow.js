// Test script to verify auth flow is working
// Run this in the console on the main app after logging in

console.log('=== Testing StarterPack Auth Flow ===');

// Check localStorage
console.log('1. Checking localStorage...');
const token = localStorage.getItem('starterpack_auth_token');
const user = localStorage.getItem('starterpack_user');

if (token) {
  console.log('✅ Auth token found:', token.substring(0, 50) + '...');
} else {
  console.log('❌ No auth token in localStorage');
}

if (user) {
  console.log('✅ User data found:', JSON.parse(user));
} else {
  console.log('❌ No user data in localStorage');
}

// Check Firebase auth
console.log('\n2. Checking Firebase auth...');
if (typeof firebase !== 'undefined' && firebase.auth) {
  const currentUser = firebase.auth().currentUser;
  if (currentUser) {
    console.log('✅ Firebase user logged in:', currentUser.email);
  } else {
    console.log('❌ No Firebase user logged in');
  }
} else {
  console.log('⚠️ Firebase not available');
}

console.log('\n=== Test Complete ===');
console.log('Next steps:');
console.log('1. If no token found, refresh the page to trigger auth state change');
console.log('2. Then reload the extension to pick up the stored token');