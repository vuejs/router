// @ts-check
require('./helper')
const expect = require('expect')
const { RouterMatcher } = require('../src/matcher')
const { START_LOCATION_NORMALIZED } = require('../src/types')

const component = null

/** @typedef {import('../src/types').RouteRecord} RouteRecord */
/** @typedef {import('../src/types').MatcherLocation} MatcherLocation */
/** @typedef {import('../src/types').MatcherLocationRedirect} MatcherLocationRedirect */
/** @typedef {import('../src/types').MatcherLocationNormalized} MatcherLocationNormalized */

describe('Router Matcher', () => {
  describe('resolve', () => {
    /**
     *
     * @param {RouteRecord | RouteRecord[]} record Record or records we are testing the matcher against
     * @param {MatcherLocation} location location we want to reolve against
     * @param {Partial<MatcherLocationNormalized>} resolved Expected resolved location given by the matcher
     * @param {MatcherLocationNormalized} [start] Optional currentLocation used when resolving
     */
    function assertRecordMatch(
      record,
      location,
      resolved,
      start = START_LOCATION_NORMALIZED
    ) {
      record = Array.isArray(record) ? record : [record]
      const matcher = new RouterMatcher(record)
      const targetLocation = {}

      // add location if provided as it should be the same value
      if ('path' in location) {
        resolved.path = location.path
      }

      if ('redirect' in record) {
      } else {
        // use one single record
        // @ts-ignore
        if (!('matched' in resolved)) resolved.matched = record
      }

      // allows not passing params
      if ('params' in location) {
        resolved.params = resolved.params || location.params
      } else {
        resolved.params = resolved.params || {}
      }

      const result = matcher.resolve(
        {
          ...targetLocation,
          // override anything provided in location
          ...location,
        },
        start
      )
      expect(result).toEqual(resolved)
    }

    /**
     *
     * @param {RouteRecord | RouteRecord[]} record Record or records we are testing the matcher against
     * @param {MatcherLocation} location location we want to reolve against
     * @param {MatcherLocationNormalized} [start] Optional currentLocation used when resolving
     * @returns {any} error
     */
    function assertErrorMatch(
      record,
      location,
      start = START_LOCATION_NORMALIZED
    ) {
      try {
        assertRecordMatch(record, location, {}, start)
      } catch (error) {
        return error
      }
    }

    describe('LocationAsPath', () => {
      it('resolves a normal path', () => {
        assertRecordMatch(
          { path: '/', name: 'Home', component },
          { path: '/' },
          { name: 'Home', path: '/', params: {} }
        )
      })

      it('resolves a normal path without name', () => {
        assertRecordMatch(
          { path: '/', component },
          { path: '/' },
          { name: undefined, path: '/', params: {} }
        )
      })

      it('resolves a path with params', () => {
        assertRecordMatch(
          { path: '/users/:id', name: 'User', component },
          { path: '/users/posva' },
          { name: 'User', params: { id: 'posva' } }
        )
      })

      it('resolves a path with multiple params', () => {
        assertRecordMatch(
          { path: '/users/:id/:other', name: 'User', component },
          { path: '/users/posva/hey' },
          { name: 'User', params: { id: 'posva', other: 'hey' } }
        )
      })

      it('resolves a path with multiple params but no name', () => {
        assertRecordMatch(
          { path: '/users/:id/:other', component },
          { path: '/users/posva/hey' },
          { name: undefined, params: { id: 'posva', other: 'hey' } }
        )
      })

      it('throws if the path does not exists', () => {
        expect(
          assertErrorMatch({ path: '/', component }, { path: '/foo' })
        ).toMatchInlineSnapshot(
          `[Error: No match for {"path":"/foo","params":{},"query":{},"hash":"","fullPath":"/"}]`
        )
      })
    })

    describe('LocationAsName', () => {
      it('matches a name', () => {
        assertRecordMatch(
          { path: '/home', name: 'Home', component },
          { name: 'Home' },
          { name: 'Home', path: '/home' }
        )
      })

      it('matches a name and fill params', () => {
        assertRecordMatch(
          { path: '/users/:id/m/:role', name: 'UserEdit', component },
          { name: 'UserEdit', params: { id: 'posva', role: 'admin' } },
          { name: 'UserEdit', path: '/users/posva/m/admin' }
        )
      })

      it('throws if the named route does not exists', () => {
        expect(
          assertErrorMatch({ path: '/', component }, { name: 'Home' })
        ).toMatchInlineSnapshot(
          `[Error: No match for {"path":"/","name":"Home","params":{},"query":{},"hash":"","fullPath":"/"}]`
        )
      })
    })

    describe('LocationAsRelative', () => {
      it('matches with nothing', () => {
        const record = { path: '/home', name: 'Home', component }
        assertRecordMatch(
          record,
          {},
          { name: 'Home', path: '/home' },
          { name: 'Home', params: {}, path: '/home', matched: [record] }
        )
      })

      it('replace params even with no name', () => {
        const record = { path: '/users/:id/m/:role', component }
        assertRecordMatch(
          record,
          { params: { id: 'posva', role: 'admin' } },
          { name: undefined, path: '/users/posva/m/admin' },
          {
            path: '/users/ed/m/user',
            name: undefined,
            params: { id: 'ed', role: 'user' },
            matched: [record],
          }
        )
      })

      it('replace params', () => {
        const record = {
          path: '/users/:id/m/:role',
          name: 'UserEdit',
          component,
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
          }
        )
      })

      it('keep params if not provided', () => {
        const record = {
          path: '/users/:id/m/:role',
          name: 'UserEdit',
          component,
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
          }
        )
      })

      it('keep params if not provided even with no name', () => {
        const record = { path: '/users/:id/m/:role', component }
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
          }
        )
      })

      describe('redirects', () => {
        /**
         *
         * @param {RouteRecord[]} records Record or records we are testing the matcher against
         * @param {MatcherLocation} location location we want to reolve against
         * @param {MatcherLocationNormalized | MatcherLocationRedirect} expected Expected resolved location given by the matcher
         * @param {MatcherLocationNormalized} [currentLocation] Optional currentLocation used when resolving
         */
        function assertRedirect(
          records,
          location,
          expected,
          currentLocation = START_LOCATION_NORMALIZED
        ) {
          const matcher = new RouterMatcher(records)
          const resolved = matcher.resolve(location, currentLocation)
          expect(resolved).toEqual(expected)
          return resolved
        }

        it('resolves a redirect string', () => {
          const records = [
            { path: '/home', component },
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
              },
            }
          )
        })

        it('resolves a redirect function that returns a string', () => {
          const redirect = () => '/home'
          const records = [
            { path: '/home', component },
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
              },
            }
          )
        })

        it('resolves a redirect function that returns an object route', () => {
          const redirect = () => {
            path: '/home'
          }
          const records = [
            { path: '/home', component },
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
              },
            }
          )
        })

        it('resolves a redirect as an object', () => {
          const records = [
            { path: '/home', component },
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
              },
            }
          )
        })

        it('works with a named location', () => {
          const records = [
            { path: '/home', component },
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
              },
            }
          )
        })

        it('throws if relative location when redirecting', () => {
          const records = [
            { path: '/home', component },
            { path: '/redirect', redirect: '/home' },
          ]
          expect(
            assertErrorMatch(
              { path: '/redirect', redirect: '/home' },
              { params: {} },
              { path: '/redirect', params: {}, matched: [], name: undefined }
            )
          ).toMatchInlineSnapshot(`
            [Error: Cannot redirect using a relative location:
            {
              "params": {}
            }
            Use the function redirect and explicitely provide a name]
          `)
        })

        it('normalize a location when redirecting', () => {
          const redirect = to => ({ name: 'b', params: to.params })
          const records = [
            { path: '/home', component },
            {
              path: '/a/:a',
              name: 'a',
              redirect,
            },
            { path: '/b/:a', name: 'b', component },
          ]
          assertRedirect(
            records,
            {
              name: undefined,
              path: '/a/foo',
            },
            {
              redirect,
              normalizedLocation: {
                path: '/a/foo',
                params: { a: 'foo' },
                name: 'a',
                matched: [],
              },
            }
          )
        })
      })

      it('throws if the current named route does not exists', () => {
        const record = { path: '/', component }
        const start = {
          name: 'home',
          params: {},
          path: '/',
          matched: [record],
        }
        // the property should be non enumerable
        Object.defineProperty(start, 'matched', { enumerable: false })
        expect(assertErrorMatch(record, {}, start)).toMatchInlineSnapshot(
          `[Error: No match for {"name":"home","params":{},"path":"/"}]`
        )
      })
    })

    describe('children', () => {
      const ChildA = { path: 'a', name: 'child-a', component }
      const ChildB = { path: 'b', name: 'child-b', component }
      const ChildC = { path: 'c', name: 'child-c', component }
      const ChildWithParam = { path: ':p', name: 'child-params', component }
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
        component,
        children: [NestedChildA, NestedChildB, NestedChildC],
      }
      const NestedWithParam = {
        path: 'nested/:n',
        name: 'nested',
        component,
        children: [NestedChildWithParam],
      }

      it('resolves children', () => {
        const Foo = {
          path: '/foo',
          name: 'Foo',
          component,
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

      it('resolves nested children', () => {
        const Foo = {
          path: '/foo',
          name: 'Foo',
          component,
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
          component,
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
          component,
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
          }
        )
      })

      it('resolves nested children with params', () => {
        const Foo = {
          path: '/foo',
          name: 'Foo',
          component,
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
                path: `${Foo.path}/${NestedWithParam.path}/${
                  NestedChildWithParam.path
                }`,
              },
            ],
          }
        )
      })
    })
  })
})
