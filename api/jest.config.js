export default {
  testEnvironment: 'node',
  verbose: true,
  collectCoverageFrom: [
    'controllers/**/*.js',
    'helpers/**/*.js',
    'middleware/**/*.js',
    'utils/**/*.js'
  ],
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/models/',
    '/tests/',
    '/coverage/'
  ],
  testMatch: [
    '**/tests/**/*.test.js'
  ],
  transform: {}
};
