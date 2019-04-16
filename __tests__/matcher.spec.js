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

    describe('LocationAsPath', () => {
      it('resolves a normal path', () => {
        assertRecordMatch(
          { path: '/', name: 'Home', component },
          { path: '/' },
          { name: 'Home', path: '/', params: {} }
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
    })
  })
})
