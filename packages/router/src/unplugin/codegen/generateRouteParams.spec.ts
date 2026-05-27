import { describe, expect, it } from 'vitest'
import { DEFAULT_OPTIONS, resolveOptions } from '../options'
import type { TreeNode } from '../core/tree'
import { PrefixTree } from '../core/tree'
import { EXPERIMENTAL_generateRouteParams } from './generateRouteParams'
import type { ParamParsersMap } from './generateParamParsers'

describe('EXPERIMENTAL_generateRouteParams', () => {
  const RESOLVED_OPTIONS = resolveOptions(DEFAULT_OPTIONS)

  function createTreeWithParam(segment: string): TreeNode {
    const tree = new PrefixTree(RESOLVED_OPTIONS)
    return tree.insert(segment, `${segment}.vue`)
  }

  function makeParsersMap(name: string, isRaw: boolean): ParamParsersMap {
    return new Map([
      [
        name,
        {
          name,
          typeName: `Param_${name}`,
          relativePath: `parsers/${name}`,
          absolutePath: `/abs/parsers/${name}`,
          isRaw,
        },
      ],
    ])
  }

  describe('excludes null from custom parser types', () => {
    it('required path param excludes null', () => {
      const node = createTreeWithParam('[version=semver]')
      const result = EXPERIMENTAL_generateRouteParams(
        node,
        ['Param_semver'],
        false
      )
      expect(result).toBe(
        '{ version: Exclude<Param_semver, unknown[] | null> }'
      )
    })

    it('optional path param includes null', () => {
      const node = createTreeWithParam('[[version=semver]]')
      const result = EXPERIMENTAL_generateRouteParams(
        node,
        ['Param_semver'],
        false
      )
      expect(result).toBe(
        '{ version: Exclude<Param_semver, unknown[] | null> | null }'
      )
    })

    it('repeatable path param uses Extract', () => {
      const node = createTreeWithParam('[version=semver]+')
      const result = EXPERIMENTAL_generateRouteParams(
        node,
        ['Param_semver'],
        false
      )
      expect(result).toBe('{ version: Extract<Param_semver, unknown[]> }')
    })

    it('optional repeatable path param uses Extract', () => {
      const node = createTreeWithParam('[[version=semver]]+')
      const result = EXPERIMENTAL_generateRouteParams(
        node,
        ['Param_semver'],
        false
      )
      expect(result).toBe('{ version: Extract<Param_semver, unknown[]> }')
    })
  })

  describe('non-parser types', () => {
    it('required path param is string', () => {
      const node = createTreeWithParam('[id]')
      const result = EXPERIMENTAL_generateRouteParams(node, [null], false)
      expect(result).toBe('{ id: string }')
    })

    it('optional path param includes null', () => {
      const node = createTreeWithParam('[[id]]')
      const result = EXPERIMENTAL_generateRouteParams(node, [null], false)
      expect(result).toBe('{ id: string | null }')
    })

    it("native 'string' type matches no-parser output for required path", () => {
      const node = createTreeWithParam('[id]')
      const nullResult = EXPERIMENTAL_generateRouteParams(node, [null], false)
      const stringResult = EXPERIMENTAL_generateRouteParams(
        node,
        ['string'],
        false
      )
      expect(stringResult).toBe(nullResult)
    })

    it("native 'string' type matches no-parser output for optional path", () => {
      const node = createTreeWithParam('[[id]]')
      const nullResult = EXPERIMENTAL_generateRouteParams(node, [null], false)
      const stringResult = EXPERIMENTAL_generateRouteParams(
        node,
        ['string'],
        false
      )
      expect(stringResult).toBe(nullResult)
    })
  })

  describe('raw param parsers', () => {
    it('emits Param_X /* raw param parser */ for raw path params', () => {
      const node = createTreeWithParam('[id=raw]')
      const result = EXPERIMENTAL_generateRouteParams(
        node,
        ['Param_raw'],
        false,
        makeParsersMap('raw', true)
      )
      expect(result).toBe('{ id: Param_raw /* raw param parser */ }')
    })

    it('does not append | null for optional raw path params', () => {
      const node = createTreeWithParam('[[id=raw]]')
      const result = EXPERIMENTAL_generateRouteParams(
        node,
        ['Param_raw'],
        false,
        makeParsersMap('raw', true)
      )
      expect(result).toBe('{ id: Param_raw /* raw param parser */ }')
    })

    it('skips Extract for repeatable raw path params', () => {
      const node = createTreeWithParam('[id=raw]+')
      const result = EXPERIMENTAL_generateRouteParams(
        node,
        ['Param_raw'],
        false,
        makeParsersMap('raw', true)
      )
      expect(result).toBe('{ id: Param_raw /* raw param parser */ }')
    })

    it('skips Extract for optional repeatable raw path params', () => {
      const node = createTreeWithParam('[[id=raw]]+')
      const result = EXPERIMENTAL_generateRouteParams(
        node,
        ['Param_raw'],
        false,
        makeParsersMap('raw', true)
      )
      expect(result).toBe('{ id: Param_raw /* raw param parser */ }')
    })

    it('falls back to Exclude/Extract when paramParsersMap is omitted', () => {
      const node = createTreeWithParam('[id=raw]')
      const result = EXPERIMENTAL_generateRouteParams(
        node,
        ['Param_raw'],
        false
      )
      expect(result).toBe('{ id: Exclude<Param_raw, unknown[] | null> }')
    })

    it('still uses Exclude for non-raw entries in the map', () => {
      const node = createTreeWithParam('[id=plain]')
      const result = EXPERIMENTAL_generateRouteParams(
        node,
        ['Param_plain'],
        false,
        makeParsersMap('plain', false)
      )
      expect(result).toBe('{ id: Exclude<Param_plain, unknown[] | null> }')
    })
  })

  describe('raw query param parsers', () => {
    function createNodeWithQueryParam(
      paramName: string,
      parserName: string
    ): TreeNode {
      const tree = new PrefixTree(RESOLVED_OPTIONS)
      const node = tree.insert('b', 'b.vue')
      node.setCustomRouteBlock('b.vue', {
        params: {
          query: {
            [paramName]: { parser: parserName, format: 'value' },
          },
        },
      })
      return node
    }

    it('omits | undefined on route.params for raw query parsers', () => {
      const node = createNodeWithQueryParam('test', 'set')
      // route.params side (isRaw=false): runtime always calls the raw parser
      // with the array form, so the value never ends up undefined.
      const result = EXPERIMENTAL_generateRouteParams(
        node,
        ['Param_set'],
        false,
        makeParsersMap('set', true)
      )
      expect(result).toBe('{ test: Param_set /* raw param parser */ }')
    })

    it('adds explicit | undefined on router.push for raw query parsers', () => {
      const node = createNodeWithQueryParam('test', 'set')
      // router.push side (isRaw=true): allow users to pass `undefined`
      // explicitly even under exactOptionalPropertyTypes.
      const result = EXPERIMENTAL_generateRouteParams(
        node,
        ['Param_set'],
        true,
        makeParsersMap('set', true)
      )
      expect(result).toBe(
        '{ test?: Param_set /* raw param parser */ | undefined }'
      )
    })

    it('keeps | undefined on route.params for non-raw query parsers', () => {
      const node = createNodeWithQueryParam('test', 'plain')
      const result = EXPERIMENTAL_generateRouteParams(
        node,
        ['Param_plain'],
        false,
        makeParsersMap('plain', false)
      )
      expect(result).toBe(
        '{ test: Exclude<Param_plain, unknown[] | null> | undefined }'
      )
    })

    it('adds | undefined on router.push for non-raw query parsers', () => {
      const node = createNodeWithQueryParam('test', 'plain')
      const result = EXPERIMENTAL_generateRouteParams(
        node,
        ['Param_plain'],
        true,
        makeParsersMap('plain', false)
      )
      expect(result).toBe(
        '{ test?: Exclude<Param_plain, unknown[] | null> | undefined }'
      )
    })
  })
})
