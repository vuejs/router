import { extractComponentsGuards } from '../src/utils'
import { START_LOCATION_NORMALIZED, RouteRecord } from '../src/types'
import { components, normalizeRouteRecord } from './utils'
import { RouteRecordNormalized } from '../src/matcher/types'

const beforeRouteEnter = jest.fn()

// stub those two
const to = START_LOCATION_NORMALIZED
const from = START_LOCATION_NORMALIZED

const NoGuard: RouteRecord = { path: '/', component: components.Home }
const SingleGuard: RouteRecord = {
  path: '/',
  component: { ...components.Home, beforeRouteEnter },
}
const SingleGuardNamed: RouteRecord = {
  path: '/',
  components: {
    default: { ...components.Home, beforeRouteEnter },
    other: { ...components.Foo, beforeRouteEnter },
  },
}

function makeAsync(
  record: Exclude<RouteRecord, { redirect: any }>
): RouteRecordNormalized {
  if ('components' in record) {
    const copy = { ...record }
    copy.components = Object.keys(record.components).reduce(
      (components, name) => {
        // @ts-ignore
        components[name] = () => Promise.resolve(record.components[name])
        return components
      },
      {} as typeof record['components']
    )
    return normalizeRouteRecord(copy)
  } else {
    const { component, ...copy } = record
    if (typeof component === 'function')
      return normalizeRouteRecord({
        ...copy,
        components: { default: component },
      })

    return normalizeRouteRecord({
      ...copy,
      components: {
        default: () => Promise.resolve(component),
      },
    })
  }
}

beforeEach(() => {
  beforeRouteEnter.mockReset()
  beforeRouteEnter.mockImplementation((to, from, next) => {
    next()
  })
})

async function checkGuards(
  components: Exclude<RouteRecord, { redirect: any }>[],
  n: number
) {
  beforeRouteEnter.mockClear()
  const guards = await extractComponentsGuards(
    // type is fine as we excluded RouteRecordRedirect in components argument
    components.map(normalizeRouteRecord),
    'beforeRouteEnter',
    to,
    from
  )
  expect(guards).toHaveLength(n)
  for (const guard of guards) {
    expect(guard).toBeInstanceOf(Function)
    expect(await guard())
  }
  expect(beforeRouteEnter).toHaveBeenCalledTimes(n)
}

describe('extractComponentsGuards', () => {
  it('extracts guards from one single component', async () => {
    await checkGuards([SingleGuard], 1)
  })

  it('extracts guards from multiple components (named views)', async () => {
    await checkGuards([SingleGuardNamed], 2)
  })

  it('handles no guards', async () => {
    await checkGuards([NoGuard], 0)
  })

  it('handles mixed things', async () => {
    await checkGuards([SingleGuard, SingleGuardNamed], 3)
    await checkGuards([SingleGuard, SingleGuard], 2)
    await checkGuards([SingleGuardNamed, SingleGuardNamed], 4)
  })

  // TODO: async components
  it.skip('works with async components', async () => {
    await checkGuards([makeAsync(NoGuard)], 0)
    await checkGuards([makeAsync(SingleGuard)], 1)
    await checkGuards([makeAsync(SingleGuard), makeAsync(SingleGuardNamed)], 3)
    await checkGuards([makeAsync(SingleGuard), makeAsync(SingleGuard)], 2)
    await checkGuards(
      [makeAsync(SingleGuardNamed), makeAsync(SingleGuardNamed)],
      4
    )
  })
})
