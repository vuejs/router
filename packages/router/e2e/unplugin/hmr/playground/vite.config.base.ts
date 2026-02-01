import { defineConfig } from 'vite'
import { fileURLToPath, URL } from 'node:url'

const root = fileURLToPath(new URL('./', import.meta.url))

export default defineConfig({
  root,
  clearScreen: false,
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '~': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  define: {
    __DEV__: 'true',
    __BROWSER__: 'true',
    __FEATURE_PROD_DEVTOOLS__: 'false',
    __STRIP_DEVTOOLS__: 'false',
  },
  build: {
    sourcemap: true,
  },
})
