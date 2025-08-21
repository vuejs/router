/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi } from 'vitest'

describe('RouterView – HMR (Options API)', () => {
  it('Registers the instance on re-mount → nextTick via onVnodeMounted, even if watch(post) is blocked', async () => {
    // 1) Reset modules and prepare hoisted state to track blocked post-watch registrations
    vi.resetModules()
    const hoisted = vi.hoisted(() => ({ blockedPostWatchCalls: 0 }))

    // 2) Mock `vue`: block only watch({ flush: "post" }), delegate all others to the real implementation
    vi.doMock('vue', async () => {
      const actual = await vi.importActual<typeof import('vue')>('vue')
      return {
        ...actual,
        watch: (source: any, cb: any, options: any) => {
          if (options?.flush === 'post') {
            hoisted.blockedPostWatchCalls++
            return { stop() {} } as any // completely suppress post-watch callbacks
          }
          return (actual as any).watch(source, cb, options)
        },
      }
    })

    // 3) Dynamic import (after mocking is applied!)
    const { defineComponent, h, ref, nextTick } = await import('vue')
    const { mount } = await import('@vue/test-utils')

    // 4) Import router/RouterView and enable HMR flag
    ;(globalThis as any).__DEV__ = true
    ;(import.meta as any).hot = {}
    const { createRouter, createMemoryHistory, RouterView } = await import(
      '../src'
    )

    // 5) Define test component & router
    const beforeUpdateSpy = vi.fn()
    const OptComp = {
      template: `<div>Opt</div>`,
      beforeRouteUpdate(to: any) {
        beforeUpdateSpy(to.params.id)
      },
    }

    const router = createRouter({
      history: createMemoryHistory(),
      routes: [{ path: '/temp/:id', components: { default: OptComp } }],
    })

    const rvKey = ref(0)
    const App = defineComponent({
      setup() {
        return () => h('div', [h(RouterView, { key: rvKey.value })])
      },
    })

    mount(App, { global: { plugins: [router] }, attachTo: document.body })
    await router.push('/temp/1')
    await router.isReady()

    // 6) Prepare to track writes to rec.instances.default
    const rec = router.currentRoute.value.matched[0]
    expect(rec).toBeTruthy()

    if (rec?.instances && 'default' in rec.instances) {
      // @ts-ignore
      rec.instances.default = null
    }

    const desc = Object.getOwnPropertyDescriptor(rec.instances, 'default')
    let stored: any
    let preWrites = 0
    let postWrites = 0
    let phase: 'pre' | 'post' = 'pre'

    Object.defineProperty(rec.instances, 'default', {
      configurable: true,
      get() {
        return stored
      },
      set(v) {
        stored = v
        if (phase === 'pre') {
          preWrites++
        } else {
          postWrites++
        }
      },
    })

    // 7) Re-mount → onVnodeMounted hasn’t fired yet in the same tick
    rvKey.value++
    expect(preWrites).toBe(0)

    // 8) Next tick: onVnodeMounted should register the instance (post-watch is blocked)
    await nextTick()
    expect(preWrites).toBeGreaterThanOrEqual(1) // recorded via pre-registration only
    expect(Boolean(stored)).toBe(true)

    // 9) Navigation → post-watch is blocked, so postWrites must remain 0
    phase = 'post'
    const navDone = new Promise<void>(resolve => {
      const remove = router.afterEach(() => {
        remove()
        resolve()
      })
    })
    router.push('/temp/2')
    await navDone

    expect(postWrites).toBe(0) // no post-watch writes
    expect(hoisted.blockedPostWatchCalls).toBeGreaterThanOrEqual(1) // attempted to register post-watch
    expect(beforeUpdateSpy).toHaveBeenCalledWith('2') // hook still works

    // 10) Restore original property & unmock
    if (desc) Object.defineProperty(rec.instances, 'default', desc)
    else delete (rec.instances as any).default
    ;(rec.instances as any).default = stored
    vi.doUnmock('vue')
  })
})
