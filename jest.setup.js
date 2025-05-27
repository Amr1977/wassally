// jest.setup.js

export default {
  setupFilesAfterEnv: ["./tests/setupTests.js"],
  testEnvironment: "node"
};

// Provide default/dummy values for required environment variables
process.env.GMAIL_EMAIL = process.env.GMAIL_EMAIL || "test@example.com";
process.env.GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD || "dummyPassword";
process.env.JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || "dummyAccessSecret";
process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "dummyRefreshSecret";
process.env.FIREBASE_API_KEY = process.env.FIREBASE_API_KEY || "dummyAPIkey"
// Add any others as needed

// firebase-init.js (or wherever you initialize Firebase Admin)
import admin from 'firebase-admin';

// Ensure the environment variable exists.
if (!process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
  throw new Error('Missing FIREBASE_SERVICE_ACCOUNT_JSON environment variable.');
}

// Parse the service account credentials from the environment variable.
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);

// Initialize the Firebase Admin SDK.
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://wassally25-default-rtdb.firebaseio.com"
});

console.log("Firebase Admin SDK initialized successfully.");
