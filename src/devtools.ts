import { App, setupDevtoolsPlugin } from '@vue/devtools-api'
import { Router } from './router'

export function addDevtools(app: App, router: Router) {
  setupDevtoolsPlugin(
    {
      id: 'Router',
      label: 'Router devtools',
      app,
    },
    api => {
      api.on.inspectComponent((payload, ctx) => {
        if (payload.instanceData) {
          const stateType = 'extra properties (test)'
          payload.instanceData.state.push({
            type: stateType,
            key: 'foo',
            value: 'bar',
            editable: false,
          })

          payload.instanceData.state.push({
            type: stateType,
            key: 'time',
            editable: false,
            value: {
              _custom: {
                type: null,
                readOnly: true,
                display: `${router.currentRoute.value.fullPath}s`,
                tooltip: 'Current Route',
                value: router.currentRoute.value,
              },
            },
          })
        }
      })

      api.addTimelineLayer({
        id: 'router:navigations',
        label: 'Router Navigations',
        color: 0x92a2bf,
      })

      router.afterEach((from, to) => {
        // @ts-ignore
        api.notifyComponentUpdate()
        api.addTimelineEvent({
          layerId: 'router:navigations',
          event: {
            time: Date.now(),
            data: {
              info: 'afterEach',
              from,
              to,
            },
            meta: { foo: 'meta?' },
          },
        })
      })
    }
  )
}
