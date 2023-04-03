import fs from 'node:fs/promises'
import path from 'node:path'
import chalk from 'chalk'
import { gzipSync } from 'zlib'
import { compress } from 'brotli'

const __dirname = path.dirname(new URL(import.meta.url).pathname)

async function checkFileSize(filePath) {
  const { isFile = false } = await fs.stat(filePath).catch(() => ({}))
  if (!isFile) {
    console.error(chalk.red(`File ${chalk.bold(filePath)} not found`))
    return
  }

  const file = await fs.readFile(filePath)
  const [gzipped, compressed] = await Promise.all([
    gzipSync(file),
    compress(file),
  ])

  console.log(
    `${chalk.gray(chalk.bold(path.basename(filePath)))} min:${(
      file.length / 1024
    ).toFixed(2)}kb / gzip:${(gzipped.length / 1024).toFixed(2)}kb / brotli:${(
      compressed.length / 1024
    ).toFixed(2)}kb`
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
