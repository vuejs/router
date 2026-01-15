import { createUnplugin, type UnpluginOptions } from 'unplugin'
import { createRoutesContext } from './core/context'
import {
  MODULE_ROUTES_PATH,
  getVirtualId as _getVirtualId,
  asVirtualId as _asVirtualId,
  routeBlockQueryRE,
  ROUTE_BLOCK_ID,
  ROUTES_LAST_LOAD_TIME,
  VIRTUAL_PREFIX,
  DEFINE_PAGE_QUERY_RE,
  MODULE_RESOLVER_PATH,
} from './core/moduleConstants'
import {
  Options,
  resolveOptions,
  DEFAULT_OPTIONS,
  mergeAllExtensions,
} from './options'
import { createViteContext } from './core/vite'
import { join } from 'pathe'
import { appendExtensionListToPattern } from './core/utils'
import { createAutoExportPlugin } from '../experimental/data-loaders/auto-exports'

export type * from './types'

export { DEFAULT_OPTIONS }

export { AutoExportLoaders } from '../experimental/data-loaders/auto-exports'
export type { AutoExportLoadersOptions } from '../experimental/data-loaders/auto-exports'

export default createUnplugin<Options | undefined>((opt = {}, _meta) => {
  const options = resolveOptions(opt)
  const ctx = createRoutesContext(options)

  function getVirtualId(id: string) {
    if (options._inspect) return id
    return _getVirtualId(id)
  }

  function asVirtualId(id: string) {
    // for inspection
    if (options._inspect) return id
    return _asVirtualId(id)
  }

  // create the transform filter to detect `definePage()` inside page component
  const pageFilePattern = appendExtensionListToPattern(
    options.filePatterns,
    mergeAllExtensions(options)
  )

  const IDS_TO_INCLUDE = options.routesFolder.flatMap(routeOption =>
    pageFilePattern.map(pattern => join(routeOption.src, pattern))
  )

  const plugins: UnpluginOptions[] = [
    {
      name: 'unplugin-vue-router',
      enforce: 'pre',

      resolveId: {
        filter: {
          id: {
            include: [
              new RegExp(`^${MODULE_ROUTES_PATH}$`),
              new RegExp(`^${MODULE_RESOLVER_PATH}$`),
              routeBlockQueryRE,
            ],
          },
        },
        handler(id) {
          // vue-router/auto-routes
          // vue-router/auto-resolver
          if (id === MODULE_ROUTES_PATH || id === MODULE_RESOLVER_PATH) {
            // must be a virtual module
            return asVirtualId(id)
          }

          // otherwisse we know it matched the routeBlockQueryRE
          // this allows us to skip the route block module as a whole since we already parse it
          return ROUTE_BLOCK_ID
        },
      },

      async buildStart() {
        await ctx.scanPages(options.watch)
      },

      buildEnd() {
        ctx.stopWatcher()
      },

      transform: {
        filter: {
          id: {
            include: [...IDS_TO_INCLUDE, DEFINE_PAGE_QUERY_RE],
            exclude: options.exclude,
          },
        },
        handler(code, id) {
          // remove the `definePage()` from the file or isolate it
          return ctx.definePageTransform(code, id)
        },
      },

      load: {
        filter: {
          id: {
            include: [
              // virtualized ids only
              new RegExp(`^${ROUTE_BLOCK_ID}$`),
              new RegExp(`^${VIRTUAL_PREFIX}${MODULE_ROUTES_PATH}$`),
              new RegExp(`^${VIRTUAL_PREFIX}${MODULE_RESOLVER_PATH}$`),
            ],
          },
        },
        handler(id) {
          // remove the <route> block as it's parsed by the plugin
          // stub it with an empty module
          if (id === ROUTE_BLOCK_ID) {
            return {
              code: `export default {}`,
              map: null,
            }
          }

          // we need to use a virtual module so that vite resolves the vue-router/auto-routes
          // dependency correctly
          const resolvedId = getVirtualId(id)

          // vue-router/auto-routes
          if (resolvedId === MODULE_ROUTES_PATH) {
            ROUTES_LAST_LOAD_TIME.update()
            return ctx.generateRoutes()
          }

          // vue-router/auto-resolver
          if (resolvedId === MODULE_RESOLVER_PATH) {
            ROUTES_LAST_LOAD_TIME.update()
            return ctx.generateResolver()
          }

          return // ok TS...
        },
      },

      // for HMR
      vite: {
        configureServer(server) {
          // Cast needed: Vite version differences in monorepo
          ctx.setServerContext(createViteContext(server))
        },
      },
    },
  ]

  // Experimental options
  if (options.experimental.autoExportsDataLoaders) {
    plugins.push(
      createAutoExportPlugin({
        transformFilter: {
          include: IDS_TO_INCLUDE,
          exclude: options.exclude,
        },
        loadersPathsGlobs: options.experimental.autoExportsDataLoaders,
        root: options.root,
      })
    )
  }

  return plugins
})

export { createRoutesContext }
export { getFileBasedRouteName, getPascalCaseRouteName } from './core/utils'

// Route Tree and edition
export { createTreeNodeValue } from './core/treeNodeValue'
export { EditableTreeNode } from './core/extendRoutes'

/**
 * Adds useful auto imports to the AutoImport config:
 * @example
 * ```js
 * import { VueRouterAutoImports } from 'vue-router/unplugin'
 *
 * AutoImport({
 *   imports: [VueRouterAutoImports],
 * }),
 * ```
 */
export const VueRouterAutoImports: Record<
  string,
  Array<string | [importName: string, alias: string]>
> = {
  'vue-router': [
    'useRoute',
    'useRouter',
    'onBeforeRouteUpdate',
    'onBeforeRouteLeave',
    // NOTE: the typing seems broken locally, so instead we export it directly from vue-router/experimental
    // 'definePage',
  ],
  'vue-router/experimental': ['definePage'],
}
