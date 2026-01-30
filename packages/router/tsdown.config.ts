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
    // by default we keep them
    __STRIP_DEVTOOLS__: `false`,
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
  // Externalize everything and avoid mistakenly including dependencies in the
  // bundle of vue-router runtime
  skipNodeModulesBundle: true,
} satisfies InlineConfig

const esm = {
  ...commonOptions,
  entry: {
    ...commonOptions.entry,
    'experimental/index': './src/experimental/index.ts',
    'experimental/pinia-colada':
      './src/experimental/data-loaders/entries/pinia-colada.ts',
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
  outputOptions: {
    ...commonOptions.outputOptions,
    dir: undefined, // must be unset with file
    file: 'dist/vue-router.global.js',
  },
  define: {
    ...commonOptions.define,
    __DEV__: 'true',
    // the new devtools api does not have iife support and are too heavy
    __FEATURE_PROD_DEVTOOLS__: `false`,
    __STRIP_DEVTOOLS__: `true`,
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

// Unplugin build configuration
const unplugin = {
  format: ['cjs', 'esm'] as const,
  entry: {
    'unplugin/index': './src/unplugin/index.ts',
    'unplugin/options': './src/unplugin/options.ts',
    'unplugin/vite': './src/unplugin/vite.ts',
    'unplugin/webpack': './src/unplugin/webpack.ts',
    'unplugin/rollup': './src/unplugin/rollup.ts',
    'unplugin/rolldown': './src/unplugin/rolldown.ts',
    'unplugin/esbuild': './src/unplugin/esbuild.ts',
    'unplugin/types': './src/unplugin/types.ts',
  },
  platform: 'node' as const,
  dts: true,
  // avoid inlining rolldown and other unplugin deps
  skipNodeModulesBundle: true,
  sourcemap: false,
  outputOptions: {
    banner,
    exports: 'named',
  },
} satisfies InlineConfig

// Volar plugin build configuration
const volar = {
  format: ['cjs'] as const,
  entry: {
    'volar/sfc-route-blocks': './src/volar/entries/sfc-route-blocks.ts',
    'volar/sfc-typed-router': './src/volar/entries/sfc-typed-router.ts',
  },
  // these are part of volar core
  external: ['@vue/language-core', 'muggle-string', 'pathe'],
  dts: true,
  sourcemap: false,
  outputOptions: {
    banner,
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
  unplugin,
  volar,
]
