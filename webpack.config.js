const { resolve } = require('path')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const webpack = require('webpack')
const { WebpackPluginServe: Serve } = require('webpack-plugin-serve')

const outputPath = resolve(__dirname, 'dist')

module.exports = {
  mode: 'development',
  devtool: 'inline-source-map',
  output: {
    path: outputPath,
    // publicPath: '/',
    filename: 'bundle.js',
  },
  entry: [
    resolve(__dirname, 'explorations/html5.ts'),
    'webpack-plugin-serve/client',
  ],
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: 'ts-loader',
      },
    ],
  },
  resolve: {
    // Add `.ts` and `.tsx` as a resolvable extension.
    extensions: ['.ts', '.tsx', '.js'],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './explorations/html5.html',
    }),
    new webpack.DefinePlugin({
      'process.env': {
        NODE_ENV: JSON.stringify(process.env.NODE_ENV),
      },
    }),
    new Serve({
      host: 'localhost',
      port: 8888,
      historyFallback: true,
      static: [outputPath],
    }),
  ],
  watch: true,
}
