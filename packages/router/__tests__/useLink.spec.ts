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
import {
  experimental_createRouter,
  normalizeRouteRecord,
} from '../src/experimental/router'
import { createFixedResolver } from '../src/experimental/route-resolver/resolver-fixed'
import { MatcherPatternPathDynamic } from '../src/experimental/route-resolver/matchers/matcher-pattern'
import { PARAM_PARSER_INT } from '../src/experimental/route-resolver/matchers/param-parsers'
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

    it('keeps parsed integer links active when they are exact active', async () => {
      const userRoute = normalizeRouteRecord({
        name: 'user',
        path: new MatcherPatternPathDynamic(
          /^\/users\/([^/]+?)$/i,
          { id: [PARAM_PARSER_INT] },
          ['users', 1]
        ),
        components: { default: {} },
      })
      const router = experimental_createRouter({
        history: createMemoryHistory(),
        resolver: createFixedResolver([userRoute]),
      })
      await router.push('/users/1')

      let link!: ReturnType<typeof useLink>
      mount(
        {
          setup() {
            link = useLink({ to: { name: 'user', params: { id: 1 } } })
            return () => ''
          },
        },
        { global: { plugins: [router] } }
      )

      expect(link.route.value.params).toEqual({ id: 1 })
      expect(link.isActive.value).toBe(true)
      expect(link.isExactActive.value).toBe(true)
    })

    describe('optional params', () => {
      async function linkToAbout(to: UseLinkOptions['to']) {
        const aboutRoute = normalizeRouteRecord({
          name: 'about',
          path: new MatcherPatternPathDynamic(
            /^\/about(?:\/(test))?$/,
            { mode: [] },
            ['about', 1]
          ),
          components: { default: {} },
        })
        const router = experimental_createRouter({
          history: createMemoryHistory(),
          resolver: createFixedResolver([aboutRoute]),
        })
        await router.push('/about')

        let link!: ReturnType<typeof useLink>
        mount(
          {
            setup() {
              link = useLink({ to })
              return () => ''
            },
          },
          { global: { plugins: [router] } }
        )

        return link
      }

      it('is active when the optional param is missing', async () => {
        const link = await linkToAbout({ name: 'about', params: {} })

        expect(link.isActive.value).toBe(true)
        expect(link.isExactActive.value).toBe(true)
      })

      it('is active when the optional param is null', async () => {
        const link = await linkToAbout({
          name: 'about',
          params: { mode: null },
        })

        expect(link.isActive.value).toBe(true)
        expect(link.isExactActive.value).toBe(true)
      })

      it('is active for the path without a trailing slash', async () => {
        const link = await linkToAbout('/about')

        expect(link.isActive.value).toBe(true)
        expect(link.isExactActive.value).toBe(true)
      })

      it('is inactive for the path with a trailing slash', async () => {
        const link = await linkToAbout('/about/')

        expect(link.isActive.value).toBe(false)
        expect(link.isExactActive.value).toBe(false)
      })
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
