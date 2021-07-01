const handler = require('serve-handler')
const http = require('http')
const fs = require('fs')
const path = require('path')

/** @type {string[]} */
let examples = []
const buildDir = path.join(__dirname, '__build__')
fs.readdirSync(buildDir).forEach(file => {
  if (file.endsWith('.html') && !/index\.html$/.test(file)) {
    const fullPath = path.join(buildDir, file)
    if (fs.statSync(fullPath).isFile() && fs.existsSync(fullPath)) {
      examples.push(file.replace(/\.html$/, ''))
    }
  }
})

const server = http.createServer((request, response) => {
  return handler(request, response, {
    public: path.join(__dirname, '__build__'),
    cleanUrls: true,
    rewrites: examples.map(name => ({
      source: `${name}/**`,
      destination: `${name}.html`,
    })),
  })
})

const port = process.env.PORT || 3000
module.exports = server.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}, Ctrl+C to stop`)
})
