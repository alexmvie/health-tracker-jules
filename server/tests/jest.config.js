module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.js', '**/?(*.)+(spec|test).js'],
  moduleDirectories: ['node_modules', 'src'],
  setupFiles: ['./tests/setup.js'],
  verbose: true
};
