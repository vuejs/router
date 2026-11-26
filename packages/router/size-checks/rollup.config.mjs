import path from 'node:path'
import { fileURLToPath } from 'node:url'
import ts from 'rollup-plugin-typescript2'
import replace from '@rollup/plugin-replace'
import resolve from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import terser from '@rollup/plugin-terser'
import { defineConfig } from 'rollup'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// [input, output, Options API]
const entries = [
  ['webRouter', 'webRouter', true],
  ['webRouter_experimental', 'webRouter_experimental', true],
  ['webRouter_basic_loader', 'webRouter_basic_loader', true],
  ['webRouter_colada_loader', 'webRouter_colada_loader', true],
  // Vapor apps can drop the Options API
  ['webRouter_vapor', 'webRouter_vapor', false],
  ['webRouter_vapor', 'webRouter_vapor_options_api', true],
]

const configs = entries.map(([file, output, optionsApi]) => {
  return defineConfig({
    external: ['vue', 'pinia', '@pinia/colada'],
    output: {
      file: path.resolve(__dirname, `./dist/${output}.js`),
      format: 'es',
    },
    input: path.resolve(__dirname, `./${file}.js`),
    plugins: [
      replace({
        preventAssignment: true,
        values: {
          __DEV__: 'false',
          // this is only used during tests
          __TEST__: 'false',
          // If the build is expected to run directly in the browser (global / esm builds)
          __BROWSER__: 'true',
          // is targeting bundlers?
          __BUNDLER__: 'false',
          __GLOBAL__: 'false',
          // is targeting Node (SSR)?
          __NODE_JS__: 'false',
          __VUE_PROD_DEVTOOLS__: 'false',
          __VUE_OPTIONS_API__: String(optionsApi),
          'process.env.NODE_ENV': JSON.stringify('production'),
        },
      }),
      ts({
        check: false,
        tsconfig: path.resolve(__dirname, '../tsconfig.json'),
        cacheRoot: path.resolve(__dirname, '../node_modules/.rts2_cache'),
        tsconfigOverride: {
          compilerOptions: {
            sourceMap: false,
            declaration: false,
            declarationMap: false,
          },
          exclude: ['__tests__', 'test-dts'],
        },
      }),
      resolve(),
      commonjs(),
      terser({
        // uncomment to debug output size changes
        // mangle: false,
        format: {
          comments: false,
        },
        module: true,
        compress: {
          ecma: 2015,
          pure_getters: true,
        },
      }),
    ],
  })
})

export default configs
