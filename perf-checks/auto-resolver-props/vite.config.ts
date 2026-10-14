import { defineConfig } from 'vite'
import Vue from '@vitejs/plugin-vue'
import VueRouter from 'vue-router/vite'

export default defineConfig({
  plugins: [
    VueRouter({
      routesFolder: 'src/pages',
      dts: 'src/routes.d.ts',
      watch: false,
    }),
    Vue(),
  ],
  build: { sourcemap: false },
})
