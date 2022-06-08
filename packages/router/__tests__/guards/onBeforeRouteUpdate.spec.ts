/**
 * @jest-environment jsdom
 */
import {
  createRouter,
  createMemoryHistory,
  onBeforeRouteUpdate,
  RouterView,
  RouteRecordRaw,
} from '../../src'
import { defineComponent, h, ComponentOptions, FunctionalComponent } from 'vue'
import { mount } from '@vue/test-utils'
import { delay } from '../utils'

const component = {
  template: '<div>Generic</div>',
}

function withSpy(name?: string, isAsync = false) {
  const spy = jest.fn()
  const Component = defineComponent({
    name,
    template: `<p>${name || 'No Name'}</p>`,
    setup() {
      onBeforeRouteUpdate(spy)
      return isAsync ? delay(100).then(() => ({})) : {}
    },
  })

  return { spy, Component }
}

type ComponentToMount =
  | Parameters<typeof mount>[0]
  | ComponentOptions
  | FunctionalComponent

function factory(
  routes: RouteRecordRaw[],
  componentToMount: ComponentToMount = () => h(RouterView)
) {
  const router = createRouter({
    history: createMemoryHistory(),
    routes,
  })
  const wrapper = mount(componentToMount as any, {
    global: {
      plugins: [router],
    },
  })

  return { wrapper, router }
}
describe('onBeforeRouteUpdate', () => {
  it('removes update guards when leaving', async () => {
    const { spy: routeUpdate, Component } = withSpy()

    const { router } = factory([
      { path: '/', component },
      { path: '/foo', component: Component },
    ])

    await router.isReady()
    await router.push('/foo')
    expect(routeUpdate).toHaveBeenCalledTimes(0)
    await router.push('/foo?q')
    expect(routeUpdate).toHaveBeenCalledTimes(1)
    await router.push('/')
    expect(routeUpdate).toHaveBeenCalledTimes(1)
    await router.push('/foo')
    expect(routeUpdate).toHaveBeenCalledTimes(1)
    await router.push('/foo?q')
    expect(routeUpdate).toHaveBeenCalledTimes(2)
  })

  // NOTE: this one seems to always pass on unit test, so we are using the e2e
  // suspense test as well
  it('works with async setup', async () => {
    const { spy: normalSpy, Component } = withSpy()
    const { spy: asyncSpy, Component: Async } = withSpy('Async', true)

    const { router } = factory(
      [
        { path: '/', component: Component },
        { path: '/async', component: Async },
      ],
      {
        template: `<router-view v-slot="{ Component }">
        <Suspense>
          <component :is="Component" />
        </Suspense>
      </router-view>
      `,
      }
    )

    expect(normalSpy).toHaveBeenCalledTimes(0)
    expect(asyncSpy).toHaveBeenCalledTimes(0)

    await router.push('/async')
    expect(normalSpy).toHaveBeenCalledTimes(0)
    expect(asyncSpy).toHaveBeenCalledTimes(0)

    await router.push({ query: { n: 1 } })
    expect(normalSpy).toHaveBeenCalledTimes(0)
    expect(asyncSpy).toHaveBeenCalledTimes(1)
    expect(asyncSpy).toHaveBeenLastCalledWith(
      expect.objectContaining({ fullPath: '/async?n=1' }),
      expect.objectContaining({ fullPath: '/async' }),
      expect.anything()
    )

    await router.push('/')
    expect(normalSpy).toHaveBeenCalledTimes(0)
    expect(asyncSpy).toHaveBeenCalledTimes(1)

    await router.push({ query: { n: 2 } })
    expect(normalSpy).toHaveBeenCalledTimes(1)
    expect(normalSpy).toHaveBeenLastCalledWith(
      expect.objectContaining({ fullPath: '/?n=2' }),
      expect.objectContaining({ fullPath: '/' }),
      expect.anything()
    )

    expect(asyncSpy).toHaveBeenCalledTimes(1)

    await router.push('/async')
    expect(normalSpy).toHaveBeenCalledTimes(1)
    expect(asyncSpy).toHaveBeenCalledTimes(1)
  })
})
