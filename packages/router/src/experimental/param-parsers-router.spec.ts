import { beforeAll, describe, expect, it } from 'vitest'
import {
  experimental_createRouter,
  normalizeRouteRecord,
  type EXPERIMENTAL_RouteRecordNormalized_Matchable,
} from './router'
import { createFixedResolver } from './route-resolver/resolver-fixed'
import {
  MatcherPatternPathDynamic,
  MatcherPatternPathStatic,
} from './route-resolver/matchers/matcher-pattern'
import { MatcherPatternQueryParam } from './route-resolver/matchers/matcher-pattern-query'
import {
  defineParamParser,
  defineParamParserRaw,
  PARAM_PARSER_INT,
} from './route-resolver/matchers/param-parsers'
import { miss } from './route-resolver/matchers/errors'
import { createMemoryHistory } from '../history/memory'
import { components } from '../../__tests__/utils'

const testNum = defineParamParser<number>({
  get: value => {
    const n = Number(value)
    if (!value || Number.isNaN(n)) miss(`"${value}" is not a number`)
    return n
  },
  set: value => String(value),
})

const testCsv = defineParamParserRaw<string[]>({
  get: value => {
    if (value == null) return []
    return (Array.isArray(value) ? value : [value])
      .flatMap(v => v?.split(','))
      .filter((v): v is string => !!v)
  },
  set: value => (value.length ? value.join(',') : null),
})

const testSet = defineParamParserRaw<Set<string>>({
  get: value => {
    const arr = (Array.isArray(value) ? value : [value]).filter(v => v != null)
    return new Set<string>(arr)
  },
  set: value => [...value],
})

const testSetShape = defineParamParserRaw<Set<string>>({
  get: value => {
    if (value == null) return new Set()
    return new Set(
      Array.isArray(value) ? value.filter(v => v != null) : [value]
    )
  },
  set: value => {
    if (value.size === 0) return null
    if (value.size === 1) return [...value][0]!
    return [...value]
  },
})

function record(
  name: string,
  path: EXPERIMENTAL_RouteRecordNormalized_Matchable['path'],
  query?: EXPERIMENTAL_RouteRecordNormalized_Matchable['query']
) {
  return normalizeRouteRecord({
    name,
    path,
    query,
    components: { default: components.Foo },
  })
}

const r_numRequired = record(
  'num-required',
  new MatcherPatternPathDynamic(/^\/required\/([^/]+?)$/i, { id: [testNum] }, [
    'required',
    1,
  ])
)
const r_numOptional = record(
  'num-optional',
  new MatcherPatternPathDynamic(
    /^\/optional(?:\/([^/]+?))?$/i,
    { id: [testNum, false, true] },
    ['optional', 1]
  )
)
const r_numRepeatable = record(
  'num-repeatable',
  new MatcherPatternPathDynamic(
    /^\/repeatable\/(.+?)$/i,
    { id: [testNum, true] },
    ['repeatable', 1]
  )
)
const r_numOptionalRepeatable = record(
  'num-optional-repeatable',
  new MatcherPatternPathDynamic(
    /^\/optional-repeatable(?:\/(.+?))?$/i,
    { id: [testNum, true, true] },
    ['optional-repeatable', 1]
  )
)

const r_query = record('query', new MatcherPatternPathStatic('/query'), [
  new MatcherPatternQueryParam('page', 'page', 'value', PARAM_PARSER_INT, 1),
  new MatcherPatternQueryParam('tag', 'tag', 'array', undefined, []),
  new MatcherPatternQueryParam('ids', 'ids', 'array', testCsv, []),
])

const r_csvRequired = record(
  'csv-required',
  new MatcherPatternPathDynamic(
    /^\/raw\/required\/([^/]+?)$/i,
    { ids: [testCsv] },
    ['raw', 'required', 1]
  )
)
const r_csvOptional = record(
  'csv-optional',
  new MatcherPatternPathDynamic(
    /^\/raw\/optional(?:\/([^/]+?))?$/i,
    { ids: [testCsv, false, true] },
    ['raw', 'optional', 1]
  )
)
const r_csvRepeatable = record(
  'csv-repeatable',
  new MatcherPatternPathDynamic(
    /^\/raw\/repeatable\/(.+?)$/i,
    { ids: [testCsv, true] },
    ['raw', 'repeatable', 1]
  )
)
const r_csvOptionalRepeatable = record(
  'csv-optional-repeatable',
  new MatcherPatternPathDynamic(
    /^\/raw\/optional-repeatable(?:\/(.+?))?$/i,
    { ids: [testCsv, true, true] },
    ['raw', 'optional-repeatable', 1]
  )
)

