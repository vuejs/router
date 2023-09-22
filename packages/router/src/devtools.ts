import {
  App,
  CustomInspectorNode,
  InspectorNodeTag,
  CustomInspectorState,
  HookPayloads,
  setupDevtoolsPlugin,
  TimelineEvent,
} from '@vue/devtools-api'
import { watch } from 'vue'
import { decode } from './encoding'
import { isSameRouteRecord } from './location'
import { RouterMatcher } from './matcher'
import { RouteRecordMatcher } from './matcher/pathMatcher'
import { PathParser } from './matcher/pathParserRanker'
import { Router } from './router'
import { UseLinkDevtoolsContext } from './RouterLink'
import { RouterViewDevtoolsContext } from './RouterView'
import { RouteLocationNormalized } from './types'
import { assign, isArray } from './utils'

/**
 * Copies a route location and removes any problematic properties that cannot be shown in devtools (e.g. Vue instances).
 *
 * @param routeLocation - routeLocation to format
 * @param tooltip - optional tooltip
 * @returns a copy of the routeLocation
 */
function formatRouteLocation(
  routeLocation: RouteLocationNormalized,
  tooltip?: string
) {
  const copy = assign({}, routeLocation, {
    // remove variables that can contain vue instances
    matched: routeLocation.matched.map(matched =>
      omit(matched, ['instances', 'children', 'aliasOf'])
    ),
  })

  return {
    _custom: {
      type: null,
      readOnly: true,
      display: routeLocation.fullPath,
      tooltip,
      value: copy,
    },
  }
}

function formatDisplay(display: string) {
  return {
    _custom: {
      display,
    },
  }
}

// to support multiple router instances
let routerId = 0

