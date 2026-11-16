import { describe, expect, it } from 'vitest'
import {
  _getLinkActiveState,
  createMemoryHistory,
  createRouter,
  type RouteLocationRaw,
} from '../src'

const component = {}

function createTestRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', name: 'home', component },
      { path: '/about', alias: '/about-alias', component },
      {
        path: '/users/:id',
        component,
        children: [{ path: 'profile', component }],
      },
      {
        path: '/parent',
        name: 'parent',
        component,
        alias: '/parent-alias',
        children: [
          { path: '', name: 'parent-index', component },
          { path: 'other', component },
        ],
      },
      { path: '/files/:paths+', component },
    ],
  })
}

function activeState(to: RouteLocationRaw, current: RouteLocationRaw) {
  const router = createTestRouter()
  return _getLinkActiveState(router.resolve(to), router.resolve(current))
}

const inactive = { isActive: false, isExactActive: false }
const active = { isActive: true, isExactActive: false }
const exact = { isActive: true, isExactActive: true }

describe('_getLinkActiveState', () => {
  it('is exact active on the same location', () => {
    expect(activeState('/about', '/about')).toEqual(exact)
    expect(activeState({ name: 'home' }, '/')).toEqual(exact)
  })

  it('is inactive on a different location', () => {
    expect(activeState('/about', '/')).toEqual(inactive)
  })

  it('is inactive when no record matches', () => {
    expect(activeState('/nope', '/nope')).toEqual(inactive)
    expect(activeState('/about', '/nope')).toEqual(inactive)
  })

  it('is active on a child of the target', () => {
    expect(activeState('/users/1', '/users/1/profile')).toEqual(active)
  })

  it('is inactive on a child with different params', () => {
    expect(activeState('/users/2', '/users/1/profile')).toEqual(inactive)
  })

  describe('aliases', () => {
    it('is exact active on an alias of the target', () => {
      expect(activeState('/about', '/about-alias')).toEqual(exact)
    })

    it('is exact active on the original of an alias target', () => {
      expect(activeState('/about-alias', '/about')).toEqual(exact)
    })

    it('is active on an aliased child', () => {
      expect(activeState('/parent', '/parent-alias/other')).toEqual(active)
    })
  })

  describe('nested empty child', () => {
    it('is exact active on the empty child', () => {
      expect(activeState({ name: 'parent-index' }, '/parent')).toEqual(exact)
    })

    it('is active through the parent on a sibling child', () => {
      expect(activeState({ name: 'parent-index' }, '/parent/other')).toEqual(
        active
      )
    })

    it('is active through the parent on an aliased sibling child', () => {
      expect(
        activeState({ name: 'parent-index' }, '/parent-alias/other')
      ).toEqual(active)
    })

    it('is inactive on the parent itself', () => {
      expect(activeState({ name: 'parent-index' }, { name: 'parent' })).toEqual(
        inactive
      )
    })
  })

  describe('repeatable params', () => {
    it('is exact active with the same values', () => {
      expect(activeState('/files/a/b', '/files/a/b')).toEqual(exact)
    })

    it('is inactive with fewer values', () => {
      expect(activeState('/files/a', '/files/a/b')).toEqual(inactive)
    })

    it('is inactive with different values', () => {
      expect(activeState('/files/a/c', '/files/a/b')).toEqual(inactive)
    })
  })
})
