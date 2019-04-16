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
        assertRecordMatch(
          { path: '/home', name: 'Home', component },
          {},
          { name: 'Home', path: '/home' },
          { name: 'Home', params: {}, path: '/home' }
        )
      })

      it('replace params even with no name', () => {
        assertRecordMatch(
          { path: '/users/:id/m/:role', component },
          { params: { id: 'posva', role: 'admin' } },
          { name: undefined, path: '/users/posva/m/admin' },
          {
            path: '/users/ed/m/user',
            name: undefined,
            params: { id: 'ed', role: 'user' },
          }
        )
      })

      it('replace params', () => {
        assertRecordMatch(
          { path: '/users/:id/m/:role', name: 'UserEdit', component },
          { params: { id: 'posva', role: 'admin' } },
          { name: 'UserEdit', path: '/users/posva/m/admin' },
          {
            path: '/users/ed/m/user',
            name: 'UserEdit',
            params: { id: 'ed', role: 'user' },
          }
        )
      })

      it('keep params if not provided', () => {
        assertRecordMatch(
          { path: '/users/:id/m/:role', name: 'UserEdit', component },
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
          }
        )
      })

      it('keep params if not provided even with no name', () => {
        assertRecordMatch(
          { path: '/users/:id/m/:role', component },
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
          }
        )
      })

      it('throws if the current named route does not exists', () => {
        expect(
          assertErrorMatch(
            { path: '/', component },
            {},
            { name: 'home', params: {}, path: '/' }
          )
        ).toMatchInlineSnapshot(
          `[Error: No match for {"name":"home","params":{},"path":"/"}]`
        )
      })
    })
  })
})
