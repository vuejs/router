import { mergeConfig } from 'vite'
import baseConfig from './vite.config.base.ts'
import { fileURLToPath, URL } from 'node:url'
import VueRouter from '../../../../src/unplugin/vite'
import Vue from '@vitejs/plugin-vue'

const root = fileURLToPath(new URL('./', import.meta.url))

export default mergeConfig(baseConfig, {
  plugins: [
    VueRouter({
      root,
      // logs: true,
      // defaults to false on CI
      watch: true,
      experimental: {
        paramParsers: true,
      },
    }),
    Vue(),
  ],
})
