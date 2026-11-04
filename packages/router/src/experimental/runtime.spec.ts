import { describe, expect, it } from 'vitest'
import { mergeRouteRecord } from './runtime'

describe('mergeRouteRecord', () => {
  it('merges props for named views across route records', () => {
    const record = mergeRouteRecord(
      {
        path: '/',
        components: {},
        props: { default: true, aside: { title: 'initial' } },
      },
      { props: { aside: { title: 'updated' } } },
      { props: { footer: false } }
    )

    expect(record.props).toEqual({
      default: true,
      aside: { title: 'updated' },
      footer: false,
    })
  })

  it('keeps named-view props when a later record has no props', () => {
    const record = mergeRouteRecord(
      { path: '/', components: {}, props: { aside: true } },
      { props: undefined, meta: { title: 'page' } }
    )

    expect(record.props).toEqual({ aside: true })
    expect(record.meta).toEqual({ title: 'page' })
  })

  it.each([
    ['true', true],
    ['a function', (route: { params: object }) => route.params],
  ])('keeps %s as props', (_label, props) => {
    const record = mergeRouteRecord(
      { path: '/:id', component: {} },
      { props, meta: { title: 'page' } }
    )

    expect(record.props).toBe(props)
  })

  it('replaces object props with non-object props', () => {
    const record = mergeRouteRecord(
      { path: '/:id', component: {}, props: { id: '1' } },
      { props: true }
    )

    expect(record.props).toBe(true)
  })

  it.each([
    ['true', true],
    ['a function', () => ({ id: '2' })],
  ])('replaces %s with object props', (_label, props) => {
    const record = mergeRouteRecord(
      { path: '/:id', component: {}, props },
      { props: { aside: { title: 'page' } } }
    )

    expect(record.props).toEqual({ aside: { title: 'page' } })
  })
})
