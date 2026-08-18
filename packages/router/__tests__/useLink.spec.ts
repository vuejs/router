/**
 * @vitest-environment happy-dom
 */
import { nextTick, ref } from 'vue'
import { mount } from '@vue/test-utils'
import { mockWarn } from './vitest-mock-warn'
import type { RouteLocationRaw } from '../src/typed-routes'
import type { UseLinkOptions } from '../src/RouterLink'
import { useLink } from '../src/RouterLink'
import { createMemoryHistory } from '../src/history/memory'
import { createRouter } from '../src/router'
import { describe, expect, it } from 'vitest'

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

  describe('active state', () => {
    it('updates isActive and isExactActive after navigation', async () => {
      const router = createRouter({
        history: createMemoryHistory(),
        routes: [
          { path: '/', component: {} },
          { path: '/a', component: {} },
          { path: '/b', component: {} },
        ],
      })
      await router.push('/')

      let link!: ReturnType<typeof useLink>
      mount(
        {
          setup() {
            link = useLink({ to: '/a' })
            return () => ''
          },
        },
        { global: { plugins: [router] } }
      )

      expect(link.isActive.value).toBe(false)
      expect(link.isExactActive.value).toBe(false)

      await router.push('/a')
      expect(link.isActive.value).toBe(true)
      expect(link.isExactActive.value).toBe(true)

      await router.push('/b')
      expect(link.isActive.value).toBe(false)
      expect(link.isExactActive.value).toBe(false)
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
