import { shallowRef } from 'vue'
import type { RouteRecordRaw } from '../../types'
import { isRouteName } from '../../types/typeGuards'
import type { RouteRecordNameGeneric } from '../../typed-routes'
import {
  comparePathParserScore,
  PATH_PARSER_OPTIONS_DEFAULTS,
  type PathParserOptions,
} from '../../matcher/pathParserRanker'
import { normalizeRecordProps } from '../../matcher'
import { isAbsolutePath, mergeOptions, noop } from '../../utils'
import { diagnostics } from '../../diagnostics'
import type {
  EXPERIMENTAL_Resolver_Base,
  RecordName,
} from './resolver-abstract'
import { createResolve } from './resolver-fixed'
import { MatcherPatternPathParser } from './matchers/matcher-pattern-path-parser'
import {
  normalizeRouteRecord,
  type EXPERIMENTAL_RouteRecord_Matchable,
  type EXPERIMENTAL_RouteRecordNormalized,
  type EXPERIMENTAL_RouteRecordNormalized_Matchable,
} from '../router'

/**
 * Resolver that allows adding and removing routes at runtime. Created with
 * {@link createDynamicResolver}.
 */
export interface EXPERIMENTAL_ResolverDynamic<
  TRecord,
> extends EXPERIMENTAL_Resolver_Base<TRecord> {
  /**
   * Add a new {@link RouteRecordRaw | route record} as the child of an
   * existing route.
   *
   * @param parentName - name of the parent route
   * @param route - route record to add
   * @returns a function that removes the added route
   */
  addRoute(
    parentName: NonNullable<RouteRecordNameGeneric>,
    route: RouteRecordRaw
  ): () => void

  /**
   * Add a new {@link RouteRecordRaw | route record}.
   *
   * @param route - route record to add
   * @returns a function that removes the added route
   */
  addRoute(route: RouteRecordRaw): () => void

  /**
   * Remove an existing route by its name or its record. This also removes its
   * children and aliases.
   *
   * @param nameOrRecord - name or record of the route to remove
   */
  removeRoute(nameOrRecord: NonNullable<RouteRecordNameGeneric> | TRecord): void

  /**
   * Remove all the routes.
   */
  clearRoutes(): void
}

/**
 * Records that are removed with a record.
 */
interface RecordNode {
  children: EXPERIMENTAL_RouteRecordNormalized[]
  aliases: EXPERIMENTAL_RouteRecordNormalized[]
}

/**
 * Creates a resolver that accepts the route records of the classic router
 * (`path: '/users/:id'`, `children`, `alias`, `component`, etc.) and allows
 * adding and removing routes at runtime. Records are ranked like in the classic
 * router.
 *
 * @param routes - initial routes
 * @param globalOptions - options applied to all the routes (`strict`, `sensitive`, `end`)
 * @returns a resolver that can be passed to `experimental_createRouter()`
 *
 * @example
 * ```ts
 * const router = experimental_createRouter({
 *   history: createWebHistory(),
 *   resolver: createDynamicResolver([
 *     { path: '/', component: Home },
 *     { path: '/users/:id', name: 'user', component: User },
 *   ]),
 * })
 * router.addRoute({ path: '/about', name: 'about', component: About })
 * ```
 */
