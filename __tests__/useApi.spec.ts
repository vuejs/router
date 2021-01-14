/**
 * @jest-environment jsdom
 */
import { mount } from '@vue/test-utils'
import { computed } from 'vue'
import { useRoute, createRouter, createMemoryHistory } from '../src'

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
})
