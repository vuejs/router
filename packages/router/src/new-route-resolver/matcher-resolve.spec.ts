import { createRouterMatcher, normalizeRouteRecord } from '../matcher'
import { RouteComponent, RouteRecordRaw, MatcherLocation } from '../types'
import { defineComponent } from 'vue'
import { START_LOCATION_NORMALIZED } from '../location'
import { describe, expect, it } from 'vitest'
import { mockWarn } from '../../__tests__/vitest-mock-warn'
import {
  createCompiledMatcher,
  MatcherLocationRaw,
  NEW_MatcherRecordRaw,
  NEW_LocationResolved,
  NEW_MatcherRecord,
} from './resolver'
import { PathParams, tokensToParser } from '../matcher/pathParserRanker'
import { tokenizePath } from '../matcher/pathTokenizer'
import { miss } from './matchers/errors'
import { MatcherPatternPath } from './matcher-pattern'

// for raw route record
const component: RouteComponent = defineComponent({})
// for normalized route records
const components = { default: component }

function compileRouteRecord(
  record: RouteRecordRaw,
  parentRecord?: RouteRecordRaw
): NEW_MatcherRecordRaw {
  // we adapt the path to ensure they are absolute
  // TODO: aliases? they could be handled directly in the path matcher
  const path = record.path.startsWith('/')
    ? record.path
    : (parentRecord?.path || '') + record.path
  record.path = path
  const parser = tokensToParser(tokenizePath(record.path), {
    // start: true,
    end: record.end,
    sensitive: record.sensitive,
    strict: record.strict,
  })

  return {
    name: record.name,

    path: {
      match(value) {
        const params = parser.parse(value)
        if (params) {
          return params
        }
        throw miss()
      },
      build(params) {
        // TODO: normalize params?
        return parser.stringify(params)
      },
    } satisfies MatcherPatternPath<PathParams>,

    children: record.children?.map(childRecord =>
      compileRouteRecord(childRecord, record)
    ),
  }
}

