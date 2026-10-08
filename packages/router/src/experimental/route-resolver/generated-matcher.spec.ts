import { describe, expect, it } from 'vitest'
import { mockWarn } from '../../../__tests__/vitest-mock-warn'
import { PrefixTree, type TreeNode } from '../../unplugin/core/tree'
import { ImportsMap } from '../../unplugin/core/utils'
import { resolveOptions } from '../../unplugin/options'
import { generateRouteRecordPath } from '../../unplugin/codegen/generateRouteResolver'
import {
  MatcherPatternPathDynamic,
  MatcherPatternPathStatic,
  type MatcherPatternPath,
} from './matchers/matcher-pattern'
import { MatchMiss } from './matchers/errors'

function compilePath(node: TreeNode): MatcherPatternPath {
  const code = generateRouteRecordPath({
    node,
    importsMap: new ImportsMap(),
    paramParsersMap: new Map(),
  })
  // Execute the generated JavaScript as a user's app does, without hand-written regexps.
  return new Function(
    'MatcherPatternPathDynamic',
    'MatcherPatternPathStatic',
    `return ({ ${code} }).path`
  )(MatcherPatternPathDynamic, MatcherPatternPathStatic)
}

function generatePath(filePath: string): MatcherPatternPath {
  const tree = new PrefixTree(resolveOptions({}))
  return compilePath(tree.insert(filePath, `${filePath}.vue`))
}

const optionalPaths = [
  '[[a]]/[[b]]',
  '(group)/[[a]]/[[b]]',
  '[[a]]/(group)/[[b]]',
  '[[a]]/[[b]]/(group)/index',
  '(first)/[[a]]/(middle)/[[b]]/(last)/index',
  '[[a]]/[[b]]/index',
]

