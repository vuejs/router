import { getLang } from '@vue-macros/common'
import type { UnpluginContextMeta } from 'unplugin'

// vue-router/auto/routes was more natural but didn't work well with TS
export const MODULE_ROUTES_PATH = `vue-router/auto-routes`
export const MODULE_RESOLVER_PATH = `vue-router/auto-resolver`

// NOTE: not sure if needed. Used for HMR the virtual routes
let time = Date.now()
/**
 * Last time the routes were loaded from MODULE_ROUTES_PATH
 */
export const ROUTES_LAST_LOAD_TIME = {
  get value() {
    return time
  },
  update(when = Date.now()) {
    time = when
  },
}

// we used to have `/__` because HMR didn't work with `\0` virtual modules
// but it seems to work now, so switching to the official Vite virtual module prefix
export const VIRTUAL_PREFIX = '\0'

// allows removing the route block from the code
export const ROUTE_BLOCK_ID = asVirtualId('vue-router/auto/route-block')

export function getVirtualId(id: string) {
  return id.startsWith(VIRTUAL_PREFIX) ? id.slice(VIRTUAL_PREFIX.length) : null
}

export const routeBlockQueryRE = /\?vue&type=route/

export function asVirtualId(id: string) {
  return VIRTUAL_PREFIX + id
}

export const DEFINE_PAGE_QUERY_RE = /\?.*\bdefinePage\b/

/**
 * Generates the id used to import the `definePage()` route data of a page
 * component.
 *
 * @param filePath - path of the page component
 * @param framework - bundler the plugin is running in
 */
export function getDefinePageImportId(
  filePath: string,
  framework?: UnpluginContextMeta['framework']
): string {
  const lang = getLang(filePath)
  // TODO: apply the language used in the sfc
  if (lang !== 'vue') return `${filePath}?definePage&lang.${lang}`

  const id = `${filePath}?definePage&vue&lang.tsx`
  // webpack and rspack match rules against the file path, ignoring the query,
  // so vue-loader would try to compile the extracted `definePage()` as an SFC.
  // Using a match resource makes the module go through the tsx rules instead
  // https://webpack.js.org/api/loaders/#inline-matchresource
  if (framework === 'webpack' || framework === 'rspack') {
    return `${filePath}.definePage.tsx?definePage!=!${id}`
  }
  return id
}
