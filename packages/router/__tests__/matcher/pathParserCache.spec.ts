import { createRouterMatcher } from '../../src/matcher'
import type { RouteRecordRaw } from '../../src'
import type { MatcherLocation } from '../../src/types'
import { describe, expect, it } from 'vitest'

const currentLocation = { path: '/' } as MatcherLocation
// @ts-expect-error
const component: RouteComponent = null

// same shape as an app with localized copies of its routes
function routes(prefix: string): RouteRecordRaw[] {
  return ['', '/fr', '/de'].flatMap(locale => [
    { path: `${prefix}${locale}/`, name: `home${locale}`, component },
    {
      path: `${prefix}${locale}/users/:id(\\d+)`,
      name: `user${locale}`,
      component,
      alias: `${prefix}${locale}/u/:id(\\d+)`,
    },
    {
      path: `${prefix}${locale}/docs/:parts+`,
      name: `docs${locale}`,
      component,
    },
    {
      path: `${prefix}${locale}/settings`,
      name: `settings${locale}`,
      component,
      children: [
        { path: '', name: `settings-home${locale}`, component },
        { path: ':section?', name: `settings-section${locale}`, component },
      ],
    },
  ])
}

describe('Matcher: path parsers are shared between matchers', () => {
  it('reuses the parser of a path but creates new matchers', () => {
    const a = createRouterMatcher(routes('/reuse'), {})
    const b = createRouterMatcher(routes('/reuse'), {})
    const matchersA = a.getRoutes()
    const matchersB = b.getRoutes()
    expect(matchersB).toHaveLength(matchersA.length)
    matchersA.forEach((matcher, i) => {
      expect(matchersB[i]).not.toBe(matcher)
      expect(matchersB[i].re).toBe(matcher.re)
      expect(matchersB[i].children).not.toBe(matcher.children)
    })
  })

  it('resolves the same locations', () => {
    const a = createRouterMatcher(routes('/same'), {})
    const b = createRouterMatcher(routes('/same'), {})
    for (const path of [
      '/same/',
      '/same/fr/users/7',
      '/same/de/u/7',
      '/same/users/abc',
      '/same/fr/docs/a/b/c',
      '/same/de/settings',
      '/same/de/settings/privacy',
    ]) {
      expect(b.resolve({ path }, currentLocation)).toEqual(
        a.resolve({ path }, currentLocation)
      )
    }
    expect(
      b.resolve(
        { name: 'settings-section/fr', params: { section: 'privacy' } },
        currentLocation
      ).path
    ).toBe('/same/fr/settings/privacy')
  })

  it('does not share parsers between different options', () => {
    const record = (): RouteRecordRaw[] => [
      { path: '/options/Page', name: 'page', component },
    ]
    const loose = createRouterMatcher(record(), {})
    const sensitive = createRouterMatcher(record(), { sensitive: true })
    const strict = createRouterMatcher(record(), { strict: true })
    const notEnd = createRouterMatcher(record(), { end: false })
    const res = [loose, sensitive, strict, notEnd].map(m => m.getRoutes()[0].re)
    expect(new Set(res).size).toBe(4)

    expect(loose.resolve({ path: '/options/page' }, currentLocation).name).toBe(
      'page'
    )
    expect(
      sensitive.resolve({ path: '/options/page' }, currentLocation).name
    ).toBeUndefined()
    expect(
      strict.resolve({ path: '/options/Page/' }, currentLocation).name
    ).toBeUndefined()
    expect(
      notEnd.resolve({ path: '/options/Page/more' }, currentLocation).name
    ).toBe('page')
    // the default options still get their own parser
    expect(
      createRouterMatcher(record(), {}).resolve(
        { path: '/options/page' },
        currentLocation
      ).name
    ).toBe('page')
  })

  it('keeps matchers independent when routes are added or removed', () => {
    const a = createRouterMatcher(routes('/independent'), {})
    const b = createRouterMatcher(routes('/independent'), {})
    const count = b.getRoutes().length
    a.addRoute({ path: '/independent/extra', name: 'extra', component })
    a.removeRoute('settings')
    expect(a.getRecordMatcher('extra')).toBeTruthy()
    expect(b.getRecordMatcher('extra')).toBeFalsy()
    expect(b.getRecordMatcher('settings')).toBeTruthy()
    expect(b.getRecordMatcher('settings')!.children).toHaveLength(2)
    expect(b.getRoutes()).toHaveLength(count)
  })
})
