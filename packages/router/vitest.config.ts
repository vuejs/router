import { defineConfig } from 'vitest/config'
import Vue from '@vitejs/plugin-vue'

export default defineConfig({
  resolve: {
    alias: [],
  },
  define: {
    __DEV__: true,
    __TEST__: true,
    __BROWSER__: true,
  },
  plugins: [Vue()],

  test: {
    // open: false,
    coverage: {
      include: ['src/**/*.ts'],
      exclude: [
        'src/**/*.d.ts',
        'src/**/*.test-d.ts',
        'src/**/*.spec.ts',
        // '/node_modules/',
        'src/index.ts',
        'src/devtools.ts',
        'src/experimental/index.ts',
        // FIXME: add more tests
        'src/**/test-utils.ts',
      ],
    },
    typecheck: {
      enabled: true,
      checker: 'vue-tsc',
      // only: true,
      // by default it includes all specs too
      // include: ['**/*.test-d.ts'],

      // tsconfig: './tsconfig.typecheck.json',
    },
  },
})
