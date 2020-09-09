import {
  App,
  CustomInspectorNode,
  CustomInspectorNodeTag,
  CustomInspectorState,
  setupDevtoolsPlugin,
  TimelineEvent,
} from '@vue/devtools-api'
import { watch } from 'vue'
import { RouterMatcher } from './matcher'
import { RouteRecordMatcher } from './matcher/pathMatcher'
import { PathParser } from './matcher/pathParserRanker'
import { Router } from './router'
import { RouteLocationNormalized } from './types'

function formatRouteLocation(
  routeLocation: RouteLocationNormalized,
  tooltip?: string
) {
  const copy = {
    ...routeLocation,
    // remove variables that can contain vue instances
    matched: routeLocation.matched.map(
      ({ instances, children, aliasOf, ...rest }) => rest
    ),
  }

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

export function addDevtools(app: App, router: Router, matcher: RouterMatcher) {
  // Take over router.beforeEach and afterEach

  setupDevtoolsPlugin(
    {
      id: 'Router',
      label: 'Router devtools',
      app,
    },
    api => {
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

      watch(router.currentRoute, () => {
        // @ts-ignore
        api.notifyComponentUpdate()
      })

      const navigationsLayerId = 'router:navigations'

      api.addTimelineLayer({
        id: navigationsLayerId,
        label: 'Router Navigations',
        color: 0x40a8c4,
      })

      // const errorsLayerId = 'router:errors'
      // api.addTimelineLayer({
      //   id: errorsLayerId,
      //   label: 'Router Errors',
      //   color: 0xea5455,
      // })

      router.onError(error => {
        api.addTimelineEvent({
          layerId: navigationsLayerId,
          event: {
            // @ts-ignore
            logType: 'error',
            time: Date.now(),
            data: { error },
          },
        })
      })

      router.beforeEach((to, from) => {
        const data: TimelineEvent<any, any>['data'] = {
          guard: formatDisplay('beforEach'),
          from: formatRouteLocation(
            from,
            'Current Location during this navigation'
          ),
          to: formatRouteLocation(to, 'Target location'),
        }

        api.addTimelineEvent({
          layerId: navigationsLayerId,
          event: {
            time: Date.now(),
            meta: {},
            data,
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
            time: Date.now(),
            data,
            // @ts-ignore
            logType: failure ? 'warning' : 'default',
            meta: {},
          },
        })
      })

      const routerInspectorId = 'router-inspector'

      api.addInspector({
        id: routerInspectorId,
        label: 'Routes',
        icon: 'book',
        treeFilterPlaceholder: 'Search routes',
      })

      api.on.getInspectorTree(payload => {
        if (payload.app === app && payload.inspectorId === routerInspectorId) {
          const routes = matcher.getRoutes().filter(
            route =>
              !route.parent &&
              (!payload.filter ||
                // save isActive state
                isRouteMatching(route, payload.filter))
          )
          // reset match state if no filter is provided
          if (!payload.filter) {
            routes.forEach(route => {
              ;(route as any).__vd_match = false
            })
          }
          payload.rootNodes = routes.map(formatRouteRecordForInspector)
        }
      })

      api.on.getInspectorState(payload => {
        if (payload.app === app && payload.inspectorId === routerInspectorId) {
          const routes = matcher.getRoutes()
          const route = routes.find(
            route => route.record.path === payload.nodeId
          )

          if (route) {
            payload.state = {
              options: formatRouteRecordMatcherForStateInspector(route),
            }
          }
        }
      })
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

  if (record.name != null)
    fields.push({
      editable: false,
      key: 'name',
      value: record.name,
    })

  fields.push({ editable: false, key: 'regexp', value: route.re })

  if (route.keys.length)
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

  if (record.redirect != null)
    fields.push({
      editable: false,
      key: 'redirect',
      value: record.redirect,
    })

  if (route.alias.length)
    fields.push({
      editable: false,
      key: 'aliases',
      value: route.alias.map(alias => alias.record.path),
    })

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

function formatRouteRecordForInspector(
  route: RouteRecordMatcher
): CustomInspectorNode {
  const tags: CustomInspectorNodeTag[] = []

  const { record } = route

  if (record.name != null) {
    tags.push({
      label: String(record.name),
      textColor: 0,
      backgroundColor: 0x00bcd4,
    })
  }

  if (record.aliasOf) {
    tags.push({
      label: 'alias',
      textColor: 0,
      backgroundColor: 0xff984f,
    })
  }

  if ((route as any).__vd_match) {
    tags.push({
      label: 'matches',
      textColor: 0,
      backgroundColor: 0xf4f4f4,
    })
  }

  if (record.redirect) {
    tags.push({
      label:
        'redirect: ' +
        (typeof record.redirect === 'string' ? record.redirect : 'Object'),
      textColor: 0xffffff,
      backgroundColor: 0x666666,
    })
  }

  return {
    id: record.path,
    label: record.path,
    tags,
    // @ts-ignore
    children: route.children.map(formatRouteRecordForInspector),
  }
}

const EXTRACT_REGEXP_RE = /^\/(.*)\/([a-z]*)$/

function isRouteMatching(route: RouteRecordMatcher, filter: string): boolean {
  const found = String(route.re).match(EXTRACT_REGEXP_RE)
  // reset the matching state
  ;(route as any).__vd_match = false
  if (!found || found.length < 3) return false

  // use a regexp without $ at the end to match nested routes better
  const nonEndingRE = new RegExp(found[1].replace(/\$$/, ''), found[2])
  if (nonEndingRE.test(filter)) {
    // mark children as matches
    route.children.some(child => isRouteMatching(child, filter))
    // exception case: `/`
    if (route.record.path !== '/' || filter === '/') {
      ;(route as any).__vd_match = route.re.test(filter)
      return true
    }
    // hide the / route
    return false
  }

  // also allow partial matching on the path
  if (route.record.path.startsWith(filter)) return true
  if (route.record.name && String(route.record.name).includes(filter))
    return true

  return route.children.some(child => isRouteMatching(child, filter))
}
