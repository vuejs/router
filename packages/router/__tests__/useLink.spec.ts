/**
 * @jest-environment jsdom
 */
import { nextTick, ref } from 'vue'
import { mount } from '@vue/test-utils'
import { mockWarn } from 'jest-mock-warn'
import {
  createMemoryHistory,
  createRouter,
  RouteLocationRaw,
  useLink,
  UseLinkOptions,
} from '../src'

async function callUseLink(args: UseLinkOptions) {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      {
        path: '/',
        component: {},
        name: 'root',
      },
      {
        path: '/a',
        component: {},
        name: 'a',
      },
      {
        path: '/b',
        component: {},
        name: 'b',
      },
    ],
  })

  await router.push('/')

  let link: ReturnType<typeof useLink>

  mount(
    {
      setup() {
        link = useLink(args)

        return () => ''
      },
    },
    {
      global: {
        plugins: [router],
      },
    }
  )

  return link!
}

describe('useLink', () => {
  describe('basic usage', () => {
    it('supports a string for "to"', async () => {
      const { href, route } = await callUseLink({
        to: '/a',
      })

      expect(href.value).toBe('/a')
      expect(route.value).toMatchObject({ name: 'a' })
    })

    it('supports an object for "to"', async () => {
      const { href, route } = await callUseLink({
        to: { path: '/a' },
      })

      expect(href.value).toBe('/a')
      expect(route.value).toMatchObject({ name: 'a' })
    })

    it('supports a ref for "to"', async () => {
      const to = ref<RouteLocationRaw>('/a')

      const { href, route } = await callUseLink({
        to,
      })

      expect(href.value).toBe('/a')
      expect(route.value).toMatchObject({ name: 'a' })

      to.value = { path: '/b' }

      await nextTick()

      expect(href.value).toBe('/b')
      expect(route.value).toMatchObject({ name: 'b' })
    })
  })

  describe('warnings', () => {
    mockWarn()

    it('should warn when "to" is undefined', async () => {
      await callUseLink({
        to: undefined as any,
      })

      expect('Invalid value for prop "to" in useLink()').toHaveBeenWarned()
      expect(
        'router.resolve() was passed an invalid location'
      ).toHaveBeenWarned()
    })

    it('should warn when "to" is an undefined ref', async () => {
      await callUseLink({
        to: ref(undefined as any),
      })

      expect('Invalid value for prop "to" in useLink()').toHaveBeenWarned()
      expect(
        'router.resolve() was passed an invalid location'
      ).toHaveBeenWarned()
    })

    it('should warn when "to" changes to a null ref', async () => {
      const to = ref('/a')

      const { href, route } = await callUseLink({
        to,
      })

      expect(href.value).toBe('/a')
      expect(route.value).toMatchObject({ name: 'a' })

      to.value = null as any

      await nextTick()

      expect('Invalid value for prop "to" in useLink()').toHaveBeenWarned()
      expect(
        'router.resolve() was passed an invalid location'
      ).toHaveBeenWarned()
    })
  })
})
