import { describe, it, expectTypeOf } from 'vitest'
import type {
  ScrollPositionCoordinates,
  _ScrollPositionNormalized,
} from './scrollBehavior'
import type { _RouteRecordBase } from './types'
import type { ResolvedOptions } from './unplugin/options'

describe('exactOptionalPropertyTypes', () => {
  it('ScrollPositionCoordinates accepts valid values', () => {
    expectTypeOf<ScrollPositionCoordinates>().toEqualTypeOf<{
      behavior?: ScrollBehavior
      left?: number
      top?: number
    }>()
  })

  it('_ScrollPositionNormalized accepts explicit undefined for behavior', () => {
    // behavior includes | undefined because savedPosition.behavior
    // can be absent at runtime (e.g. computeScrollPosition omits it)
    const pos: _ScrollPositionNormalized = {
      behavior: undefined,
      left: 0,
      top: 0,
    }
    void pos
  })

  it('_RouteRecordBase meta does not allow undefined', () => {
    expectTypeOf<_RouteRecordBase['meta']>().not.toEqualTypeOf<undefined>()
  })

  it('ResolvedOptions has non-nullable extensions after resolveOptions', () => {
    expectTypeOf<ResolvedOptions['extensions']>().toEqualTypeOf<string[]>()
  })

  it('ResolvedOptions has non-nullable root after resolveOptions', () => {
    expectTypeOf<ResolvedOptions['root']>().toEqualTypeOf<string>()
  })

  it('ResolvedOptions has non-nullable getRouteName after resolveOptions', () => {
    expectTypeOf<
      ResolvedOptions['getRouteName']
    >().not.toEqualTypeOf<undefined>()
  })

  it('ResolvedOptions has non-nullable dts after resolveOptions', () => {
    expectTypeOf<ResolvedOptions['dts']>().not.toEqualTypeOf<undefined>()
  })
})
