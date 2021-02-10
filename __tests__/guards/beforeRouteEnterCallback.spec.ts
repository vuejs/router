/**
 * @jest-environment jsdom
 */
import { defineComponent, h } from 'vue'
import { mount } from '@vue/test-utils'
import { createRouter, createMemoryHistory, RouterOptions } from '../../src'

const nextCallbacks = {
  Default: jest.fn(),
  Other: jest.fn(),
}
const Default = defineComponent({
  beforeRouteEnter(to, from, next) {
    next(nextCallbacks.Default)
  },
  name: 'Default',
  setup() {
    return () => h('div', 'Default content')
  },
})

const Other = defineComponent({
  beforeRouteEnter(to, from, next) {
    next(nextCallbacks.Other)
  },
  name: 'Other',
  setup() {
    return () => h('div', 'Other content')
  },
})

const Third = defineComponent({
  name: 'Third',
  setup() {
    return () => h('div', 'Third content')
  },
})

beforeEach(() => {
  for (const key in nextCallbacks) {
    nextCallbacks[key as keyof typeof nextCallbacks].mockClear()
  }
})

describe('beforeRouteEnter next callback', () => {
  async function factory(options: Partial<RouterOptions>) {
    const history = createMemoryHistory()
    const router = createRouter({
      history,
      routes: [],
      ...options,
    })

    const wrapper = mount(
      {
        template: `
      <div>
        <router-view/>
        <router-view name="other"/>
      </div>
      `,
      },
      {
        global: {
          plugins: [router],
        },
      }
    )

    return { wrapper, router }
  }

  it('calls each beforeRouteEnter callback once', async () => {
    const { router } = await factory({
      routes: [
        {
          path: '/:p(.*)',
          components: {
            default: Default,
            other: Other,
            third: Third,
          },
        },
      ],
    })

    await router.isReady()

    expect(nextCallbacks.Default).toHaveBeenCalledTimes(1)
    expect(nextCallbacks.Other).toHaveBeenCalledTimes(1)
  })
})
