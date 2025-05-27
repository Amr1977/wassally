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