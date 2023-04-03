const fs = require('fs').promises
const path = require('path')
const chalk = require('chalk')
const { gzipSync } = require('zlib')
const { compress } = require('brotli')

async function checkFileSize(filePath) {
  const stat = await fs.stat(filePath).catch(() => null)
  if (!stat?.isFile()) {
    console.error(chalk.red(`File ${chalk.bold(filePath)} not found`))
    return
  }
  const file = await fs.readFile(filePath)
  const minSize = (file.length / 1024).toFixed(2) + 'kb'
  const [gzipped, compressed] = await Promise.all([
    gzipSync(file),
    //
    compress(file),
  ])
  const gzippedSize = (gzipped.length / 1024).toFixed(2) + 'kb'
  const compressedSize = (compressed.length / 1024).toFixed(2) + 'kb'
  console.log(
    `${chalk.gray(
      chalk.bold(path.basename(filePath))
    )} min:${minSize} / gzip:${gzippedSize} / brotli:${compressedSize}`
  )
}

;(async () => {
  const files = [
    path.resolve(__dirname, '../packages/router/size-checks/dist/webRouter.js'),
    path.resolve(
      __dirname,
      '../packages/router/dist/vue-router.global.prod.js'
    ),
  ]
  for (const file of files) {
    await checkFileSize(file)
  }
})()
