import { type InlineConfig } from 'tsdown'
import pkg from './package.json' with { type: 'json' }
import fs from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))

const banner = `
/*!
 * ${pkg.name} v${pkg.version}
 * (c) ${new Date().getFullYear()} Eduardo San Martin Morote
 * @license MIT
 */
`.trim()

const commonOptions = {
  sourcemap: false,
  format: ['esm'],
  entry: {
    'vue-router': './src/index.ts',
  },
  outputOptions: {
    banner,
    name: 'VueRouter',
    globals: {
      vue: 'Vue',
      '@vue/devtools-api': 'VueDevtoolsApi',
    },
  },
  define: {
    __DEV__: `(process.env.NODE_ENV !== 'production')`,
    // this is only used during tests
    __TEST__: 'false',
    // If the build is expected to run directly in the browser (global / esm builds)
    // FIXME: makes no sense anymore
    __BROWSER__: 'true',
    // is replaced by the vite vue plugin
    __FEATURE_PROD_DEVTOOLS__: `__VUE_PROD_DEVTOOLS__`,
  },
  dts: false,
  // TODO: remove in v5
  async onSuccess() {
    // write a stub file for vue-router.esm-bundler.js
    await fs.writeFile(
      resolve(__dirname, 'dist/vue-router.esm-bundler.js'),
      `
console.warn("[vue-router]: importing from 'vue-router/dist/vue-router.esm-bundler.js' is deprecated. Use 'vue-router' directly.")
export * from './vue-router.mjs'
`.trimStart()
    )
  },
} satisfies InlineConfig

const esm = {
  ...commonOptions,
  entry: {
    ...commonOptions.entry,
    'experimental/index': './src/experimental/index.ts',
  },
  platform: 'neutral',
  dts: true,
  // sourcemap: true,
} satisfies InlineConfig

const esmBrowser = {
  ...commonOptions,
  outputOptions: {
    ...commonOptions.outputOptions,
    dir: undefined, // must be unset with file
    file: 'dist/vue-router.esm-browser.js',
  },
  define: {
    ...commonOptions.define,
    __DEV__: 'true',
    __FEATURE_PROD_DEVTOOLS__: 'true',
  },
} satisfies InlineConfig

const esmBrowserProd = {
  ...esmBrowser,
  target: 'es2015',
  minify: true,
  outputOptions: {
    ...esmBrowser.outputOptions,
    file: 'dist/vue-router.esm-browser.prod.js',
  },
  define: {
    ...esmBrowser.define,
    __DEV__: 'false',
    __FEATURE_PROD_DEVTOOLS__: 'false',
  },
} satisfies InlineConfig

const cjs = {
  ...commonOptions,
  format: 'cjs',
  outputOptions: {
    ...commonOptions.outputOptions,
    dir: undefined, // must be unset with file
    file: 'dist/vue-router.cjs',
  },
  define: {
    ...commonOptions.define,
    // TODO: what is the right value
    __BROWSER__: 'false',
    __FEATURE_PROD_DEVTOOLS__: `false`,
  },
} satisfies InlineConfig

const cjsProd = {
  ...cjs,
  minify: true,
  outputOptions: {
    ...cjs.outputOptions,
    file: 'dist/vue-router.prod.cjs',
  },
} satisfies InlineConfig

const iife = {
  ...commonOptions,
  format: 'iife',
  // TODO: remove when upgrading to devtools-api v7 because it's too big
  noExternal: ['@vue/devtools-api'],
  outputOptions: {
    ...commonOptions.outputOptions,
    dir: undefined, // must be unset with file
    file: 'dist/vue-router.global.js',
  },
  define: {
    ...commonOptions.define,
    __DEV__: 'true',
    __FEATURE_PROD_DEVTOOLS__: `true`,
  },
} satisfies InlineConfig

const iifeProd = {
  ...iife,
  target: 'es2015',
  minify: true,
  outputOptions: {
    ...iife.outputOptions,
    file: 'dist/vue-router.global.prod.js',
  },
  define: {
    ...iife.define,
    __DEV__: 'false',
    __FEATURE_PROD_DEVTOOLS__: `false`,
  },
} satisfies InlineConfig

export default [
  //
  esm,
  esmBrowser,
  esmBrowserProd,
  cjs,
  cjsProd,
  iife,
  iifeProd,
]
