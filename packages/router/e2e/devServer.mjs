import { createServer } from 'vite'
import viteConfig from './vite.config.mjs'
const config = viteConfig({ prod: false })

/** @type {import('vite').ViteDevServer} */
let server = null

;(async () => {
  const app = await createServer({
    configFile: false,
    ...config,
  })
  server = await app.listen(process.env.PORT || 3000)
  internalResolve(server)
})()

let internalResolve = () => {}

export function getServer() {
  return new Promise((resolve, reject) => {
    if (server) {
      resolve(server)
    } else {
      internalResolve = resolve
    }
  })
}
