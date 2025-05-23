const winston = require('winston');
const { combine, timestamp, printf, errors, json } = winston.format;
const DailyRotateFile = require('winston-daily-rotate-file');
const fs = require('fs');
const path = require('path');

// 1. Ensure logs directory exists
const logDir = 'logs';

if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
  console.log(`Created logs directory at: ${path.resolve(logDir)}`);
}

// 2. Configuration
const isProduction = process.env.NODE_ENV === 'production';
const serviceName = process.env.SERVICE_NAME || 'badr-delivery';

// 3. Custom Formats
const consoleFormat = printf(({ timestamp, level, message, stack, ...meta }) => {
  let log = `[${timestamp}] [${serviceName}] ${level}: ${message}`;
  if (stack) log += `\n${stack}`;
  if (Object.keys(meta).length) log += `\n${JSON.stringify(meta, null, 2)}`;
  return log;
});

const fileFormat = combine(
  timestamp(),
  errors({ stack: true }),
  json()
);

// 4. Transports
const transports = [
  // Console (always enabled)
  new winston.transports.Console({
    format: combine(
      winston.format.colorize(),
      timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      consoleFormat
    ),
    handleExceptions: true,
    handleRejections: true
  }),

  // Rotated file logging (production only)
  ...(isProduction ? [
    new DailyRotateFile({
      filename: `${logDir}/combined-%DATE%.log`,
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '14d',
      format: fileFormat,
      level: 'info'
    }),
    new DailyRotateFile({
      filename: `${logDir}/errors-%DATE%.log`,
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '30d',
      format: fileFormat,
      level: 'error'
    })
  ] : [])
];

// 5. Logger Instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || (isProduction ? 'info' : 'debug'),
  defaultMeta: { service: serviceName },
  format: fileFormat,
  transports,
  exceptionHandlers: [
    new winston.transports.File({ 
      filename: `${logDir}/exceptions.log`,
      format: fileFormat
    })
  ],
  rejectionHandlers: [
    new winston.transports.File({
      filename: `${logDir}/rejections.log`,
      format: fileFormat
    })
  ]
});

// 6. Express Stream for HTTP logging
logger.stream = {
  write: (message) => logger.http(message.trim())
};

// 7. Request-specific logging
logger.withRequest = function(req) {
  return this.child({
    requestId: req.id || 'none',
    userId: req.user?.id || 'anonymous',
    ip: req.ip,
    method: req.method,
    endpoint: req.originalUrl
  });
};

module.exports = logger;