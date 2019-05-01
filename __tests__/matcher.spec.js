// @ts-check
require('./helper')
const expect = require('expect')
const { RouterMatcher } = require('../src/matcher')
const { START_LOCATION_NORMALIZED } = require('../src/types')

const component = null

describe('Router Matcher', () => {
  describe('resolve', () => {
    /**
     *
     * @param {import('../src/types').RouteRecord} record
     * @param {import('../src/types').MatcherLocation} location
     * @param {Partial<import('../src/types').MatcherLocationNormalized>} resolved
     * @param {import('../src/types').MatcherLocationNormalized} start
     */
    function assertRecordMatch(
      record,
      location,
      resolved,
      start = START_LOCATION_NORMALIZED
    ) {
      const matcher = new RouterMatcher([record])
      const targetLocation = {}

      // add location if provided as it should be the same value
      if ('path' in location) {
        resolved.path = location.path
      }

      // use one single record
      if (!('matched' in resolved)) resolved.matched = [record]

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
     * @param {import('../src/types').RouteRecord} record
     * @param {import('../src/types').MatcherLocation} location
     * @param {import('../src/types').MatcherLocationNormalized} start
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

      it('throws if the current named route does not exists', () => {
        const record = { path: '/', component }
        const start = { name: 'home', params: {}, path: '/', matched: [record] }
        // the property should be non enumerable
        Object.defineProperty(start, 'matched', { enumerable: false })
        expect(assertErrorMatch(record, {}, start)).toMatchInlineSnapshot(
          `[Error: No match for {"name":"home","params":{},"path":"/"}]`
        )
      })
    })
  })
})
