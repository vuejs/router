import { describe, expect, it } from 'vitest'
import {
  _getLinkActiveState,
  createMemoryHistory,
  createRouter,
  type RouteLocationRaw,
} from '../src'

// Cases such as aliases, empty children and repeatable params are covered by
// RouterLink.spec.ts through `useLink`, which uses this same helper.
function activeState(to: RouteLocationRaw, current: RouteLocationRaw) {
  const component = {}
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      {
        path: '/users/:id',
        component,
        children: [{ path: 'profile', component }],
      },
    ],
  })
  return _getLinkActiveState(router.resolve(to), router.resolve(current))
}

describe('_getLinkActiveState', () => {
  it('is exact active on the same location', () => {
    expect(activeState('/users/1', '/users/1')).toEqual({
      isActive: true,
      isExactActive: true,
    })
  })

  it('is active but not exact active on a child', () => {
    expect(activeState('/users/1', '/users/1/profile')).toEqual({
      isActive: true,
      isExactActive: false,
    })
  })

  it('is inactive with different params', () => {
    expect(activeState('/users/2', '/users/1')).toEqual({
      isActive: false,
      isExactActive: false,
    })
  })

  it('is inactive when the target does not match a record', () => {
    expect(activeState('/nope', '/users/1')).toEqual({
      isActive: false,
      isExactActive: false,
    })
  })
})
