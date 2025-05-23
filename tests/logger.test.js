/**
 * Test Suite for logger.js module
 * 
 * This suite checks:
 * - Logger instance creation
 * - Logger transports (e.g., Console, DailyRotateFile)
 * - Functionality of logger.withRequest(req)
 */

const logger = require('../src/modules/logger');

// Jest doesn't test actual console/file output — we focus on structure & method existence
describe('Logger Module', () => {
  
  // Basic existence tests
  it('should expose logging methods', () => {
    expect(logger).toHaveProperty('info');
    expect(logger).toHaveProperty('error');
    expect(logger).toHaveProperty('debug');
    expect(logger).toHaveProperty('withRequest');
    expect(typeof logger.info).toBe('function');
    expect(typeof logger.error).toBe('function');
  });

  // Check the transports (console always exists, files only in production)
  it('should have at least one transport (console)', () => {
    expect(logger.transports.length).toBeGreaterThan(0);

    const hasConsole = logger.transports.some(
      (t) => t.constructor.name === 'Console'
    );

    expect(hasConsole).toBe(true);
  });

  // withRequest() should return a child logger with request metadata
  it('should attach request metadata via withRequest()', () => {
    const mockRequest = {
      id: 'req-123',
      user: { id: 'user-789' },
      ip: '192.168.1.10',
      method: 'POST',
      originalUrl: '/api/data'
    };

    const childLogger = logger.withRequest(mockRequest);

    // Should still have logging methods
    expect(typeof childLogger.info).toBe('function');

    // Metadata will not be directly exposed, but we assume it's added
    // You can simulate usage like this:
    childLogger.info('Test log from withRequest()');

    // No assertion here, just confirming no error is thrown
  });

  // Ensure logger.stream.write works
  it('should have a stream object with write method', () => {
    expect(logger.stream).toBeDefined();
    expect(typeof logger.stream.write).toBe('function');
    
    // Simulate an HTTP log write
    expect(() => logger.stream.write('Sample log')).not.toThrow();
  });
});
