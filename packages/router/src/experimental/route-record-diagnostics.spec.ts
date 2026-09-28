import { afterEach, expect, it, vi } from 'vitest'
import { normalizeRouteRecord } from './router'
import { MatcherPatternPathStatic } from './route-resolver/matchers/matcher-pattern'

afterEach(() => vi.restoreAllMocks())

it('advises how to migrate beforeEnter in an experimental route record', () => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})

  const record = {
    name: 'private',
    path: new MatcherPatternPathStatic('/private'),
    components: {},
    beforeEnter: () => false,
  }

  normalizeRouteRecord(record)

  const output = warn.mock.calls.map(([message]) => String(message)).join('\n')
  expect(output).toContain('[VUE_ROUTER_D0001]')
  expect(output).toContain('Route "private" uses beforeEnter')
  expect(output).toContain('fix: Move the condition to the route meta field')
  expect(output).toContain('to.meta')
  expect(output).toContain('router.beforeEach()')
})

it('does not report an ordinary experimental route record', () => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})

  normalizeRouteRecord({
    name: 'public',
    path: new MatcherPatternPathStatic('/public'),
    components: {},
  })

  expect(warn).not.toHaveBeenCalled()
})

it('reports an aliased route only once', () => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
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

  const output = warn.mock.calls.map(([message]) => String(message)).join('\n')
  expect(output.match(/\[VUE_ROUTER_D0001\]/g)).toHaveLength(1)
})
