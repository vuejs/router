module.exports = {
  preset: 'ts-jest',
  collectCoverageFrom: ['src/**/*.ts'],
  coveragePathIgnorePatterns: [
    '/node_modules/',
    'src/index.ts',
    'src/entries',
    'src/consola.ts',
  ],
  testMatch: [
    '**/__tests__/**/*.spec.ts?(x)',
    // '**/__tests__/**/*.spec.[jt]s?(x)',
    // '**/?(*.)+(spec|test).[jt]s?(x)',
  ],
  testEnvironment: 'node',
}
