/**
 * @file error_handler.js
 * @description Centralized error handling with Winston.
 */
import winston from 'winston';

export const logger = winston.createLogger({
  level: 'info',
  format: winston.format.simple(),
  transports: [
    new winston.transports.Console()
  ]
});

/**
 * Express middleware for error handling.
 * @param {Error} err
 * @param {Object} req
 * @param {Object} res
 * @param {Function} next
 */
export function error_handler(err, req, res, next) {
  logger.error(err.message);
  res.status(500).json({ error: err.message });
}