import fs from 'fs';
import path from 'path';
import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import { v4 as uuidv4 } from 'uuid';

const { combine, timestamp, printf, errors, json } = winston.format;

// 1. Create logs directory with secure permissions
const logDir = 'logs';
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { 
    recursive: true,
    mode: 0o755  // Restrict write access
  });
  console.log(`Created logs directory at: ${path.resolve(logDir)}`);
}

// 2. Set up base variables
const isProduction = process.env.NODE_ENV === 'production';
const serviceName = process.env.SERVICE_NAME || 'badr-delivery';

// 3. Add sensitive data redaction
const redactFormat = winston.format((info) => {
  if (info.message?.password) info.message.password = '[REDACTED]';
  if (info.message?.token) info.message.token = '[REDACTED]';
  if (info.message?.creditCard) info.message.creditCard = '[REDACTED]';
  return info;
});

// 4. Define console log format
const consoleFormat = printf(({ timestamp, level, message, stack, ...meta }) => {
  let log = `[${timestamp}] [${serviceName}] ${level}: ${message}`;
  if (stack) log += `\n${stack}`;
  if (Object.keys(meta).length) log += `\n${JSON.stringify(meta, null, 2)}`;
  return log;
});

// 5. Define file log format (json with timestamp and errors)
const fileFormat = combine(
  timestamp(),
  errors({ stack: true }),
  redactFormat(),
  json()
);

// 6. Define transports
const transports = [
  // Console transport with colors and exception handling
  new winston.transports.Console({
    format: combine(
      winston.format.colorize(),
      timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      consoleFormat
    ),
    handleExceptions: true,
    handleRejections: true,
  }),

  // Daily rotated combined logs
  new DailyRotateFile({
    filename: `${logDir}/combined-%DATE%.log`,
    datePattern: 'YYYY-MM-DD',
    zippedArchive: true,
    maxSize: '100m',
    maxFiles: '14d',
    format: fileFormat,
    level: 'info',
  }),

  // Daily rotated error logs
  new DailyRotateFile({
    filename: `${logDir}/errors-%DATE%.log`,
    datePattern: 'YYYY-MM-DD',
    zippedArchive: true,
    maxSize: '100m',
    maxFiles: '30d',
    format: fileFormat,
    level: 'error',
  }),

  // Emergency transport for critical failures
  new winston.transports.File({
    filename: `${logDir}/emergency.log`,
    level: 'error',
    handleExceptions: true,
    handleRejections: true,
    format: fileFormat,
  }),
];

// 7. Create logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || (isProduction ? 'info' : 'debug'),
  defaultMeta: { service: serviceName },
  format: fileFormat,
  transports,
  exceptionHandlers: [
    new winston.transports.File({
      filename: `${logDir}/exceptions.log`,
      format: fileFormat,
    }),
  ],
  rejectionHandlers: [
    new winston.transports.File({
      filename: `${logDir}/rejections.log`,
      format: fileFormat,
    }),
  ],
  silent: process.env.NODE_ENV === 'test', // Disable in tests
  exitOnError: false, // Don't crash on logger errors
});

// 8. HTTP logging stream for Express
logger.stream = {
  write: (message) => logger.http(message.trim()),
};

// 9. Enhanced request logging with auto-generated IDs
logger.withRequest = function (req) {
  req.id = req.id || uuidv4(); // Auto-generate request ID if missing
  return this.child({
    requestId: req.id,
    userId: req.user?.id || 'anonymous',
    ip: req.ip,
    method: req.method,
    endpoint: req.originalUrl,
    userAgent: req.headers['user-agent'],
  });
};

// 10. Add MongoDB transport in production if configured
if (isProduction && process.env.MONGO_URI) {
  const { MongoDB } = require('winston-mongodb');
  transports.push(
    new MongoDB({
      db: process.env.MONGO_URI,
      collection: 'logs',
      level: 'info',
      options: { useUnifiedTopology: true },
    })
  );
}

export default logger;