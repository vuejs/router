import { type Options } from 'tsdown'
import pkg from './package.json' with { type: 'json' }

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
} satisfies Options

const esm = {
  ...commonOptions,
  platform: 'neutral',
  dts: true,
  // sourcemap: true,
} satisfies Options

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
} satisfies Options

const cjsProd = {
  ...cjs,
  minify: true,
  outputOptions: {
    ...cjs.outputOptions,
    file: 'dist/vue-router.prod.cjs',
  },
} satisfies Options

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
} satisfies Options

const iifeProd = {
  ...iife,
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
} satisfies Options

export default [
  //
  esm,
  cjs,
  cjsProd,
  iife,
  iifeProd,
]
