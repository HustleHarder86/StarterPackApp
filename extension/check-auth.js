// Quick script to check what's in the main app's localStorage
// Run this in the console of the main app tab

console.log('=== Checking StarterPack Auth ===');
console.log('All localStorage keys:', Object.keys(localStorage));
console.log('Auth token:', localStorage.getItem('starterpack_auth_token'));
console.log('User data:', localStorage.getItem('starterpack_user'));
console.log('Firebase auth:', localStorage.getItem('firebase:authUser'));

// Check if Firebase auth exists
const firebaseKeys = Object.keys(localStorage).filter(key => key.includes('firebase'));
console.log('Firebase keys found:', firebaseKeys);

// Get current user from Firebase
if (typeof firebase !== 'undefined' && firebase.auth) {
  const currentUser = firebase.auth().currentUser;
  console.log('Firebase current user:', currentUser);
  
  if (currentUser) {
    currentUser.getIdToken().then(token => {
      console.log('Fresh token obtained:', token.substring(0, 50) + '...');
      
      // Store it for the extension
      localStorage.setItem('starterpack_auth_token', token);
      localStorage.setItem('starterpack_user', JSON.stringify({
        uid: currentUser.uid,
        email: currentUser.email,
        displayName: currentUser.displayName
      }));
      console.log('✅ Auth data stored in localStorage!');
    });
  }
}