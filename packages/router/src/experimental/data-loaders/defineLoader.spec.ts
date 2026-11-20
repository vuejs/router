/**
 * @vitest-environment happy-dom
 */
import type { App } from 'vue'
import { defineComponent } from 'vue'
import type { DefineDataLoaderOptions_DefinedData } from './defineLoader'
import {
  type DefineDataLoaderOptions_LaxData,
  INITIAL_DATA_KEY,
  SERVER_INITIAL_DATA_KEY,
  defineBasicLoader,
} from './defineLoader'
import { describe, it, expect, vi, afterEach } from 'vitest'
import type { DataLoaderPluginOptions, UseDataLoader } from './entries/index'
import {
  DataLoaderPlugin,
  NavigationResult,
  setCurrentContext,
} from './entries/index'
import { getRouter, testDefineLoader } from '../../tests/data-loaders'
// import { getRouter } from 'vue-router-mock'
import { enableAutoUnmount, flushPromises, mount } from '@vue/test-utils'
import RouterViewMock from '../../tests/data-loaders/RouterViewMock.vue'
import { mockPromise } from '../../tests/utils'
import type { RouteLocationNormalizedLoaded } from '../../typed-routes'
import { createRouter } from '../../router'
import { createMemoryHistory } from '../../history/memory'
import { RouterViewImpl } from '../../RouterView'
import { defineColadaLoader } from './defineColadaLoader'
import { createPinia, setActivePinia } from 'pinia'
import { PiniaColada } from '@pinia/colada'

function mockedLoader<T = string | NavigationResult>(
  // boolean is easier to handle for router mock
  options:
    | DefineDataLoaderOptions_LaxData
    | DefineDataLoaderOptions_DefinedData = {}
) {
  const [spy, resolve, reject] = mockPromise<T, unknown>(
    // not correct as T could be something else
    'ok' as T,
    new Error('ko')
  )
  return {
    spy,
    resolve,
    reject,
    loader: defineBasicLoader(async () => await spy(), options),
  }
}

