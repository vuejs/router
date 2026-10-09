/**
 * @vitest-environment happy-dom
 */
import {
  createVaporApp,
  defineComponent,
  defineVaporComponent,
  h,
  inject,
  nextTick,
  onActivated,
  onMounted,
  ref,
  unref,
  VaporKeepAlive,
  VaporTransition,
  vaporInteropPlugin,
  type VaporComponent,
} from 'vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createMemoryHistory, createRouter, useRoute } from '../src'
import type { NavigationGuardWithThis, RouteRecordRaw } from '../src'
import { onBeforeRouteLeave, onBeforeRouteUpdate } from '../src'
import { VaporRouterLink, VaporRouterView } from '../src/vapor'
import { viewDepthKey } from '../src/injectionSymbols'
import { onRouteRendered } from '../src/experimental/on-route-rendered'
import { compileVapor } from './vapor'

let events: string[] = []
let host: HTMLElement
let unmount: (() => void) | undefined

beforeEach(() => {
  events = []
  host = document.createElement('div')
  document.body.appendChild(host)
})
afterEach(() => {
  unmount?.()
  unmount = undefined
  host.remove()
})

const dom = () => host.textContent?.trim()

// records the navigations displayed by the closest RouterView
function trackNavigations() {
  const depth = unref(inject(viewDepthKey, 0)) - 1
  onRouteRendered(to => {
    events.push(`settled:${depth}:${to.fullPath} dom="${dom()}"`)
  })
}

function page(
  name: string,
  template = `<p>${name} {{ route.fullPath }}</p>`,
  setup?: () => void
) {
  return defineVaporComponent({
    name,
    setup() {
      trackNavigations()
      onMounted(() => events.push(`mounted:${name}`))
      onActivated(() => events.push(`activated:${name}`))
      setup?.()
      return { route: useRoute(), count: ref(0) }
    },
    render: compileVapor(template),
  })
}

// page that never reads the route
const staticPage = (name: string) => page(name, `<p>${name}</p>`)

async function setup(
  routes: RouteRecordRaw[],
  rootTemplate = '<RouterView />',
  rootSetup?: () => Record<string, unknown>
) {
  routes.push({ path: '/__start', component: page('START') })
  const history = createMemoryHistory()
  // avoid the warning about no match found
  history.replace('/__start')
  const router = createRouter({ history, routes })
  const app = createVaporApp(
    defineVaporComponent({
      setup: rootSetup,
      render: compileVapor(rootTemplate),
    })
  )
  app.use(router)
  app.component('RouterView', VaporRouterView)
  app.component('RouterLink', VaporRouterLink)
  app.component('KeepAlive', VaporKeepAlive)
  app.component('Transition', VaporTransition as any)
  await router.isReady()
  app.mount(host)
  unmount = () => app.unmount()
  // let START settle
  await nextTick()
  await nextTick()
  const go = async (to: string) => {
    events = []
    await router.push(to).catch(() => {})
    await nextTick()
    await nextTick()
  }
  return { router, app, go }
}

const record = (router: ReturnType<typeof createRouter>, path: string) =>
  router.getRoutes().find(r => r.path === path)!

