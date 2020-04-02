const webpack = require('webpack')
const WebpackDevServer = require('webpack-dev-server')
const webpackConfig = require('./webpack.config')

const config = webpackConfig({ prod: false })

const compiler = webpack(config)

const app = new WebpackDevServer(compiler, config.devServer)

const port = process.env.PORT || 8080
module.exports = app.listen(port)
