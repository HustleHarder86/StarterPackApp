// Jest setup file
const dotenv = require('dotenv');
const path = require('path');

// Load test environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env.test') });

// Define mocks before using them
const mockAuth = {
  verifyIdToken: jest.fn(),
  createUser: jest.fn(),
  updateUser: jest.fn(),  
  deleteUser: jest.fn()
};

const mockFirestore = {
  collection: jest.fn(() => ({
    doc: jest.fn(() => ({
      get: jest.fn(() => Promise.resolve({
        exists: false,
        data: () => ({})
      })),
      set: jest.fn(() => Promise.resolve()),
      update: jest.fn(() => Promise.resolve()),
      delete: jest.fn(() => Promise.resolve())
    })),
    where: jest.fn(() => ({
      get: jest.fn(() => Promise.resolve({ empty: true, forEach: jest.fn() })),
      orderBy: jest.fn(() => ({
        limit: jest.fn(() => ({
          get: jest.fn(() => Promise.resolve({ empty: true, forEach: jest.fn() }))
        }))
      }))
    })),
    add: jest.fn(() => Promise.resolve())
  })),
  batch: jest.fn(() => ({
    set: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    commit: jest.fn(() => Promise.resolve())
  }))
};

// Mock Firebase Admin modules
jest.mock('firebase-admin/app', () => ({
  initializeApp: jest.fn(() => ({})),
  cert: jest.fn(() => ({})),
  getApps: jest.fn(() => [])
}));

jest.mock('firebase-admin/firestore', () => ({
  getFirestore: jest.fn(() => mockFirestore),
  FieldValue: {
    serverTimestamp: jest.fn(() => new Date()),
    increment: jest.fn(n => n)
  },
  Timestamp: {
    now: jest.fn(() => ({ toMillis: () => Date.now() }))
  }
}));

jest.mock('firebase-admin/auth', () => ({
  getAuth: jest.fn(() => mockAuth)
}));

// Mock the firebase-admin singleton
jest.mock('../utils/firebase-admin.js', () => ({
  db: mockFirestore,
  auth: mockAuth,
  app: {},
  default: {}
}));

// Mock fetch for API tests
global.fetch = jest.fn();

// Reset mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
});

// Suppress console errors during tests
global.console = {
  ...console,
  error: jest.fn(),
  warn: jest.fn(),
  log: jest.fn()
};