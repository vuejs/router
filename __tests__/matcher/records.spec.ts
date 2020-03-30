import { normalizeRouteRecord } from '../../src/matcher'

describe('normalizeRouteRecord', () => {
  it('transforms a single view into multiple views', () => {
    const record = normalizeRouteRecord({
      path: '/home',
      component: {},
    })
    expect(record).toEqual({
      beforeEnter: undefined,
      children: [],
      aliasOf: undefined,
      components: { default: {} },
      leaveGuards: [],
      instances: {},
      meta: {},
      name: undefined,
      path: '/home',
      props: false,
    })
  })

  it('keeps original values in single view', () => {
    const beforeEnter = jest.fn()
    const record = normalizeRouteRecord({
      path: '/home',
      beforeEnter,
      children: [{ path: '/child' } as any],
      meta: { foo: true },
      name: 'name',
      component: {},
    })
    expect(record).toEqual({
      beforeEnter,
      children: [{ path: '/child' }],
      components: { default: {} },
      leaveGuards: [],
      instances: {},
      meta: { foo: true },
      name: 'name',
      path: '/home',
      props: false,
    })
  })

  it('keeps original values in redirect', () => {
    const record = normalizeRouteRecord({
      path: '/redirect',
      redirect: '/home',
      meta: { foo: true },
      name: 'name',
    })

    expect(record).toEqual({
      aliasOf: undefined,
      components: {},
      meta: { foo: true },
      name: 'name',
      path: '/redirect',
      redirect: '/home',
    })
  })

  it('keeps original values in multiple views', () => {
    const beforeEnter = jest.fn()
    const record = normalizeRouteRecord({
      path: '/home',
      beforeEnter,
      children: [{ path: '/child' } as any],
      meta: { foo: true },
      name: 'name',
      components: { one: {} },
    })
    expect(record).toEqual({
      beforeEnter,
      children: [{ path: '/child' }],
      components: { one: {} },
      leaveGuards: [],
      instances: {},
      meta: { foo: true },
      name: 'name',
      path: '/home',
      props: false,
    })
  })

  // TODO: move to router
  it.todo('beforeEnter is called with the string redirect')

  it.todo('beforeEnter is called with object redirect')

  it.todo('function redirect is invoked by beforeEnter')
})
