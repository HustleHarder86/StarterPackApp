// Firebase wrapper that provides a mock implementation for testing
// This allows the app to function while Firebase is being configured
// GLOBAL VERSION - No ES6 modules

class FirebaseWrapper {
    constructor() {
        this.isEmulated = false;
        this.auth = null;
        this.db = null;
        this.currentUser = null;
        this.authStateCallbacks = [];
    }

    async initialize(config) {
        try {
            // Try to initialize real Firebase
            firebase.initializeApp(config);
            this.auth = firebase.auth();
            this.db = firebase.firestore();
            
            // Enable persistence
            await this.auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);
            
            // Set up auth state listener
            this.auth.onAuthStateChanged(user => {
                this.currentUser = user;
                this.authStateCallbacks.forEach(callback => callback(user));
            });
            
            console.log('Firebase initialized successfully');
            return true;
        } catch (error) {
            console.error('Firebase initialization failed:', error);
            console.log('Using mock Firebase for testing');
            
            // Use mock implementation
            this.isEmulated = true;
            this.initializeMockFirebase();
            return true;
        }
    }

    initializeMockFirebase() {
        // Mock auth implementation
        this.auth = {
            currentUser: null,
            onAuthStateChanged: (callback) => {
                this.authStateCallbacks.push(callback);
                // Check localStorage for saved user
                const savedUser = localStorage.getItem('mockUser');
                if (savedUser) {
                    this.currentUser = JSON.parse(savedUser);
                    callback(this.currentUser);
                } else {
                    callback(null);
                }
                return () => {
                    const index = this.authStateCallbacks.indexOf(callback);
                    if (index > -1) this.authStateCallbacks.splice(index, 1);
                };
            },
            signInWithEmailAndPassword: async (email, password) => {
                // Mock sign in
                const user = {
                    uid: 'mock-' + Date.now(),
                    email: email,
                    displayName: email.split('@')[0]
                };
                this.currentUser = user;
                localStorage.setItem('mockUser', JSON.stringify(user));
                this.authStateCallbacks.forEach(cb => cb(user));
                return { user };
            },
            createUserWithEmailAndPassword: async (email, password) => {
                // Mock sign up
                const user = {
                    uid: 'mock-' + Date.now(),
                    email: email,
                    displayName: email.split('@')[0]
                };
                this.currentUser = user;
                localStorage.setItem('mockUser', JSON.stringify(user));
                this.authStateCallbacks.forEach(cb => cb(user));
                return { user };
            },
            signOut: async () => {
                this.currentUser = null;
                localStorage.removeItem('mockUser');
                this.authStateCallbacks.forEach(cb => cb(null));
            },
            sendPasswordResetEmail: async (email) => {
                console.log('Mock: Password reset email would be sent to', email);
                return true;
            }
        };

        // Mock Firestore implementation
        this.db = {
            collection: (name) => ({
                doc: (id) => ({
                    get: async () => ({
                        exists: false,
                        data: () => null
                    }),
                    set: async (data) => {
                        console.log(`Mock: Would save to ${name}/${id}:`, data);
                        return true;
                    },
                    update: async (data) => {
                        console.log(`Mock: Would update ${name}/${id}:`, data);
                        return true;
                    }
                }),
                where: () => ({
                    get: async () => ({
                        docs: []
                    })
                }),
                add: async (data) => {
                    console.log(`Mock: Would add to ${name}:`, data);
                    return { id: 'mock-' + Date.now() };
                }
            })
        };
    }

    getAuth() {
        return this.auth;
    }

    getDb() {
        return this.db;
    }

    isUsingMock() {
        return this.isEmulated;
    }
}

// Export to global scope
window.FirebaseWrapper = FirebaseWrapper;