// logger.js

// 1. استيراد المكتبات المطلوبة
const winston = require('winston'); // مكتبة اللوجات الأساسية
const { combine, timestamp, printf, errors, json } = winston.format; // أدوات تنسيق اللوجات
const DailyRotateFile = require('winston-daily-rotate-file'); // مكتبة لتدوير ملفات اللوجات يوميًا
const fs = require('fs');
const path = require('path');

// 2. التأكد من وجود مجلد logs
const logDir = 'logs';
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
  console.log(`Created logs directory at: ${path.resolve(logDir)}`);
}

// 3. تحديد هل احنا في وضع الإنتاج ولا لا
const isProduction = process.env.NODE_ENV === 'production';
const serviceName = process.env.SERVICE_NAME || 'badr-delivery';

// 4. تنسيقات العرض
// تنسيق مخصص لطباعة اللوج على الكونسول في وضع التطوير
const consoleFormat = printf(({ timestamp, level, message, stack, ...meta }) => {
  let log = `[${timestamp}] [${serviceName}] ${level}: ${message}`;
  if (stack) log += `\nSTACK:\n${stack}`;
  if (Object.keys(meta).length) log += `\nMETA:\n${JSON.stringify(meta, null, 2)}`;
  return log;
});

// تنسيق JSON لكتابة اللوجات في الملفات (أساسي للإنتاج)
const fileFormat = combine(
  timestamp(),
  errors({ stack: true }),
  json()
);

// 5. تعريف مستويات اللوج
const customLevels = {
  ...winston.config.npm.levels,
  http: 0 // مستوى مخصص للطلبات HTTP (أعلى أولوية)
};

// 6. إعداد وسائل الإخراج (transports)
const transports = [
  // دائمًا نطبع على الكونسول (أثناء التطوير فقط أو لأغراض الدعم)
  new winston.transports.Console({
    format: combine(
      winston.format.colorize(),
      timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      consoleFormat
    ),
    handleExceptions: true,
    handleRejections: true
  }),

  // إذا كنا في الإنتاج، نكتب اللوجات في ملفات تدور يوميًا
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

// 7. إنشاء اللوجر الرئيسي
const logger = winston.createLogger({
  levels: customLevels,
  level: process.env.LOG_LEVEL || (isProduction ? 'info' : 'debug'),
  defaultMeta: { service: serviceName },
  format: isProduction ? fileFormat : combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    errors({ stack: true }),
    consoleFormat
  ),
  transports,

  // معالجة الأخطاء الغير ممسوكة
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

// 8. دعم الكتابة من HTTP Logger Middleware زي morgan
logger.stream = {
  write: (message) => logger.http(message.trim())
};

// 9. دعم child logger لطلب معين (يربط كل لوج بالطلب الحالي)
logger.withRequest = function(req) {
  return this.child({
    requestId: req.id || 'none', // لو عندك middleware بيضيف ID
    userId: req.user?.id || 'anonymous',
    ip: req.ip,
    method: req.method,
    endpoint: req.originalUrl,
    userAgent: req.headers['user-agent'] || 'unknown',
    referrer: req.headers['referer'] || 'none'
  });
};

// 10. واجهة موحدة للتصدير
module.exports = {
  logger,
  stream: logger.stream,
  withRequest: logger.withRequest.bind(logger)
};