describe('Vapor router', () => {
  it('does not register the VDOM components in Vapor apps', async () => {
    const router = createRouter({ history: createMemoryHistory(), routes: [] })
    const app = createVaporApp({})
    app.use(router)
    expect(app.component('RouterView')).toBeUndefined()
    expect(app.component('RouterLink')).toBeUndefined()
  })

  it('renders nested views and navigates with links', async () => {
    const Parent = page(
      'Parent',
      `<RouterLink to="/p/a">to a</RouterLink><RouterLink to="/p/b">to b</RouterLink><RouterView />`
    )
    const { router } = await setup([
      {
        path: '/p',
        component: Parent,
        children: [
          { path: 'a', component: staticPage('A') },
          { path: 'b', component: staticPage('B') },
        ],
      },
    ])
    await router.push('/p/a')
    await nextTick()
    expect(dom()).toBe('to ato bA')
    const [a, b] = host.querySelectorAll('a')
    expect(a.className).toBe('router-link-active router-link-exact-active')
    expect(a.getAttribute('aria-current')).toBe('page')
    expect(b.className).toBe('')
    b.click()
    await vi.waitFor(() => expect(dom()).toBe('to ato bB'))
    expect(router.currentRoute.value.fullPath).toBe('/p/b')
    expect(b.className).toBe('router-link-active router-link-exact-active')
  })

  it('renders VDOM route components with vaporInteropPlugin', async () => {
    const leave = vi.fn()
    const Vdom = (name: string) =>
      defineComponent({
        setup() {
          trackNavigations()
          onBeforeRouteLeave(leave)
          return () => h('p', name)
        },
      })
    const history = createMemoryHistory()
    const router = createRouter({
      history,
      routes: [
        { path: '/a', component: Vdom('A') },
        { path: '/b', component: Vdom('B') },
      ],
    })
    const app = createVaporApp(
      defineVaporComponent({ render: compileVapor('<RouterView />') })
    )
    app.use(vaporInteropPlugin).use(router)
    app.component('RouterView', VaporRouterView)
    app.mount(host)
    unmount = () => app.unmount()
    await router.push('/a')
    await nextTick()
    await nextTick()
    await router.push('/b')
    await nextTick()
    await nextTick()
    expect(dom()).toBe('B')
    expect(leave).toHaveBeenCalledTimes(1)
    expect(events).toEqual(['settled:0:/a dom="A"', 'settled:0:/b dom="B"'])
  })

  describe('guards', () => {
    it('calls in-component leave and update guards', async () => {
      const leave = vi.fn()
      const update = vi.fn()
      const User = page('User', undefined, () => {
        onBeforeRouteLeave(leave)
        onBeforeRouteUpdate(update)
      })
      const { go } = await setup([
        { path: '/u/:id', component: User },
        { path: '/other', component: staticPage('Other') },
      ])
      await go('/u/1')
      await go('/u/2')
      expect(update).toHaveBeenCalledTimes(1)
      expect(leave).toHaveBeenCalledTimes(0)
      await go('/other')
      expect(leave).toHaveBeenCalledTimes(1)
      // removed once unmounted
      await go('/u/3')
      await go('/other')
      expect(leave).toHaveBeenCalledTimes(2)
      expect(update).toHaveBeenCalledTimes(1)
    })

    it('can cancel a navigation from a leave guard', async () => {
      const Page = page('A', undefined, () => onBeforeRouteLeave(() => false))
      const { go, router } = await setup([
        { path: '/a', component: Page },
        { path: '/b', component: staticPage('B') },
      ])
      await go('/a')
      await go('/b')
      expect(router.currentRoute.value.fullPath).toBe('/a')
      expect(dom()).toBe('A /a')
    })

    it('calls beforeRouteEnter next callbacks with the instance', async () => {
      const spy = vi.fn()
      const Page = defineVaporComponent({
        setup: (_props, { expose }) => {
          expose({ msg: 'hi' })
        },
        render: compileVapor('<p>A</p>'),
        beforeRouteEnter: ((_to, _from, next) => {
          next(vm => spy((vm as any).msg))
        }) satisfies NavigationGuardWithThis<undefined>,
      } as VaporComponent)
      const { go } = await setup([{ path: '/a', component: Page }])
      await go('/a')
      expect(spy).toHaveBeenCalledTimes(1)
      expect(spy).toHaveBeenCalledWith('hi')
    })

    it('calls beforeRouteUpdate component options', async () => {
      const spy = vi.fn()
      const Page = defineVaporComponent({
        render: compileVapor('<p>A</p>'),
        beforeRouteUpdate: spy,
      } as VaporComponent)
      const { go } = await setup([{ path: '/u/:id', component: Page }])
      await go('/u/1')
      await go('/u/2')
      expect(spy).toHaveBeenCalledTimes(1)
    })

    it('releases the instance of unmounted views', async () => {
      const { go, router } = await setup([
        { path: '/a', component: staticPage('A') },
        { path: '/b', component: staticPage('B') },
      ])
      await go('/a')
      expect(record(router, '/a').instances.default).toBeTruthy()
      await go('/b')
      expect(record(router, '/a').instances.default).toBeNull()
      expect(record(router, '/b').instances.default).toBeTruthy()
    })
  })

  describe('v-slot', () => {
    it('creates the view once when Component is read several times', async () => {
      const leave = vi.fn()
      let setups = 0
      const A = page('A', undefined, () => {
        setups++
        onBeforeRouteLeave(leave)
      })
      const { go } = await setup(
        [
          { path: '/a', component: A },
          { path: '/b', component: staticPage('B') },
        ],
        `<RouterView v-slot="{ Component }">
          <component v-if="Component" :is="Component" />
        </RouterView>`
      )
      await go('/a')
      expect(dom()).toBe('A /a')
      expect(setups).toBe(1)
      await go('/b')
      expect(leave).toHaveBeenCalledTimes(1)
      await go('/a')
      await go('/b')
      expect(leave).toHaveBeenCalledTimes(2)
      expect(setups).toBe(2)
    })

    it('Component is undefined without a match', async () => {
      await setup(
        [],
        `<RouterView v-slot="{ Component }">
          <component v-if="Component" :is="Component" />
          <p v-else>none</p>
        </RouterView>`
      )
      // START is at a nested depth
      expect(dom()).toBe('START /__start')
    })

    it('keeps views alive', async () => {
      const Counter = page(
        'Counter',
        `<button @click="count++">{{ count }}</button>`
      )
      const { go } = await setup(
        [
          { path: '/c', component: Counter },
          { path: '/b', component: staticPage('B') },
        ],
        `<RouterView v-slot="{ Component }">
          <KeepAlive><component :is="Component" /></KeepAlive>
        </RouterView>`
      )
      await go('/c')
      host.querySelector('button')!.click()
      await nextTick()
      expect(dom()).toBe('1')
      await go('/b')
      await go('/c')
      expect(dom()).toBe('1')
      expect(events).toContain('activated:Counter')
      expect(events).not.toContain('mounted:Counter')
    })

    it('exposes the view through a template ref', async () => {
      const Page = defineVaporComponent({
        setup: (_props, { expose }) => expose({ msg: 'hi' }),
        render: compileVapor('<p>A</p>'),
      })
      const view = ref()
      const { go } = await setup(
        [{ path: '/a', component: Page }],
        `<RouterView v-slot="{ Component }">
          <component :is="Component" ref="view" />
        </RouterView>`,
        () => ({ view })
      )
      await go('/a')
      expect(view.value.msg).toBe('hi')
    })
  })

  describe('onRouteRendered', () => {
    it('initial navigation', async () => {
      const { go } = await setup([{ path: '/a', component: page('A') }])
      await go('/a')
      expect(events).toEqual(['mounted:A', 'settled:0:/a dom="A /a"'])
    })

    it('when mounted after the initial navigation', async () => {
      const history = createMemoryHistory()
      history.replace('/a')
      const router = createRouter({
        history,
        routes: [{ path: '/a', component: page('A') }],
      })
      const app = createVaporApp(
        defineVaporComponent({ render: compileVapor('<RouterView />') })
      )
      app.use(router)
      app.component('RouterView', VaporRouterView)
      await router.isReady()
      app.mount(host)
      unmount = () => app.unmount()
      await nextTick()
      expect(events).toEqual(['mounted:A', 'settled:0:/a dom="A /a"'])
    })

    it('component not reused', async () => {
      const { go } = await setup([
        { path: '/a', component: page('A') },
        { path: '/b', component: page('B') },
      ])
      await go('/a')
      await go('/b')
      expect(events).toEqual(['mounted:B', 'settled:0:/b dom="B /b"'])
    })

    it('component reused with params', async () => {
      const { go } = await setup([{ path: '/u/:id', component: page('U') }])
      await go('/u/1')
      await go('/u/2')
      expect(events).toEqual(['settled:0:/u/2 dom="U /u/2"'])
    })

    it('same component on different records', async () => {
      const Shared = page('S')
      const { go } = await setup([
        { path: '/x', component: Shared },
        { path: '/y', component: Shared },
      ])
      await go('/x')
      await go('/y')
      expect(events).toEqual(['settled:0:/y dom="S /y"'])
    })

    it('page that does not read the route (query change)', async () => {
      const { go } = await setup([{ path: '/s', component: staticPage('S') }])
      await go('/s')
      await go('/s?q=1')
      expect(events).toEqual(['settled:0:/s?q=1 dom="S"'])
    })

    it('component keyed by path', async () => {
      const { go } = await setup(
        [{ path: '/u/:id', component: page('U') }],
        `<RouterView v-slot="{ Component, route }">
          <component :is="Component" :key="route.path" />
        </RouterView>`
      )
      await go('/u/1')
      await go('/u/2')
      expect(events).toEqual(['mounted:U', 'settled:0:/u/2 dom="U /u/2"'])
    })

    it('does not log unrelated re-renders', async () => {
      const Counter = page(
        'Counter',
        `<button @click="count++">{{ count }}</button>`
      )
      const { go } = await setup([{ path: '/c', component: Counter }])
      await go('/c')
      events = []
      host.querySelector('button')!.click()
      await nextTick()
      await nextTick()
      expect(dom()).toBe('1')
      expect(events).toEqual([])
    })

    it('nested views', async () => {
      const { go } = await setup([
        {
          path: '/p',
          component: page('P', '<p>P</p><RouterView />'),
          children: [
            { path: 'a', component: page('A') },
            { path: 'b', component: page('B') },
          ],
        },
      ])
      await go('/p/a')
      expect(events).toEqual([
        'mounted:A',
        'mounted:P',
        'settled:0:/p/a dom="PA /p/a"',
        'settled:1:/p/a dom="PA /p/a"',
      ])
      await go('/p/b')
      expect(events).toEqual([
        'mounted:B',
        'settled:0:/p/b dom="PB /p/b"',
        'settled:1:/p/b dom="PB /p/b"',
      ])
    })

    it('named views', async () => {
      const { go } = await setup(
        [
          {
            path: '/n',
            components: { default: page('D'), aside: page('Aside') },
          },
        ],
        '<RouterView /><RouterView name="aside" />'
      )
      await go('/n')
      expect(events).toEqual([
        'mounted:D',
        'mounted:Aside',
        'settled:0:/n dom="D /nAside /n"',
        'settled:0:/n dom="D /nAside /n"',
      ])
    })

    it('KeepAlive activation', async () => {
      const { go } = await setup(
        [
          { path: '/a', component: page('A') },
          { path: '/b', component: page('B') },
        ],
        `<RouterView v-slot="{ Component }">
          <KeepAlive><component :is="Component" /></KeepAlive>
        </RouterView>`
      )
      await go('/a')
      await go('/b')
      await go('/a')
      expect(events).toEqual(['activated:A', 'settled:0:/a dom="A /a"'])
    })

    it('ignores failed navigations', async () => {
      const { go, router } = await setup([
        { path: '/a', component: page('A') },
        { path: '/b', component: page('B'), beforeEnter: () => false },
      ])
      await go('/a')
      await go('/b')
      expect(router.currentRoute.value.fullPath).toBe('/a')
      expect(events).toEqual([])
    })

    it('passes the previously displayed route of the view', async () => {
      const spy = vi.fn()
      const A = page('A', undefined, () =>
        onRouteRendered((to, from) => spy(to.fullPath, from.fullPath))
      )
      const { go } = await setup([{ path: '/a/:id', component: A }])
      await go('/a/1')
      await go('/a/2')
      expect(spy.mock.calls).toEqual([
        ['/a/1', '/__start'],
        ['/a/2', '/a/1'],
      ])
    })

    it('Transition out-in', async () => {
      const { go } = await setup(
        [
          { path: '/a', component: page('A') },
          { path: '/b', component: page('B') },
        ],
        `<RouterView v-slot="{ Component }">
          <Transition mode="out-in"><component :is="Component" /></Transition>
        </RouterView>`
      )
      await go('/a')
      await vi.waitFor(() => expect(dom()).toBe('A /a'))
      await go('/b')
      await vi.waitFor(() =>
        expect(events).toEqual(['mounted:B', 'settled:0:/b dom="B /b"'])
      )
    })

    it('Transition out-in + KeepAlive', async () => {
      const { go } = await setup(
        [
          { path: '/a', component: page('A') },
          { path: '/b', component: page('B') },
        ],
        `<RouterView v-slot="{ Component }">
          <Transition mode="out-in">
            <KeepAlive><component :is="Component" /></KeepAlive>
          </Transition>
        </RouterView>`
      )
      await go('/a')
      await vi.waitFor(() => expect(dom()).toBe('A /a'))
      await go('/b')
      await vi.waitFor(() => expect(dom()).toBe('B /b'))
      await go('/a')
      await vi.waitFor(() =>
        expect(events).toEqual(['activated:A', 'settled:0:/a dom="A /a"'])
      )
    })
  })
})
