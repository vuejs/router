import path from 'node:path'
import { fileURLToPath } from 'node:url'
import ts from 'rollup-plugin-typescript2'
import replace from '@rollup/plugin-replace'
import resolve from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import terser from '@rollup/plugin-terser'
import { defineConfig } from 'rollup'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const configs = ['webRouter', 'webRouter_experimental'].map(file => {
  return defineConfig({
    external: ['vue'],
    output: {
      file: path.resolve(__dirname, `./dist/${file}.js`),
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
