module.exports = {
  testEnvironment: 'node',
  globals: {
    __DEV__: true,
    __TEST__: true,
    __BROWSER__: true,
  },
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