export function addDevtools(app: App, router: Router, matcher: RouterMatcher) {
  // Take over router.beforeEach and afterEach

  // make sure we are not registering the devtool twice
  if ((router as any).__hasDevtools) return
  ;(router as any).__hasDevtools = true

  // increment to support multiple router instances
  const id = routerId++
  setupDevtoolsPlugin(
    {
      id: 'org.vuejs.router' + (id ? '.' + id : ''),
      label: 'Vue Router',
      packageName: 'vue-router',
      homepage: 'https://router.vuejs.org',
      logo: 'https://router.vuejs.org/logo.png',
      componentStateTypes: ['Routing'],
      app,
    },
    api => {
      if (typeof api.now !== 'function') {
        console.warn(
          '[Vue Router]: You seem to be using an outdated version of Vue Devtools. Are you still using the Beta release instead of the stable one? You can find the links at https://devtools.vuejs.org/guide/installation.html.'
        )
      }

      // display state added by the router
      api.on.inspectComponent((payload, ctx) => {
        if (payload.instanceData) {
          payload.instanceData.state.push({
            type: 'Routing',
            key: '$route',
            editable: false,
            value: formatRouteLocation(
              router.currentRoute.value,
              'Current Route'
            ),
          })
        }
      })

      // mark router-link as active and display tags on router views
      api.on.visitComponentTree(({ treeNode: node, componentInstance }) => {
        if (componentInstance.__vrv_devtools) {
          const info =
            componentInstance.__vrv_devtools as RouterViewDevtoolsContext

          node.tags.push({
            label: (info.name ? `${info.name.toString()}: ` : '') + info.path,
            textColor: 0,
            tooltip: 'This component is rendered by &lt;router-view&gt;',
            backgroundColor: PINK_500,
          })
        }
        // if multiple useLink are used
        if (isArray(componentInstance.__vrl_devtools)) {
          componentInstance.__devtoolsApi = api
          ;(
            componentInstance.__vrl_devtools as UseLinkDevtoolsContext[]
          ).forEach(devtoolsData => {
            let backgroundColor = ORANGE_400
            let tooltip: string = ''

            if (devtoolsData.isExactActive) {
              backgroundColor = LIME_500
              tooltip = 'This is exactly active'
            } else if (devtoolsData.isActive) {
              backgroundColor = BLUE_600
              tooltip = 'This link is active'
            }

            node.tags.push({
              label: devtoolsData.route.path,
              textColor: 0,
              tooltip,
              backgroundColor,
            })
          })
        }
      })

      watch(router.currentRoute, () => {
        // refresh active state
        refreshRoutesView()
        api.notifyComponentUpdate()
        api.sendInspectorTree(routerInspectorId)
        api.sendInspectorState(routerInspectorId)
      })

      const navigationsLayerId = 'router:navigations:' + id

      api.addTimelineLayer({
        id: navigationsLayerId,
        label: `Router${id ? ' ' + id : ''} Navigations`,
        color: 0x40a8c4,
      })

      // const errorsLayerId = 'router:errors'
      // api.addTimelineLayer({
      //   id: errorsLayerId,
      //   label: 'Router Errors',
      //   color: 0xea5455,
      // })

      router.onError((error, to) => {
        api.addTimelineEvent({
          layerId: navigationsLayerId,
          event: {
            title: 'Error during Navigation',
            subtitle: to.fullPath,
            logType: 'error',
            time: api.now(),
            data: { error },
            groupId: (to.meta as any).__navigationId,
          },
        })
      })

      // attached to `meta` and used to group events
      let navigationId = 0

      router.beforeEach((to, from) => {
        const data: TimelineEvent<any, any>['data'] = {
          guard: formatDisplay('beforeEach'),
          from: formatRouteLocation(
            from,
            'Current Location during this navigation'
          ),
          to: formatRouteLocation(to, 'Target location'),
        }

        // Used to group navigations together, hide from devtools
        Object.defineProperty(to.meta, '__navigationId', {
          value: navigationId++,
        })

        api.addTimelineEvent({
          layerId: navigationsLayerId,
          event: {
            time: api.now(),
            title: 'Start of navigation',
            subtitle: to.fullPath,
            data,
            groupId: (to.meta as any).__navigationId,
          },
        })
      })

      router.afterEach((to, from, failure) => {
        const data: TimelineEvent<any, any>['data'] = {
          guard: formatDisplay('afterEach'),
        }

        if (failure) {
          data.failure = {
            _custom: {
              type: Error,
              readOnly: true,
              display: failure ? failure.message : '',
              tooltip: 'Navigation Failure',
              value: failure,
            },
          }
          data.status = formatDisplay('❌')
        } else {
          data.status = formatDisplay('✅')
        }

        // we set here to have the right order
        data.from = formatRouteLocation(
          from,
          'Current Location during this navigation'
        )
        data.to = formatRouteLocation(to, 'Target location')

        api.addTimelineEvent({
          layerId: navigationsLayerId,
          event: {
            title: 'End of navigation',
            subtitle: to.fullPath,
            time: api.now(),
            data,
            logType: failure ? 'warning' : 'default',
            groupId: (to.meta as any).__navigationId,
          },
        })
      })

      /**
       * Inspector of Existing routes
       */

      const routerInspectorId = 'router-inspector:' + id

      api.addInspector({
        id: routerInspectorId,
        label: 'Routes' + (id ? ' ' + id : ''),
        icon: 'book',
        treeFilterPlaceholder: 'Search routes',
      })

      function refreshRoutesView() {
        // the routes view isn't active
        if (!activeRoutesPayload) return
        const payload = activeRoutesPayload

        // children routes will appear as nested
        let routes = matcher.getRoutes().filter(
          route =>
            !route.parent ||
            // these routes have a parent with no component which will not appear in the view
            // therefore we still need to include them
            !route.parent.record.components
        )

        // reset match state to false
        routes.forEach(resetMatchStateOnRouteRecord)

        // apply a match state if there is a payload
        if (payload.filter) {
          routes = routes.filter(route =>
            // save matches state based on the payload
            isRouteMatching(route, payload.filter.toLowerCase())
          )
        }

        // mark active routes
        routes.forEach(route =>
          markRouteRecordActive(route, router.currentRoute.value)
        )
        payload.rootNodes = routes.map(formatRouteRecordForInspector)
      }

      let activeRoutesPayload: HookPayloads['getInspectorTree'] | undefined
      api.on.getInspectorTree(payload => {
        activeRoutesPayload = payload
        if (payload.app === app && payload.inspectorId === routerInspectorId) {
          refreshRoutesView()
        }
      })

      /**
       * Display information about the currently selected route record
       */
      api.on.getInspectorState(payload => {
        if (payload.app === app && payload.inspectorId === routerInspectorId) {
          const routes = matcher.getRoutes()
          const route = routes.find(
            route => (route.record as any).__vd_id === payload.nodeId
          )

          if (route) {
            payload.state = {
              options: formatRouteRecordMatcherForStateInspector(route),
            }
          }
        }
      })

      api.sendInspectorTree(routerInspectorId)
      api.sendInspectorState(routerInspectorId)
    }
  )
}

function modifierForKey(key: PathParser['keys'][number]) {
  if (key.optional) {
    return key.repeatable ? '*' : '?'
  } else {
    return key.repeatable ? '+' : ''
  }
}

function formatRouteRecordMatcherForStateInspector(
  route: RouteRecordMatcher
): CustomInspectorState[string] {
  const { record } = route
  const fields: CustomInspectorState[string] = [
    { editable: false, key: 'path', value: record.path },
  ]

  if (record.name != null) {
    fields.push({
      editable: false,
      key: 'name',
      value: record.name,
    })
  }

  fields.push({ editable: false, key: 'regexp', value: route.re })

  if (route.keys.length) {
    fields.push({
      editable: false,
      key: 'keys',
      value: {
        _custom: {
          type: null,
          readOnly: true,
          display: route.keys
            .map(key => `${key.name}${modifierForKey(key)}`)
            .join(' '),
          tooltip: 'Param keys',
          value: route.keys,
        },
      },
    })
  }

  if (record.redirect != null) {
    fields.push({
      editable: false,
      key: 'redirect',
      value: record.redirect,
    })
  }

  if (route.alias.length) {
    fields.push({
      editable: false,
      key: 'aliases',
      value: route.alias.map(alias => alias.record.path),
    })
  }

  if (Object.keys(route.record.meta).length) {
    fields.push({
      editable: false,
      key: 'meta',
      value: route.record.meta,
    })
  }

  fields.push({
    key: 'score',
    editable: false,
    value: {
      _custom: {
        type: null,
        readOnly: true,
        display: route.score.map(score => score.join(', ')).join(' | '),
        tooltip: 'Score used to sort routes',
        value: route.score,
      },
    },
  })

  return fields
}