export function createDynamicResolver(
  routes: Readonly<RouteRecordRaw[]> = [],
  globalOptions: PathParserOptions = {}
): EXPERIMENTAL_ResolverDynamic<EXPERIMENTAL_RouteRecordNormalized_Matchable> {
  type TRecord = EXPERIMENTAL_RouteRecordNormalized_Matchable
  // ordered matchable records, aliases included
  const matchers: TRecord[] = []
  // original records by name
  const recordMap = new Map<RecordName, TRecord>()
  const nodes = new Map<EXPERIMENTAL_RouteRecordNormalized, RecordNode>()
  // invalidates computed values that call `resolve()` when routes change
  const version = shallowRef(0)
  const resolveFn = createResolve(matchers, recordMap)
  const options = mergeOptions(PATH_PARSER_OPTIONS_DEFAULTS, globalOptions)

  function addRoute(
    parentOrRoute: NonNullable<RouteRecordNameGeneric> | RouteRecordRaw,
    route?: RouteRecordRaw
  ): () => void {
    let parent: TRecord | undefined
    if (isRouteName(parentOrRoute)) {
      parent = recordMap.get(parentOrRoute)
      if (__DEV__ && !parent) {
        diagnostics.VUE_ROUTER_R0001({ name: String(parentOrRoute) })
      }
    } else {
      route = parentOrRoute
    }

    const record = insertRecord(route!, parent)
    version.value++
    return record ? () => removeRoute(record) : noop
  }

  /**
   * Normalizes and inserts a record, its aliases, and its children.
   *
   * @param raw - record to add
   * @param parent - parent record
   * @param originalRecord - when adding the children of an alias, the original child
   * @returns the original record
   */
  function insertRecord(
    raw: RouteRecordRaw,
    parent?: EXPERIMENTAL_RouteRecordNormalized,
    originalRecord?: EXPERIMENTAL_RouteRecordNormalized
  ): EXPERIMENTAL_RouteRecordNormalized | undefined {
    const isRootAdd = !originalRecord
    const recordOptions = mergeOptions(options, raw)
    const components =
      'components' in raw
        ? raw.components
        : raw.component && { default: raw.component }
    const isMatchable = !!(
      raw.name ||
      (components && Object.keys(components).length) ||
      raw.redirect
    )
    const paths = [raw.path].concat(raw.alias || [])
    const props = normalizeRecordProps(raw)
    let mainRecord: EXPERIMENTAL_RouteRecordNormalized | undefined

    for (let i = 0; i < paths.length; i++) {
      let path = paths[i]
      // Build up the path for nested routes if the child isn't an absolute
      // route. Only add the / delimiter if the child path isn't empty and if the
      // parent path doesn't have a trailing slash
      if (parent && !isAbsolutePath(path)) {
        const parentPath = getRecordPath(parent)
        path =
          parentPath + (path && (parentPath.endsWith('/') ? '' : '/') + path)
      }

      if (__DEV__ && path === '*') {
        throw new Error(
          'Catch all routes ("*") must now be defined using a param with a custom regexp.\n' +
            'See more at https://router.vuejs.org/guide/migration/#Removed-star-or-catch-all-routes.'
        )
      }

      const aliasOf = originalRecord || (i ? mainRecord : undefined)
      const record = normalizeRouteRecord({
        name: aliasOf
          ? aliasOf.name
          : isMatchable
            ? (raw.name ?? Symbol(__DEV__ ? path : ''))
            : undefined,
        path: new MatcherPatternPathParser(path, recordOptions),
        // aliases share the components with the original record
        components: aliasOf ? aliasOf.components : components || undefined,
        meta: raw.meta || {},
        props,
        redirect: raw.redirect,
        beforeEnter: raw.beforeEnter,
        parent,
        aliasOf,
      } as EXPERIMENTAL_RouteRecord_Matchable) as EXPERIMENTAL_RouteRecordNormalized

      if (__DEV__) {
        checkRecord(record, raw, parent)
      }

      nodes.set(record, { children: [], aliases: [] })
      // both are aliases or both are not aliases so the children of an alias
      // match the children of the original record by index
      if (parent && !record.aliasOf === !parent.aliasOf) {
        nodes.get(parent)?.children.push(record)
      }

      if (aliasOf) {
        nodes.get(aliasOf)!.aliases.push(record)
        if (__DEV__) checkSameParams(aliasOf, record)
      } else {
        mainRecord = record
        // replace any existing route with the same name
        if (isRootAdd && raw.name != null) {
          if (__DEV__) checkSameNameAsAncestor(raw, parent)
          removeRoute(raw.name)
        }
      }

      // records without name, components, or redirect only group other routes
      if (record.name != null) {
        insertMatcher(record as TRecord)
      }

      if (raw.children) {
        const originalChildren =
          originalRecord && nodes.get(originalRecord)!.children
        for (let j = 0; j < raw.children.length; j++) {
          const child = raw.children[j]
          if (
            __DEV__ &&
            !originalChildren &&
            raw.name != null &&
            child.name == null &&
            !child.path &&
            !child.children?.length
          ) {
            diagnostics.VUE_ROUTER_R0103({ name: String(raw.name) })
          }
          insertRecord(child, record, originalChildren?.[j])
        }
      }

      // the children of the aliases are aliases of the children of the first record
      originalRecord = originalRecord || record
    }

    return mainRecord
  }

  function insertMatcher(record: TRecord) {
    matchers.splice(findInsertionIndex(record, matchers), 0, record)
    if (!record.aliasOf) {
      recordMap.set(record.name, record)
    }
  }

  function removeRoute(
    nameOrRecord:
      | NonNullable<RouteRecordNameGeneric>
      | EXPERIMENTAL_RouteRecordNormalized
  ) {
    const record = isRouteName(nameOrRecord)
      ? recordMap.get(nameOrRecord)
      : nameOrRecord
    const node = record && nodes.get(record)
    if (node) {
      nodes.delete(record)
      if (record.name != null && recordMap.get(record.name) === record) {
        recordMap.delete(record.name)
      }
      const index = matchers.indexOf(record as TRecord)
      if (index > -1) matchers.splice(index, 1)
      node.children.forEach(removeRoute)
      node.aliases.forEach(removeRoute)
      version.value++
    } else if (__DEV__ && isRouteName(nameOrRecord)) {
      diagnostics.VUE_ROUTER_R0002({ name: String(nameOrRecord) })
    }
  }

  function clearRoutes() {
    matchers.length = 0
    recordMap.clear()
    nodes.clear()
    version.value++
  }

  for (const route of routes) insertRecord(route)

  return {
    resolve: ((...args: Parameters<typeof resolveFn>) => {
      // track the routes so `computed()`s using `resolve()` are invalidated
      version.value
      return resolveFn(...args)
    }) as typeof resolveFn,
    getRoutes: () => matchers,
    getRoute: name => recordMap.get(name),
    addRoute,
    removeRoute,
    clearRoutes,
  }
}

