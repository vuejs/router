import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import analyze from 'rollup-plugin-analyzer'
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  root: resolve(process.cwd(), 'playground'),
  build: {
    outDir: '../playground_dist',
    rollupOptions: {
      plugins: [analyze()],
    },
  },
  plugins: [vue()],
  define: {
    __DEV__: JSON.stringify(!process.env.prod),
    __BROWSER__: 'true',
    'process.env': {
      NODE_ENV: JSON.stringify(process.env.NODE_ENV),
    },
  },
})
