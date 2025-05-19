/**
 * @file index.js
 * @description Aggregator for the Badr Delivery Platform.
 * Initializes the API server, real-time communication, database connection, and scheduled tasks.
 * This file brings together all the modules to launch our fully functional MVP.
 */

import express from 'express';
import bodyParser from 'body-parser';
import http from 'http';

// Ensure that the database connection is initialized
import './modules/database/db.js';

// Load scheduled tasks (e.g., for OTP cleanup, etc.)
import './modules/scheduler/task_scheduler.js';

// Import API routes (which aggregate authentication, orders, etc.)
import apiRoutes from './modules/api/routes.js';

// Import the socket initializer for real-time communication
import { init_socket } from './modules/realtime/socket.js';

const PORT = process.env.PORT || 3000;

const app = express();

// Middleware for JSON parsing
app.use(bodyParser.json());

// Use the API routes with the "/api" prefix
app.use('/api', apiRoutes);

// Create an HTTP server and integrate Socket.io for realtime messaging
const server = http.createServer(app);
init_socket(server);

// Start the server
server.listen(PORT, () => {
  console.log(`Badr Delivery Platform running on port ${PORT}`);
});