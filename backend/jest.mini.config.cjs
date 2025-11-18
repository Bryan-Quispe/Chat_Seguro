module.exports = {
  testEnvironment: 'node',
  transform: {},
  // Only collect coverage for the utilities we care about
  collectCoverageFrom: [
    'src/utils/encryption.js',
    'src/utils/jwt.js',
    'src/utils/logger.js',
    'src/utils/pinGenerator.js'
  ],
  coverageThreshold: {
    global: {
      branches: 0,
      functions: 0,
      lines: 0,
      statements: 0
    }
  },
  setupFilesAfterEnv: ['<rootDir>/__tests__/setup.js'],
  testMatch: ['**/__tests__/*.(test|spec).js']
};
