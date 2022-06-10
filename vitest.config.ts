import { defineConfig } from 'vitest/config'

export default defineConfig({
  define: {
    __DEV__: true,
    __TEST__: true,
    __BROWSER__: true,
  },
  test: {
    globals: true,
    environment: 'node',
    reporters: 'dot',
    coverage: {
      reportsDirectory: 'coverage',
      reporter: ['text', 'lcov', 'html'],
      src: ['__tests__/**/*.spec.ts?(x)'],
      exclude: [
        '/node_modules/',
        'src/index.ts',
        'src/entries',
        'src/devtools.ts',
      ],
    },
    include: ['__tests__/**/*.spec.ts?(x)'],
  },
})
