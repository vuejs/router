const fs = require('fs')
const { resolve, join } = require('path')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const webpack = require('webpack')

const outputPath = resolve(__dirname, '__build__')

module.exports = {
  // Expose __dirname to allow automatically setting basename.
  context: __dirname,
  node: {
    __dirname: true,
  },

  mode: process.env.NODE_ENV || 'development',

  // devtool: 'inline-source-map',
  devServer: {
    // contentBase: outputPath,
    historyApiFallback: {
      rewrites: [{ from: /^\/encoding(?:\/?|\/.*)$/, to: '/encoding.html' }],
    },
    // hot: true,
  },

  entry: {
    encoding: resolve(__dirname, 'encoding/index.ts'),
  },
  // entry: fs.readdirSync(__dirname).reduce((entries, dir) => {
  //   const fullDir = path.join(__dirname, dir)
  //   const entry = path.join(fullDir, 'index.ts')
  //   if (fs.statSync(fullDir).isDirectory() && fs.existsSync(entry)) {
  //     entries[dir] = ['es6-promise/auto', entry]
  //   }

  //   return entries
  // }, {}),

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
    ],
  },
  resolve: {
    alias: {
      vue: resolve(__dirname, '../node_modules/vue/dist/vue.esm.js'),
      'vue-router': join(__dirname, '..', 'src'),
    },
    // Add `.ts` and `.tsx` as a resolvable extension.
    extensions: ['.ts', '.tsx', '.js'],
  },
  plugins: [
    new HtmlWebpackPlugin({
      // inject: false,
      // chunks: ['encoding'],
      filename: 'encoding.html',
      title: 'Vue Router Examples - encoding',
      template: resolve(__dirname, 'encoding/index.html'),
    }),
    new webpack.DefinePlugin({
      'process.env': {
        NODE_ENV: JSON.stringify(process.env.NODE_ENV),
      },
    }),
  ],
}
