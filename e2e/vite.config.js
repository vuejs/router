const fs = require('fs')
const { resolve, join } = require('path')
const { defineConfig } = require('vite')
const vue = require('@vitejs/plugin-vue')

/** @type {string[]} */
let examples = []
fs.readdirSync(__dirname).forEach(dir => {
  const fullDir = join(__dirname, dir)
  const entry = join(fullDir, dir + '.ts')
  if (fs.statSync(fullDir).isDirectory() && fs.existsSync(entry)) {
    examples.push(dir)
  }
})

// https://vitejs.dev/config/
const config = (env = {}) => {
  return defineConfig({
    root: resolve(__dirname),
    resolve: {
      alias: {
        vue: resolve(__dirname, '../node_modules/vue/dist/vue.esm-bundler.js'),
        'vue-router': join(__dirname, '..', 'src'),
      },
      // Add `.ts` and `.tsx` as a resolvable extension.
      extensions: ['.ts', '.tsx', '.js', '.vue'],
    },
    build: {
      outDir: join(__dirname, '__build__'),
      filename: '[name].js',
      chunkFilename: '[id].chunk.js',
      publicPath: '/',
      rollupOptions: {
        plugins: [],
        input: examples.reduce(
          (entries, name) => {
            entries[name] = resolve(__dirname, name, 'index.html')
            return entries
          },
          { index: resolve(__dirname, 'index.html') }
        ),
      },
    },
    plugins: [vue()],
    define: {
      __DEV__: JSON.stringify(!env.prod),
      __CI__: JSON.stringify(process.env.CI || false),
      __BROWSER__: 'true',
      'process.env': {
        NODE_ENV: JSON.stringify(env.prod ? 'production' : 'development'),
      },
    },
  })
}

module.exports = config
