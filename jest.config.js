module.exports = {
  preset: 'ts-jest',
  globals: {
    __DEV__: true,
    __BROWSER__: true,
  },
  coverageDirectory: 'coverage',
  coverageReporters: ['html', 'lcov', 'text'],
  collectCoverageFrom: ['src/**/*.ts'],
  coveragePathIgnorePatterns: ['/node_modules/', 'src/index.ts', 'src/entries'],
  testMatch: ['<rootDir>/__tests__/**/*.spec.ts?(x)'],
  watchPathIgnorePatterns: ['<rootDir>/node_modules'],
  testEnvironment: 'node',
}
