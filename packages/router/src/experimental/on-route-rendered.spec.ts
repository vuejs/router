/**
 * @vitest-environment happy-dom
 */
import { enableAutoUnmount, flushPromises, mount } from '@vue/test-utils'
import {
  defineComponent,
  h,
  inject,
  onActivated,
  onMounted,
  onUpdated,
  ref,
  unref,
} from 'vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createMemoryHistory } from '../history/memory'
import { RouterView } from '../RouterView'
import { createRouter } from '../router'
import type { RouteRecordRaw } from '../types'
import { viewDepthKey } from '../injectionSymbols'
import { onRouteRendered } from './on-route-rendered'

let events: string[] = []

beforeEach(() => {
  events = []
})
enableAutoUnmount(afterEach)

const dom = () => document.body.textContent?.trim()

// records the navigations displayed by the closest RouterView
function trackNavigations() {
  const depth = unref(inject(viewDepthKey, 0)) - 1
  onRouteRendered(to => {
    events.push(`settled:${depth}:${to.fullPath} dom="${dom()}"`)
  })
}

function page(name: string, template = `<p>${name} {{ $route.fullPath }}</p>`) {
  return defineComponent({
    name,
    setup() {
      trackNavigations()
      onMounted(() => events.push(`mounted:${name}`))
      onUpdated(() => events.push(`updated:${name}`))
      onActivated(() => events.push(`activated:${name}`))
    },
    template,
  })
}

// page that never reads the route
function staticPage(name: string) {
  return page(name, `<p>${name}</p>`)
}

async function setup(
  routes: RouteRecordRaw[],
  rootTemplate = '<RouterView />'
) {
  routes.push({
    path: '/__start',
    component: page('START'),
  })
  const history = createMemoryHistory()
  // avoid the warning about no match found
  history.replace('/__start')
  const router = createRouter({ history, routes })
  const Root = defineComponent({
    components: { RouterView },
    template: rootTemplate,
  })
  const wrapper = mount(Root, {
    attachTo: document.body,
    global: { plugins: [router], stubs: { transition: false } },
  })
  const go = async (to: string) => {
    events = []
    await router.push(to)
    await flushPromises()
  }
  return { router, wrapper, go }
}

const frames = () => new Promise(resolve => setTimeout(resolve, 100))

