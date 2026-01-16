/**
 * @vitest-environment jsdom
 */
import {
  createRouter,
  createMemoryHistory,
  onBeforeRouteLeave,
  RouteRecordRaw,
} from '../../src'
import { createApp, defineComponent } from 'vue'
import { mount } from '@vue/test-utils'
import { vi, describe, expect, it } from 'vitest'

const component = {
  template: '<div>Generic</div>',
}

describe('onBeforeRouteLeave', () => {
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
        onBeforeRouteLeave(spy)
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

    const routes: RouteRecordRaw[] = [
      { path: '/', component },
      { path: '/a', component: SharedComponent },
      { path: '/a/:id', component: DetailComponent },
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

    // Step 1: Navigate to /a - component mounts and registers guard with /a's record
    await router.push('/a')
    await router.isReady()
    expect(spy).not.toHaveBeenCalled()
    expect(mountCount).toBe(1)
    expect(activatedCount).toBe(1)

    // Step 2: Navigate to /a/123 - SharedComponent is deactivated (kept alive)
    // Leave guard is called when leaving /a
    await router.push('/a/123')
    expect(deactivatedCount).toBe(1)
    expect(spy).toHaveBeenCalledTimes(1) // called when leaving /a

    // Step 3: Navigate to /b - SharedComponent is reactivated for a DIFFERENT route
    // The guard should be re-registered with /b's record
    await router.push('/b')
    expect(activatedCount).toBe(2)
    expect(mountCount).toBe(1) // still only mounted once (kept alive)

    // Step 4: Leave /b - onBeforeRouteLeave SHOULD be triggered
    // BUG (before fix): The guard was registered with /a's record, not /b's record
    // So leaving /b would not trigger the guard
    await router.push('/')
    expect(spy).toHaveBeenCalledTimes(2) // called again when leaving /b

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
