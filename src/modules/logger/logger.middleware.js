// logger.middleware.js

const { withRequest } = require('./logger');

// Middleware لإرفاق لوجر خاص بكل طلب
function loggerMiddleware(req, res, next) {
  // نحط نسخة مخصصة من اللوجر في req
  req.logger = withRequest(req);

  // تسجيل دخول بسيط لكل طلب
  req.logger.http(`Incoming request: ${req.method} ${req.originalUrl}`);

  next();
}

module.exports = loggerMiddleware;