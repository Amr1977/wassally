import fs from 'fs';
import path from 'path';
import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';

const { combine, timestamp, printf, errors, json } = winston.format;

// 1. إنشاء مجلد logs لو مش موجود
const logDir = 'logs';
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
  console.log(`Created logs directory at: ${path.resolve(logDir)}`);
}

// 2. إعداد المتغيرات الأساسية
const isProduction = process.env.NODE_ENV === 'production';
const serviceName = process.env.SERVICE_NAME || 'badr-delivery';

// 3. تعريف تنسيق اللوق للكونسول
const consoleFormat = printf(({ timestamp, level, message, stack, ...meta }) => {
  let log = `[${timestamp}] [${serviceName}] ${level}: ${message}`;
  if (stack) log += `\n${stack}`;
  if (Object.keys(meta).length) log += `\n${JSON.stringify(meta, null, 2)}`;
  return log;
});

// 4. تعريف تنسيق اللوق للملفات (json مع الطابع الزمني والأخطاء)
const fileFormat = combine(
  timestamp(),
  errors({ stack: true }),
  json()
);

// 5. تعريف النقلات (transports) الخاصة باللوق
const transports = [
  // 5.1 النقل للكونسول مع تنسيق ملون وتعامل مع الاستثناءات والرفض
  new winston.transports.Console({
    format: combine(
      winston.format.colorize(),
      timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      consoleFormat
    ),
    handleExceptions: true,
    handleRejections: true,
  }),

  // 5.2 النقل للملفات مع تدوير يومي (rotated files) - مفعلة دايمًا في جميع البيئات
  new DailyRotateFile({
    filename: `${logDir}/combined-%DATE%.log`,
    datePattern: 'YYYY-MM-DD',
    zippedArchive: true,
    maxSize: '20m',
    maxFiles: '14d',
    format: fileFormat,
    level: 'info',
  }),

  new DailyRotateFile({
    filename: `${logDir}/errors-%DATE%.log`,
    datePattern: 'YYYY-MM-DD',
    zippedArchive: true,
    maxSize: '20m',
    maxFiles: '30d',
    format: fileFormat,
    level: 'error',
  }),
];

// 6. إنشاء مثيل Logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || (isProduction ? 'info' : 'debug'),
  defaultMeta: { service: serviceName },
  format: fileFormat, // هذا التنسيق للملفات
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
});

// 7. تيار للـ HTTP logging مع Express أو أي إطار ويب
logger.stream = {
  write: (message) => logger.http(message.trim()),
};

// 8. إضافة دالة لتسجيل لوق متعلق بالـ request لتتبع الطلبات بشكل أفضل
logger.withRequest = function (req) {
  return this.child({
    requestId: req.id || 'none',
    userId: req.user?.id || 'anonymous',
    ip: req.ip,
    method: req.method,
    endpoint: req.originalUrl,
  });
};

export default logger;