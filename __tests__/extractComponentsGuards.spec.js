// @ts-check
require('./helper')
const expect = require('expect')
const { extractComponentsGuards } = require('../src/utils')
const { START_LOCATION_NORMALIZED } = require('../src/types')
const { components, normalizeRouteRecord } = require('./utils')

/** @typedef {import('../src/types').RouteRecord} RouteRecord */
/** @typedef {import('../src/types').MatchedRouteRecord} MatchedRouteRecord */
/** @typedef {import('../src/types').RouteRecordRedirect} RouteRecordRedirect */

const beforeRouteEnter = jest.fn()

// stub those two
const to = START_LOCATION_NORMALIZED
const from = START_LOCATION_NORMALIZED

/** @type {RouteRecord} */
const NoGuard = { path: '/', component: components.Home }
/** @type {RouteRecord} */
const SingleGuard = {
  path: '/',
  component: { ...components.Home, beforeRouteEnter },
}
/** @type {RouteRecord} */
const SingleGuardNamed = {
  path: '/',
  components: {
    default: { ...components.Home, beforeRouteEnter },
    other: { ...components.Foo, beforeRouteEnter },
  },
}

/**
 *
 * @param {Exclude<RouteRecord, { redirect: any}>} record
 * @returns {MatchedRouteRecord}
 */
function makeAsync(record) {
  if ('components' in record) {
    const copy = { ...record }
    copy.components = Object.keys(record.components).reduce(
      (components, name) => {
        components[name] = () => Promise.resolve(record.components[name])
        return components
      },
      {}
    )
    return copy
  } else {
    const { component, ...copy } = record
    if (typeof component === 'function')
      return { ...copy, components: { default: component } }

    return {
      ...copy,
      components: {
        default: () => Promise.resolve(component),
      },
    }
  }
}

beforeEach(() => {
  beforeRouteEnter.mockReset()
  beforeRouteEnter.mockImplementation((to, from, next) => {
    next()
  })
})

/**
 *
 * @param {Exclude<RouteRecord, { redirect: any }>[]} components
 * @param {number} n
 */
async function checkGuards(components, n) {
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

  it('works with async components', async () => {
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
