import resolve from 'rollup-plugin-node-resolve'
import commonjs from 'rollup-plugin-commonjs'
import ts from 'rollup-plugin-typescript2'
import alias from 'rollup-plugin-alias'
import { terser } from 'rollup-plugin-terser'
import pkg from './package.json'
import path from 'path'

export default [
  // browser-friendly UMD build
  {
    input: 'src/entries/iife.ts',
    output: {
      name: 'VueRouter',
      file: pkg.unpkg,
      format: 'iife',
    },
    plugins: [
      alias({
        resolve: ['ts'],
        consola: path.resolve(__dirname, './src/consola.ts'),
      }),
      resolve(), // so Rollup can find `ms`
      commonjs(), // so Rollup can convert `ms` to an ES module
      ts(), // so Rollup can convert TypeScript to JavaScript
    ],
  },

  // CommonJS and ESM builds
  {
    input: 'src/entries/iife.ts',
    output: {
      name: 'VueRouter',
      file: 'dist/vue-router.min.js',
      format: 'iife',
    },
    plugins: [
      alias({
        resolve: ['ts'],
        consola: path.resolve(__dirname, './src/consola.ts'),
      }),
      resolve(), // so Rollup can find `ms`
      commonjs(), // so Rollup can convert `ms` to an ES module
      ts(), // so Rollup can convert TypeScript to JavaScript
      terser({
        module: false,
      }),
    ],
  },

  {
    input: 'src/index.ts',
    external: ['path-to-regexp'],
    plugins: [
      alias({
        resolve: ['ts'],
        consola: path.resolve(__dirname, './src/consola.ts'),
      }),
      ts(), // so Rollup can convert TypeScript to JavaScript
    ],
    output: [
      { file: 'dist/vue-router.cjs.js', format: 'cjs' },
      { file: pkg.module, format: 'es' },
    ],
  },
]
