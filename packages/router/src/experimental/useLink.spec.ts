/**
 * @vitest-environment happy-dom
 */
import { enableAutoUnmount, mount } from '@vue/test-utils'
import { defineComponent, h, ref } from 'vue'
import { afterEach, describe, expect, it } from 'vitest'
import { RouterView } from '../RouterView'
import { useLink, type UseLinkOptions } from './RouterLink'
import { createLinkTestRouter } from '../tests/link-router'
import { experimental_createRouter, normalizeRouteRecord } from './router'
import { createFixedResolver } from './route-resolver/resolver-fixed'
import { MatcherPatternPathDynamic } from './route-resolver/matchers/matcher-pattern'
import { createMemoryHistory } from '../history/memory'
import { mockWarn } from '../tests/vitest-mock-warn'

enableAutoUnmount(afterEach)
mockWarn()

const Page = defineComponent({ render: () => h('p', 'page') })
const Layout = defineComponent({ render: () => h(RouterView) })

async function withLink(
  options: UseLinkOptions,
  initial = '/',
  router = createLinkTestRouter({ Page, Layout })
) {
  let link!: ReturnType<typeof useLink>
  await router.push(initial)
  mount(
    defineComponent({
      setup() {
        link = useLink(options)
        return () => null
      },
    }),
    { global: { plugins: [router] } }
  )
  return { link, router }
}

describe('experimental useLink', () => {
  it('follows a getter "to"', async () => {
    const id = ref(1)
    const { link } = await withLink({
      to: () => ({ name: 'user', params: { id: id.value } }),
    })
    expect(link.href.value).toBe('/users/1')
    id.value = 2
    expect(link.href.value).toBe('/users/2')
  })

  it('follows a ref "to"', async () => {
    const to = ref('/about')
    const { link } = await withLink({ to }, '/about')
    expect(link.isExactActive.value).toBe(true)
    to.value = '/'
    expect(link.isActive.value).toBe(false)
  })

  it('navigates when navigate() is called without an event', async () => {
    const { link, router } = await withLink({ to: '/about' })
    await link.navigate()
    expect(router.currentRoute.value.path).toBe('/about')
  })

  it('warns when a reactive "to" changes to null', async () => {
    const to = ref<string | null>('/about')
    const { link } = await withLink({ to: to as UseLinkOptions['to'] })
    expect(link.href.value).toBe('/about')
    to.value = null
    // throws after the warning, as in production
    expect(() => link.href.value).toThrow()
    expect('VUE_ROUTER_R0050').toHaveBeenWarned()
  })

  describe('optional params', () => {
    // /about/:mode(test)?
    const createAboutRouter = () =>
      experimental_createRouter({
        history: createMemoryHistory(),
        resolver: createFixedResolver([
          normalizeRouteRecord({
            name: 'about',
            path: new MatcherPatternPathDynamic(
              /^\/about(?:\/(test))?$/,
              { mode: [] },
              ['about', 1]
            ),
            components: { default: Page },
          }),
        ]),
      })

    it.each<[string, UseLinkOptions['to']]>([
      ['missing', { name: 'about', params: {} }],
      ['null', { name: 'about', params: { mode: null } }],
      ['omitted from the path', '/about'],
    ])('is exact active when the param is %s', async (_, to) => {
      const { link } = await withLink({ to }, '/about', createAboutRouter())
      expect(link.isExactActive.value).toBe(true)
    })

    it('is inactive for the path with a trailing slash', async () => {
      const { link } = await withLink(
        { to: '/about/' },
        '/about',
        createAboutRouter()
      )
      expect(link.isActive.value).toBe(false)
      expect('No match found').toHaveBeenWarned()
    })
  })
})
