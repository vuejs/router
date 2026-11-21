import { createRouterMatcher, normalizeRouteRecord } from '../../src/matcher'
import { START_LOCATION_NORMALIZED } from '../../src/location'
import { vi, describe, expect, it } from 'vitest'

describe('normalizeRouteRecord', () => {
  it('transforms a single view into multiple views', () => {
    const record = normalizeRouteRecord({
      path: '/home',
      component: {},
    })
    expect(record).toMatchObject({
      beforeEnter: undefined,
      children: [],
      aliasOf: undefined,
      components: { default: {} },
      leaveGuards: expect.any(Set),
      updateGuards: expect.any(Set),
      instances: {},
      meta: {},
      name: undefined,
      path: '/home',
      props: { default: false },
    })
  })

  it('keeps original values in single view', () => {
    const beforeEnter = vi.fn()
    const record = normalizeRouteRecord({
      path: '/home',
      beforeEnter,
      children: [{ path: '/child' } as any],
      meta: { foo: true },
      name: 'name',
      component: {},
    })
    expect(record).toMatchObject({
      beforeEnter,
      children: [{ path: '/child' }],
      components: { default: {} },
      leaveGuards: expect.any(Set),
      updateGuards: expect.any(Set),
      instances: {},
      meta: { foo: true },
      name: 'name',
      path: '/home',
      props: { default: false },
    })
  })

  it('keeps original values in redirect', () => {
    const record = normalizeRouteRecord({
      path: '/redirect',
      redirect: '/home',
      meta: { foo: true },
      name: 'name',
    })

    expect(record).toMatchObject({
      aliasOf: undefined,
      components: {},
      meta: { foo: true },
      name: 'name',
      path: '/redirect',
      redirect: '/home',
    })
  })

  it('keeps original values in multiple views', () => {
    const beforeEnter = vi.fn()
    const record = normalizeRouteRecord({
      path: '/home',
      beforeEnter,
      children: [{ path: '/child' } as any],
      meta: { foo: true },
      name: 'name',
      components: { one: {} },
    })
    expect(record).toMatchObject({
      beforeEnter,
      children: [{ path: '/child' }],
      components: { one: {} },
      leaveGuards: expect.any(Set),
      updateGuards: expect.any(Set),
      instances: {},
      meta: { foo: true },
      name: 'name',
      path: '/home',
      props: { one: false },
    })
  })

  it('keeps default/global matcher options when record options are explicitly undefined', () => {
    const matcher = createRouterMatcher(
      [
        {
          path: '/Home',
          name: 'home',
          component: {},
          strict: undefined,
          sensitive: undefined,
          end: undefined,
        },
      ],
      { strict: true, sensitive: true }
    )

    expect(matcher.resolve({ path: '/Home' }, START_LOCATION_NORMALIZED).matched).toHaveLength(1)
    expect(matcher.resolve({ path: '/Home/' }, START_LOCATION_NORMALIZED).matched).toHaveLength(0)
    expect(matcher.resolve({ path: '/home' }, START_LOCATION_NORMALIZED).matched).toHaveLength(0)
    expect(matcher.resolve({ path: '/Home/extra' }, START_LOCATION_NORMALIZED).matched).toHaveLength(0)
  })
})
