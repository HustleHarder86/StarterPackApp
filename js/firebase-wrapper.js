// Firebase wrapper that provides a mock implementation for testing
// This allows the app to function while Firebase is being configured

export class FirebaseWrapper {
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
                    setTimeout(() => callback(this.currentUser), 100);
                } else {
                    setTimeout(() => callback(null), 100);
                }
            },
            signInWithEmailAndPassword: async (email, password) => {
                // Mock sign in - accept any email/password for testing
                const mockUser = {
                    uid: 'mock-' + Date.now(),
                    email: email,
                    displayName: email.split('@')[0],
                    getIdToken: () => Promise.resolve('mock-token-' + Date.now())
                };
                this.currentUser = mockUser;
                localStorage.setItem('mockUser', JSON.stringify(mockUser));
                this.authStateCallbacks.forEach(callback => callback(mockUser));
                return { user: mockUser };
            },
            createUserWithEmailAndPassword: async (email, password) => {
                // Mock sign up
                const mockUser = {
                    uid: 'mock-' + Date.now(),
                    email: email,
                    displayName: email.split('@')[0],
                    getIdToken: () => Promise.resolve('mock-token-' + Date.now()),
                    updateProfile: (data) => {
                        Object.assign(mockUser, data);
                        return Promise.resolve();
                    }
                };
                this.currentUser = mockUser;
                localStorage.setItem('mockUser', JSON.stringify(mockUser));
                this.authStateCallbacks.forEach(callback => callback(mockUser));
                return { user: mockUser };
            },
            signOut: async () => {
                this.currentUser = null;
                localStorage.removeItem('mockUser');
                this.authStateCallbacks.forEach(callback => callback(null));
            },
            setPersistence: () => Promise.resolve()
        };

        // Mock Firestore implementation
        this.db = {
            collection: (name) => ({
                doc: (id) => ({
                    get: async () => {
                        const data = JSON.parse(localStorage.getItem(`mockDb_${name}_${id}`) || 'null');
                        return {
                            exists: data !== null,
                            data: () => data,
                            id: id
                        };
                    },
                    set: async (data) => {
                        localStorage.setItem(`mockDb_${name}_${id}`, JSON.stringify(data));
                        return;
                    },
                    update: async (data) => {
                        const existing = JSON.parse(localStorage.getItem(`mockDb_${name}_${id}`) || '{}');
                        const updated = { ...existing, ...data };
                        localStorage.setItem(`mockDb_${name}_${id}`, JSON.stringify(updated));
                        return;
                    }
                }),
                add: async (data) => {
                    const id = 'mock-doc-' + Date.now();
                    localStorage.setItem(`mockDb_${name}_${id}`, JSON.stringify(data));
                    return { id };
                }
            })
        };

        // Mock Firestore FieldValue
        if (!firebase.firestore) {
            window.firebase = window.firebase || {};
            window.firebase.firestore = {
                FieldValue: {
                    serverTimestamp: () => new Date().toISOString()
                }
            };
        }
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