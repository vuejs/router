// @ts-check
const fs = require('fs')
const { resolve, join } = require('path')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const webpack = require('webpack')

/** @type {string[]} */
let examples = []
fs.readdirSync(__dirname).forEach(dir => {
  const fullDir = join(__dirname, dir)
  const entry = join(fullDir, 'index.ts')
  if (fs.statSync(fullDir).isDirectory() && fs.existsSync(entry)) {
    examples.push(dir)
  }
})

const globalCss = resolve(__dirname, 'global.css')

/** @type {import('webpack').ConfigurationFactory} */
const config = (env = {}) => ({
  // Expose __dirname to allow automatically setting basename.
  context: __dirname,
  node: {
    __dirname: true,
  },

  mode: env.prod ? 'production' : 'development',
  devtool: env.prod ? 'source-map' : 'inline-source-map',

  devServer: {
    historyApiFallback: {
      rewrites: examples.map(name => ({
        from: new RegExp(`^/${name}(?:\\/?|/.*)$`),
        to: `/${name}.html`,
      })),
    },
    hot: true,
    stats: 'minimal',
  },

  entry: examples.reduce(
    (entries, name) => {
      entries[name] = [globalCss, resolve(__dirname, name, 'index.ts')]
      return entries
    },
    { index: [globalCss, resolve(__dirname, 'index.ts')] }
  ),

  output: {
    path: join(__dirname, '__build__'),
    filename: '[name].js',
    chunkFilename: '[id].chunk.js',
    publicPath: '/',
  },

  module: {
    rules: [
      {
        test: /\.ts$/,
        use: 'ts-loader',
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
    ],
  },
  resolve: {
    alias: {
      vue: resolve(__dirname, '../node_modules/vue/dist/vue.esm-bundler.js'),
      'vue-router': join(__dirname, '..', 'src'),
    },
    // Add `.ts` and `.tsx` as a resolvable extension.
    extensions: ['.ts', '.tsx', '.js', '.vue'],
  },
  plugins: [
    new webpack.DefinePlugin({
      __DEV__: JSON.stringify(!env.prod),
      __CI__: JSON.stringify(process.env.CI || false),
      __BROWSER__: 'true',
      'process.env': {
        NODE_ENV: JSON.stringify(process.env.NODE_ENV),
      },
    }),
    ...examples.map(
      name =>
        new HtmlWebpackPlugin({
          filename: `${name}.html`,
          chunks: [name],
          template: resolve(__dirname, name, 'index.html'),
        })
    ),
    new HtmlWebpackPlugin({
      filename: 'index.html',
      chunks: ['index'],
      template: resolve(__dirname, 'index.html'),
    }),
  ],
})

module.exports = config
