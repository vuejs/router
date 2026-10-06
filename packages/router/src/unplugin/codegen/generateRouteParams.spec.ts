import { describe, expect, it } from 'vitest'
import { DEFAULT_OPTIONS, resolveOptions } from '../options'
import type { TreeNode } from '../core/tree'
import { PrefixTree } from '../core/tree'
import { EXPERIMENTAL_generateRouteParams } from './generateRouteParams'
import { generateParamsTypes } from './generateParamParsers'
import type { ParamParsersMap } from './generateParamParsers'
import { mockWarn } from '../../tests/vitest-mock-warn'
import { isTreeParamOptional } from '../core/treeNodeValue'
import type { CustomRouteBlockHashParamOptions } from '../core/customBlock'

describe('EXPERIMENTAL_generateRouteParams', () => {
  mockWarn()
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

  describe.each([false, true])('hash options with raw parser: %s', isRaw => {
    it.each([
      [false, undefined, 'Param_section | undefined'],
      [true, undefined, 'Exclude<Param_section, undefined>'],
      [false, 'undefined', 'Param_section | undefined'],
      [false, 'null', 'Exclude<Param_section, undefined> | null'],
      [false, '() => null', 'Exclude<Param_section, undefined> | null'],
    ] as const)(
      'generates required=%s default=%s',
      (required, defaultValue, resolved) => {
        const params = [
          {
            paramName: 'section',
            parser: 'section',
            type: 'hash' as const,
            required,
            defaultValue,
          },
        ]
        const parsers = makeParsersMap('section', isRaw)
        expect(
          EXPERIMENTAL_generateRouteParams(
            params,
            ['Param_section'],
            false,
            parsers
          )
        ).toBe(`{ 'section': ${resolved} }`)
        expect(
          EXPERIMENTAL_generateRouteParams(
            params,
            ['Param_section'],
            true,
            parsers
          )
        ).toBe(
          required
            ? "{ 'section': Param_section }"
            : defaultValue === 'null' || defaultValue === '() => null'
              ? "{ 'section'?: Param_section | null | undefined }"
              : "{ 'section'?: Param_section | undefined }"
        )
      }
    )
  })

  it.each([
    ["'intro'", false],
    ["() => 'intro'", false],
    ["function () { return 'intro' }", false],
    ['null', true],
    ['() => null', true],
    ["() => (Math.random() ? null : 'intro')", true],
    ["() => { if (Math.random()) return 'intro' }", true],
    ['getDefaultSection', true],
  ])(
    'adds null for nullable hash default %s: %s',
    (defaultValue, isNullable) => {
      const params = [
        {
          paramName: 'section',
          parser: null,
          type: 'hash' as const,
          defaultValue,
        },
      ]
      const nullType = isNullable ? ' | null' : ''
      expect(EXPERIMENTAL_generateRouteParams(params, [null], false)).toBe(
        `{ 'section': string${nullType} }`
      )
      expect(EXPERIMENTAL_generateRouteParams(params, [null], true)).toBe(
        `{ 'section'?: string${nullType} | undefined }`
      )
    }
  )

  function generateHashTypes(options: CustomRouteBlockHashParamOptions) {
    const node = createTreeWithParam('page')
    node.setCustomRouteBlock('page.vue', {
      params: { hash: { myHash: options } },
    })
    const types = generateParamsTypes(node.params, new Map())
    return [
      EXPERIMENTAL_generateRouteParams(node.params, types, false),
      EXPERIMENTAL_generateRouteParams(node.params, types, true),
    ]
  }

  it('uses undefined for an empty hash declaration', () => {
    expect(generateHashTypes({})).toEqual([
      "{ 'myHash': string | undefined }",
      "{ 'myHash'?: string | undefined }",
    ])
  })

  it('uses null for a hash declaration with a null default', () => {
    expect(generateHashTypes({ default: 'null' })).toEqual([
      "{ 'myHash': string | null }",
      "{ 'myHash'?: string | null | undefined }",
    ])
  })

  it('uses the parser type for a hash declaration with a parser', () => {
    expect(generateHashTypes({ parser: 'int' })).toEqual([
      "{ 'myHash': number | undefined }",
      "{ 'myHash'?: number | undefined }",
    ])
  })

  it('uses null and the parser type for a hash declaration with both', () => {
    expect(generateHashTypes({ parser: 'int', default: 'null' })).toEqual([
      "{ 'myHash': number | null }",
      "{ 'myHash'?: number | null | undefined }",
    ])
  })

  it.each([null, 'string', 'Param_string', 'Param_section'])(
    'uses undefined for absent hashes with type %s',
    type => {
      const params = [
        { paramName: 'section', parser: 'string', type: 'hash' as const },
      ]
      expect(EXPERIMENTAL_generateRouteParams(params, [type], false)).toBe(
        `{ 'section': ${type ?? 'string'} | undefined }`
      )
      expect(EXPERIMENTAL_generateRouteParams(params, [type], true)).toBe(
        `{ 'section'?: ${type ?? 'string'} | undefined }`
      )
    }
  )

  it.each([
    ['active-tab', "'active-tab'"],
    ["reader's-tab", "'reader\\'s-tab'"],
  ])('quotes hash param name %j in generated types', (name, key) => {
    const node = createTreeWithParam('page')
    node.setCustomRouteBlock('page.vue', {
      params: { hash: { [name]: 'section' } },
    })
    expect(
      EXPERIMENTAL_generateRouteParams(node.params, ['Param_section'], false)
    ).toBe(`{ ${key}: Param_section | undefined }`)
  })

  it('treats an explicit undefined default as absent for required hashes', () => {
    const node = createTreeWithParam('page')
    node.setCustomRouteBlock('page.vue', {
      params: { hash: { section: { required: true, default: 'undefined' } } },
    })
    expect(isTreeParamOptional(node.hashParams[0]!)).toBe(false)
  })

  it('keeps only the last hash param when several are declared', () => {
    const node = createTreeWithParam('page')
    node.setCustomRouteBlock('page.vue', {
      params: { hash: { section: 'string', other: 'int', tab: 'bool' } },
    })
    expect(node.hashParams).toEqual([
      { paramName: 'tab', parser: 'bool', type: 'hash' },
    ])
    // the getter runs again but warns once
    void node.params
    expect('using "tab" and ignoring: section, other').toHaveBeenWarnedTimes(1)
  })

  it('preserves hash declarations when merging overrides', () => {
    const node = createTreeWithParam('page')
    node.setCustomRouteBlock('page.vue', {
      params: { hash: { section: 'string' } },
    })
    node.value.mergeOverride('page.vue', {
      params: { hash: { section: 'int' }, query: { page: 'int' } },
    })
    expect(node.hashParams).toEqual([
      { paramName: 'section', parser: 'int', type: 'hash' },
    ])
    expect(node.queryParams.map(param => param.paramName)).toEqual(['page'])
  })

  it('inherits path and query params but keeps hash params local', () => {
    const tree = new PrefixTree(RESOLVED_OPTIONS)
    const parent = tree.insert('[id]', 'parent.vue')
    parent.setCustomRouteBlock('parent.vue', {
      params: { query: { page: 'int' }, hash: { section: 'string' } },
    })
    const child = tree.insert('[id]/child', 'child.vue')
    expect(child.params.map(param => param.paramName)).toEqual(['id', 'page'])
    child.setCustomRouteBlock('child.vue', {
      params: { hash: { tab: 'string' } },
    })
    expect(child.hashParams).toEqual([
      { paramName: 'tab', parser: 'string', type: 'hash' },
    ])
    expect(child.params.map(param => param.paramName)).toEqual([
      'id',
      'page',
      'tab',
    ])
    expect(parent.hashParams).toEqual([
      { paramName: 'section', parser: 'string', type: 'hash' },
    ])
  })

  describe('excludes null from custom parser types', () => {
    it('required path param excludes null', () => {
      const node = createTreeWithParam('[version=semver]')
      const result = EXPERIMENTAL_generateRouteParams(
        node.params,
        ['Param_semver'],
        false
      )
      expect(result).toBe(
        "{ 'version': Exclude<Param_semver, unknown[] | null> }"
      )
    })

    it('optional path param includes null', () => {
      const node = createTreeWithParam('[[version=semver]]')
      const result = EXPERIMENTAL_generateRouteParams(
        node.params,
        ['Param_semver'],
        false
      )
      expect(result).toBe(
        "{ 'version': Exclude<Param_semver, unknown[] | null> | null }"
      )
    })

    it('repeatable path param uses Extract', () => {
      const node = createTreeWithParam('[version=semver]+')
      const result = EXPERIMENTAL_generateRouteParams(
        node.params,
        ['Param_semver'],
        false
      )
      expect(result).toBe("{ 'version': Extract<Param_semver, unknown[]> }")
    })

    it('optional repeatable path param uses Extract', () => {
      const node = createTreeWithParam('[[version=semver]]+')
      const result = EXPERIMENTAL_generateRouteParams(
        node.params,
        ['Param_semver'],
        false
      )
      expect(result).toBe("{ 'version': Extract<Param_semver, unknown[]> }")
    })
  })

  describe('non-parser types', () => {
    it('required path param is string', () => {
      const node = createTreeWithParam('[id]')
      const result = EXPERIMENTAL_generateRouteParams(
        node.params,
        [null],
        false
      )
      expect(result).toBe("{ 'id': string }")
    })

    it('optional path param includes null', () => {
      const node = createTreeWithParam('[[id]]')
      const result = EXPERIMENTAL_generateRouteParams(
        node.params,
        [null],
        false
      )
      expect(result).toBe("{ 'id': string | null }")
    })

    it("native 'string' type matches no-parser output for required path", () => {
      const node = createTreeWithParam('[id]')
      const nullResult = EXPERIMENTAL_generateRouteParams(
        node.params,
        [null],
        false
      )
      const stringResult = EXPERIMENTAL_generateRouteParams(
        node.params,
        ['string'],
        false
      )
      expect(stringResult).toBe(nullResult)
    })

    it("native 'string' type matches no-parser output for optional path", () => {
      const node = createTreeWithParam('[[id]]')
      const nullResult = EXPERIMENTAL_generateRouteParams(
        node.params,
        [null],
        false
      )
      const stringResult = EXPERIMENTAL_generateRouteParams(
        node.params,
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
        node.params,
        ['Param_raw'],
        false,
        makeParsersMap('raw', true)
      )
      expect(result).toBe("{ 'id': Param_raw /* raw param parser */ }")
    })

    it('does not append | null for optional raw path params', () => {
      const node = createTreeWithParam('[[id=raw]]')
      const result = EXPERIMENTAL_generateRouteParams(
        node.params,
        ['Param_raw'],
        false,
        makeParsersMap('raw', true)
      )
      expect(result).toBe("{ 'id': Param_raw /* raw param parser */ }")
    })

    it('skips Extract for repeatable raw path params', () => {
      const node = createTreeWithParam('[id=raw]+')
      const result = EXPERIMENTAL_generateRouteParams(
        node.params,
        ['Param_raw'],
        false,
        makeParsersMap('raw', true)
      )
      expect(result).toBe("{ 'id': Param_raw /* raw param parser */ }")
    })

    it('skips Extract for optional repeatable raw path params', () => {
      const node = createTreeWithParam('[[id=raw]]+')
      const result = EXPERIMENTAL_generateRouteParams(
        node.params,
        ['Param_raw'],
        false,
        makeParsersMap('raw', true)
      )
      expect(result).toBe("{ 'id': Param_raw /* raw param parser */ }")
    })

    it('falls back to Exclude/Extract when paramParsersMap is omitted', () => {
      const node = createTreeWithParam('[id=raw]')
      const result = EXPERIMENTAL_generateRouteParams(
        node.params,
        ['Param_raw'],
        false
      )
      expect(result).toBe("{ 'id': Exclude<Param_raw, unknown[] | null> }")
    })

    it('still uses Exclude for non-raw entries in the map', () => {
      const node = createTreeWithParam('[id=plain]')
      const result = EXPERIMENTAL_generateRouteParams(
        node.params,
        ['Param_plain'],
        false,
        makeParsersMap('plain', false)
      )
      expect(result).toBe("{ 'id': Exclude<Param_plain, unknown[] | null> }")
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
        node.params,
        ['Param_set'],
        false,
        makeParsersMap('set', true)
      )
      expect(result).toBe("{ 'test': Param_set /* raw param parser */ }")
    })

    it('adds explicit | undefined on router.push for raw query parsers', () => {
      const node = createNodeWithQueryParam('test', 'set')
      // router.push side (isRaw=true): allow users to pass `undefined`
      // explicitly even under exactOptionalPropertyTypes.
      const result = EXPERIMENTAL_generateRouteParams(
        node.params,
        ['Param_set'],
        true,
        makeParsersMap('set', true)
      )
      expect(result).toBe(
        "{ 'test'?: Param_set /* raw param parser */ | undefined }"
      )
    })

    it('keeps | undefined on route.params for non-raw query parsers', () => {
      const node = createNodeWithQueryParam('test', 'plain')
      const result = EXPERIMENTAL_generateRouteParams(
        node.params,
        ['Param_plain'],
        false,
        makeParsersMap('plain', false)
      )
      expect(result).toBe(
        "{ 'test': Exclude<Param_plain, unknown[] | null> | undefined }"
      )
    })

    it('adds | undefined on router.push for non-raw query parsers', () => {
      const node = createNodeWithQueryParam('test', 'plain')
      const result = EXPERIMENTAL_generateRouteParams(
        node.params,
        ['Param_plain'],
        true,
        makeParsersMap('plain', false)
      )
      expect(result).toBe(
        "{ 'test'?: Exclude<Param_plain, unknown[] | null> | undefined }"
      )
    })
  })
})
