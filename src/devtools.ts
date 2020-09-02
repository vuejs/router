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

      console.log('adding devtools to timeline')
      router.beforeEach((to, from) => {
        const data: TimelineEvent<any, any>['data'] = {
          guard: formatDisplay('beforEach'),
          from: formatRouteLocation(
            from,
            'Current Location during this navigation'
          ),
          to: formatRouteLocation(to, 'Target location'),
        }

        console.log('adding to timeline')
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

      const routerInspectorId = 'hahaha router-inspector'

      api.addInspector({
        id: routerInspectorId,
        label: 'Routes',
        icon: 'book',
        treeFilterPlaceholder: 'Filter routes',
      })

      api.on.getInspectorTree(payload => {
        if (payload.app === app && payload.inspectorId === routerInspectorId) {
          const routes = matcher.getRoutes().filter(route => !route.parent)
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
      value: route.alias,
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
