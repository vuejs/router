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
import { createRouter, type Router } from '../src/router'
import {
  experimental_createRouter,
  normalizeRouteRecord,
} from '../src/experimental/router'
import { createFixedResolver } from '../src/experimental/route-resolver/resolver-fixed'
import { MatcherPatternPathDynamic } from '../src/experimental/route-resolver/matchers/matcher-pattern'
import { PARAM_PARSER_INT } from '../src/experimental/route-resolver/matchers/param-parsers'
import { describe, expect, it } from 'vitest'

function mountLink(
  router: Router | ReturnType<typeof experimental_createRouter>,
  options: UseLinkOptions
) {
  let link!: ReturnType<typeof useLink>
  mount(
    {
      setup() {
        link = useLink(options)
        return () => ''
      },
    },
    { global: { plugins: [router] } }
  )
  return link
}

async function callUseLink(options: UseLinkOptions) {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', component: {}, name: 'root' },
      { path: '/a', component: {}, name: 'a' },
      { path: '/b', component: {}, name: 'b' },
    ],
  })
  await router.push('/')
  return { router, link: mountLink(router, options) }
}

describe('useLink', () => {
  describe('basic usage', () => {
    it('supports a string for "to"', async () => {
      const { link } = await callUseLink({ to: '/a' })

      expect(link.href.value).toBe('/a')
      expect(link.route.value).toMatchObject({ name: 'a' })
    })

    it('supports an object for "to"', async () => {
      const { link } = await callUseLink({ to: { path: '/a' } })

      expect(link.href.value).toBe('/a')
      expect(link.route.value).toMatchObject({ name: 'a' })
    })

    it('supports a ref for "to"', async () => {
      const to = ref<RouteLocationRaw>('/a')
      const { link } = await callUseLink({ to })

      expect(link.href.value).toBe('/a')

      to.value = { path: '/b' }
      await nextTick()

      expect(link.href.value).toBe('/b')
      expect(link.route.value).toMatchObject({ name: 'b' })
    })
  })

  describe('active state', () => {
    it('updates isActive and isExactActive after navigation', async () => {
      const { link, router } = await callUseLink({ to: '/a' })

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

      const link = mountLink(router, {
        to: { name: 'user', params: { id: 1 } },
      })

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
        return mountLink(router, { to })
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

    it('warns when "to" is undefined', async () => {
      await callUseLink({ to: undefined as any })

      expect('Invalid value for prop "to" in useLink()').toHaveBeenWarned()
      expect(
        'router.resolve() was passed an invalid location'
      ).toHaveBeenWarned()
    })

    it('warns when "to" changes to null', async () => {
      const to = ref('/a')
      const { link } = await callUseLink({ to })
      expect(link.href.value).toBe('/a')

      to.value = null as any
      await nextTick()

      expect('Invalid value for prop "to" in useLink()').toHaveBeenWarned()
      expect(
        'router.resolve() was passed an invalid location'
      ).toHaveBeenWarned()
    })
  })
})
