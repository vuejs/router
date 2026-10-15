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
})