describe('RouterMatcher.resolve', () => {
  mockWarn()
  type Matcher = ReturnType<typeof createCompiledMatcher>
  type MatcherResolvedLocation = ReturnType<Matcher['resolve']>

  const START_LOCATION: MatcherResolvedLocation = {
    name: Symbol('START'),
    params: {},
    path: '/',
    fullPath: '/',
    query: {},
    hash: '',
    matched: [],
    // meta: {},
  }

  function isMatcherLocationResolved(
    location: unknown
  ): location is NEW_LocationResolved<NEW_MatcherRecord> {
    return !!(
      location &&
      typeof location === 'object' &&
      'matched' in location &&
      'fullPath' in location &&
      Array.isArray(location.matched)
    )
  }

  // TODO: rework with object param for clarity

  function assertRecordMatch(
    record: RouteRecordRaw | RouteRecordRaw[],
    toLocation: MatcherLocationRaw,
    expectedLocation: Partial<MatcherResolvedLocation>,
    fromLocation:
      | NEW_LocationResolved<NEW_MatcherRecord>
      | Exclude<MatcherLocationRaw, string>
      | `/${string}` = START_LOCATION
  ) {
    const records = (Array.isArray(record) ? record : [record]).map(
      (record): NEW_MatcherRecordRaw => compileRouteRecord(record)
    )
    const matcher = createCompiledMatcher<NEW_MatcherRecord>()
    for (const record of records) {
      matcher.addMatcher(record)
    }

    const resolved: MatcherResolvedLocation = {
      // FIXME: to add later
      // meta: records[0].meta || {},
      path:
        typeof toLocation === 'string' ? toLocation : toLocation.path || '/',
      name: expect.any(Symbol) as symbol,
      matched: [], // FIXME: build up
      params: (typeof toLocation === 'object' && toLocation.params) || {},
      ...expectedLocation,
    }

    Object.defineProperty(resolved, 'matched', {
      writable: true,
      configurable: true,
      enumerable: false,
      value: [],
    })

    fromLocation = isMatcherLocationResolved(fromLocation)
      ? fromLocation
      : matcher.resolve(fromLocation)

    expect(matcher.resolve(toLocation, fromLocation)).toMatchObject({
      // avoid undesired properties
      query: {},
      hash: '',
      ...resolved,
    })
  }

  /**
   *
   * @param record - Record or records we are testing the matcher against
   * @param location - location we want to resolve against
   * @param [start] Optional currentLocation used when resolving
   * @returns error
   */
  function assertErrorMatch(
    record: RouteRecordRaw | RouteRecordRaw[],
    location: MatcherLocationRaw,
    start: MatcherLocation = START_LOCATION_NORMALIZED
  ) {
    assertRecordMatch(record, location, {}, start)
  }

  describe.skip('LocationAsPath', () => {
    it('resolves a normal path', () => {
      assertRecordMatch({ path: '/', name: 'Home', components }, '/', {
        name: 'Home',
        path: '/',
        params: {},
      })
    })

    it('resolves a normal path without name', () => {
      assertRecordMatch(
        { path: '/', components },
        { path: '/' },
        { name: undefined, path: '/', params: {} }
      )
    })

    it('resolves a path with params', () => {
      assertRecordMatch(
        { path: '/users/:id', name: 'User', components },
        { path: '/users/posva' },
        { name: 'User', params: { id: 'posva' } }
      )
    })

    it('resolves an array of params for a repeatable params', () => {
      assertRecordMatch(
        { path: '/a/:p+', name: 'a', components },
        { name: 'a', params: { p: ['b', 'c', 'd'] } },
        { name: 'a', path: '/a/b/c/d', params: { p: ['b', 'c', 'd'] } }
      )
    })

    it('resolves single params for a repeatable params', () => {
      assertRecordMatch(
        { path: '/a/:p+', name: 'a', components },
        { name: 'a', params: { p: 'b' } },
        { name: 'a', path: '/a/b', params: { p: 'b' } }
      )
    })

    it('keeps repeated params as a single one when provided through path', () => {
      assertRecordMatch(
        { path: '/a/:p+', name: 'a', components },
        { path: '/a/b/c' },
        { name: 'a', params: { p: ['b', 'c'] } }
      )
    })

    it('resolves a path with multiple params', () => {
      assertRecordMatch(
        { path: '/users/:id/:other', name: 'User', components },
        { path: '/users/posva/hey' },
        { name: 'User', params: { id: 'posva', other: 'hey' } }
      )
    })

    it('resolves a path with multiple params but no name', () => {
      assertRecordMatch(
        { path: '/users/:id/:other', components },
        { path: '/users/posva/hey' },
        { name: undefined, params: { id: 'posva', other: 'hey' } }
      )
    })

    it('returns an empty match when the path does not exist', () => {
      assertRecordMatch(
        { path: '/', components },
        { path: '/foo' },
        { name: undefined, params: {}, path: '/foo', matched: [] }
      )
    })

    it('allows an optional trailing slash', () => {
      assertRecordMatch(
        { path: '/home/', name: 'Home', components },
        { path: '/home/' },
        { name: 'Home', path: '/home/', matched: expect.any(Array) }
      )
    })

    it('allows an optional trailing slash with optional param', () => {
      assertRecordMatch(
        { path: '/:a', components, name: 'a' },
        { path: '/a/' },
        { path: '/a/', params: { a: 'a' }, name: 'a' }
      )
      assertRecordMatch(
        { path: '/a/:a', components, name: 'a' },
        { path: '/a/a/' },
        { path: '/a/a/', params: { a: 'a' }, name: 'a' }
      )
    })

    it('allows an optional trailing slash with missing optional param', () => {
      assertRecordMatch(
        { path: '/:a?', components, name: 'a' },
        { path: '/' },
        { path: '/', params: { a: '' }, name: 'a' }
      )
      assertRecordMatch(
        { path: '/a/:a?', components, name: 'a' },
        { path: '/a/' },
        { path: '/a/', params: { a: '' }, name: 'a' }
      )
    })

    it('keeps required trailing slash (strict: true)', () => {
      const record = {
        path: '/home/',
        name: 'Home',
        components,
        options: { strict: true },
      }
      assertErrorMatch(record, { path: '/home' })
      assertRecordMatch(
        record,
        { path: '/home/' },
        { name: 'Home', path: '/home/', matched: expect.any(Array) }
      )
    })

    it('rejects a trailing slash when strict', () => {
      const record = {
        path: '/home',
        name: 'Home',
        components,
        options: { strict: true },
      }
      assertRecordMatch(
        record,
        { path: '/home' },
        { name: 'Home', path: '/home', matched: expect.any(Array) }
      )
      assertErrorMatch(record, { path: '/home/' })
    })
  })

  describe('LocationAsName', () => {
    it('matches a name', () => {
      assertRecordMatch(
        { path: '/home', name: 'Home', components },
        // TODO: allow a name only without the params?
        { name: 'Home', params: {} },
        { name: 'Home', path: '/home' }
      )
    })

    it('matches a name and fill params', () => {
      assertRecordMatch(
        { path: '/users/:id/m/:role', name: 'UserEdit', components },
        { name: 'UserEdit', params: { id: 'posva', role: 'admin' } },
        {
          name: 'UserEdit',
          path: '/users/posva/m/admin',
          params: { id: 'posva', role: 'admin' },
        }
      )
    })

    it('throws if the named route does not exists', () => {
      expect(() =>
        assertErrorMatch(
          { path: '/', components },
          { name: 'Home', params: {} }
        )
      ).toThrowError('Matcher "Home" not found')
    })

    it('merges params', () => {
      assertRecordMatch(
        { path: '/:a/:b', name: 'p', components },
        { params: { b: 'b' } },
        { name: 'p', path: '/A/b', params: { a: 'A', b: 'b' } },
        '/A/B'
      )
    })

    // TODO: new matcher no longer allows implicit param merging
    it.todo('only keep existing params', () => {
      assertRecordMatch(
        { path: '/:a/:b', name: 'p', components },
        { name: 'p', params: { b: 'b' } },
        { name: 'p', path: '/a/b', params: { a: 'a', b: 'b' } },
        '/a/c'
      )
    })

    // TODO: implement parent children
    it.todo('keep optional params from parent record', () => {
      const Child_A = { path: 'a', name: 'child_a', components }
      const Child_B = { path: 'b', name: 'child_b', components }
      const Parent = {
        path: '/:optional?/parent',
        name: 'parent',
        components,
        children: [Child_A, Child_B],
      }
      assertRecordMatch(
        Parent,
        { name: 'child_b' },
        {
          name: 'child_b',
          path: '/foo/parent/b',
          params: { optional: 'foo' },
          matched: [
            Parent as any,
            {
              ...Child_B,
              path: `${Parent.path}/${Child_B.path}`,
            },
          ],
        },
        {
          params: { optional: 'foo' },
          path: '/foo/parent/a',
          matched: [],
          meta: {},
          name: undefined,
        }
      )
    })

    // TODO: check if needed by the active matching, if not just test that the param is dropped
    it.todo('discards non existent params', () => {
      assertRecordMatch(
        { path: '/', name: 'home', components },
        { name: 'home', params: { a: 'a', b: 'b' } },
        { name: 'home', path: '/', params: {} }
      )
      expect('invalid param(s) "a", "b" ').toHaveBeenWarned()
      assertRecordMatch(
        { path: '/:b', name: 'a', components },
        { name: 'a', params: { a: 'a', b: 'b' } },
        { name: 'a', path: '/b', params: { b: 'b' } }
      )
      expect('invalid param(s) "a"').toHaveBeenWarned()
    })

    it('drops optional params in absolute location', () => {
      assertRecordMatch(
        { path: '/:a/:b?', name: 'p', components },
        { name: 'p', params: { a: 'b' } },
        { name: 'p', path: '/b', params: { a: 'b' } }
      )
    })

    it('keeps optional params passed as empty strings', () => {
      assertRecordMatch(
        { path: '/:a/:b?', name: 'p', components },
        { name: 'p', params: { a: 'b', b: '' } },
        { name: 'p', path: '/b', params: { a: 'b', b: '' } }
      )
    })

    it('resolves root path with optional params', () => {
      assertRecordMatch(
        { path: '/:tab?', name: 'h', components },
        { name: 'h', params: {} },
        { name: 'h', path: '/', params: {} }
      )
      assertRecordMatch(
        { path: '/:tab?/:other?', name: 'h', components },
        { name: 'h', params: {} },
        { name: 'h', path: '/', params: {} }
      )
    })
  })

  describe.skip('LocationAsRelative', () => {
    it('warns if a path isn not absolute', () => {
      const record = {
        path: '/parent',
        components,
      }
      const matcher = createRouterMatcher([record], {})
      matcher.resolve(
        { path: 'two' },
        {
          path: '/parent/one',
          name: undefined,
          params: {},
          matched: [] as any,
          meta: {},
        }
      )
      expect('received "two"').toHaveBeenWarned()
    })

    it('matches with nothing', () => {
      const record = { path: '/home', name: 'Home', components }
      assertRecordMatch(
        record,
        {},
        { name: 'Home', path: '/home' },
        {
          name: 'Home',
          params: {},
          path: '/home',
          matched: [record] as any,
          meta: {},
        }
      )
    })

    it('replace params even with no name', () => {
      const record = { path: '/users/:id/m/:role', components }
      assertRecordMatch(
        record,
        { params: { id: 'posva', role: 'admin' } },
        { name: undefined, path: '/users/posva/m/admin' },
        {
          path: '/users/ed/m/user',
          name: undefined,
          params: { id: 'ed', role: 'user' },
          matched: [record] as any,
          meta: {},
        }
      )
    })

    it('replace params', () => {
      const record = {
        path: '/users/:id/m/:role',
        name: 'UserEdit',
        components,
      }
      assertRecordMatch(
        record,
        { params: { id: 'posva', role: 'admin' } },
        { name: 'UserEdit', path: '/users/posva/m/admin' },
        {
          path: '/users/ed/m/user',
          name: 'UserEdit',
          params: { id: 'ed', role: 'user' },
          matched: [],
          meta: {},
        }
      )
    })

    it('keep params if not provided', () => {
      const record = {
        path: '/users/:id/m/:role',
        name: 'UserEdit',
        components,
      }
      assertRecordMatch(
        record,
        {},
        {
          name: 'UserEdit',
          path: '/users/ed/m/user',
          params: { id: 'ed', role: 'user' },
        },
        {
          path: '/users/ed/m/user',
          name: 'UserEdit',
          params: { id: 'ed', role: 'user' },
          matched: [record] as any,
          meta: {},
        }
      )
    })

    it('keep params if not provided even with no name', () => {
      const record = { path: '/users/:id/m/:role', components }
      assertRecordMatch(
        record,
        {},
        {
          name: undefined,
          path: '/users/ed/m/user',
          params: { id: 'ed', role: 'user' },
        },
        {
          path: '/users/ed/m/user',
          name: undefined,
          params: { id: 'ed', role: 'user' },
          matched: [record] as any,
          meta: {},
        }
      )
    })

    it('merges params', () => {
      assertRecordMatch(
        { path: '/:a/:b?', name: 'p', components },
        { params: { b: 'b' } },
        { name: 'p', path: '/a/b', params: { a: 'a', b: 'b' } },
        {
          name: 'p',
          params: { a: 'a' },
          path: '/a',
          matched: [],
          meta: {},
        }
      )
    })

    it('keep optional params', () => {
      assertRecordMatch(
        { path: '/:a/:b?', name: 'p', components },
        {},
        { name: 'p', path: '/a/b', params: { a: 'a', b: 'b' } },
        {
          name: 'p',
          params: { a: 'a', b: 'b' },
          path: '/a/b',
          matched: [],
          meta: {},
        }
      )
    })

    it('merges optional params', () => {
      assertRecordMatch(
        { path: '/:a/:b?', name: 'p', components },
        { params: { a: 'c' } },
        { name: 'p', path: '/c/b', params: { a: 'c', b: 'b' } },
        {
          name: 'p',
          params: { a: 'a', b: 'b' },
          path: '/a/b',
          matched: [],
          meta: {},
        }
      )
    })

    it('throws if the current named route does not exists', () => {
      const record = { path: '/', components }
      const start = {
        name: 'home',
        params: {},
        path: '/',
        matched: [record],
      }
      // the property should be non enumerable
      Object.defineProperty(start, 'matched', { enumerable: false })
      expect(
        assertErrorMatch(
          record,
          { params: { a: 'foo' } },
          {
            ...start,
            matched: start.matched.map(normalizeRouteRecord),
            meta: {},
          }
        )
      ).toMatchSnapshot()
    })

    it('avoids records with children without a component nor name', () => {
      assertErrorMatch(
        {
          path: '/articles',
          children: [{ path: ':id', components }],
        },
        { path: '/articles' }
      )
    })

    it('avoid deeply nested records with children without a component nor name', () => {
      assertErrorMatch(
        {
          path: '/app',
          components,
          children: [
            {
              path: '/articles',
              children: [{ path: ':id', components }],
            },
          ],
        },
        { path: '/articles' }
      )
    })

    it('can reach a named route with children and no component if named', () => {
      assertRecordMatch(
        {
          path: '/articles',
          name: 'ArticlesParent',
          children: [{ path: ':id', components }],
        },
        { name: 'ArticlesParent' },
        { name: 'ArticlesParent', path: '/articles' }
      )
    })
  })

  describe.skip('alias', () => {
    it('resolves an alias', () => {
      assertRecordMatch(
        {
          path: '/',
          alias: '/home',
          name: 'Home',
          components,
          meta: { foo: true },
        },
        { path: '/home' },
        {
          name: 'Home',
          path: '/home',
          params: {},
          meta: { foo: true },
          matched: [
            {
              path: '/home',
              name: 'Home',
              components,
              aliasOf: expect.objectContaining({ name: 'Home', path: '/' }),
              meta: { foo: true },
            },
          ],
        }
      )
    })

    it('multiple aliases', () => {
      const record = {
        path: '/',
        alias: ['/home', '/start'],
        name: 'Home',
        components,
        meta: { foo: true },
      }

      assertRecordMatch(
        record,
        { path: '/' },
        {
          name: 'Home',
          path: '/',
          params: {},
          meta: { foo: true },
          matched: [
            {
              path: '/',
              name: 'Home',
              components,
              aliasOf: undefined,
              meta: { foo: true },
            },
          ],
        }
      )
      assertRecordMatch(
        record,
        { path: '/home' },
        {
          name: 'Home',
          path: '/home',
          params: {},
          meta: { foo: true },
          matched: [
            {
              path: '/home',
              name: 'Home',
              components,
              aliasOf: expect.objectContaining({ name: 'Home', path: '/' }),
              meta: { foo: true },
            },
          ],
        }
      )
      assertRecordMatch(
        record,
        { path: '/start' },
        {
          name: 'Home',
          path: '/start',
          params: {},
          meta: { foo: true },
          matched: [
            {
              path: '/start',
              name: 'Home',
              components,
              aliasOf: expect.objectContaining({ name: 'Home', path: '/' }),
              meta: { foo: true },
            },
          ],
        }
      )
    })

    it('resolves the original record by name', () => {
      assertRecordMatch(
        {
          path: '/',
          alias: '/home',
          name: 'Home',
          components,
          meta: { foo: true },
        },
        { name: 'Home' },
        {
          name: 'Home',
          path: '/',
          params: {},
          meta: { foo: true },
          matched: [
            {
              path: '/',
              name: 'Home',
              components,
              aliasOf: undefined,
              meta: { foo: true },
            },
          ],
        }
      )
    })

    it('resolves an alias with children to the alias when using the path', () => {
      const children = [{ path: 'one', component, name: 'nested' }]
      assertRecordMatch(
        {
          path: '/parent',
          alias: '/p',
          component,
          children,
        },
        { path: '/p/one' },
        {
          path: '/p/one',
          name: 'nested',
          params: {},
          matched: [
            {
              path: '/p',
              children,
              components,
              aliasOf: expect.objectContaining({ path: '/parent' }),
            },
            {
              path: '/p/one',
              name: 'nested',
              components,
              aliasOf: expect.objectContaining({ path: '/parent/one' }),
            },
          ],
        }
      )
    })

    describe('nested aliases', () => {
      const children = [
        {
          path: 'one',
          component,
          name: 'nested',
          alias: 'o',
          children: [
            { path: 'two', alias: 't', name: 'nestednested', component },
          ],
        },
        {
          path: 'other',
          alias: 'otherAlias',
          component,
          name: 'other',
        },
      ]
      const record = {
        path: '/parent',
        name: 'parent',
        alias: '/p',
        component,
        children,
      }

      it('resolves the parent as an alias', () => {
        assertRecordMatch(
          record,
          { path: '/p' },
          expect.objectContaining({
            path: '/p',
            name: 'parent',
            matched: [
              expect.objectContaining({
                path: '/p',
                aliasOf: expect.objectContaining({ path: '/parent' }),
              }),
            ],
          })
        )
      })

      describe('multiple children', () => {
        // tests concerning the /parent/other path and its aliases

        it('resolves the alias parent', () => {
          assertRecordMatch(
            record,
            { path: '/p/other' },
            expect.objectContaining({
              path: '/p/other',
              name: 'other',
              matched: [
                expect.objectContaining({
                  path: '/p',
                  aliasOf: expect.objectContaining({ path: '/parent' }),
                }),
                expect.objectContaining({
                  path: '/p/other',
                  aliasOf: expect.objectContaining({ path: '/parent/other' }),
                }),
              ],
            })
          )
        })

        it('resolves the alias child', () => {
          assertRecordMatch(
            record,
            { path: '/parent/otherAlias' },
            expect.objectContaining({
              path: '/parent/otherAlias',
              name: 'other',
              matched: [
                expect.objectContaining({
                  path: '/parent',
                  aliasOf: undefined,
                }),
                expect.objectContaining({
                  path: '/parent/otherAlias',
                  aliasOf: expect.objectContaining({ path: '/parent/other' }),
                }),
              ],
            })
          )
        })

        it('resolves the alias parent and child', () => {
          assertRecordMatch(
            record,
            { path: '/p/otherAlias' },
            expect.objectContaining({
              path: '/p/otherAlias',
              name: 'other',
              matched: [
                expect.objectContaining({
                  path: '/p',
                  aliasOf: expect.objectContaining({ path: '/parent' }),
                }),
                expect.objectContaining({
                  path: '/p/otherAlias',
                  aliasOf: expect.objectContaining({ path: '/parent/other' }),
                }),
              ],
            })
          )
        })
      })

      it('resolves the original one with no aliases', () => {
        assertRecordMatch(
          record,
          { path: '/parent/one/two' },
          expect.objectContaining({
            path: '/parent/one/two',
            name: 'nestednested',
            matched: [
              expect.objectContaining({
                path: '/parent',
                aliasOf: undefined,
              }),
              expect.objectContaining({
                path: '/parent/one',
                aliasOf: undefined,
              }),
              expect.objectContaining({
                path: '/parent/one/two',
                aliasOf: undefined,
              }),
            ],
          })
        )
      })

      it.todo('resolves when parent is an alias and child has an absolute path')

      it('resolves when parent is an alias', () => {
        assertRecordMatch(
          record,
          { path: '/p/one/two' },
          expect.objectContaining({
            path: '/p/one/two',
            name: 'nestednested',
            matched: [
              expect.objectContaining({
                path: '/p',
                aliasOf: expect.objectContaining({ path: '/parent' }),
              }),
              expect.objectContaining({
                path: '/p/one',
                aliasOf: expect.objectContaining({ path: '/parent/one' }),
              }),
              expect.objectContaining({
                path: '/p/one/two',
                aliasOf: expect.objectContaining({ path: '/parent/one/two' }),
              }),
            ],
          })
        )
      })

      it('resolves a different child when parent is an alias', () => {
        assertRecordMatch(
          record,
          { path: '/p/other' },
          expect.objectContaining({
            path: '/p/other',
            name: 'other',
            matched: [
              expect.objectContaining({
                path: '/p',
                aliasOf: expect.objectContaining({ path: '/parent' }),
              }),
              expect.objectContaining({
                path: '/p/other',
                aliasOf: expect.objectContaining({ path: '/parent/other' }),
              }),
            ],
          })
        )
      })

      it('resolves when the first child is an alias', () => {
        assertRecordMatch(
          record,
          { path: '/parent/o/two' },
          expect.objectContaining({
            path: '/parent/o/two',
            name: 'nestednested',
            matched: [
              expect.objectContaining({
                path: '/parent',
                aliasOf: undefined,
              }),
              expect.objectContaining({
                path: '/parent/o',
                aliasOf: expect.objectContaining({ path: '/parent/one' }),
              }),
              expect.objectContaining({
                path: '/parent/o/two',
                aliasOf: expect.objectContaining({ path: '/parent/one/two' }),
              }),
            ],
          })
        )
      })

      it('resolves when the second child is an alias', () => {
        assertRecordMatch(
          record,
          { path: '/parent/one/t' },
          expect.objectContaining({
            path: '/parent/one/t',
            name: 'nestednested',
            matched: [
              expect.objectContaining({
                path: '/parent',
                aliasOf: undefined,
              }),
              expect.objectContaining({
                path: '/parent/one',
                aliasOf: undefined,
              }),
              expect.objectContaining({
                path: '/parent/one/t',
                aliasOf: expect.objectContaining({ path: '/parent/one/two' }),
              }),
            ],
          })
        )
      })

      it('resolves when the two last children are aliases', () => {
        assertRecordMatch(
          record,
          { path: '/parent/o/t' },
          expect.objectContaining({
            path: '/parent/o/t',
            name: 'nestednested',
            matched: [
              expect.objectContaining({
                path: '/parent',
                aliasOf: undefined,
              }),
              expect.objectContaining({
                path: '/parent/o',
                aliasOf: expect.objectContaining({ path: '/parent/one' }),
              }),
              expect.objectContaining({
                path: '/parent/o/t',
                aliasOf: expect.objectContaining({ path: '/parent/one/two' }),
              }),
            ],
          })
        )
      })

      it('resolves when all are aliases', () => {
        assertRecordMatch(
          record,
          { path: '/p/o/t' },
          expect.objectContaining({
            path: '/p/o/t',
            name: 'nestednested',
            matched: [
              expect.objectContaining({
                path: '/p',
                aliasOf: expect.objectContaining({ path: '/parent' }),
              }),
              expect.objectContaining({
                path: '/p/o',
                aliasOf: expect.objectContaining({ path: '/parent/one' }),
              }),
              expect.objectContaining({
                path: '/p/o/t',
                aliasOf: expect.objectContaining({ path: '/parent/one/two' }),
              }),
            ],
          })
        )
      })

      it('resolves when first and last are aliases', () => {
        assertRecordMatch(
          record,
          { path: '/p/one/t' },
          expect.objectContaining({
            path: '/p/one/t',
            name: 'nestednested',
            matched: [
              expect.objectContaining({
                path: '/p',
                aliasOf: expect.objectContaining({ path: '/parent' }),
              }),
              expect.objectContaining({
                path: '/p/one',
                aliasOf: expect.objectContaining({ path: '/parent/one' }),
              }),
              expect.objectContaining({
                path: '/p/one/t',
                aliasOf: expect.objectContaining({ path: '/parent/one/two' }),
              }),
            ],
          })
        )
      })
    })

    it('resolves the original path of the named children of a route with an alias', () => {
      const children = [{ path: 'one', component, name: 'nested' }]
      assertRecordMatch(
        {
          path: '/parent',
          alias: '/p',
          component,
          children,
        },
        { name: 'nested' },
        {
          path: '/parent/one',
          name: 'nested',
          params: {},
          matched: [
            {
              path: '/parent',
              children,
              components,
              aliasOf: undefined,
            },
            { path: '/parent/one', name: 'nested', components },
          ],
        }
      )
    })
  })

  describe.skip('children', () => {
    const ChildA = { path: 'a', name: 'child-a', components }
    const ChildB = { path: 'b', name: 'child-b', components }
    const ChildC = { path: 'c', name: 'child-c', components }
    const ChildD = { path: '/absolute', name: 'absolute', components }
    const ChildWithParam = { path: ':p', name: 'child-params', components }
    const NestedChildWithParam = {
      ...ChildWithParam,
      name: 'nested-child-params',
    }
    const NestedChildA = { ...ChildA, name: 'nested-child-a' }
    const NestedChildB = { ...ChildB, name: 'nested-child-b' }
    const NestedChildC = { ...ChildC, name: 'nested-child-c' }
    const Nested = {
      path: 'nested',
      name: 'nested',
      components,
      children: [NestedChildA, NestedChildB, NestedChildC],
    }
    const NestedWithParam = {
      path: 'nested/:n',
      name: 'nested',
      components,
      children: [NestedChildWithParam],
    }

    it('resolves children', () => {
      const Foo = {
        path: '/foo',
        name: 'Foo',
        components,
        children: [ChildA, ChildB, ChildC],
      }
      assertRecordMatch(
        Foo,
        { path: '/foo/b' },
        {
          name: 'child-b',
          path: '/foo/b',
          params: {},
          matched: [Foo, { ...ChildB, path: `${Foo.path}/${ChildB.path}` }],
        }
      )
    })

    it('resolves children with empty paths', () => {
      const Nested = { path: '', name: 'nested', components }
      const Foo = {
        path: '/foo',
        name: 'Foo',
        components,
        children: [Nested],
      }
      assertRecordMatch(
        Foo,
        { path: '/foo' },
        {
          name: 'nested',
          path: '/foo',
          params: {},
          matched: [Foo as any, { ...Nested, path: `${Foo.path}` }],
        }
      )
    })

    it('resolves nested children with empty paths', () => {
      const NestedNested = { path: '', name: 'nested', components }
      const Nested = {
        path: '',
        name: 'nested-nested',
        components,
        children: [NestedNested],
      }
      const Foo = {
        path: '/foo',
        name: 'Foo',
        components,
        children: [Nested],
      }
      assertRecordMatch(
        Foo,
        { path: '/foo' },
        {
          name: 'nested',
          path: '/foo',
          params: {},
          matched: [
            Foo as any,
            { ...Nested, path: `${Foo.path}` },
            { ...NestedNested, path: `${Foo.path}` },
          ],
        }
      )
    })

    it('resolves nested children', () => {
      const Foo = {
        path: '/foo',
        name: 'Foo',
        components,
        children: [Nested],
      }
      assertRecordMatch(
        Foo,
        { path: '/foo/nested/a' },
        {
          name: 'nested-child-a',
          path: '/foo/nested/a',
          params: {},
          matched: [
            Foo as any,
            { ...Nested, path: `${Foo.path}/${Nested.path}` },
            {
              ...NestedChildA,
              path: `${Foo.path}/${Nested.path}/${NestedChildA.path}`,
            },
          ],
        }
      )
    })

    it('resolves nested children with named location', () => {
      const Foo = {
        path: '/foo',
        name: 'Foo',
        components,
        children: [Nested],
      }
      assertRecordMatch(
        Foo,
        { name: 'nested-child-a' },
        {
          name: 'nested-child-a',
          path: '/foo/nested/a',
          params: {},
          matched: [
            Foo as any,
            { ...Nested, path: `${Foo.path}/${Nested.path}` },
            {
              ...NestedChildA,
              path: `${Foo.path}/${Nested.path}/${NestedChildA.path}`,
            },
          ],
        }
      )
    })

    it('resolves nested children with relative location', () => {
      const Foo = {
        path: '/foo',
        name: 'Foo',
        components,
        children: [Nested],
      }
      assertRecordMatch(
        Foo,
        {},
        {
          name: 'nested-child-a',
          path: '/foo/nested/a',
          params: {},
          matched: [
            Foo as any,
            { ...Nested, path: `${Foo.path}/${Nested.path}` },
            {
              ...NestedChildA,
              path: `${Foo.path}/${Nested.path}/${NestedChildA.path}`,
            },
          ],
        },
        {
          name: 'nested-child-a',
          matched: [],
          params: {},
          path: '/foo/nested/a',
          meta: {},
        }
      )
    })

    it('resolves nested children with params', () => {
      const Foo = {
        path: '/foo',
        name: 'Foo',
        components,
        children: [NestedWithParam],
      }
      assertRecordMatch(
        Foo,
        { path: '/foo/nested/a/b' },
        {
          name: 'nested-child-params',
          path: '/foo/nested/a/b',
          params: { p: 'b', n: 'a' },
          matched: [
            Foo as any,
            {
              ...NestedWithParam,
              path: `${Foo.path}/${NestedWithParam.path}`,
            },
            {
              ...NestedChildWithParam,
              path: `${Foo.path}/${NestedWithParam.path}/${NestedChildWithParam.path}`,
            },
          ],
        }
      )
    })

    it('resolves nested children with params with named location', () => {
      const Foo = {
        path: '/foo',
        name: 'Foo',
        components,
        children: [NestedWithParam],
      }
      assertRecordMatch(
        Foo,
        { name: 'nested-child-params', params: { p: 'a', n: 'b' } },
        {
          name: 'nested-child-params',
          path: '/foo/nested/b/a',
          params: { p: 'a', n: 'b' },
          matched: [
            Foo as any,
            {
              ...NestedWithParam,
              path: `${Foo.path}/${NestedWithParam.path}`,
            },
            {
              ...NestedChildWithParam,
              path: `${Foo.path}/${NestedWithParam.path}/${NestedChildWithParam.path}`,
            },
          ],
        }
      )
    })

    it('resolves absolute path children', () => {
      const Foo = {
        path: '/foo',
        name: 'Foo',
        components,
        children: [ChildA, ChildD],
      }
      assertRecordMatch(
        Foo,
        { path: '/absolute' },
        {
          name: 'absolute',
          path: '/absolute',
          params: {},
          matched: [Foo, ChildD],
        }
      )
    })

    it('resolves children with root as the parent', () => {
      const Nested = { path: 'nested', name: 'nested', components }
      const Parent = {
        path: '/',
        name: 'parent',
        components,
        children: [Nested],
      }
      assertRecordMatch(
        Parent,
        { path: '/nested' },
        {
          name: 'nested',
          path: '/nested',
          params: {},
          matched: [Parent as any, { ...Nested, path: `/nested` }],
        }
      )
    })

    it('resolves children with parent with trailing slash', () => {
      const Nested = { path: 'nested', name: 'nested', components }
      const Parent = {
        path: '/parent/',
        name: 'parent',
        components,
        children: [Nested],
      }
      assertRecordMatch(
        Parent,
        { path: '/parent/nested' },
        {
          name: 'nested',
          path: '/parent/nested',
          params: {},
          matched: [Parent as any, { ...Nested, path: `/parent/nested` }],
        }
      )
    })
  })
})