describe('onRouteRendered', () => {
  it('initial navigation', async () => {
    const { go } = await setup([{ path: '/a', component: page('A') }])
    await go('/a')
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
    expect(events).toEqual(['updated:U', 'settled:0:/u/2 dom="U /u/2"'])
  })

  it('same component on different records', async () => {
    const Shared = page('S')
    const { go } = await setup([
      { path: '/x', component: Shared },
      { path: '/y', component: Shared },
    ])
    await go('/x')
    await go('/y')
    expect(events).toEqual(['updated:S', 'settled:0:/y dom="S /y"'])
  })

  it('page that does not read the route (query change)', async () => {
    const { go } = await setup([{ path: '/s', component: staticPage('S') }])
    await go('/s')
    await go('/s?q=1')
    expect(events).toEqual(['updated:S', 'settled:0:/s?q=1 dom="S"'])
  })

  it('page that does not read the route (hash change)', async () => {
    const { go } = await setup([{ path: '/s', component: staticPage('S') }])
    await go('/s')
    await go('/s#top')
    expect(events).toEqual(['updated:S', 'settled:0:/s#top dom="S"'])
  })

  it('reused page with query and hash changes', async () => {
    const { go } = await setup([{ path: '/u/:id', component: page('U') }])
    await go('/u/1')
    await go('/u/1?tab=posts')
    expect(events).toEqual([
      'updated:U',
      'settled:0:/u/1?tab=posts dom="U /u/1?tab=posts"',
    ])
    await go('/u/1?tab=posts#bio')
    expect(events).toEqual([
      'updated:U',
      'settled:0:/u/1?tab=posts#bio dom="U /u/1?tab=posts#bio"',
    ])
    await go('/u/1#links')
    expect(events).toEqual([
      'updated:U',
      'settled:0:/u/1#links dom="U /u/1#links"',
    ])
  })

  it('nested views with query and hash changes', async () => {
    const { go } = await setup([
      {
        path: '/p',
        // neither page reads the route
        component: page('P', '<div>P <RouterView /></div>'),
        children: [{ path: 'a', component: staticPage('CA') }],
      },
    ])
    await go('/p/a')
    await go('/p/a?q=1')
    expect(events).toEqual([
      'updated:P',
      'updated:CA',
      'settled:0:/p/a?q=1 dom="P CA"',
      'settled:1:/p/a?q=1 dom="P CA"',
    ])
    await go('/p/a?q=1#bio')
    expect(events).toEqual([
      'updated:P',
      'updated:CA',
      'settled:0:/p/a?q=1#bio dom="P CA"',
      'settled:1:/p/a?q=1#bio dom="P CA"',
    ])
  })

  it('component reused by key', async () => {
    const { go } = await setup(
      [{ path: '/u/:id', component: page('U') }],
      `<RouterView v-slot="{ Component, route }">
        <component :is="Component" :key="route.fullPath" />
      </RouterView>`
    )
    await go('/u/1')
    await go('/u/2')
    expect(events).toEqual(['mounted:U', 'settled:0:/u/2 dom="U /u/2"'])
  })

  it('component keyed by path', async () => {
    const { go } = await setup(
      [{ path: '/u/:id', component: page('U') }],
      `<RouterView v-slot="{ Component, route }">
        <component :is="Component" :key="route.path" />
      </RouterView>`
    )
    await go('/u/1')
    // new key: new instance
    await go('/u/2')
    expect(events).toEqual(['mounted:U', 'settled:0:/u/2 dom="U /u/2"'])
    // same key: reused instance
    await go('/u/2?q=1')
    expect(events).toEqual(['updated:U', 'settled:0:/u/2?q=1 dom="U /u/2?q=1"'])
    await go('/u/2?q=1#bio')
    expect(events).toEqual([
      'updated:U',
      'settled:0:/u/2?q=1#bio dom="U /u/2?q=1#bio"',
    ])
    await go('/u/1#bio')
    expect(events).toEqual(['mounted:U', 'settled:0:/u/1#bio dom="U /u/1#bio"'])
  })

  it('component keyed by path with Transition out-in', async () => {
    const { go } = await setup(
      [{ path: '/u/:id', component: page('U') }],
      `<RouterView v-slot="{ Component, route }">
        <Transition mode="out-in">
          <component :is="Component" :key="route.path" />
        </Transition>
      </RouterView>`
    )
    await go('/u/1')
    await frames()
    await go('/u/2')
    // the old instance is leaving
    expect(events).toEqual([])
    await frames()
    expect(events).toEqual(['mounted:U', 'settled:0:/u/2 dom="U /u/2"'])
    // same key: no transition
    await go('/u/2?q=1')
    expect(events).toEqual(['updated:U', 'settled:0:/u/2?q=1 dom="U /u/2?q=1"'])
  })

  it('does not log unrelated re-renders', async () => {
    const count = ref(0)
    const Counter = defineComponent({
      setup() {
        trackNavigations()
        return () => h('p', `count ${count.value}`)
      },
    })
    const { go } = await setup([{ path: '/c', component: Counter }])
    await go('/c')
    events = []
    count.value++
    await flushPromises()
    expect(events).toEqual([])
  })

  it('nested views', async () => {
    const { go } = await setup([
      {
        path: '/p',
        component: page('P', '<div>P <RouterView /></div>'),
        children: [
          { path: 'a', component: page('CA') },
          { path: 'b', component: page('CB') },
        ],
      },
    ])
    await go('/p/a')
    expect(events).toEqual([
      'mounted:CA',
      'mounted:P',
      'settled:1:/p/a dom="P CA /p/a"',
      'settled:0:/p/a dom="P CA /p/a"',
    ])
    await go('/p/b')
    expect(events).toEqual([
      'updated:P',
      'mounted:CB',
      'settled:0:/p/b dom="P CB /p/b"',
      'settled:1:/p/b dom="P CB /p/b"',
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
    expect(events).toEqual([
      'updated:A',
      'activated:A',
      'updated:B',
      'settled:0:/a dom="A /a"',
    ])
  })

  it('Transition out-in', async () => {
    const { go } = await setup(
      [
        { path: '/a', component: page('A') },
        { path: '/b', component: page('B') },
      ],
      `<RouterView v-slot="{ Component }">
        <Transition name="fade" mode="out-in"><component :is="Component" /></Transition>
      </RouterView>`
    )
    await go('/a')
    await frames()
    await go('/b')
    expect(events).toEqual([])
    await frames()
    expect(events).toEqual(['mounted:B', 'settled:0:/b dom="B /b"'])
  })

  it('Suspense with async setup', async () => {
    const { promise: pending, resolve } = Promise.withResolvers<void>()
    const Async = defineComponent({
      name: 'Async',
      async setup() {
        trackNavigations()
        onMounted(() => events.push('mounted:Async'))
        await pending
        return {}
      },
      template: '<p>Async</p>',
    })
    const { go } = await setup(
      [
        { path: '/a', component: page('A') },
        { path: '/async', component: Async },
      ],
      `<RouterView v-slot="{ Component }">
        <Suspense><component :is="Component" /></Suspense>
      </RouterView>`
    )
    await go('/a')
    await go('/async')
    expect(events).toEqual([])
    resolve()
    await flushPromises()
    expect(events).toEqual([
      'updated:A',
      'mounted:Async',
      'settled:0:/async dom="Async"',
    ])
  })

  it('reports a navigation once after a descendant Suspense resolves', async () => {
    const { promise: pending, resolve } = Promise.withResolvers<void>()
    const rendered = vi.fn()
    const Async = defineComponent({
      async setup() {
        onRouteRendered(rendered)
        await pending
        return () => h('p', 'Async')
      },
    })
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/a', component: Async },
        { path: '/b', component: Async },
      ],
    })
    await router.push('/a')
    await router.isReady()
    const Root = defineComponent({
      components: { RouterView },
      template:
        '<RouterView v-slot="{ Component }"><Suspense><component :is="Component" /></Suspense></RouterView>',
    })
    const wrapper = mount(Root, { global: { plugins: [router] } })
    await flushPromises()
    await router.push('/b')
    await flushPromises()
    expect(rendered).not.toHaveBeenCalled()

    resolve()
    await flushPromises()
    expect(wrapper.text()).toBe('Async')
    expect(rendered).toHaveBeenCalledTimes(1)
    expect(rendered).toHaveBeenCalledWith(
      expect.objectContaining({ fullPath: '/b' }),
      expect.objectContaining({ fullPath: '/' })
    )
  })

  it('Suspense keyed async component keeps the old branch', async () => {
    const pending: Array<PromiseWithResolvers<void>> = []
    const Async = defineComponent({
      name: 'Async',
      async setup() {
        const trigger = ref(0)
        trackNavigations()
        onMounted(() => events.push('mounted:Async'))
        onUpdated(() => events.push('updated:Async'))
        const deferred = Promise.withResolvers<void>()
        pending.push(deferred)
        await deferred.promise
        return { trigger }
      },
      template:
        '<p>Async {{ $route.fullPath }} <button @click="trigger++">{{ trigger }}</button></p>',
    })
    const { go, wrapper } = await setup(
      [{ path: '/async/:id', component: Async }],
      `<RouterView v-slot="{ Component, route }">
        <Suspense><component :is="Component" :key="route.fullPath" /></Suspense>
      </RouterView>`
    )
    const first = go('/async/1')
    await flushPromises()
    pending.shift()!.resolve()
    await first
    await flushPromises()
    await go('/async/2')
    // the old branch re-renders while the new one is pending, its post hooks
    // are deferred until Suspense resolves
    await wrapper.get('button').trigger('click')
    expect(wrapper.text()).toBe('Async /async/2 1')
    expect(events).toEqual([])
    pending.shift()!.resolve()
    await flushPromises()
    expect(events).toEqual([
      'updated:Async',
      'mounted:Async',
      'settled:0:/async/2 dom="Async /async/2 0"',
    ])
  })

  it('KeepAlive + Transition + Suspense', async () => {
    const { go } = await setup(
      [
        { path: '/a', component: page('A') },
        { path: '/b', component: page('B') },
      ],
      `<RouterView v-slot="{ Component }">
        <Transition mode="out-in">
          <KeepAlive>
            <Suspense><component :is="Component" /></Suspense>
          </KeepAlive>
        </Transition>
      </RouterView>`
    )
    await go('/a')
    await frames()
    await go('/b')
    await frames()
    expect(events).toEqual([
      'updated:A',
      'mounted:B',
      'activated:B',
      'settled:0:/b dom="B /b"',
    ])
    await go('/a')
    await frames()
    expect(events).toEqual([
      'activated:A',
      'updated:B',
      'updated:A',
      'settled:0:/a dom="A /a"',
    ])
  })

  it('Transition out-in + KeepAlive + Suspense with a new async page', async () => {
    const { promise: pending, resolve } = Promise.withResolvers<void>()
    const Async = defineComponent({
      name: 'Async',
      async setup() {
        trackNavigations()
        onMounted(() => events.push('mounted:Async'))
        await pending
        return {}
      },
      template: '<p>Async</p>',
    })
    const { go } = await setup(
      [
        { path: '/a', component: page('A') },
        { path: '/async', component: Async },
      ],
      `<RouterView v-slot="{ Component }">
        <Transition mode="out-in">
          <KeepAlive>
            <Suspense><component :is="Component" /></Suspense>
          </KeepAlive>
        </Transition>
      </RouterView>`
    )
    await go('/a')
    await frames()
    await go('/async')
    await frames()
    // A's update hooks are deferred by the pending Suspense
    expect(events).toEqual([])
    resolve()
    await flushPromises()
    await frames()
    expect(events).toEqual([
      'updated:A',
      'mounted:Async',
      'settled:0:/async dom="Async"',
    ])
  })

  it('Transition default mode', async () => {
    const { go } = await setup(
      [
        { path: '/a', component: page('A') },
        { path: '/b', component: page('B') },
      ],
      `<RouterView v-slot="{ Component }">
        <Transition><component :is="Component" /></Transition>
      </RouterView>`
    )
    await go('/a')
    await frames()
    await go('/b')
    // both pages are in the DOM while A leaves
    expect(events).toEqual(['mounted:B', 'settled:0:/b dom="A /aB /b"'])
  })

  it('named views', async () => {
    const Side = page('SA')
    const { go } = await setup(
      [
        { path: '/a', components: { default: page('A'), side: Side } },
        { path: '/b', components: { default: page('B'), side: Side } },
      ],
      '<RouterView /><RouterView name="side" />'
    )
    await go('/a')
    await go('/b')
    expect(events).toEqual([
      'mounted:B',
      'updated:SA',
      'settled:0:/b dom="B /bSA /b"',
      'settled:0:/b dom="B /bSA /b"',
    ])
  })

  it('lazy loaded route component', async () => {
    const { go } = await setup([
      { path: '/a', component: page('A') },
      { path: '/lazy', component: () => Promise.resolve(page('Lazy')) },
    ])
    await go('/a')
    await go('/lazy')
    expect(events).toEqual(['mounted:Lazy', 'settled:0:/lazy dom="Lazy /lazy"'])
  })

  it('works when the app is mounted in a detached element', async () => {
    const history = createMemoryHistory()
    history.replace('/__start')
    const router = createRouter({
      history,
      routes: [
        { path: '/__start', component: page('START') },
        { path: '/a', component: page('A') },
        { path: '/b', component: page('B') },
      ],
    })
    mount(RouterView, { global: { plugins: [router] } })
    await router.push('/a')
    await router.push('/b')
    await flushPromises()
    expect(events.filter(event => event.startsWith('settled'))).toHaveLength(2)
  })

  it('uses afterEach outside of any RouterView', async () => {
    const Root = defineComponent({
      components: { RouterView },
      setup() {
        onRouteRendered((to, from) => {
          events.push(`root:${from.fullPath}->${to.fullPath} dom="${dom()}"`)
        })
      },
      template: '<RouterView />',
    })
    const history = createMemoryHistory()
    history.replace('/__start')
    const router = createRouter({
      history,
      routes: [
        { path: '/__start', component: page('START') },
        { path: '/a', component: page('A') },
        { path: '/b', component: page('B') },
      ],
    })
    const wrapper = mount(Root, {
      attachTo: document.body,
      global: { plugins: [router] },
    })
    await router.push('/a')
    await flushPromises()
    events = []

    await router.push('/b')
    await flushPromises()
    // before the new route renders
    expect(events).toEqual([
      'root:/a->/b dom="A /a"',
      'mounted:B',
      'settled:0:/b dom="B /b"',
    ])

    events = []
    const removeGuard = router.beforeEach(() => false)
    await router.push('/a')
    await flushPromises()
    removeGuard()
    expect(events).toEqual([])

    wrapper.unmount()
    await router.push('/a')
    expect(events).toEqual([])
  })

  it('attaches to the closest RouterView from any descendant', async () => {
    const Deep = defineComponent({
      setup() {
        trackNavigations()
      },
      template: '<span />',
    })
    const Wrapper = defineComponent({
      components: { Deep },
      template: '<div><Deep /></div>',
    })
    const Parent = defineComponent({
      components: { RouterView, Wrapper },
      // Wrapper is outside of the nested RouterView
      template: '<div>P <Wrapper /><RouterView /></div>',
    })
    const Child = defineComponent({
      components: { Wrapper },
      template: '<p>C <Wrapper /></p>',
    })
    const { go } = await setup([
      {
        path: '/p',
        component: Parent,
        children: [
          { path: 'a', component: Child },
          { path: 'b', component: Child },
        ],
      },
    ])
    await go('/p/a')
    await go('/p/b')
    expect(events).toEqual([
      'settled:0:/p/b dom="P C"',
      'settled:1:/p/b dom="P C"',
    ])
  })

  it('passes the previously displayed route of the view', async () => {
    const Page = defineComponent({
      setup() {
        onRouteRendered((to, from) => {
          events.push(`${from.fullPath}->${to.fullPath}`)
        })
      },
      template: '<p>{{ $route.fullPath }}</p>',
    })
    const { go } = await setup([{ path: '/u/:id', component: Page }])
    // START_LOCATION on the first navigation
    await go('/u/1')
    expect(events).toEqual(['/->/u/1'])
    await go('/u/2')
    expect(events).toEqual(['/u/1->/u/2'])
  })

  it('pauses components deactivated by KeepAlive', async () => {
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
    expect(events.filter(event => event.startsWith('settled'))).toEqual([
      'settled:0:/b dom="B /b"',
    ])
    await go('/a')
    expect(events.filter(event => event.startsWith('settled'))).toEqual([
      'settled:0:/a dom="A /a"',
    ])
  })

  it('ignores failed navigations within a RouterView', async () => {
    const { go, router } = await setup([
      { path: '/a', component: page('A') },
      { path: '/b', component: page('B') },
      { path: '/u/:id', component: page('U') },
    ])
    await go('/a')
    let removeGuard = router.beforeEach(() => false)
    await go('/b')
    removeGuard()
    expect(events).toEqual([])

    await go('/u/1')
    // reused component
    removeGuard = router.beforeEach(() => false)
    await go('/u/2')
    removeGuard()
    expect(events).toEqual([])

    // duplicated navigation
    await go('/u/1')
    expect(events).toEqual([])

    await go('/u/2')
    expect(events).toEqual(['updated:U', 'settled:0:/u/2 dom="U /u/2"'])
  })

  it('calls root and view callbacks for the initial navigation when mounted after it', async () => {
    const show = ref(false)
    const Late = defineComponent({
      setup() {
        onRouteRendered(to => events.push(`late:${to.fullPath}`))
      },
      template: '<i />',
    })
    const Root = defineComponent({
      components: { RouterView, Late },
      setup() {
        onRouteRendered((to, from) => {
          events.push(`root:${from.fullPath}->${to.fullPath} dom="${dom()}"`)
        })
        return { show }
      },
      template: '<Late v-if="show" /><RouterView />',
    })
    const history = createMemoryHistory()
    history.replace('/__start')
    const router = createRouter({
      history,
      routes: [
        { path: '/__start', component: page('START') },
        { path: '/', component: page('Home') },
        { path: '/a', component: page('A') },
      ],
    })
    await router.push('/a')
    await router.isReady()

    mount(Root, { attachTo: document.body, global: { plugins: [router] } })
    await flushPromises()
    expect(events).toEqual([
      'mounted:A',
      'root:/->/a dom="A /a"',
      'settled:0:/a dom="A /a"',
    ])

    // mounted after the initial render: waits for the next navigation
    events = []
    show.value = true
    await flushPromises()
    expect(events).toEqual([])
  })

  it('calls root callbacks once for the initial navigation when mounted before it', async () => {
    const Root = defineComponent({
      components: { RouterView },
      setup() {
        onRouteRendered((to, from) => {
          events.push(`root:${from.fullPath}->${to.fullPath}`)
        })
      },
      template: '<RouterView />',
    })
    const history = createMemoryHistory()
    history.replace('/__start')
    const router = createRouter({
      history,
      routes: [
        { path: '/__start', component: page('START') },
        { path: '/a', component: page('A') },
      ],
    })
    mount(Root, { attachTo: document.body, global: { plugins: [router] } })
    await router.push('/a')
    await flushPromises()
    expect(events).toEqual([
      'root:/->/a',
      'mounted:A',
      'settled:0:/a dom="A /a"',
    ])
  })

  it('does not repeat a navigation that finishes before a suspended component mounts', async () => {
    const { promise: pending, resolve: resolvePending } =
      Promise.withResolvers<void>()
    const rendered = vi.fn()
    const Outside = defineComponent({
      setup() {
        onRouteRendered(rendered)
      },
      template: '<div>outside</div>',
    })
    const Pending = defineComponent({
      async setup() {
        await pending
        return () => h('div')
      },
    })
    const Root = defineComponent({
      components: { Outside, Pending, RouterView },
      template:
        '<div><Suspense><div><Outside /><Pending /></div></Suspense><RouterView /></div>',
    })
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/a', component: page('A') },
        { path: '/b', component: page('B') },
      ],
    })
    await router.push('/a')
    await router.isReady()

    const wrapper = mount(Root, { global: { plugins: [router] } })
    await router.push('/b')
    await flushPromises()
    expect(wrapper.text()).toContain('B /b')
    expect(rendered).toHaveBeenCalledTimes(1)

    resolvePending()
    await flushPromises()
    expect(rendered).toHaveBeenCalledTimes(1)
    expect(rendered).toHaveBeenCalledWith(
      expect.objectContaining({ fullPath: '/b' }),
      expect.objectContaining({ fullPath: '/a' })
    )
  })

  it('pauses a cached component outside of RouterView while deactivated', async () => {
    const show = ref(true)
    const rendered = vi.fn()
    const Outside = defineComponent({
      setup() {
        onRouteRendered(rendered)
      },
      template: '<p>outside</p>',
    })
    const Alternate = defineComponent({ template: '<p>alternate</p>' })
    const Root = defineComponent({
      components: { Outside, Alternate, RouterView },
      setup: () => ({ show }),
      template:
        '<div><KeepAlive><Outside v-if="show" /><Alternate v-else /></KeepAlive><RouterView /></div>',
    })
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/a', component: page('A') },
        { path: '/b', component: page('B') },
      ],
    })
    await router.push('/a')
    await router.isReady()
    const wrapper = mount(Root, { global: { plugins: [router] } })
    await flushPromises()
    rendered.mockClear()

    show.value = false
    await flushPromises()
    expect(wrapper.text()).toContain('alternate')
    await router.push('/b')
    await flushPromises()
    expect(rendered).not.toHaveBeenCalled()

    show.value = true
    await flushPromises()
    expect(wrapper.text()).toContain('outside')
    await router.push('/a')
    await flushPromises()
    expect(rendered).toHaveBeenCalledTimes(1)
    expect(rendered).toHaveBeenCalledWith(
      expect.objectContaining({ fullPath: '/a' }),
      expect.objectContaining({ fullPath: '/b' })
    )
  })
})
