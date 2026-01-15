import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import Vue from '@vitejs/plugin-vue'
import VueRouter from 'vue-router/vite'
import AutoScaffold from 'auto-scaffold/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    AutoScaffold({
      presets: ['vue', 'vue-router'],
    }),
    // FIXME: why doesn't it work when imported from vue-router/vite
    VueRouter({
      logs: true,
      dts: './src/routes.d.ts',
    }),
    Vue(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      // "vue-router": fileURLToPath(new URL("../router/src", import.meta.url)),
    },
  },
  define: {
    __DEV__: JSON.stringify(!process.env.prod),
    __BROWSER__: 'true',
    'process.env': {
      NODE_ENV: JSON.stringify(process.env.NODE_ENV),
    },
  },
})
