/**
 * @vitest-environment happy-dom
 */
import {
  createRouter,
  createMemoryHistory,
  onBeforeRouteLeave,
  type RouteRecordRaw,
} from '../../src'
import { createApp, defineComponent, onActivated, onDeactivated } from 'vue'
import { mount } from '@vue/test-utils'
import { vi, describe, expect, it } from 'vitest'

const component = {
  template: '<div>Generic</div>',
}

describe('onBeforeRouteLeave', () => {
  it('triggers when shared KeepAlive component is reactivated for a different route', async () => {
    const routeLeaveSpy = vi.fn()
    const activatedSpy = vi.fn()
    const deactivatedSpy = vi.fn()
    const setupSpy = vi.fn(() => {
      onBeforeRouteLeave(routeLeaveSpy)
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

    const routes: RouteRecordRaw[] = [
      { path: '/', component },
      { path: '/a', component: SharedComponent },
      { path: '/other', component: DetailComponent },
      { path: '/b', component: SharedComponent },
    ]

    const router = createRouter({
      history: createMemoryHistory(),
      routes,
    })

    const wrapper = mount(
      {
        template: `
          <router-view v-slot="{ Component }">
            <keep-alive>
              <component :is="Component" />
            </keep-alive>
          </router-view>
        `,
      },
      {
        global: {
          plugins: [router],
        },
      }
    )
    await router.isReady()

    // Step 1: Navigate to /a - component mounts and registers guard with /a's record
    await router.push('/a')
    expect(routeLeaveSpy).not.toHaveBeenCalled()
    expect(setupSpy).toHaveBeenCalledTimes(1)
    expect(activatedSpy).toHaveBeenCalledTimes(1)

    // Step 2: Navigate to another route so SharedComponent is deactivated (kept alive)
    // Leave guard is called when leaving /a
    await router.push('/other')
    expect(deactivatedSpy).toHaveBeenCalledTimes(1)
    expect(routeLeaveSpy).toHaveBeenCalledTimes(1) // called when leaving /a

    // Step 3: Navigate to /b - SharedComponent is reactivated for a DIFFERENT route
    // The guard should be re-registered with /b's record
    await router.push('/b')
    expect(activatedSpy).toHaveBeenCalledTimes(2)
    expect(setupSpy).toHaveBeenCalledTimes(1) // still only mounted once (kept alive)

    // Step 4: Leave /b - onBeforeRouteLeave SHOULD be triggered
    // BUG (before fix): The guard was registered with /a's record, not /b's record
    // So leaving /b would not trigger the guard
    await router.push('/')
    expect(routeLeaveSpy).toHaveBeenCalledTimes(2) // called again when leaving /b

    wrapper.unmount()
  })

  it('removes guards when leaving the route', async () => {
    const spy = vi.fn()
    const WithLeave = defineComponent({
      template: `text`,
      setup() {
        onBeforeRouteLeave(spy)
      },
    })

    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/', component },
        { path: '/leave', component: WithLeave as any },
      ],
    })
    const app = createApp({
      template: `
      <router-view />
      `,
    })
    app.use(router)
    const rootEl = document.createElement('div')
    document.body.appendChild(rootEl)
    app.mount(rootEl)

    await router.isReady()
    await router.push('/leave')
    await router.push('/')
    expect(spy).toHaveBeenCalledTimes(1)
    await router.push('/leave')
    await router.push('/')
    expect(spy).toHaveBeenCalledTimes(2)
  })
})