/**
 * Returns the full path of a record created by {@link createDynamicResolver}.
 */
function getRecordPath(record: EXPERIMENTAL_RouteRecordNormalized): string {
  return (record.path as MatcherPatternPathParser).path
}

function getRecordKeys(record: EXPERIMENTAL_RouteRecordNormalized) {
  return (record.path as MatcherPatternPathParser).parser.keys
}

/**
 * Performs a binary search to find the correct insertion index for a new
 * record. Records are sorted by their score. If scores are tied, descendants
 * come before ancestors. If there's still a tie, new routes are inserted after
 * existing routes.
 *
 * @param record - new record to be inserted
 * @param records - existing records
 */
function findInsertionIndex<T extends EXPERIMENTAL_RouteRecordNormalized>(
  record: T,
  records: T[]
): number {
  const path = record.path as MatcherPatternPathParser
  let lower = 0
  let upper = records.length

  while (lower !== upper) {
    const mid = (lower + upper) >> 1
    if (
      comparePathParserScore(
        path,
        records[mid].path as MatcherPatternPathParser
      ) < 0
    ) {
      upper = mid
    } else {
      lower = mid + 1
    }
  }

  // check for an ancestor with the same score
  let ancestor: EXPERIMENTAL_RouteRecordNormalized | null | undefined = record
  while ((ancestor = ancestor.parent)) {
    if (
      ancestor.name != null &&
      comparePathParserScore(
        path,
        ancestor.path as MatcherPatternPathParser
      ) === 0
    ) {
      upper = records.lastIndexOf(ancestor as T, upper - 1)
      if (__DEV__ && upper < 0) {
        diagnostics.VUE_ROUTER_R0105({
          ancestor: getRecordPath(ancestor),
          record: getRecordPath(record),
        })
      }
      break
    }
  }

  return upper
}

/**
 * Dev only checks run when a record is added.
 */
function checkRecord(
  record: EXPERIMENTAL_RouteRecordNormalized,
  raw: RouteRecordRaw,
  parent: EXPERIMENTAL_RouteRecordNormalized | undefined
) {
  const keys = getRecordKeys(record)
  const existingKeys = new Set<string>()
  for (const key of keys) {
    if (existingKeys.has(key.name)) {
      diagnostics.VUE_ROUTER_R0090({
        name: key.name,
        path: getRecordPath(record),
      })
    }
    existingKeys.add(key.name)
  }

  if (parent && isAbsolutePath(raw.path)) {
    for (const key of getRecordKeys(parent)) {
      if (!keys.find(k => isSameParam(k, key))) {
        diagnostics.VUE_ROUTER_R0104({
          path: getRecordPath(record),
          name: key.name,
          parent: getRecordPath(parent),
        })
        return
      }
    }
  }
}

type ParamKey = MatcherPatternPathParser['parser']['keys'][number]

function isSameParam(a: ParamKey, b: ParamKey): boolean {
  return (
    a.name === b.name &&
    a.optional === b.optional &&
    a.repeatable === b.repeatable
  )
}

/**
 * Check if a path and its alias have the same required params.
 *
 * @param a - original record
 * @param b - alias record
 */
function checkSameParams(
  a: EXPERIMENTAL_RouteRecordNormalized,
  b: EXPERIMENTAL_RouteRecordNormalized
) {
  for (const [x, y] of [
    [a, b],
    [b, a],
  ]) {
    for (const key of getRecordKeys(x)) {
      if (!key.optional && !getRecordKeys(y).find(k => isSameParam(key, k))) {
        diagnostics.VUE_ROUTER_R0102({
          alias: getRecordPath(b),
          original: getRecordPath(a),
          name: key.name,
        })
        return
      }
    }
  }
}

function checkSameNameAsAncestor(
  raw: RouteRecordRaw,
  parent: EXPERIMENTAL_RouteRecordNormalized | undefined
) {
  for (let ancestor = parent; ancestor; ancestor = ancestor.parent!) {
    if (ancestor.name === raw.name) {
      throw new Error(
        `A route named "${String(raw.name)}" has been added as a ${
          parent === ancestor ? 'child' : 'descendant'
        } of a route with the same name. Route names must be unique and a nested route cannot use the same name as an ancestor.`
      )
    }
  }
}
