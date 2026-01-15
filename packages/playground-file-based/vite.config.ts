import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import Vue from '@vitejs/plugin-vue'
import VueRouter from 'vue-router/vite'
import AutoScaffold from 'auto-scaffold/vite'
// import AutoImport from 'unplugin-auto-import/vite'
import VueDevtools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    // FIXME: it seems to conflict with the mono repo setup
    // AutoImport({
    // dts: './src/auto-imports.d.ts',
    // imports: ['vue', 'vue-router'],
    // }),
    AutoScaffold({
      presets: ['vue', 'vue-router'],
    }),
    // FIXME: why doesn't it work when imported from vue-router/vite
    VueRouter({
      logs: true,
      dts: './src/routes.d.ts',

      experimental: {
        autoExportsDataLoaders: ['src/loaders'],
        paramParsers: {
          dir: 'src/params',
        },
      },
    }),
    Vue(),
    VueDevtools(),
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