describe(
  'defineBasicLoader',
  // change it during dev while working on features
  // CI might need higher timeout
  { timeout: process.env.CI ? 1000 : 500 },
  () => {
    enableAutoUnmount(afterEach)

    testDefineLoader(
      ({ fn, ...options }) => defineBasicLoader(fn, { ...options }),
      {
        beforeEach() {
          // invalidate current context
          setCurrentContext(undefined)
          // reset data used for SSR
          const router = getRouter()
          delete router[INITIAL_DATA_KEY]
          delete router[SERVER_INITIAL_DATA_KEY]
        },
      }
    )

    function singleLoaderOneRoute<Loader extends UseDataLoader>(
      useData: Loader,
      pluginOptions?: Omit<DataLoaderPluginOptions, 'router'>
    ) {
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
          plugins: [[DataLoaderPlugin, { router, ...pluginOptions }], router],
        },
      })

      const app: App = wrapper.vm.$.appContext.app

      return {
        wrapper,
        router,
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

    describe('initialData', () => {
      it.skip('stores initialData', async () => {
        const router = getRouter()
        const spy1 = vi.fn().mockResolvedValue('f1')
        const spy2 = vi.fn().mockResolvedValue('f2')
        const l1 = defineBasicLoader(spy1, { key: 'd1' })
        const l2 = defineBasicLoader(spy2, { key: 'd2' })
        router.addRoute({
          name: '_test',
          path: '/fetch',
          component: defineComponent({
            setup() {
              const { data: d1 } = l1()
              const { data: d2 } = l2()
              return { d1, d2 }
            },
            template: `<p>{{ d1 }} {{ d2 }}</p>`,
          }),
          meta: {
            loaders: [l1, l2],
            nested: { foo: 'bar' },
          },
        })

        mount(RouterViewMock, {
          global: {
            plugins: [
              [
                DataLoaderPlugin,
                {
                  router,
                },
              ],
              router,
            ],
          },
        })

        await router.push('/fetch?p=one')
        expect(spy1).toHaveBeenCalledTimes(1)
        expect(spy2).toHaveBeenCalledTimes(1)
        expect(router[SERVER_INITIAL_DATA_KEY]).toEqual({
          d1: 'f1',
          d2: 'f2',
        })
      })

      it('uses initialData if present', async () => {
        const spy = vi
          .fn<(to: RouteLocationNormalizedLoaded) => Promise<string>>()
          .mockResolvedValue('initial')
        const { router, useData } = singleLoaderOneRoute(
          defineBasicLoader(spy, { key: 'root' })
        )
        router[INITIAL_DATA_KEY] = { root: 'initial' }

        await router.push('/fetch?p=one')
        const { data } = useData()
        expect(data.value).toEqual('initial')
        expect(spy).toHaveBeenCalledTimes(0)
      })

      it('ignores initialData on subsequent navigations', async () => {
        const spy = vi
          .fn<(to: RouteLocationNormalizedLoaded) => Promise<string>>()
          .mockImplementation(async to => to.query.p as string)
        const { router, useData } = singleLoaderOneRoute(
          defineBasicLoader(spy, { key: 'root' })
        )

        router[INITIAL_DATA_KEY] = { root: 'initial' }

        await router.push('/fetch?p=one')
        await router.push('/fetch?p=two')
        const { data } = useData()
        expect(spy).toHaveBeenCalledTimes(1)
        expect(data.value).toEqual('two')
      })

      it('can use initialData on nested loaders that are not exported', async () => {
        const router = getRouter()
        const l1 = mockedLoader({ key: 'root' })
        const l2 = mockedLoader({ key: 'nested' })
        router.addRoute({
          name: '_test',
          path: '/fetch',
          component: defineComponent({
            setup() {
              const { data } = l1.loader()
              const { data: nested } = l2.loader()
              return { data, nested }
            },
            template: `<p>{{ data }} {{ nested }}</p>`,
          }),
          meta: {
            loaders: [
              // we purposely only expose the 1st loader
              l1.loader,
              // l2.loader,
            ],
            nested: { foo: 'bar' },
          },
        })
        const wrapper = mount(RouterViewMock, {
          global: {
            plugins: [
              [
                DataLoaderPlugin,
                {
                  router,
                },
              ],
              router,
            ],
          },
        })
        const app: App = wrapper.vm.$.appContext.app
        router[INITIAL_DATA_KEY] = { root: 'initial', nested: 'nested-initial' }

        await router.push('/fetch?p=one')
        const { data: root, isLoading: rootPending } = app.runWithContext(() =>
          l1.loader()
        )
        const { data: nested, isLoading: nestedPending } = app.runWithContext(
          () => l2.loader()
        )
        expect(l1.spy).toHaveBeenCalledTimes(0)
        expect(l2.spy).toHaveBeenCalledTimes(0)
        expect(wrapper.text()).toBe('initial nested-initial')
        expect(root.value).toEqual('initial')
        expect(nested.value).toEqual('nested-initial')
        expect(rootPending.value).toEqual(false)
        expect(nestedPending.value).toEqual(false)
      })
    })

    describe('warns', () => {
      // this might happen if the user forgets to export a loader
      // https://github.com/posva/unplugin-vue-router/issues/759
      it('warns if a NavigationResult is returned (deprecated)', async () => {
        const router = getRouter()
        const l1 = mockedLoader({ key: 'my-key' })
        router.addRoute({
          name: '_test',
          path: '/fetch',
          component: defineComponent({
            setup() {
              const { data } = l1.loader()
              return { data }
            },
            template: `<p>{{ !!data }}</p>`,
          }),
          meta: {
            // oops! no loader exported
            loaders: [],
            nested: { foo: 'bar' },
          },
        })
        const wrapper = mount(RouterViewMock, {
          global: {
            plugins: [
              [
                DataLoaderPlugin,
                {
                  router,
                },
              ],
              router,
            ],
          },
        })

        l1.spy.mockResolvedValueOnce(new NavigationResult('/?redirected=true'))

        await router.push('/fetch')
        await vi.advanceTimersByTimeAsync(1)
        // non-exposed loader can't redirect — stays on /fetch
        expect(router.currentRoute.value.fullPath).toBe('/fetch')
        // no data
        expect(wrapper.text()).toBe('false')

        expect('Returning a NavigationResult is deprecated').toHaveBeenWarned()
        expect('NavigationResult').toHaveBeenWarned()
        expect('key: "my-key"').toHaveBeenWarned()
      })

      it('warns if a NavigationResult is throw on a non exposed loader', async () => {
        const router = getRouter()
        const l1 = mockedLoader({ key: 'my-key' })
        router.addRoute({
          name: '_test',
          path: '/fetch',
          component: defineComponent({
            setup() {
              const { data } = l1.loader()
              return { data }
            },
            template: `<p>{{ !!data }}</p>`,
          }),
          meta: {
            // oops! no loader exported
            loaders: [],
            nested: { foo: 'bar' },
          },
        })
        const wrapper = mount(RouterViewMock, {
          global: {
            plugins: [
              [
                DataLoaderPlugin,
                {
                  router,
                },
              ],
              router,
            ],
          },
        })

        l1.spy.mockRejectedValue(new NavigationResult('/?redirected=true'))

        await router.push('/fetch')
        await vi.advanceTimersByTimeAsync(1)
        expect(router.currentRoute.value.fullPath).toBe('/fetch')
        // no data
        expect(wrapper.text()).toBe('false')

        expect('NavigationResult').toHaveBeenWarned()
        expect('key: "my-key"').toHaveBeenWarned()
      })
    })

    // https://github.com/vuejs/router/issues/2684
    describe('nested loaders with instantly resolved parents', () => {
      // helper component that resolves a loader and provides a slot, as used in #2684
      const ParentResolver = defineComponent({
        setup() {
          const { data } = useParentLoader()
          return { data }
        },
        template: `<div class="resolver"><slot :data="data" /></div>`,
      })
      const ParentPage = defineComponent({
        components: { ParentResolver, RouterView: RouterViewImpl },
        template: `<ParentResolver v-slot="{ data }">
          <div id="parent-page">parent {{ data }}<RouterView /></div>
        </ParentResolver>`,
      })
      const ChildPage = defineComponent({
        components: { ParentResolver },
        setup() {
          const { data } = useChildLoader()
          return { data }
        },
        template: `<ParentResolver v-slot="{ data }">
          <div id="child-page">child {{ data }}</div>
        </ParentResolver>`,
      })
      let parentCalls: number
      let childCalls: number
      let useParentLoader: UseDataLoaderBasic_DefinedData<string>
      let useChildLoader: UseDataLoaderBasic_DefinedData<string>

      function setupLoaders({
        cached,
        lazy,
        basic,
      }: { cached?: boolean; lazy?: boolean; basic?: boolean } = {}) {
        parentCalls = 0
        childCalls = 0
        let cache: string | undefined
        const parentQuery = () => {
          parentCalls++
          if (cached && cache) return cache
          cache = 'parent' + parentCalls
          return cache
        }
        const childQuery = async () => {
          childCalls++
          const { data } = await useParentLoader()
          return `child: ${data}`
        }
        if (basic) {
          useParentLoader = defineBasicLoader(parentQuery, {
            lazy,
          }) as typeof useParentLoader
          useChildLoader = defineBasicLoader(childQuery, {
            lazy,
          }) as typeof useChildLoader
        } else {
          useParentLoader = defineColadaLoader({
            query: parentQuery,
            key: () => ['parent'],
            lazy,
          }) as typeof useParentLoader
          useChildLoader = defineColadaLoader({
            query: childQuery,
            key: () => ['child'],
            lazy,
          }) as typeof useChildLoader
        }
      }

      function mountApp() {
        const pinia = createPinia()
        setActivePinia(pinia)
        const router = createRouter({
          history: createMemoryHistory(),
          routes: [
            {
              path: '/',
              component: defineComponent({ template: `<div>home</div>` }),
            },
            {
              path: '/nested',
              component: ParentPage,
              meta: { loaders: [useParentLoader] },
              children: [
                {
                  path: 'child',
                  component: ChildPage,
                  meta: { loaders: [useChildLoader] },
                },
                {
                  path: 'child2',
                  component: ChildPage,
                  meta: { loaders: [useChildLoader] },
                },
              ],
            },
          ],
        })
        const wrapper = mount(App, {
          global: {
            plugins: [
              pinia,
              PiniaColada,
              [DataLoaderPlugin, { router }],
              router,
            ],
          },
        })
        return { router, wrapper }
      }

      const App = defineComponent({
        components: { RouterView: RouterViewImpl },
        template: `<RouterView />`,
      })

      it('calls the parent loader once per navigation', async () => {
        setupLoaders({ lazy: true })
        const { router } = mountApp()

        await router.push('/nested/child')
        await flushPromises()

        expect(parentCalls).toBe(1)
        expect(childCalls).toBe(1)
      })

      it('calls the parent loader once with the basic loader too', async () => {
        setupLoaders({ lazy: true, basic: true })
        const { router } = mountApp()

        await router.push('/nested/child')
        await flushPromises()

        expect(parentCalls).toBe(1)
        expect(childCalls).toBe(1)
      })

      it('does not enter an infinite loop with cached parent loaders', async () => {
        setupLoaders({ cached: true })
        const { router } = mountApp()

        await router.push('/nested/child')
        await flushPromises()
        await router.push('/nested/child2')
        await flushPromises()

        expect(router.currentRoute.value.fullPath).toBe('/nested/child2')
      })
    })
  }
)