const r_setRequired = record(
  'set-required',
  new MatcherPatternPathDynamic(
    /^\/set\/required\/([^/]+?)$/i,
    { ids: [testSet] },
    ['set', 'required', 1]
  )
)
const r_setOptional = record(
  'set-optional',
  new MatcherPatternPathDynamic(
    /^\/set\/optional(?:\/([^/]+?))?$/i,
    { ids: [testSet, false, true] },
    ['set', 'optional', 1]
  )
)
const r_setRepeatable = record(
  'set-repeatable',
  new MatcherPatternPathDynamic(
    /^\/set\/repeatable\/(.+?)$/i,
    { ids: [testSet, true] },
    ['set', 'repeatable', 1]
  )
)
const r_setOptionalRepeatable = record(
  'set-optional-repeatable',
  new MatcherPatternPathDynamic(
    /^\/set\/optional-repeatable(?:\/(.+?))?$/i,
    { ids: [testSet, true, true] },
    ['set', 'optional-repeatable', 1]
  )
)

// only the optional-repeatable variant matters for the
// `null` vs `[]` empty-case comparison
const r_setShapeOptionalRepeatable = record(
  'set-shape-optional-repeatable',
  new MatcherPatternPathDynamic(
    /^\/set-shape\/optional-repeatable(?:\/(.+?))?$/i,
    { ids: [testSetShape, true, true] },
    ['set-shape', 'optional-repeatable', 1]
  )
)

// catch-all: must be last so it only matches when nothing else does
const r_notFound = record(
  'not-found',
  new MatcherPatternPathDynamic(
    /^\/(.*)$/i,
    { pathMatch: [undefined, false, true] },
    [0],
    null
  )
)

const router = experimental_createRouter({
  history: createMemoryHistory(),
  resolver: createFixedResolver([
    r_numRequired,
    r_numOptional,
    r_numRepeatable,
    r_numOptionalRepeatable,
    r_query,
    r_csvRequired,
    r_csvOptional,
    r_csvRepeatable,
    r_csvOptionalRepeatable,
    r_setRequired,
    r_setOptional,
    r_setRepeatable,
    r_setOptionalRepeatable,
    r_setShapeOptionalRepeatable,
    r_notFound,
  ]),
})

// needed for memory history to initialize properly
beforeAll(() => router.push('/'))

describe('regular param parsers', () => {
  it('required (test-num): /required/42 -> { id: 42 }', () => {
    expect(router.resolve('/required/42').params).toEqual({ id: 42 })
    expect(
      router.resolve({ name: 'num-required', params: { id: 42 } }).path
    ).toBe('/required/42')
  })

  it('required (test-num): /required/oops falls through to catch-all', () => {
    expect(router.resolve('/required/oops')).toMatchObject({
      name: 'not-found',
    })
  })

  it('optional (test-num): /optional -> { id: null }, /optional/7 -> { id: 7 }', () => {
    expect(router.resolve('/optional').params).toEqual({ id: null })
    expect(router.resolve('/optional/7').params).toEqual({ id: 7 })

    expect(
      router.resolve({ name: 'num-optional', params: { id: null } }).path
    ).toBe('/optional')
    expect(
      router.resolve({ name: 'num-optional', params: { id: 7 } }).path
    ).toBe('/optional/7')
  })

  it('repeatable (test-num): /repeatable/1/2/3 -> { id: [1,2,3] }', () => {
    expect(router.resolve('/repeatable/1/2/3').params).toEqual({
      id: [1, 2, 3],
    })

    expect(
      router.resolve({ name: 'num-repeatable', params: { id: [1, 2, 3] } }).path
    ).toBe('/repeatable/1/2/3')
  })

  it('optional-repeatable (test-num): /optional-repeatable -> empty, /optional-repeatable/1/2 -> [1,2]', () => {
    expect(router.resolve('/optional-repeatable').params).toEqual({ id: [] })
    expect(router.resolve('/optional-repeatable/1/2').params).toEqual({
      id: [1, 2],
    })

    expect(
      router.resolve({ name: 'num-optional-repeatable', params: { id: [] } })
        .path
    ).toBe('/optional-repeatable')
    expect(
      router.resolve({
        name: 'num-optional-repeatable',
        params: { id: [1, 2] },
      }).path
    ).toBe('/optional-repeatable/1/2')
  })

  it('query parsers: defaults', () => {
    expect(router.resolve('/query').params).toEqual({
      page: 1,
      tag: [],
      ids: [],
    })
  })

  it('query parsers: populated', () => {
    expect(
      router.resolve('/query?page=3&tag=a&tag=b&ids=x,y,z').params
    ).toEqual({
      page: 3,
      tag: ['a', 'b'],
      ids: ['x', 'y', 'z'],
    })
  })

  it('query parsers: messy ids (?ids&ids=&ids=,,,&ids=,2,,64)', () => {
    // test-csv filters out empty strings; only "2" and "64" survive
    expect(router.resolve('/query?ids&ids=&ids=,,,&ids=,2,,64').params).toEqual(
      { page: 1, tag: [], ids: ['2', '64'] }
    )
  })

  it('catch-all: unknown deep path resolves to not-found, round-trips', () => {
    expect(router.resolve('/totally/unknown/path')).toMatchObject({
      name: 'not-found',
    })
    expect(
      router.resolve({
        name: 'not-found',
        params: { pathMatch: 'totally/unknown/path' },
      }).path
    ).toBe('/totally/unknown/path')
  })
})

