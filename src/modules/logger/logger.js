// logger.js
const winston = require('winston');
require('winston-loggly-bulk');

// Create a Winston logger instance with multiple transports.
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info', // Log level default or from environment
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.printf(({ timestamp, level, message }) => `[${timestamp}] ${level}: ${message}`)
  ),
  transports: [
    // Console transport for local logging.
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }),
    // Remote logging transport - Loggly example.
    new winston.transports.Loggly({
      token: 'YOUR_LOGGLY_TOKEN',           // Replace with your Loggly token
      subdomain: 'YOUR_LOGGLY_SUBDOMAIN',     // Replace with your Loggly subdomain
      tags: ['nodejs', 'mvp'],
      json: true
    })
  ]
});

module.exports = logger;