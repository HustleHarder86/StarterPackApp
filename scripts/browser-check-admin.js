// Browser Console Script to Check Admin Status
// Run this in the browser console while logged in to check your admin status

(async function checkMyAdminStatus() {
    console.log('🔍 Checking your admin status...\n');
    
    // Check if Firebase is available
    if (typeof firebase === 'undefined') {
        console.error('❌ Firebase not loaded. Make sure you\'re on the ROI Finder page.');
        return;
    }
    
    // Get current user
    const user = firebase.auth().currentUser;
    
    if (!user) {
        console.error('❌ Not logged in. Please login first.');
        return;
    }
    
    console.log('✅ Logged in as:', user.email);
    console.log('   UID:', user.uid);
    
    try {
        // Get user document from Firestore
        const db = firebase.firestore();
        const userDoc = await db.collection('users').doc(user.uid).get();
        
        if (userDoc.exists) {
            const userData = userDoc.data();
            console.log('\n📄 Your Account Details:');
            console.log('   Role:', userData.role || 'Not set');
            console.log('   Is Admin:', userData.isAdmin || false);
            console.log('   Subscription Tier:', userData.subscriptionTier || 'Not set');
            console.log('   STR Trials Used:', userData.strTrialUsed || 0);
            
            // Check admin status
            const isAdmin = userData.role === 'admin' || userData.isAdmin === true;
            const hasUnlimitedSTR = isAdmin || 
                                   userData.subscriptionTier === 'pro' || 
                                   userData.subscriptionTier === 'enterprise';
            
            console.log('\n🎯 Access Summary:');
            if (isAdmin) {
                console.log('   ✅ You ARE an ADMIN!');
                console.log('   👑 You have unlimited STR access');
                console.log('   🚀 All features unlocked');
            } else if (hasUnlimitedSTR) {
                console.log('   ✅ You have unlimited STR access (Pro/Enterprise)');
            } else {
                console.log('   ❌ You are NOT an admin');
                const trialsLeft = Math.max(0, 5 - (userData.strTrialUsed || 0));
                console.log(`   📊 STR trials remaining: ${trialsLeft}/5`);
                console.log('\n   To get admin access, ask the platform owner to run:');
                console.log(`   node scripts/update-to-admin.js ${user.email}`);
            }
            
            // Check custom claims (if available)
            const idTokenResult = await user.getIdTokenResult();
            if (idTokenResult.claims.role) {
                console.log('\n🔐 Custom Claims:');
                console.log('   Role:', idTokenResult.claims.role);
                console.log('   Tier:', idTokenResult.claims.tier || 'Not set');
            }
            
        } else {
            console.error('❌ User document not found in Firestore');
        }
        
    } catch (error) {
        console.error('❌ Error checking status:', error.message);
    }
    
    console.log('\n✨ Check complete!');
})();