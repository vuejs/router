/**
 * @vitest-environment node
 */
import { createSSRApp, h, type Component } from 'vue'
import { renderToString } from '@vue/server-renderer'
import { vi, describe, expect, it } from 'vitest'
import { START_LOCATION_NORMALIZED } from '../src/location'
import type { RouteRecordNormalized } from '../src/matcher/types'
import type {
  RouteLocationNormalized,
  RouteLocationResolved,
} from '../src/typed-routes'
import type { RouterOptions } from '../src/router'

const records = {
  home: { path: '/home' } as RouteRecordNormalized,
  parent: { path: '/parent' } as RouteRecordNormalized,
  child: { path: '/parent/child' } as RouteRecordNormalized,
  user: { path: '/users/:id' } as RouteRecordNormalized,
}
const homeAlias = {
  path: '/start',
  aliasOf: records.home,
} as RouteRecordNormalized

function createLocation(
  path: string,
  matched: RouteRecordNormalized[],
  params: RouteLocationResolved['params'] = {}
): RouteLocationResolved {
  return {
    fullPath: path,
    href: path,
    path,
    params,
    meta: {},
    query: {},
    hash: '',
    matched,
    redirectedFrom: undefined,
    name: undefined,
  } as unknown as RouteLocationResolved
}

const locations = {
  home: createLocation('/home', [records.home]),
  homeAlias: createLocation('/start', [homeAlias]),
  parent: createLocation('/parent', [records.parent]),
  child: createLocation('/parent/child', [records.parent, records.child]),
  user1: createLocation('/users/1', [records.user], { id: '1' }),
  user2: createLocation('/users/2', [records.user], { id: '2' }),
}

/**
 * Renders `RouterLink` with `isBrowser` forced to a given value so both the
 * reactive rendering and the server one can be compared in the same file.
 */
async function renderLink(
  isBrowser: boolean,
  currentLocation: RouteLocationNormalized,
  propsData: Record<string, unknown>,
  resolvedLocation: RouteLocationResolved,
  options: Partial<RouterOptions> = {},
  slot?: (link: any) => any
) {
  vi.resetModules()
  vi.doMock('../src/utils/env', () => ({ isBrowser }))

  // all of these must come from the same module registry as the mock above
  const [{ RouterLink }, { routerKey }, { createMockedRoute }] =
    await Promise.all([
      import('../src/RouterLink'),
      import('../src/injectionSymbols'),
      import('./mount'),
    ])

  const route = createMockedRoute(currentLocation)
  const router = {
    options,
    resolve: vi.fn().mockReturnValue(resolvedLocation),
    push: vi.fn().mockResolvedValue(resolvedLocation),
    replace: vi.fn().mockResolvedValue(resolvedLocation),
  }

  const app = createSSRApp({
    render: () =>
      h(RouterLink as Component, propsData, slot as unknown as () => any),
  })
  app.provide(routerKey, router as any)
  for (const key of Object.getOwnPropertySymbols(route.provides)) {
    app.provide(key, (route.provides as any)[key])
  }

  const html = await renderToString(app)
  vi.doUnmock('../src/utils/env')
  return html
}

describe('RouterLink SSR', () => {
  const cases: Array<
    [
      name: string,
      currentLocation: RouteLocationNormalized,
      propsData: Record<string, unknown>,
      resolvedLocation: RouteLocationResolved,
      options?: Partial<RouterOptions>,
      slot?: (link: any) => any,
    ]
  > = [
    [
      'an inactive link',
      START_LOCATION_NORMALIZED,
      { to: '/home' },
      locations.home,
    ],
    [
      'an exact active link',
      locations.home as unknown as RouteLocationNormalized,
      { to: '/home' },
      locations.home,
    ],
    [
      'an active parent',
      locations.child as unknown as RouteLocationNormalized,
      { to: '/parent' },
      locations.parent,
    ],
    [
      'a nested exact active link',
      locations.child as unknown as RouteLocationNormalized,
      { to: '/parent/child' },
      locations.child,
    ],
    [
      'an aliased record',
      locations.homeAlias as unknown as RouteLocationNormalized,
      { to: '/home' },
      locations.home,
    ],
    [
      'matching params',
      locations.user1 as unknown as RouteLocationNormalized,
      { to: { name: 'user', params: { id: '1' } } },
      locations.user1,
    ],
    [
      'differing params',
      locations.user1 as unknown as RouteLocationNormalized,
      { to: { name: 'user', params: { id: '2' } } },
      locations.user2,
    ],
    [
      'a custom activeClass',
      locations.child as unknown as RouteLocationNormalized,
      { to: '/parent', activeClass: 'is-active' },
      locations.parent,
    ],
    [
      'a custom exactActiveClass',
      locations.home as unknown as RouteLocationNormalized,
      { to: '/home', exactActiveClass: 'is-exact' },
      locations.home,
    ],
    [
      'a custom ariaCurrentValue',
      locations.home as unknown as RouteLocationNormalized,
      { to: '/home', ariaCurrentValue: 'step' },
      locations.home,
    ],
    [
      'global link classes',
      locations.child as unknown as RouteLocationNormalized,
      { to: '/parent' },
      locations.parent,
      { linkActiveClass: 'g-active', linkExactActiveClass: 'g-exact' },
    ],
    [
      'a fallthrough class',
      locations.home as unknown as RouteLocationNormalized,
      { to: '/home', class: 'user-class' },
      locations.home,
    ],
    [
      'a default slot',
      locations.home as unknown as RouteLocationNormalized,
      { to: '/home' },
      locations.home,
      {},
      () => 'Home' as any,
    ],
    [
      'a custom link with one vnode',
      locations.home as unknown as RouteLocationNormalized,
      { to: '/home', custom: true },
      locations.home,
      {},
      (link: any) => h('a', { href: link.href }, String(link.isExactActive)),
    ],
    [
      'a custom link with multiple vnodes',
      locations.home as unknown as RouteLocationNormalized,
      { to: '/home', custom: true },
      locations.home,
      {},
      (link: any) => [h('span', link.href), h('span', String(link.isActive))],
    ],
  ]

  it.each(cases)(
    'renders %s the same on the server',
    async (_name, currentLocation, propsData, resolved, options, slot) => {
      expect(
        await renderLink(
          false,
          currentLocation,
          propsData,
          resolved,
          options,
          slot
        )
      ).toBe(
        await renderLink(
          true,
          currentLocation,
          propsData,
          resolved,
          options,
          slot
        )
      )
    }
  )

  it('passes the same slot props', async () => {
    const received: any[] = []
    const slot = (link: any) => {
      received.push({ ...link, navigate: typeof link.navigate })
      return h('span')
    }
    const args = [
      locations.child as unknown as RouteLocationNormalized,
      { to: '/parent', custom: true },
      locations.parent,
      {},
      slot,
    ] as const

    await renderLink(true, ...args)
    await renderLink(false, ...args)

    const [reactive, eager] = received
    expect(Object.keys(eager).sort()).toEqual(Object.keys(reactive).sort())
    expect(eager).toMatchObject({
      href: reactive.href,
      isActive: reactive.isActive,
      isExactActive: reactive.isExactActive,
      navigate: 'function',
    })
    expect(eager.isActive).toBe(true)
  })
})