/**
 * Extracted from tailwind palette
 */
const PINK_500 = 0xec4899
const BLUE_600 = 0x2563eb
const LIME_500 = 0x84cc16
const CYAN_400 = 0x22d3ee
const ORANGE_400 = 0xfb923c
// const GRAY_100 = 0xf4f4f5
const DARK = 0x666666

function formatRouteRecordForInspector(
  route: RouteRecordMatcher
): CustomInspectorNode {
  const tags: InspectorNodeTag[] = []

  const { record } = route

  if (record.name != null) {
    tags.push({
      label: String(record.name),
      textColor: 0,
      backgroundColor: CYAN_400,
    })
  }

  if (record.aliasOf) {
    tags.push({
      label: 'alias',
      textColor: 0,
      backgroundColor: ORANGE_400,
    })
  }

  if ((route as any).__vd_match) {
    tags.push({
      label: 'matches',
      textColor: 0,
      backgroundColor: PINK_500,
    })
  }

  if ((route as any).__vd_exactActive) {
    tags.push({
      label: 'exact',
      textColor: 0,
      backgroundColor: LIME_500,
    })
  }

  if ((route as any).__vd_active) {
    tags.push({
      label: 'active',
      textColor: 0,
      backgroundColor: BLUE_600,
    })
  }

  if (record.redirect) {
    tags.push({
      label:
        typeof record.redirect === 'string'
          ? `redirect: ${record.redirect}`
          : 'redirects',
      textColor: 0xffffff,
      backgroundColor: DARK,
    })
  }

  // add an id to be able to select it. Using the `path` is not possible because
  // empty path children would collide with their parents
  let id = (record as any).__vd_id
  if (id == null) {
    id = String(routeRecordId++)
    ;(record as any).__vd_id = id
  }

  return {
    id,
    label: record.path,
    tags,
    children: route.children.map(formatRouteRecordForInspector),
  }
}

//  incremental id for route records and inspector state
let routeRecordId = 0

const EXTRACT_REGEXP_RE = /^\/(.*)\/([a-z]*)$/

function markRouteRecordActive(
  route: RouteRecordMatcher,
  currentRoute: RouteLocationNormalized
) {
  // no route will be active if matched is empty
  // reset the matching state
  const isExactActive =
    currentRoute.matched.length &&
    isSameRouteRecord(
      currentRoute.matched[currentRoute.matched.length - 1],
      route.record
    )
  ;(route as any).__vd_exactActive = (route as any).__vd_active = isExactActive

  if (!isExactActive) {
    ;(route as any).__vd_active = currentRoute.matched.some(match =>
      isSameRouteRecord(match, route.record)
    )
  }

  route.children.forEach(childRoute =>
    markRouteRecordActive(childRoute, currentRoute)
  )
}

function resetMatchStateOnRouteRecord(route: RouteRecordMatcher) {
  ;(route as any).__vd_match = false
  route.children.forEach(resetMatchStateOnRouteRecord)
}

function isRouteMatching(route: RouteRecordMatcher, filter: string): boolean {
  const found = String(route.re).match(EXTRACT_REGEXP_RE)
  // reset the matching state
  ;(route as any).__vd_match = false
  if (!found || found.length < 3) {
    return false
  }

  // use a regexp without $ at the end to match nested routes better
  const nonEndingRE = new RegExp(found[1].replace(/\$$/, ''), found[2])
  if (nonEndingRE.test(filter)) {
    // mark children as matches
    route.children.forEach(child => isRouteMatching(child, filter))
    // exception case: `/`
    if (route.record.path !== '/' || filter === '/') {
      ;(route as any).__vd_match = route.re.test(filter)
      return true
    }
    // hide the / route
    return false
  }

  const path = route.record.path.toLowerCase()
  const decodedPath = decode(path)

  // also allow partial matching on the path
  if (
    !filter.startsWith('/') &&
    (decodedPath.includes(filter) || path.includes(filter))
  )
    return true
  if (decodedPath.startsWith(filter) || path.startsWith(filter)) return true
  if (route.record.name && String(route.record.name).includes(filter))
    return true

  return route.children.some(child => isRouteMatching(child, filter))
}

function omit<T extends object, K extends [...(keyof T)[]]>(obj: T, keys: K) {
  const ret = {} as {
    [K2 in Exclude<keyof T, K[number]>]: T[K2]
  }

  for (const key in obj) {
    if (!keys.includes(key)) {
      // @ts-expect-error
      ret[key] = obj[key]
    }
  }
  return ret
}
