import replace from '@rollup/plugin-replace'
import resolve from '@rollup/plugin-node-resolve'
import commonjs from 'rollup-plugin-commonjs'
import ts from 'rollup-plugin-typescript2'
import alias from '@rollup/plugin-alias'
import { terser } from 'rollup-plugin-terser'
import pkg from './package.json'
import path from 'path'

const banner = `/*!
  * ${pkg.name} v${pkg.version}
  * (c) ${new Date().getFullYear()} Eduardo San Martin Morote
  * @license MIT
  */`

const exportName = 'VueRouter'

function createEntry(
  {
    format, // Rollup format (iife, umd, cjs, es)
    external, // Rollup external option
    input = 'src/index.ts', // entry point
    env = 'development', // NODE_ENV variable
    minify = false,
    isBrowser = false, // produce a browser module version or not
  } = {
    input: 'src/index.ts',
    env: 'development',
    minify: false,
    isBrowser: false,
  }
) {
  // force production mode when minifying
  if (minify) env = 'production'
  const isProductionBuild =
    process.env.__DEV__ === 'false' || env === 'production'
  const isBundlerESMBuild = format === 'es'

  const config = {
    input,
    plugins: [
      replace({
        __VERSION__: JSON.stringify(pkg.version),
        __DEV__: isBundlerESMBuild
          ? // preserve to be handled by bundlers
            `process.env.NODE_ENV !== 'production'`
          : // hard coded dev/prod builds
            !isProductionBuild,
      }),
      alias({
        resolve: ['ts'],
        consola: path.resolve(__dirname, './src/consola.ts'),
      }),
    ],
    output: {
      banner,
      file: 'dist/vue-router.other.js',
      format,
    },
  }

  if (format === 'iife') {
    // config.input = 'src/entries/iife.ts'
    config.output.file = pkg.unpkg
    config.output.name = exportName
  } else if (format === 'es') {
    config.output.file = isBrowser ? pkg.browser : pkg.module
  } else if (format === 'cjs') {
    config.output.file = 'dist/vue-router.cjs.js'
  }

  if (!external) {
    config.plugins.push(resolve(), commonjs())
  } else {
    config.external = external
  }

  config.plugins.push(
    ts({
      // only check once, during the es version with browser (it includes external libs)
      check: format === 'es' && isBrowser && !minify,
      tsconfigOverride: {
        compilerOptions: {
          // same for d.ts files
          declaration: format === 'es' && isBrowser && !minify,
          module: 'esnext', // we need to override it because mocha requires this value to be commonjs
          target: format === 'iife' || format === 'cjs' ? 'es5' : 'esnext',
        },
      },
    })
  )

  if (minify) {
    config.plugins.push(
      terser({
        module: format === 'es',
        output: {
          preamble: banner,
        },
      })
    )
    config.output.file = config.output.file.replace(/\.js$/i, '.min.js')
  }

  return config
}

export default [
  // browser-friendly UMD build
  createEntry({ format: 'iife' }),
  createEntry({ format: 'iife', minify: true }),
  createEntry({ format: 'cjs', external: ['path-to-regexp'] }),
  createEntry({ format: 'es', external: ['path-to-regexp'] }),
  createEntry({ format: 'es', isBrowser: true }),
  createEntry({ format: 'es', isBrowser: true, minify: true }),
]
