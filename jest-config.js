export default {
  testEnvironment: 'node',
  reporters: [
    'default',
    ['jest-html-reporters', {
      publicPath: './test-report',
      filename: 'report.html',
      expand: true,
      pageTitle: 'Badr Delivery Platform - Test Report',
      includeConsoleLog: true // ✅ هذا الخيار يظهر الـ console.log
    }]
  ]
};