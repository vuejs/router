const { createServer } = require('vite')
const viteConfig = require('./vite.config')
const config = viteConfig({ prod: false })

let server = null

;(async () => {
  const app = await createServer({
    configFile: false,
    ...config,
  })
  const port = process.env.PORT || 8080
  server = await app.listen(port)
})()

module.exports = server
