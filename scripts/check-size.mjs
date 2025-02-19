import fs from 'node:fs/promises'
import path from 'node:path'
import {fileURLToPath} from 'node:url'
import chalk from 'chalk'
import { gzipSync } from 'zlib'
import { compress } from 'brotli'

const pathname = process.platform === 'win32' ? fileURLToPath(import.meta.url) : new URL(import.meta.url).pathname
const __dirname = path.dirname(pathname)

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
  await Promise.all(
    [
      path.resolve(
        __dirname,
        '../packages/router/size-checks/dist/webRouter.js'
      ),
      path.resolve(
        __dirname,
        '../packages/router/dist/vue-router.global.prod.js'
      ),
    ].map(checkFileSize)
  )
})()
