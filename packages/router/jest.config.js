module.exports = {
  testEnvironment: 'node',
  testEnvironmentOptions: {
    customExportConditions: ['node', 'node-addons'],
  },
  globals: {
    __DEV__: true,
    __TEST__: true,
    __BROWSER__: true,
  },
  setupFilesAfterEnv: ['<rootDir>/__tests__/setup.ts'],
  coverageDirectory: 'coverage',
  coverageReporters: ['html', 'lcov', 'text'],
  collectCoverageFrom: ['src/**/*.ts'],
  coveragePathIgnorePatterns: [
    '/node_modules/',
    'src/index.ts',
    'src/entries',
    'src/devtools.ts',
  ],
  transform: {
    '^.+\\.tsx?$': '@sucrase/jest-plugin',
  },
  testMatch: ['<rootDir>/__tests__/**/*.spec.ts?(x)'],
  watchPathIgnorePatterns: ['<rootDir>/node_modules'],
}
