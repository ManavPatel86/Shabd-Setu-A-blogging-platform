export default {
  testEnvironment: 'node',
  verbose: true,
  collectCoverageFrom: [
    'controllers/**/*.js',
    'helpers/**/*.js',
    'middleware/**/*.js',
    'models/**/*.js',
    'utils/**/*.js'
  ],
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/tests/',
    '/coverage/'
  ],
  testMatch: [
    '**/tests/**/*.test.js'
  ],
  transform: {}
};
