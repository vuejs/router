import { type ViteDevServer } from 'vite'
import { type ServerContext } from '../../options'
import {
  MODULE_RESOLVER_PATH,
  MODULE_ROUTES_PATH,
  asVirtualId,
} from '../moduleConstants'

export function createViteContext(server: ViteDevServer): ServerContext {
  function invalidate(path: string): false | Promise<void> {
    const foundModule = server.moduleGraph.getModuleById(path)
    // console.log(`🟣 Invalidating module: ${path}, found: ${!!foundModule}`)
    if (foundModule) {
      return server.reloadModule(foundModule)
    }
    return !!foundModule
  }

  function invalidatePage(filepath: string): Promise<void> | false {
    const pageModules = server.moduleGraph.getModulesByFile(filepath)
    // console.log(`🟣 Invalidating page: ${filepath}, found: ${!!pageModule}`)
    if (pageModules) {
      return Promise.all(
        [...pageModules].map(mod => server.reloadModule(mod))
      ).then(() => {})
    }
    return false
  }

  function reload() {
    server.ws.send({
      type: 'full-reload',
      path: '*',
    })
  }

  /**
   * Triggers HMR for the vue-router/auto-routes module.
   */
  async function updateRoutes() {
    const autoRoutesMod = server.moduleGraph.getModuleById(
      asVirtualId(MODULE_ROUTES_PATH)
    )
    const autoResolvedMod = server.moduleGraph.getModuleById(
      asVirtualId(MODULE_RESOLVER_PATH)
    )

    await Promise.all([
      autoRoutesMod && server.reloadModule(autoRoutesMod),
      autoResolvedMod && server.reloadModule(autoResolvedMod),
    ])
  }

  return {
    invalidate,
    invalidatePage,
    updateRoutes,
    reload,
  }
}
