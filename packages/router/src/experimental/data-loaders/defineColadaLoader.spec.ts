/**
 * @vitest-environment happy-dom
 */
import { App, defineComponent, nextTick } from 'vue'
import { defineColadaLoader } from './defineColadaLoader'
import { describe, it, expect, vi, afterEach } from 'vitest'
import {
  DataLoaderPlugin,
  DataLoaderPluginOptions,
  getCurrentContext,
  setCurrentContext,
  UseDataLoader,
} from './entries/index'
import { getRouter, testDefineLoader } from '../../tests/data-loaders'
// import { getRouter } from 'vue-router-mock'
import { enableAutoUnmount, mount } from '@vue/test-utils'
import RouterViewMock from '../../tests/data-loaders/RouterViewMock.vue'
import { setActivePinia, createPinia, getActivePinia } from 'pinia'
import {
  PiniaColada,
  useQueryCache,
  serializeQueryCache,
  hydrateQueryCache,
} from '@pinia/colada'
import type { RouteLocationNormalizedLoaded } from '../../typed-routes'

describe(
  'defineColadaLoader',
  // fail faster on unresolved promises
  { timeout: process.env.CI ? 1000 : 100 },
  () => {
    enableAutoUnmount(afterEach)

    testDefineLoader(
      ({ fn, key, ...options }) =>
        defineColadaLoader({ ...options, query: fn, key: () => [key ?? 'id'] }),
      {
        beforeEach() {
          const pinia = createPinia()
          // invalidate current context
          setCurrentContext(undefined)
          setActivePinia(pinia)
          return { pinia }
        },
        plugins: ({ pinia }) => [pinia, PiniaColada],
      }
    )

    function singleLoaderOneRoute<Loader extends UseDataLoader>(
      useData: Loader,
      pluginOptions?: Omit<DataLoaderPluginOptions, 'router'>
    ): {
      wrapper: ReturnType<typeof mount>
      router: ReturnType<typeof getRouter>
      // technically it should be () => ReturnType<Loader> but it doesn't infer all the types
      useData: Loader
      app: App
    } {
      let useDataResult: ReturnType<Loader>
      const component = defineComponent({
        setup() {
          // @ts-expect-error: wat?
          useDataResult = useData()

          const { data, error, isLoading } = useDataResult
          return { data, error, isLoading }
        },
        template: `\
<div>
  <p id="route">{{ $route.path }}</p>
  <p id="data">{{ data }}</p>
  <p id="error">{{ error }}</p>
  <p id="isLoading">{{ isLoading }}</p>
</div>`,
      })
      const router = getRouter()
      router.addRoute({
        name: '_test',
        path: '/fetch',
        meta: {
          loaders: [useData],
          nested: { foo: 'bar' },
        },
        component,
      })

      const wrapper = mount(RouterViewMock, {
        global: {
          plugins: [
            [DataLoaderPlugin, { router, ...pluginOptions }],
            router,
            createPinia(),
            PiniaColada,
          ],
        },
      })

      const app: App = wrapper.vm.$.appContext.app

      return {
        wrapper,
        router,
        // @ts-expect-error: not exactly Loader
        useData: () => {
          if (useDataResult) {
            return useDataResult
          }
          // forced to ensure similar running context to within a component
          // this is for tests that call useData() before the navigation is finished
          setCurrentContext(undefined)
          return app.runWithContext(() => useData()) as ReturnType<Loader>
        },
        app,
      }
    }

    it('avoids refetching fresh data when navigating', async () => {
      const query = vi.fn().mockResolvedValue('data')
      const useData = defineColadaLoader({
        query,
        key: to => [to.query.q as string],
      })

      const { router } = singleLoaderOneRoute(useData)

      // same key
      await router.push('/fetch?q=1&v=1')
      expect(query).toHaveBeenCalledTimes(1)
      await router.push('/fetch?q=1&v=2')
      expect(query).toHaveBeenCalledTimes(1)

      // different key
      await router.push('/fetch?q=2&v=3')
      expect(query).toHaveBeenCalledTimes(2)
      // already fetched
      await router.push('/fetch?q=1&v=4')
      expect(query).toHaveBeenCalledTimes(2)
    })

    it('updates data loader data if internal data changes', async () => {
      const query = vi.fn(async () => 'data')

      const { router, useData } = singleLoaderOneRoute(
        defineColadaLoader({
          query,
          key: () => ['id'],
        })
      )

      await router.push('/fetch?v=1')
      expect(query).toHaveBeenCalledTimes(1)
      const { data: loaderData } = useData()
      // we use a full mount to ensure we can use inject and onScopeDispose in useQuery
      // and avoid warning
      const wrapper = mount(
        defineComponent({
          setup() {
            const caches = useQueryCache()
            return { caches }
          },
          template: `<div></div>`,
        }),
        {
          global: {
            plugins: [getActivePinia()!, PiniaColada],
          },
        }
      )
      wrapper.vm.caches.setQueryData(['id'], 'new')
      await nextTick()
      expect(loaderData.value).toBe('new')
    })

    it('restores previous data if fetching succeeds but navigation is cancelled', async () => {
      const query = vi.fn(
        async (to: RouteLocationNormalizedLoaded) => to.query.v
      )

      const { router, useData } = singleLoaderOneRoute(
        defineColadaLoader({
          query,
          key: () => ['id'],
        })
      )

      await router.push('/fetch?v=1')
      expect(query).toHaveBeenCalledTimes(1)
      const { data: loaderData } = useData()

      // cancel next navigation after running loaders
      // it cannot be a beforeEach because it wouldn't run the loaders
      router.beforeResolve(() => false)
      await router.push('/fetch?v=2')
      await vi.advanceTimersByTimeAsync(0)
      // we ensure that it was called
      expect(query).toHaveBeenCalledTimes(2)
      expect(loaderData.value).toBe('1')
    })

    it('hydrates without calling the query on the initial navigation', async () => {
      // setups the loader
      const query = vi.fn().mockResolvedValue('data')
      const useData = defineColadaLoader({
        query,
        key: () => ['id'],
      })

      // sets up the page
      let useDataResult: ReturnType<typeof useData> | undefined
      const component = defineComponent({
        setup() {
          useDataResult = useData()

          const { data, error, isLoading } = useDataResult
          return { data, error, isLoading }
        },
        template: `<p/>`,
      })

      // add the page to the router
      const router = getRouter()
      router.addRoute({
        name: '_test',
        path: '/fetch',
        meta: {
          loaders: [useData],
          nested: { foo: 'bar' },
        },
        component,
      })

      // sets up the cache
      const pinia = createPinia()

      const wrapper = mount(RouterViewMock, {
        global: {
          plugins: [[DataLoaderPlugin, { router }], router, pinia, PiniaColada],
        },
      })

      const serializedCache = {
        // entry with successful data for id
        '["id"]': ['data', null, 0],
      } satisfies ReturnType<typeof serializeQueryCache>

      wrapper.vm.$.appContext.app.runWithContext(() => {
        hydrateQueryCache(useQueryCache(pinia), serializedCache)
      })

      await router.push('/fetch')
      expect(query).toHaveBeenCalledTimes(0)

      await expect(useDataResult!.reload()).resolves.toBeUndefined()
      expect(query).toHaveBeenCalledTimes(1)
    })

    // NOTE: this test should fail if the `setCurrentContext(currentContext)` is not called in the `if (isInitial)` branch
    // Shouldn't this be directly in tester?
    it('restores the context after using a loader', async () => {
      const query = vi.fn().mockResolvedValue('data')

      const useData = defineColadaLoader({
        query,
        key: () => ['id'],
      })

      let useDataResult: ReturnType<typeof useData> | undefined
      const component = defineComponent({
        setup() {
          useDataResult = useData()
          expect(getCurrentContext()).toEqual([])

          const { data, error, isLoading } = useDataResult
          return { data, error, isLoading }
        },
        template: `<p/>`,
      })

      const router = getRouter()
      router.addRoute({
        name: '_test',
        path: '/fetch',
        meta: {
          loaders: [useData],
          nested: { foo: 'bar' },
        },
        component,
      })

      const pinia = createPinia()

      const wrapper = mount(RouterViewMock, {
        global: {
          plugins: [[DataLoaderPlugin, { router }], router, pinia, PiniaColada],
        },
      })

      const serializedCache = {
        // entry with successful data for id
        '["id"]': ['data', null, 0],
      } satisfies ReturnType<typeof serializeQueryCache>

      wrapper.vm.$.appContext.app.runWithContext(() => {
        hydrateQueryCache(useQueryCache(pinia), serializedCache)
      })

      await router.push('/fetch')

      expect(useDataResult?.data.value).toBe('data')

      expect(getCurrentContext()).toEqual([])
    })

    it('can refetch nested loaders on invalidation', async () => {
      const nestedQuery = vi.fn(async () => [{ id: 0 }, { id: 1 }])
      const useListData = defineColadaLoader({
        query: nestedQuery,
        key: () => ['items'],
      })

      const useDetailData = defineColadaLoader({
        key: to => ['items', { id: to.params.id as string }],
        async query(to) {
          const list = await useListData()
          const item = list.find(
            item => String(item.id) === (to.params.id as string)
          )
          if (!item) {
            throw new Error('Not Found')
          }
          return { ...item, when: Date.now() }
        },
      })

      const component = defineComponent({
        setup() {
          return { ...useDetailData() }
        },
        template: `<p/>`,
      })

      const router = getRouter()
      router.addRoute({
        name: 'item-id',
        path: '/items/:id',
        meta: { loaders: [useDetailData], nested: { foo: 'bar' } },
        component,
      })

      const pinia = createPinia()

      mount(RouterViewMock, {
        global: {
          plugins: [[DataLoaderPlugin, { router }], router, pinia, PiniaColada],
        },
      })

      await router.push('/items/0')
      const queryCache = useQueryCache(pinia)

      expect(nestedQuery).toHaveBeenCalledTimes(1)
      await expect(
        queryCache.invalidateQueries({ key: ['items'] })
      ).resolves.toBeDefined()
      expect(nestedQuery).toHaveBeenCalledTimes(2)

      await router.push('/items/1')
      // FIXME:
      // expect(nestedQuery).toHaveBeenCalledTimes(2)
    })

    it('marks loader queries as inactive when navigating away from the page', async () => {
      // Create two loaders with different keys
      const useLoader1 = defineColadaLoader({
        query: async () => 'data-1',
        key: ['page-1'],
      })

      const useLoader2 = defineColadaLoader({
        query: async () => 'data-2',
        key: ['page-2'],
      })

      // Create components for each page
      const page1 = defineComponent({
        setup() {
          const { data, error, isLoading } = useLoader1()
          return { data, error, isLoading }
        },
        template: `<div><p id="data">{{ data }}</p></div>`,
      })

      const page2 = defineComponent({
        setup() {
          const { data, error, isLoading } = useLoader2()
          return { data, error, isLoading }
        },
        template: `<div><p id="data">{{ data }}</p></div>`,
      })

      // Set up router with both routes
      const router = getRouter()
      router.addRoute({
        name: 'page1',
        path: '/page1',
        meta: { loaders: [useLoader1], nested: { foo: 'bar' } },
        component: page1,
      })
      router.addRoute({
        name: 'page2',
        path: '/page2',
        meta: { loaders: [useLoader2], nested: { foo: 'bar' } },
        component: page2,
      })

      // Create pinia instance and mount
      const pinia = createPinia()

      const wrapper = mount(RouterViewMock, {
        global: {
          plugins: [[DataLoaderPlugin, { router }], router, pinia, PiniaColada],
        },
      })

      const queryCache = useQueryCache(pinia)

      // trigger both loaders
      await router.push('/page1')
      await router.push('/page2')

      // We went to the other page
      expect(wrapper.find('#data').text()).toBe('data-2')

      const entry1 = queryCache.getEntries({ key: ['page-1'] }).at(0)!
      const entry2 = queryCache.getEntries({ key: ['page-2'] }).at(0)!
      expect(entry1).toBeDefined()
      expect(entry2).toBeDefined()

      expect(entry1.deps.size).toBe(0)
      expect(entry1.active).toBe(false)
      expect(entry2.deps.size).toBe(1)
      expect(entry2.active).toBe(true)

      await router.push('/page1')
      expect(wrapper.find('#data').text()).toBe('data-1')
      expect(entry2.deps.size).toBe(0)
      expect(entry2.active).toBe(false)
      expect(entry1.deps.size).toBe(1)
      expect(entry1.active).toBe(true)
    })

    it('marks loader queries as inactive when navigating between pages with different parameters', async () => {
      const useLoaderWithParam = defineColadaLoader({
        query: async to => `data-${to.params.id as string}`,
        key: to => ['page-loader', to.params.id as string],
      })

      const router = getRouter()
      router.addRoute({
        name: 'loader',
        path: '/loader/:id',
        meta: { loaders: [useLoaderWithParam], nested: { foo: 'bar' } },
        component: defineComponent({
          setup() {
            const { data, error, isLoading } = useLoaderWithParam()
            return { data, error, isLoading }
          },
          template: `<div><p id="data">{{ data }}</p></div>`,
        }),
      })

      const pinia = createPinia()

      const wrapper = mount(RouterViewMock, {
        global: {
          plugins: [[DataLoaderPlugin, { router }], router, pinia, PiniaColada],
        },
      })

      const queryCache = useQueryCache(pinia)

      // navigate back and forth between two loader pages
      await router.push('/loader/1')
      expect(wrapper.find('#data').text()).toBe('data-1')

      await router.push('/')
      expect(wrapper.text()).toBe('home')

      await router.push('/loader/2')
      expect(wrapper.find('#data').text()).toBe('data-2')

      await router.push('/')
      expect(wrapper.text()).toBe('home')

      const entry1 = queryCache.get(['page-loader', '1'])!
      const entry2 = queryCache.get(['page-loader', '2'])!

      expect(entry1).toBeDefined()
      expect(entry2).toBeDefined()

      // Both entries should be inactive with no deps
      expect(entry1.deps.size).toBe(0)
      expect(entry1.active).toBe(false)
      expect(entry2.deps.size).toBe(0)
      expect(entry2.active).toBe(false)
    })
  }
)
