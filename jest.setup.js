// jest.setup.js

// Provide default/dummy values for required environment variables
process.env.GMAIL_EMAIL = process.env.GMAIL_EMAIL || "test@example.com";
process.env.GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD || "dummyPassword";
process.env.JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || "dummyAccessSecret";
process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "dummyRefreshSecret";
process.env.FIREBASE_API_KEY = process.env.FIREBASE_API_KEY || "dummyAPIkey"
// Add any others as needed