describe('generated path matchers', () => {
  mockWarn()

  it.each(optionalPaths)(
    'matches and builds the root path with only optional params in %s',
    filePath => {
      const pattern = generatePath(filePath)

      expect(pattern.match('/')).toEqual({ a: null, b: null })
      expect(pattern.match('/x')).toEqual({ a: 'x', b: null })
      expect(() => pattern.match('/x/')).toThrow()
      expect(pattern.build({ a: null, b: null })).toBe('/')
      expect(pattern.build({ a: 'x', b: null })).toBe('/x')
    }
  )

  it.each(['[[a]]/required', '[[a]]/[b]', '[[a]]/prefix-[b]'])(
    'does not match the root path with required segments in %s',
    filePath => {
      const pattern = generatePath(filePath)

      expect(() => pattern.match('/')).toThrow()
      expect(() => pattern.match('')).toThrow()
    }
  )

  it('matches and builds the root path with only optional repeatable params', () => {
    const tree = new PrefixTree(resolveOptions({}))
    const parent = tree.insert('[[a]]+', '[[a]]+.vue')
    parent.setCustomRouteBlock('[[a]]+.vue', {
      params: { path: { a: { re: '\\d+' } } },
    })
    const node = tree.insert('[[a]]+/[[b]]+', '[[a]]+/[[b]]+.vue')
    node.setCustomRouteBlock('[[a]]+/[[b]]+.vue', {
      params: { path: { b: { re: '[a-z]+' } } },
    })
    const pattern = compilePath(node)

    expect(pattern.match('/')).toEqual({ a: [], b: [] })
    expect(pattern.match('/12/34')).toEqual({ a: ['12', '34'], b: [] })
    expect(pattern.match('/x/y')).toEqual({ a: [], b: ['x', 'y'] })
    expect(pattern.match('/12/34/x/y')).toEqual({
      a: ['12', '34'],
      b: ['x', 'y'],
    })
    expect(pattern.build({ a: [], b: [] })).toBe('/')
    expect(pattern.build({ a: ['12', '34'], b: [] })).toBe('/12/34')
    expect(pattern.build({ a: [], b: ['x', 'y'] })).toBe('/x/y')
    expect(pattern.build({ a: ['12', '34'], b: ['x', 'y'] })).toBe('/12/34/x/y')
    expect(() => pattern.match('/12/x/34')).toThrow()
    expect(() => pattern.match('/12/34/x/y/')).toThrow()
  })

  it.each(optionalPaths)(
    'matches and builds optional custom regexps in %s',
    filePath => {
      const tree = new PrefixTree(resolveOptions({}))
      const aPath = filePath.slice(
        0,
        filePath.indexOf('[[a]]') + '[[a]]'.length
      )
      const aNode = tree.insert(aPath, `${aPath}.vue`)
      aNode.setCustomRouteBlock(`${aPath}.vue`, {
        params: { path: { a: { re: '\\d+' } } },
      })
      const bPath = filePath.slice(
        0,
        filePath.indexOf('[[b]]') + '[[b]]'.length
      )
      const bNode = tree.insert(bPath, `${bPath}.vue`)
      bNode.setCustomRouteBlock(`${bPath}.vue`, {
        params: { path: { b: { re: '(?:en|fr)' } } },
      })
      const file = `${filePath}.vue`
      const node = tree.insert(filePath, file)
      const pattern = compilePath(node)

      expect(pattern.match('/')).toEqual({ a: null, b: null })
      expect(pattern.match('/42')).toEqual({ a: '42', b: null })
      expect(pattern.match('/en')).toEqual({ a: null, b: 'en' })
      expect(pattern.match('/42/fr')).toEqual({ a: '42', b: 'fr' })
      expect(pattern.build({ a: null, b: null })).toBe('/')
      expect(pattern.build({ a: '42', b: null })).toBe('/42')
      expect(pattern.build({ a: null, b: 'en' })).toBe('/en')
      expect(pattern.build({ a: '42', b: 'fr' })).toBe('/42/fr')
      expect(() => pattern.match('/x')).toThrow(MatchMiss)
      expect(() => pattern.match('/42/de')).toThrow()
      expect(() => pattern.match('/42/')).toThrow()
    }
  )

  it('matches and builds optional repeatable custom regexps', () => {
    const tree = new PrefixTree(resolveOptions({}))
    const parent = tree.insert('[[a]]+', '[[a]]+.vue')
    parent.setCustomRouteBlock('[[a]]+.vue', {
      params: { path: { a: { re: '\\d+' } } },
    })
    const node = tree.insert('[[a]]+/[[b]]', '[[a]]+/[[b]].vue')
    node.setCustomRouteBlock('[[a]]+/[[b]].vue', {
      params: { path: { b: { re: '(?:en|fr)' } } },
    })
    const pattern = compilePath(node)

    expect(pattern.match('/')).toEqual({ a: [], b: null })
    expect(pattern.match('/12/34')).toEqual({ a: ['12', '34'], b: null })
    expect(pattern.match('/fr')).toEqual({ a: [], b: 'fr' })
    expect(pattern.match('/12/34/en')).toEqual({ a: ['12', '34'], b: 'en' })
    expect(pattern.build({ a: [], b: null })).toBe('/')
    expect(pattern.build({ a: [], b: 'fr' })).toBe('/fr')
    expect(pattern.build({ a: ['12', '34'], b: 'en' })).toBe('/12/34/en')
    expect(() => pattern.match('/12/x/en')).toThrow()
    expect(() => pattern.match('/12/34/de')).toThrow()
    expect(() => pattern.match('/12/34/')).toThrow()
  })

  it('encodes static paths', () => {
    const pattern = generatePath('café/my page')

    expect(pattern.match('/caf%C3%A9/my%20page')).toEqual({})
    expect(pattern.build({})).toBe('/caf%C3%A9/my%20page')
    expect(() => pattern.match('/café/my page')).toThrow()
  })

  it('single param', () => {
    const pattern = generatePath('teams/[teamId]/b')

    expect(pattern.match('/teams/123/b')).toEqual({
      teamId: '123',
    })
    expect(pattern.match('/teams/abc/b')).toEqual({
      teamId: 'abc',
    })
    expect(() => pattern.match('/teams/123/c')).toThrow()
    expect(() => pattern.match('/teams/123/b/c')).toThrow()
    expect(() => pattern.match('/teams')).toThrow()
    expect(() => pattern.match('/teams/')).toThrow()
  })

  it('decodes single param', () => {
    const pattern = generatePath('teams/[teamId]')
    expect(pattern.match('/teams/a%20b')).toEqual({ teamId: 'a b' })
    expect(pattern.build({ teamId: 'a b' })).toBe('/teams/a%20b')
  })

  it('optional param', () => {
    const pattern = generatePath('teams/[[teamId]]/b')

    expect(pattern.match('/teams/b')).toEqual({ teamId: null })
    expect(pattern.match('/teams/123/b')).toEqual({ teamId: '123' })
    expect(() => pattern.match('/teams/123/c')).toThrow()
    expect(() => pattern.match('/teams/123/b/c')).toThrow()
    expect(() => pattern.match('/teams//b')).toThrow()
    expect(pattern.build({ teamId: '123' })).toBe('/teams/123/b')
    expect(pattern.build({ teamId: null })).toBe('/teams/b')
    expect(pattern.build({ teamId: '' })).toBe('/teams/b')
    expect('VUE_ROUTER_R0122').toHaveBeenWarnedTimes(1)
  })

  it('optional param in the end', () => {
    const pattern = generatePath('teams/[[teamId]]')

    expect(pattern.match('/teams')).toEqual({ teamId: null })
    expect(() => pattern.match('/teams/')).toThrow()
    expect(pattern.match('/teams/123')).toEqual({ teamId: '123' })
    expect(() => pattern.match('/teams/123/c')).toThrow()
    expect(() => pattern.match('/teams//b')).toThrow()
    expect(pattern.build({ teamId: '123' })).toBe('/teams/123')
    expect(pattern.build({ teamId: null })).toBe('/teams')
    expect(pattern.build({ teamId: '' })).toBe('/teams')
    expect('VUE_ROUTER_R0122').toHaveBeenWarnedTimes(1)
  })

  it('repeatable param', () => {
    const pattern = generatePath('teams/[teamId]+/b')

    expect(pattern.match('/teams/123/b')).toEqual({ teamId: ['123'] })
    expect(pattern.match('/teams/123/456/b')).toEqual({
      teamId: ['123', '456'],
    })
    expect(() => pattern.match('/teams/123/c')).toThrow()
    expect(() => pattern.match('/teams/123/b/c')).toThrow()
    expect(pattern.build({ teamId: ['123'] })).toBe('/teams/123/b')
    expect(pattern.build({ teamId: ['123', '456'] })).toBe('/teams/123/456/b')
  })

  it('repeatable param in the end', () => {
    const pattern = generatePath('teams/[teamId]+')

    expect(pattern.match('/teams/123')).toEqual({ teamId: ['123'] })
    expect(pattern.match('/teams/123/456')).toEqual({ teamId: ['123', '456'] })
    expect(() => pattern.match('/teams')).toThrow()
    expect(() => pattern.match('/teams/')).toThrow()
    expect(() => pattern.match('/teams/123/')).toThrow()
    expect(pattern.build({ teamId: ['123'] })).toBe('/teams/123')
    expect(pattern.build({ teamId: ['123', '456'] })).toBe('/teams/123/456')
    expect(() => pattern.build({ teamId: [] })).toThrow()
  })

  it('splat params with prefix', () => {
    const pattern = generatePath('teams/[...pathMatch]')
    expect(pattern.match('/teams/')).toEqual({ pathMatch: '' })
    expect(pattern.match('/teams/123/b')).toEqual({ pathMatch: '123/b' })
    expect(() => pattern.match('/teams')).toThrow()
    expect(() => pattern.match('/teamso/123/c')).toThrow()

    expect(pattern.build({ pathMatch: null })).toBe('/teams/')
    expect(pattern.build({ pathMatch: '' })).toBe('/teams/')
    expect(pattern.build({ pathMatch: '124' })).toBe('/teams/124')
    expect(pattern.build({ pathMatch: '124/b' })).toBe('/teams/124/b')
  })

  it('splat param without prefix', () => {
    const pattern = generatePath('[...pathMatch]')
    expect(pattern.match('/')).toEqual({ pathMatch: '' })
    expect(pattern.match('/123/b')).toEqual({ pathMatch: '123/b' })
    expect(pattern.match('/anything/goes/here')).toEqual({
      pathMatch: 'anything/goes/here',
    })

    expect(pattern.build({ pathMatch: null })).toBe('/')
    expect(pattern.build({ pathMatch: '' })).toBe('/')
    expect(pattern.build({ pathMatch: '124' })).toBe('/124')
    expect(pattern.build({ pathMatch: '124/b' })).toBe('/124/b')
  })

  it('repeatable optional param', () => {
    const pattern = generatePath('teams/[[teamId]]+/b')

    expect(pattern.match('/teams/123/b')).toEqual({ teamId: ['123'] })
    expect(pattern.match('/teams/123/456/b')).toEqual({
      teamId: ['123', '456'],
    })
    expect(pattern.match('/teams/b')).toEqual({ teamId: [] })

    expect(() => pattern.match('/teams/123/c')).toThrow()
    expect(() => pattern.match('/teams/123/b/c')).toThrow()

    expect(pattern.build({ teamId: ['123'] })).toBe('/teams/123/b')
    expect(pattern.build({ teamId: ['123', '456'] })).toBe('/teams/123/456/b')
    expect(pattern.build({ teamId: [] })).toBe('/teams/b')
  })

  it('works with empty values for repeatable optional param', () => {
    const pattern = generatePath('teams/[[teamId]]+/b')

    expect(pattern.build({ teamId: '' })).toBe('/teams/b')
    expect(pattern.build({ teamId: null })).toBe('/teams/b')
    expect(pattern.build({ teamId: undefined })).toBe('/teams/b')
    expect(pattern.build({})).toBe('/teams/b')
    expect('VUE_ROUTER_R0122').toHaveBeenWarnedTimes(2)
  })

  it('multiple params', () => {
    const pattern = generatePath('teams/[teamId]/[otherId]')

    expect(pattern.match('/teams/123/456')).toEqual({
      teamId: '123',
      otherId: '456',
    })
    expect(() => pattern.match('/teams/123')).toThrow()
    expect(() => pattern.match('/teams/123/456/c')).toThrow()
    expect(() => pattern.match('/teams/')).toThrow()
    expect(pattern.build({ teamId: '123', otherId: '456' })).toBe(
      '/teams/123/456'
    )
  })

  it('sub segments (params + static)', () => {
    const pattern = generatePath('teams/[teamId]-b-[otherId]')

    expect(pattern.match('/teams/123-b-456')).toEqual({
      teamId: '123',
      otherId: '456',
    })
    expect(() => pattern.match('/teams/123-b')).toThrow()
    expect(() => pattern.match('/teams/123-b-456/c')).toThrow()
    expect(() => pattern.match('/teams/')).toThrow()
    expect(pattern.build({ teamId: '123', otherId: '456' })).toBe(
      '/teams/123-b-456'
    )
  })

  it('matches and builds repeatable params in dot-separated paths', () => {
    const pattern = generatePath('set.[ids]+.other')

    expect(pattern.match('/set/123/other')).toEqual({ ids: ['123'] })
    expect(pattern.match('/set/123/456/other')).toEqual({ ids: ['123', '456'] })
    expect(pattern.build({ ids: ['123'] })).toBe('/set/123/other')
    expect(pattern.build({ ids: ['123', '456'] })).toBe('/set/123/456/other')
  })

  it('matches and builds multiple repeatable params in dot-separated paths', () => {
    const pattern = generatePath('before.[ids]+.middle.[other]+.after')

    expect(pattern.match('/before/a/middle/c/after')).toEqual({
      ids: ['a'],
      other: ['c'],
    })
    expect(pattern.match('/before/a/b/middle/c/d/after')).toEqual({
      ids: ['a', 'b'],
      other: ['c', 'd'],
    })
    expect(pattern.build({ ids: ['a', 'b'], other: ['c', 'd'] })).toBe(
      '/before/a/b/middle/c/d/after'
    )
  })

  it('omits route groups from matched and built paths', () => {
    const pattern = generatePath('(admin)/users/[id]')

    expect(pattern.match('/users/42')).toEqual({ id: '42' })
    expect(pattern.build({ id: '42' })).toBe('/users/42')
    expect(() => pattern.match('/admin/users/42')).toThrow()
  })

  it('uses custom regexps to reject invalid params', () => {
    const tree = new PrefixTree(resolveOptions({}))
    const node = tree.insert('orgs/[org]', 'orgs/[org].vue')
    node.setCustomRouteBlock('orgs/[org].vue', {
      params: { path: { org: { re: '@\\w+' } } },
    })
    const pattern = compilePath(node)

    expect(pattern.match('/orgs/@vue')).toEqual({ org: '@vue' })
    expect(pattern.build({ org: '@vue' })).toBe('/orgs/@vue')
    expect(() => pattern.match('/orgs/vue')).toThrow()
  })
})
