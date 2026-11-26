import { describe, expect, it } from 'vitest'
import { createDynamicResolver } from './resolver-dynamic'
import { NO_MATCH_LOCATION } from './resolver-abstract'
import { MatcherPatternPathStar } from './matchers/matcher-pattern-path-star'
import { MatcherPatternPathStatic } from './matchers/matcher-pattern'
import { MatcherPatternQueryParam } from './matchers/matcher-pattern-query'
import { parseClassicPath } from './matchers/matcher-pattern-path-classic'
import { normalizeRouteRecord } from '../router'
import { mockWarn } from '../../../__tests__/vitest-mock-warn'

const components = {}

describe('createDynamicResolver', () => {
  mockWarn()

  it('resolves initial records with string paths', () => {
    const resolver = createDynamicResolver([
      { name: 'home', path: '/', components },
      { name: 'user', path: '/users/:id', components },
    ])
    expect(resolver.resolve('/users/1')).toMatchObject({
      name: 'user',
      params: { id: '1' },
    })
    expect(
      resolver.resolve({ name: 'user', params: { id: '2' } })
    ).toMatchObject({ path: '/users/2' })
    expect(resolver.getRoute('home')!.path).toBeInstanceOf(
      MatcherPatternPathStatic
    )
  })

  it('normalizes added records', () => {
    const resolver = createDynamicResolver()
    const about = resolver.addRoute({
      name: 'about',
      path: '/about',
      components,
    })
    expect(about).toMatchObject({ meta: {}, props: {} })
    expect(about.leaveGuards).toBeInstanceOf(Set)
    expect(about.path).toBeInstanceOf(MatcherPatternPathStatic)
    expect(resolver.getRoutes()).toEqual([about])
  })

  it('keeps already normalized records', () => {
    const record = normalizeRouteRecord({
      name: 'search',
      path: parseClassicPath('/search'),
      query: [new MatcherPatternQueryParam('q', 'q', 'value')],
      components,
    })
    const resolver = createDynamicResolver([record])
    expect(resolver.getRoutes()[0]).toBe(record)
    expect(resolver.resolve('/search?q=vue').params).toEqual({ q: 'vue' })
  })

  it('adds and removes routes', () => {
    const resolver = createDynamicResolver()
    const about = resolver.addRoute({
      name: 'about',
      path: '/about',
      components,
    })
    expect(resolver.resolve('/about').name).toBe('about')
    resolver.removeRoute(about)
    expect(resolver.resolve('/about')).toMatchObject(NO_MATCH_LOCATION)
    expect(resolver.getRoute('about')).toBeUndefined()
  })

  it('removes a route by name', () => {
    const resolver = createDynamicResolver([
      { name: 'about', path: '/about', components },
    ])
    resolver.removeRoute('about')
    expect(resolver.getRoutes()).toHaveLength(0)
  })

  it('warns when removing a route that does not exist', () => {
    createDynamicResolver().removeRoute('nope')
    expect('VUE_ROUTER_R0002').toHaveBeenWarned()
  })

  it('replaces a route with the same name', () => {
    const resolver = createDynamicResolver([
      { name: 'a', path: '/a', components },
    ])
    resolver.addRoute({ name: 'a', path: '/b', components })
    expect(resolver.getRoutes()).toHaveLength(1)
    expect(resolver.resolve('/a')).toMatchObject(NO_MATCH_LOCATION)
    expect(resolver.resolve('/b').name).toBe('a')
  })

  it('removes children and aliases with the record', () => {
    const resolver = createDynamicResolver()
    const parent = resolver.addRoute({
      name: 'parent',
      path: '/parent',
      components,
    })
    const child = resolver.addRoute({
      name: 'child',
      path: '/parent/child',
      components,
      parent,
    })
    resolver.addRoute({
      name: 'child',
      path: '/alias',
      components,
      parent,
      aliasOf: child,
    })
    resolver.addRoute({ name: 'other', path: '/other', components })
    expect(resolver.resolve('/alias')).toMatchObject({
      name: 'child',
      path: '/alias',
    })

    resolver.removeRoute('parent')
    expect(resolver.getRoutes().map(r => r.name)).toEqual(['other'])
  })

  it('clears all routes', () => {
    const resolver = createDynamicResolver([
      { name: 'a', path: '/a', components },
      { name: 'b', path: '/b', components },
    ])
    resolver.clearRoutes()
    expect(resolver.getRoutes()).toEqual([])
    expect(resolver.getRoute('a')).toBeUndefined()
  })

  it('ranks routes regardless of the insertion order', () => {
    const resolver = createDynamicResolver([
      { name: 'splat', path: '/:pathMatch(.*)*', components },
      { name: 'param', path: '/users/:id', components },
      { name: 'static', path: '/users/me', components },
      { name: 'optional', path: '/:lang?', components },
      { name: 'home', path: '/', components },
    ])
    expect(resolver.getRoutes().map(r => r.name)).toEqual([
      'static',
      'param',
      'home',
      'optional',
      'splat',
    ])
    expect(resolver.resolve('/users/me').name).toBe('static')
    expect(resolver.resolve('/').name).toBe('home')
    expect(resolver.resolve('/a/b').name).toBe('splat')
  })

  it('ranks a descendant before an ancestor with the same path', () => {
    const resolver = createDynamicResolver()
    const parent = resolver.addRoute({
      name: 'parent',
      path: '/users',
      components,
    })
    resolver.addRoute({ name: 'index', path: '/users', components, parent })
    expect(resolver.resolve('/users').name).toBe('index')
  })

  it('ranks custom patterns last in insertion order', () => {
    const resolver = createDynamicResolver([
      { name: 'star', path: new MatcherPatternPathStar('/'), components },
      { name: 'team', path: new MatcherPatternPathStar('/team'), components },
      { name: 'user', path: '/users/:id', components },
    ])
    expect(resolver.getRoutes().map(r => r.name)).toEqual([
      'user',
      'star',
      'team',
    ])
  })
})
