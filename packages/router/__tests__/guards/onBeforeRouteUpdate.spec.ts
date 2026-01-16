/**
 * @vitest-environment jsdom
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
    const spy = vi.fn()
    let mountCount = 0
    let activatedCount = 0
    let deactivatedCount = 0

    // A shared component used by multiple routes (simulates list pages)
    const SharedComponent = defineComponent({
      template: '<div>Shared: {{ $route.path }}</div>',
      setup() {
        mountCount++
        onBeforeRouteUpdate(spy)
        return {}
      },
      activated() {
        activatedCount++
      },
      deactivated() {
        deactivatedCount++
      },
    })

    // A different component (simulates detail page)
    const DetailComponent = defineComponent({
      template: '<div>Detail</div>',
    })

    const { router, wrapper } = factory(
      [
        { path: '/', component },
        { path: '/a', component: SharedComponent },
        { path: '/a/:id', component: DetailComponent },
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

    // Step 1: Navigate to /a - component mounts and registers guard with /a's record
    await router.push('/a')
    await router.isReady()
    expect(spy).not.toHaveBeenCalled()
    expect(mountCount).toBe(1)
    expect(activatedCount).toBe(1) // activated on mount

    // Step 2: Navigate to /a/123 - SharedComponent is deactivated (kept alive)
    await router.push('/a/123')
    expect(deactivatedCount).toBe(1)

    // Step 3: Navigate to /b - SharedComponent is reactivated for a DIFFERENT route
    // This is where the bug occurs: guard is added back to /a's record, not /b's
    await router.push('/b')
    expect(activatedCount).toBe(2) // reactivated
    expect(mountCount).toBe(1) // still only mounted once (kept alive)

    // Step 4: Update query on /b - onBeforeRouteUpdate SHOULD be triggered
    // BUG: The guard was registered with /a's record, not /b's record
    // So when /b updates, the guard is not called
    await router.push('/b?page=2')
    expect(spy).toHaveBeenCalledTimes(1)

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
