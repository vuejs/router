const webpack = require('webpack')
const WebpackDevServer = require('webpack-dev-server')
const webpackConfig = require('./webpack.config')

const compiler = webpack(webpackConfig)

const app = new WebpackDevServer(compiler, webpackConfig.devServer)

const port = process.env.PORT || 8080
module.exports = app.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}, Ctrl+C to stop`)
})
