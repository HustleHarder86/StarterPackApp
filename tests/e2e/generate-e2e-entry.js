/**
 * Generate E2E test entry point from production HTML
 */

const fs = require('fs').promises;
const path = require('path');

const PROJECT_ROOT = path.join(__dirname, '../..');
const PROD_HTML = path.join(PROJECT_ROOT, 'roi-finder.html');
const E2E_HTML = path.join(PROJECT_ROOT, 'roi-finder-e2e.html');

async function generateE2EEntry() {
  console.log('🏗️  Generating E2E entry point...\n');
  
  try {
    // Read production HTML
    let html = await fs.readFile(PROD_HTML, 'utf8');
    
    // 1. Add E2E mode detection at the very beginning
    const e2eDetectionScript = `
    <!-- E2E Test Mode Detection - Must be first -->
    <script>
        // Check for E2E test mode immediately
        const urlParams = new URLSearchParams(window.location.search);
        window.E2E_TEST_MODE = urlParams.get('e2e_test_mode') === 'true';
        
        if (window.E2E_TEST_MODE) {
            console.log('🧪 E2E Test Mode Detected - Firebase will be mocked');
            
            // Mock Firebase before any scripts load
            window.firebase = {
                initializeApp: () => ({}),
                auth: () => ({
                    onAuthStateChanged: (callback) => {
                        // Simulate authenticated user immediately
                        const testUser = {
                            uid: 'test-user-e2e',
                            email: 'test@e2e.com',
                            displayName: 'E2E Test User'
                        };
                        // Call immediately and after a delay to ensure it's caught
                        callback(testUser);
                        setTimeout(() => callback(testUser), 100);
                        return () => {}; // Return unsubscribe function
                    },
                    signOut: () => Promise.resolve(),
                    currentUser: {
                        uid: 'test-user-e2e',
                        email: 'test@e2e.com'
                    }
                }),
                firestore: () => ({
                    collection: () => ({
                        doc: () => ({
                            get: () => Promise.resolve({
                                exists: () => true,
                                data: () => ({
                                    subscriptionTier: 'starter',
                                    strTrialUsed: 0,
                                    portfolio: []
                                })
                            }),
                            set: () => Promise.resolve(),
                            update: () => Promise.resolve()
                        }),
                        add: () => Promise.resolve({ id: 'test-doc-id' }),
                        where: () => ({
                            get: () => Promise.resolve({ docs: [] })
                        })
                    })
                })
            };
            
            // Mock Firebase UI
            window.firebaseui = {
                auth: {
                    AuthUI: class {
                        start() {}
                        delete() { return Promise.resolve(); }
                    }
                }
            };
            
            // Mock fetch for config
            const originalFetch = window.fetch;
            window.fetch = function(url, ...args) {
                if (url === '/api/config') {
                    return Promise.resolve({
                        ok: true,
                        json: () => Promise.resolve({
                            firebase: {
                                apiKey: 'test-key',
                                authDomain: 'test.firebaseapp.com',
                                projectId: 'test-project',
                                storageBucket: 'test.appspot.com',
                                messagingSenderId: '123456',
                                appId: 'test-app-id'
                            }
                        })
                    });
                }
                return originalFetch(url, ...args);
            };
        }
    </script>
    `;
    
    // 2. Replace the initializeFirebase function to skip in test mode
    html = html.replace(
      'async function initializeFirebase() {',
      `async function initializeFirebase() {
            if (window.E2E_TEST_MODE) {
                console.log('🧪 Skipping Firebase initialization in test mode');
                auth = firebase.auth();
                db = firebase.firestore();
                return;
            }
            `
    );
    
    // 3. Add E2E test helpers
    const e2eHelpers = `
    <!-- E2E Test Helpers -->
    <script>
        if (window.E2E_TEST_MODE) {
            // Helper to show property form immediately
            window.E2E_showPropertyForm = function() {
                if (window.appController) {
                    window.appController.showPropertyInput();
                } else {
                    const propertySection = document.getElementById('property-input-section');
                    const loginSection = document.getElementById('login-section');
                    if (propertySection) {
                        propertySection.classList.remove('hidden');
                    }
                    if (loginSection) {
                        loginSection.classList.add('hidden');
                    }
                }
            };
            
            // Helper to get current app state
            window.E2E_getAppState = function() {
                return {
                    currentUser: window.appState?.currentUser,
                    userData: window.appState?.userData,
                    formVisible: document.getElementById('property-input-section')?.style.display !== 'none'
                };
            };
        }
    </script>
    `;
    
    // 4. Insert scripts in the right places
    // Add E2E detection right after <head>
    html = html.replace('<head>', '<head>\n' + e2eDetectionScript);
    
    // Add helpers before closing body
    html = html.replace('</body>', e2eHelpers + '\n</body>');
    
    // 5. Add a marker comment
    html = '<!-- E2E Test Entry Point - Generated from roi-finder.html -->\n' + html;
    
    // Write the E2E entry point
    await fs.writeFile(E2E_HTML, html);
    
    console.log('✅ E2E entry point generated: roi-finder-e2e.html');
    console.log('\nKey modifications:');
    console.log('  1. E2E test mode detection');
    console.log('  2. Firebase mocking');
    console.log('  3. Config API mocking');
    console.log('  4. Test helper functions');
    console.log('\nUse: roi-finder-e2e.html?e2e_test_mode=true');
    
  } catch (error) {
    console.error('❌ Failed to generate E2E entry:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  generateE2EEntry();
}

module.exports = { generateE2EEntry };