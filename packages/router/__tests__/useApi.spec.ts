/**
 * @vitest-environment happy-dom
 */
import { mount } from '@vue/test-utils'
import { computed, defineComponent, h, nextTick, shallowRef } from 'vue'
import { useRoute } from '../src/useApi'
import { createRouter } from '../src/router'
import { createMemoryHistory } from '../src/history/memory'
import type { RouteLocationResolved } from '../src/typed-routes'
import { describe, expect, it } from 'vitest'

describe('use apis', () => {
  it('unwraps useRoute()', async () => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        {
          path: '/:any(.*)',
          component: {} as any,
        },
      ],
    })

    const wrapper = mount(
      {
        template: `<p>Query: {{ q }}</p>`,
        setup() {
          const route = useRoute()
          const q = computed(() => route.query.q)

          return { q }
        },
      },
      {
        global: {
          plugins: [router],
        },
      }
    )

    expect(wrapper.text()).toBe('Query:')

    await router.push('/?q=hi')
    expect(wrapper.text()).toBe('Query: hi')
  })

  it('useRoute() returns the route passed to the closest RouterView', async () => {
    const Child = defineComponent({
      setup() {
        const route = useRoute()
        return () => h('span', route.fullPath)
      },
    })
    const View = defineComponent({
      setup() {
        const route = useRoute()
        return () => h('p', [route.fullPath, ' ', h(Child)])
      },
    })
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/', component: View },
        { path: '/other', component: View },
      ],
    })
    const routeProp = shallowRef<RouteLocationResolved>()

    const wrapper = mount(
      {
        template: `<b>{{ route.fullPath }}</b><RouterView :route="routeProp" />`,
        setup() {
          return { route: useRoute(), routeProp }
        },
      },
      { global: { plugins: [router] } }
    )

    await router.push('/other')
    expect(wrapper.find('p').text()).toBe('/other /other')

    routeProp.value = router.resolve('/?local')
    await nextTick()
    expect(wrapper.find('b').text()).toBe('/other')
    expect(wrapper.find('p').text()).toBe('/?local /?local')

    routeProp.value = undefined
    await nextTick()
    expect(wrapper.find('p').text()).toBe('/other /other')
  })
})
