import { expect, it } from 'vitest'
import { normalizeRouteRecord } from './router'
import { MatcherPatternPathStatic } from './route-resolver/matchers/matcher-pattern'
import { mockWarn } from '../tests/vitest-mock-warn'

mockWarn()

it('advises how to migrate beforeEnter in an experimental route record', () => {
  const record = {
    name: 'private',
    path: new MatcherPatternPathStatic('/private'),
    components: {},
    beforeEnter: () => false,
  }

  normalizeRouteRecord(record)

  expect('VUE_ROUTER_D0001').toHaveBeenWarned()
})

it('reports an aliased route only once', () => {
  const originalRecord = {
    name: 'private',
    path: new MatcherPatternPathStatic('/private'),
    components: {},
    beforeEnter: () => false,
  }
  const original = normalizeRouteRecord(originalRecord)

  normalizeRouteRecord({
    ...original,
    path: new MatcherPatternPathStatic('/alias'),
    aliasOf: original,
  })

  expect('VUE_ROUTER_D0001').toHaveBeenWarnedTimes(1)
})
