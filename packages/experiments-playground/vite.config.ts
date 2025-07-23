import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue(), vueDevTools()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      'vue-router/experimental': fileURLToPath(
        new URL('../router/src/experimental/index.ts', import.meta.url)
      ),
      'vue-router': fileURLToPath(
        new URL('../router/src/index.ts', import.meta.url)
      ),
    },
  },
  define: {
    __DEV__: 'true',
    __BROWSER__: 'true',
  },
})
