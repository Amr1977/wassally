/**
 * logger-demo.js (ES Module version)
 * 
 * Demo for using logger.js in an ESM (ECMAScript Module) project.
 * Make sure your logger.js also uses ESM syntax (export default).
 */

import logger from './logger.js';

// === 1. Basic Logging ===
logger.info('Logger initialized successfully.');
logger.debug('Debugging app startup...');
logger.warn('This is a warning message.');
logger.error('An error occurred!', new Error('Sample error object'));

// === 2. Logging an exception manually ===
try {
  throw new Error('Simulated crash');
} catch (err) {
  logger.error('Caught an exception:', err);
}

// === 3. Using logger.withRequest() to simulate Express-like request logging ===
const mockRequest = {
  id: 'req-789',
  user: { id: 'user-007' },
  ip: '127.0.0.1',
  method: 'POST',
  originalUrl: '/api/orders'
};

const requestLogger = logger.withRequest(mockRequest);
requestLogger.info('Client requested to create a new order');
requestLogger.debug('Processing order data...');

// === 4. Writing via stream (used by morgan middleware for HTTP logs) ===
logger.stream.write('HTTP 200 - POST /api/orders');

// === 5. Done ===
console.log('Logger demo complete. Check console or logs/ folder (if NODE_ENV=production).');