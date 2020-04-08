import { extractComponentsGuards } from '../../src/navigationGuards'
import { START_LOCATION_NORMALIZED, RouteRecordRaw } from '../../src/types'
import { components } from '../utils'
import { normalizeRouteRecord } from '../../src/matcher'
import { RouteRecordNormalized } from 'src/matcher/types'

const beforeRouteEnter = jest.fn()

// stub those two
const to = START_LOCATION_NORMALIZED
const from = START_LOCATION_NORMALIZED

const NoGuard: RouteRecordRaw = { path: '/', component: components.Home }
const SingleGuard: RouteRecordRaw = {
  path: '/',
  component: { ...components.Home, beforeRouteEnter },
}
const SingleGuardNamed: RouteRecordRaw = {
  path: '/',
  components: {
    default: { ...components.Home, beforeRouteEnter },
    other: { ...components.Foo, beforeRouteEnter },
  },
}

beforeEach(() => {
  beforeRouteEnter.mockReset()
  beforeRouteEnter.mockImplementation((to, from, next) => {
    next()
  })
})

async function checkGuards(
  components: Exclude<RouteRecordRaw, { redirect: any }>[],
  n: number,
  guardsLength: number = n
) {
  beforeRouteEnter.mockClear()
  const guards = await extractComponentsGuards(
    // type is fine as we excluded RouteRecordRedirect in components argument
    components.map(normalizeRouteRecord) as RouteRecordNormalized[],
    'beforeRouteEnter',
    to,
    from
  )
  expect(guards).toHaveLength(guardsLength)
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
})