describe('raw param parsers', () => {
  it('test-csv required: /raw/required/a,b,c -> [a,b,c]', () => {
    expect(router.resolve('/raw/required/a,b,c').params).toEqual({
      ids: ['a', 'b', 'c'],
    })
    expect(
      router.resolve({ name: 'csv-required', params: { ids: ['a', 'b', 'c'] } })
        .path
    ).toBe('/raw/required/a,b,c')
  })

  it('test-csv optional: empty + populated', () => {
    expect(router.resolve('/raw/optional').params).toEqual({ ids: [] })
    expect(router.resolve('/raw/optional/x,y').params).toEqual({
      ids: ['x', 'y'],
    })

    expect(
      router.resolve({ name: 'csv-optional', params: { ids: ['x', 'y'] } }).path
    ).toBe('/raw/optional/x,y')
  })

  it('test-csv repeatable (1+): segments x csv split', () => {
    expect(router.resolve('/raw/repeatable/a,b/c,d').params).toEqual({
      ids: ['a', 'b', 'c', 'd'],
    })
  })

  it('test-csv optional-repeatable (0+): empty + populated', () => {
    expect(router.resolve('/raw/optional-repeatable').params).toEqual({
      ids: [],
    })
    expect(router.resolve('/raw/optional-repeatable/a,b/c').params).toEqual({
      ids: ['a', 'b', 'c'],
    })
  })

  it('test-set required: yields Set, builds back from Set', () => {
    expect(router.resolve('/set/required/a').params).toEqual({
      ids: new Set(['a']),
    })
    expect(
      router.resolve({
        name: 'set-required',
        params: {
          // FIXME: will be removed in v6 when params become unknown by default
          // @ts-expect-error: should allow anything in the new version
          ids: new Set(['a']),
        },
      }).path
    ).toBe('/set/required/a')
  })

  it('test-set optional: empty Set when missing', () => {
    expect(router.resolve('/set/optional').params).toEqual({ ids: new Set() })
    expect(router.resolve('/set/optional/x').params).toEqual({
      ids: new Set(['x']),
    })
  })

  it('test-set repeatable (1+): builds full segments', () => {
    expect(
      router.resolve({
        name: 'set-repeatable',
        params: {
          // FIXME: will be removed in v6 when params become unknown by default
          // @ts-expect-error: should allow anything in the new version
          ids: new Set(['a', 'b', 'c']),
        },
      }).path
    ).toBe('/set/repeatable/a/b/c')
  })

  it('test-set optional-repeatable (0+): empty + populated', () => {
    expect(router.resolve('/set/optional-repeatable').params).toEqual({
      ids: new Set(),
    })
    expect(
      router.resolve({
        name: 'set-optional-repeatable',
        params: {
          // FIXME: will be removed in v6 when params become unknown by default
          // @ts-expect-error: should allow anything in the new version
          ids: new Set(['a', 'b', 'c', 'd']),
        },
      }).path
    ).toBe('/set/optional-repeatable/a/b/c/d')
  })

  it('empty optional-repeatable: set() returning null vs [] produce the same URL', () => {
    expect(
      router.resolve({
        name: 'set-shape-optional-repeatable',
        params: {
          // FIXME: will be removed in v6 when params become unknown by default
          // @ts-expect-error: should allow anything in the new version
          ids: new Set(),
        },
      }).path
    ).toBe('/set-shape/optional-repeatable')
    expect(
      router.resolve({
        name: 'set-optional-repeatable',
        params: {
          // FIXME: will be removed in v6 when params become unknown by default
          // @ts-expect-error: should allow anything in the new version
          ids: new Set(),
        },
      }).path
    ).toBe('/set/optional-repeatable')
  })
})
