import { RouterMatcher } from '../../src/matcher'
import {
  START_LOCATION_NORMALIZED,
  RouteComponent,
  RouteRecord,
  MatcherLocation,
  MatcherLocationNormalized,
  MatcherLocationRedirect,
} from '../../src/types'
import { normalizeRouteRecord } from '../utils'

// @ts-ignore
const component: RouteComponent = null

function createRouterMatcher(records: RouteRecord[]) {
  return new RouterMatcher(records)
}

// for normalized records
const components = { default: component }

describe('Router Matcher', () => {
  describe('resolve', () => {
    function assertRecordMatch(
      record: RouteRecord | RouteRecord[],
      location: MatcherLocation,
      resolved: Partial<MatcherLocationNormalized>,
      start: MatcherLocationNormalized = START_LOCATION_NORMALIZED
    ) {
      record = Array.isArray(record) ? record : [record]
      const matcher = createRouterMatcher(record)

      if (!('meta' in resolved)) {
        resolved.meta = record[0].meta || {}
      }

      // add location if provided as it should be the same value
      if ('path' in location && !('path' in resolved)) {
        resolved.path = location.path
      }

      if ('redirect' in record) {
        throw new Error('not handled')
      } else {
        // use one single record
        if (!resolved.matched)
          // @ts-ignore
          resolved.matched = record.map(normalizeRouteRecord)
        else resolved.matched = resolved.matched.map(normalizeRouteRecord)
      }

      // allows not passing params
      if ('params' in location) {
        resolved.params = resolved.params || location.params
      } else {
        resolved.params = resolved.params || {}
      }

      const startCopy = {
        ...start,
        matched: start.matched.map(normalizeRouteRecord),
      }

      // make matched non enumerable
      Object.defineProperty(startCopy, 'matched', { enumerable: false })

      const result = matcher.resolve(location, startCopy)
      expect(result).toEqual(resolved)
    }

    /**
     *
     * @param record Record or records we are testing the matcher against
     * @param location location we want to reolve against
     * @param [start] Optional currentLocation used when resolving
     * @returns error
     */
    function assertErrorMatch(
      record: RouteRecord | RouteRecord[],
      location: MatcherLocation,
      start: MatcherLocationNormalized = START_LOCATION_NORMALIZED
    ): any {
      try {
        assertRecordMatch(record, location, {}, start)
      } catch (error) {
        return error
      }
    }

    describe('alias', () => {
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
                meta: { foo: true },
              },
            ],
          }
        )
      })

      it('resolves an alias with children', () => {
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
              { path: '/p', children, components },
              { path: '/p/one', name: 'nested', components },
            ],
          }
        )
      })
    })

    describe('LocationAsPath', () => {
      it('resolves a normal path', () => {
        assertRecordMatch(
          { path: '/', name: 'Home', components },
          { path: '/' },
          { name: 'Home', path: '/', params: {} }
        )
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
          // TODO: maybe it should consistently be an array for repeated params
          { name: 'a', params: { p: 'b/c' } }
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

      it('throws if the path does not exists', () => {
        expect(
          assertErrorMatch({ path: '/', components }, { path: '/foo' })
        ).toMatchSnapshot()
      })
    })

    describe('LocationAsName', () => {
      it('matches a name', () => {
        assertRecordMatch(
          { path: '/home', name: 'Home', components },
          { name: 'Home' },
          { name: 'Home', path: '/home' }
        )
      })

      it('matches a name and fill params', () => {
        assertRecordMatch(
          { path: '/users/:id/m/:role', name: 'UserEdit', components },
          { name: 'UserEdit', params: { id: 'posva', role: 'admin' } },
          { name: 'UserEdit', path: '/users/posva/m/admin' }
        )
      })

      it('throws if the named route does not exists', () => {
        expect(
          assertErrorMatch({ path: '/', components }, { name: 'Home' })
        ).toMatchSnapshot()
      })
    })

    describe('LocationAsRelative', () => {
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
            matched: [record],
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
            matched: [record],
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
            matched: [record],
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
            matched: [record],
            meta: {},
          }
        )
      })

      describe('redirects', () => {
        function assertRedirect(
          records: RouteRecord[],
          location: MatcherLocation,
          expected: MatcherLocationNormalized | MatcherLocationRedirect,
          currentLocation: MatcherLocationNormalized = START_LOCATION_NORMALIZED
        ) {
          const matcher = createRouterMatcher(records)
          const resolved = matcher.resolve(location, currentLocation)
          expect(resolved).toEqual(expected)
          return resolved
        }

        it('resolves a redirect string', () => {
          const records = [
            { path: '/home', components },
            { path: '/redirect', redirect: '/home' },
          ]
          assertRedirect(
            records,
            {
              name: undefined,
              path: '/redirect',
            },
            {
              redirect: '/home',
              normalizedLocation: {
                path: '/redirect',
                params: {},
                name: undefined,
                matched: [],
                meta: {},
              },
            }
          )
        })

        it('resolves a redirect function that returns a string', () => {
          const redirect = () => '/home'
          const records = [
            { path: '/home', components },
            { path: '/redirect', redirect },
          ]
          assertRedirect(
            records,
            {
              name: undefined,
              path: '/redirect',
            },
            {
              redirect,
              normalizedLocation: {
                path: '/redirect',
                params: {},
                name: undefined,
                matched: [],
                meta: {},
              },
            }
          )
        })

        it('resolves a redirect function that returns an object route', () => {
          const redirect = () => {
            path: '/home'
          }
          const records = [
            { path: '/home', components },
            { path: '/redirect', redirect },
          ]
          assertRedirect(
            records,
            {
              name: undefined,
              path: '/redirect',
            },
            {
              redirect,
              normalizedLocation: {
                path: '/redirect',
                params: {},
                name: undefined,
                matched: [],
                meta: {},
              },
            }
          )
        })

        it('resolves a redirect as an object', () => {
          const records = [
            { path: '/home', components },
            { path: '/redirect', redirect: { path: 'home' } },
          ]
          assertRedirect(
            records,
            {
              name: undefined,
              path: '/redirect',
            },
            {
              redirect: { path: 'home' },
              normalizedLocation: {
                path: '/redirect',
                params: {},
                name: undefined,
                matched: [],
                meta: {},
              },
            }
          )
        })

        it('works with a named location', () => {
          const records = [
            { path: '/home', components },
            { path: '/redirect', name: 'redirect', redirect: { path: 'home' } },
          ]
          assertRedirect(
            records,
            {
              name: 'redirect',
            },
            {
              redirect: { path: 'home' },
              normalizedLocation: {
                path: '/redirect',
                params: {},
                name: 'redirect',
                matched: [],
                meta: {},
              },
            }
          )
        })

        it('throws if relative location when redirecting', () => {
          expect(
            assertErrorMatch(
              { path: '/redirect', redirect: '/home' },
              { params: {} },
              {
                path: '/redirect',
                params: {},
                matched: [],
                name: undefined,
                meta: {},
              }
            )
          ).toMatchSnapshot()
        })

        it('normalize a location when redirecting', () => {
          const redirect = (to: any) => ({ name: 'b', params: to.params })
          const records = [
            { path: '/home', components },
            {
              path: '/a/:a',
              name: 'a',
              redirect,
            },
            { path: '/b/:a', name: 'b', components },
          ]
          assertRedirect(
            records,
            {
              path: '/a/foo',
            },
            {
              redirect,
              normalizedLocation: {
                path: '/a/foo',
                params: { a: 'foo' },
                name: 'a',
                matched: [],
                meta: {},
              },
            }
          )
        })
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
            {},
            {
              ...start,
              matched: start.matched.map(normalizeRouteRecord),
              meta: {},
            }
          )
        ).toMatchSnapshot()
      })
    })

    describe('children', () => {
      const ChildA = { path: 'a', name: 'child-a', components }
      const ChildB = { path: 'b', name: 'child-b', components }
      const ChildC = { path: 'c', name: 'child-c', components }
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
            matched: [Foo, { ...Nested, path: `${Foo.path}` }].map(
              normalizeRouteRecord
            ),
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
              Foo,
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
              Foo,
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
              Foo,
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
              Foo,
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
              Foo,
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
              Foo,
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
    })
  })
})
