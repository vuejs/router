/**
 * @vitest-environment happy-dom
 */
import {
  createRouter,
  createMemoryHistory,
  onBeforeRouteUpdate,
  RouterView,
  type RouteRecordRaw,
} from '../../src'
import {
  defineComponent,
  h,
  ComponentOptions,
  FunctionalComponent,
  onActivated,
  onDeactivated,
} from 'vue'
import { mount } from '@vue/test-utils'
import { delay } from '../utils'
import { vi, describe, expect, it } from 'vitest'

const component = {
  template: '<div>Generic</div>',
}

function withSpy(name?: string, isAsync = false) {
  const spy = vi.fn()
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
  it('triggers when shared KeepAlive component is reactivated for a different route', async () => {
    const routeUpdateSpy = vi.fn()
    const activatedSpy = vi.fn()
    const deactivatedSpy = vi.fn()
    const setupSpy = vi.fn(() => {
      onBeforeRouteUpdate(routeUpdateSpy)
      onActivated(activatedSpy)
      onDeactivated(deactivatedSpy)
      return {}
    })

    // A shared component used by multiple routes (simulates list pages)
    const SharedComponent = defineComponent({
      template: '<div>Shared: {{ $route.path }}</div>',
      setup: setupSpy,
    })

    // A different component (simulates detail page)
    const DetailComponent = defineComponent({
      template: '<div>Detail</div>',
    })

    const { router, wrapper } = factory(
      [
        { path: '/', component },
        { path: '/a', component: SharedComponent },
        { path: '/b', component: SharedComponent },
      ],
      {
        template: `
          <router-view v-slot="{ Component }">
            <keep-alive>
              <component :is="Component" />
            </keep-alive>
          </router-view>
        `,
      }
    )
    await router.isReady()

    // Step 1: Navigate to /a - component mounts and registers guard with /a's record
    await router.push('/a')
    expect(routeUpdateSpy).not.toHaveBeenCalled()
    expect(setupSpy).toHaveBeenCalledTimes(1)
    expect(activatedSpy).toHaveBeenCalledTimes(1) // activated on mount

    // Step 2: Navigate somewhere else - SharedComponent is deactivated
    await router.push('/')
    expect(deactivatedSpy).toHaveBeenCalledTimes(1)

    // Step 3: Navigate to /b - SharedComponent is reactivated for a DIFFERENT route
    // This is where the bug occurs: guard is added back to /a's record, not /b's
    await router.push('/b')
    expect(activatedSpy).toHaveBeenCalledTimes(2) // reactivated
    expect(setupSpy).toHaveBeenCalledTimes(1) // still only mounted once (kept alive)

    // Step 4: Update query on /b - onBeforeRouteUpdate SHOULD be triggered
    // BUG (before fix): The guard was registered with /a's record, not /b's record
    // So when /b updates, the guard is not called
    await router.push('/b?page=2')
    expect(routeUpdateSpy).toHaveBeenCalledTimes(1)

    wrapper.unmount()
  })

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
