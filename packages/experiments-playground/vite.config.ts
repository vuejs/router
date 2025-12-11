import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import Vue from '@vitejs/plugin-vue'
import VueDevtools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig({
  plugins: [Vue(), VueDevtools()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      // directly point to the vue-router source code
      'vue-router/experimental': fileURLToPath(
        new URL('../router/src/experimental/index.ts', import.meta.url)
      ),
      'vue-router': fileURLToPath(
        new URL('../router/src/index.ts', import.meta.url)
      ),
    },
  },
  // to handle replacements added in vue-router source code
  define: {
    __DEV__: 'true',
    __BROWSER__: 'true',
  },
})
