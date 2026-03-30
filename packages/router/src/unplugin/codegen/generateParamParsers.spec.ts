import { describe, expect, it } from 'vitest'
import {
  warnMissingParamParsers,
  collectMissingParamParsers,
  generateParamParsersTypesDeclarations,
  generateParamsTypes,
  generateParamParserOptions,
  generatePathParamsOptions,
  generateCustomParamParsersList,
  generateNormalizedParamParsersDeclarations,
  type ParamParsersMap,
} from './generateParamParsers'
import { PrefixTree } from '../core/tree'
import { resolveOptions } from '../options'
import { ImportsMap } from '../core/utils'
import type { TreePathParam } from '../core/treeNodeValue'
import { mockWarn } from '../../tests/vitest-mock-warn'

const DEFAULT_OPTIONS = resolveOptions({})

describe('warnMissingParamParsers', () => {
  mockWarn()
  it('shows no warnings for routes without param parsers', () => {
    const tree = new PrefixTree(DEFAULT_OPTIONS)
    tree.insert('users', 'users.vue')
    tree.insert('posts/[id]', 'posts/[id].vue')

    const paramParsers: ParamParsersMap = new Map()

    warnMissingParamParsers(tree, paramParsers)
  })

  it('shows no warnings for native parsers', () => {
    const tree = new PrefixTree(DEFAULT_OPTIONS)
    tree.insert('users/[id=int]', 'users/[id=int].vue')
    tree.insert('posts/[active=bool]', 'posts/[active=bool].vue')

    const paramParsers: ParamParsersMap = new Map()

    warnMissingParamParsers(tree, paramParsers)
  })

  it('warns for missing custom parsers', () => {
    const tree = new PrefixTree(DEFAULT_OPTIONS)
    tree.insert('users/[id=uuid]', 'users/[id=uuid].vue')

    const paramParsers: ParamParsersMap = new Map()

    warnMissingParamParsers(tree, paramParsers)

    expect(
      'Parameter parser "uuid" not found for route "/users/:id".'
    ).toHaveBeenWarned()
  })

  it('shows no warnings when custom parsers exist in map', () => {
    const tree = new PrefixTree(DEFAULT_OPTIONS)
    tree.insert('users/[id=uuid]', 'users/[id=uuid].vue')

    const paramParsers: ParamParsersMap = new Map([
      [
        'uuid',
        {
          name: 'uuid',
          typeName: 'Param_uuid',
          relativePath: 'parsers/uuid',
          absolutePath: '/path/to/parsers/uuid',
        },
      ],
    ])

    warnMissingParamParsers(tree, paramParsers)
  })
})

describe('collectMissingParamParsers', () => {
  it('returns empty array for routes without param parsers', () => {
    const tree = new PrefixTree(DEFAULT_OPTIONS)
    tree.insert('users', 'users.vue')
    tree.insert('posts/[id]', 'posts/[id].vue')

    const paramParsers: ParamParsersMap = new Map()

    const result = collectMissingParamParsers(tree, paramParsers)
    expect(result).toEqual([])
  })

  it('returns empty array for native parsers', () => {
    const tree = new PrefixTree(DEFAULT_OPTIONS)
    tree.insert('users/[id=int]', 'users/[id=int].vue')
    tree.insert('posts/[active=bool]', 'posts/[active=bool].vue')

    const paramParsers: ParamParsersMap = new Map()

    const result = collectMissingParamParsers(tree, paramParsers)
    expect(result).toEqual([])
  })

  it('collects missing custom parsers with route and file info', () => {
    const tree = new PrefixTree(DEFAULT_OPTIONS)
    tree.insert('users/[id=uuid]', 'users/[id=uuid].vue')

    const paramParsers: ParamParsersMap = new Map()

    const result = collectMissingParamParsers(tree, paramParsers)
    expect(result).toEqual([
      {
        parser: 'uuid',
        routePath: '/users/:id',
        filePaths: ['users/[id=uuid].vue'],
      },
    ])
  })

  it('returns empty array when custom parsers exist in map', () => {
    const tree = new PrefixTree(DEFAULT_OPTIONS)
    tree.insert('users/[id=uuid]', 'users/[id=uuid].vue')

    const paramParsers: ParamParsersMap = new Map([
      [
        'uuid',
        {
          name: 'uuid',
          typeName: 'Param_uuid',
          relativePath: 'parsers/uuid',
          absolutePath: '/path/to/parsers/uuid',
        },
      ],
    ])

    const result = collectMissingParamParsers(tree, paramParsers)
    expect(result).toEqual([])
  })

  it('collects multiple missing parsers from different routes', () => {
    const tree = new PrefixTree(DEFAULT_OPTIONS)
    tree.insert('users/[id=uuid]', 'users/[id=uuid].vue')
    tree.insert('posts/[slug=slug]', 'posts/[slug=slug].vue')

    const paramParsers: ParamParsersMap = new Map()

    const result = collectMissingParamParsers(tree, paramParsers)
    expect(result).toHaveLength(2)
    expect(result).toContainEqual({
      parser: 'uuid',
      routePath: '/users/:id',
      filePaths: ['users/[id=uuid].vue'],
    })
    expect(result).toContainEqual({
      parser: 'slug',
      routePath: '/posts/:slug',
      filePaths: ['posts/[slug=slug].vue'],
    })
  })
})

describe('generateParamParsersTypesDeclarations', () => {
  it('returns empty string for empty param parsers map', () => {
    const paramParsers: ParamParsersMap = new Map()
    const result = generateParamParsersTypesDeclarations(paramParsers)
    expect(result).toBe('')
  })

  it('generates single param parser type declaration', () => {
    const paramParsers: ParamParsersMap = new Map([
      [
        'uuid',
        {
          name: 'uuid',
          typeName: 'Param_uuid',
          relativePath: 'parsers/uuid',
          absolutePath: '/path/to/parsers/uuid',
        },
      ],
    ])

    const result = generateParamParsersTypesDeclarations(paramParsers)
    expect(result).toBe(
      `type Param_uuid = _ExtractParamParserType<typeof import('./parsers/uuid').parser>`
    )
  })

  it('generates correct import path when parser is outside dts directory', () => {
    // This tests the case where dts is in a subfolder (e.g., types/typed-router.d.ts)
    // and parsers are at project root (e.g., parsers/uuid.ts)
    // The relativePath should be computed relative to the dts directory
    const paramParsers: ParamParsersMap = new Map([
      [
        'uuid',
        {
          name: 'uuid',
          typeName: 'Param_uuid',
          relativePath: '../parsers/uuid',
          absolutePath: '/project/parsers/uuid',
        },
      ],
    ])

    const result = generateParamParsersTypesDeclarations(paramParsers)
    expect(result).toBe(
      `type Param_uuid = _ExtractParamParserType<typeof import('../parsers/uuid').parser>`
    )
  })

  it('generates multiple param parsers type declarations', () => {
    const paramParsers: ParamParsersMap = new Map([
      [
        'uuid',
        {
          name: 'uuid',
          typeName: 'Param_uuid',
          relativePath: 'parsers/uuid',
          absolutePath: '/path/to/parsers/uuid',
        },
      ],
      [
        'slug',
        {
          name: 'slug',
          typeName: 'Param_slug',
          relativePath: 'parsers/slug',
          absolutePath: '/path/to/parsers/slug',
        },
      ],
    ])

    const result = generateParamParsersTypesDeclarations(paramParsers)
    expect(result).toMatchInlineSnapshot(`
      "type Param_uuid = _ExtractParamParserType<typeof import('./parsers/uuid').parser>
      type Param_slug = _ExtractParamParserType<typeof import('./parsers/slug').parser>"
    `)
  })
})

describe('generateParamsTypes', () => {
  it('returns null for params without parsers', () => {
    const params: TreePathParam[] = [
      {
        paramName: 'id',
        modifier: '',
        optional: false,
        repeatable: false,
        isSplat: false,
        parser: null,
      },
    ]
    const paramParsers: ParamParsersMap = new Map()

    const result = generateParamsTypes(params, paramParsers)
    expect(result).toEqual([null])
  })

  it('returns correct type names for custom parsers', () => {
    const params: TreePathParam[] = [
      {
        paramName: 'id',
        modifier: '',
        optional: false,
        repeatable: false,
        isSplat: false,
        parser: 'uuid',
      },
    ]
    const paramParsers: ParamParsersMap = new Map([
      [
        'uuid',
        {
          name: 'uuid',
          typeName: 'Param_uuid',
          relativePath: 'parsers/uuid',
          absolutePath: '/path/to/parsers/uuid',
        },
      ],
    ])

    const result = generateParamsTypes(params, paramParsers)
    expect(result).toEqual(['Param_uuid'])
  })

  it('returns correct types for native parsers', () => {
    const params: TreePathParam[] = [
      {
        paramName: 'id',
        modifier: '',
        optional: false,
        repeatable: false,
        isSplat: false,
        parser: 'int',
      },
      {
        paramName: 'active',
        modifier: '',
        optional: false,
        repeatable: false,
        isSplat: false,
        parser: 'bool',
      },
    ]
    const paramParsers: ParamParsersMap = new Map()

    const result = generateParamsTypes(params, paramParsers)
    expect(result).toEqual(['number', 'boolean'])
  })

  it('handles mixed params with and without parsers', () => {
    const params: TreePathParam[] = [
      {
        paramName: 'id',
        modifier: '',
        optional: false,
        repeatable: false,
        isSplat: false,
        parser: 'uuid',
      },
      {
        paramName: 'page',
        modifier: '',
        optional: false,
        repeatable: false,
        isSplat: false,
        parser: null,
      },
      {
        paramName: 'count',
        modifier: '',
        optional: false,
        repeatable: false,
        isSplat: false,
        parser: 'int',
      },
    ]
    const paramParsers: ParamParsersMap = new Map([
      [
        'uuid',
        {
          name: 'uuid',
          typeName: 'Param_uuid',
          relativePath: 'parsers/uuid',
          absolutePath: '/path/to/parsers/uuid',
        },
      ],
    ])

    const result = generateParamsTypes(params, paramParsers)
    expect(result).toEqual(['Param_uuid', null, 'number'])
  })
})

describe('generateParamParserOptions', () => {
  it('returns empty string for param without parser', () => {
    const param: TreePathParam = {
      paramName: 'id',
      modifier: '',
      optional: false,
      repeatable: false,
      isSplat: false,
      parser: null,
    }
    const importsMap = new ImportsMap()
    const paramParsers: ParamParsersMap = new Map()

    const result = generateParamParserOptions(param, importsMap, paramParsers)
    expect(result).toBe('')
  })

  it('generates import and returns variable for custom parser', () => {
    const param: TreePathParam = {
      paramName: 'id',
      modifier: '',
      optional: false,
      repeatable: false,
      isSplat: false,
      parser: 'uuid',
    }
    const importsMap = new ImportsMap()
    const paramParsers: ParamParsersMap = new Map([
      [
        'uuid',
        {
          name: 'uuid',
          typeName: 'Param_uuid',
          relativePath: 'parsers/uuid',
          absolutePath: '/path/to/parsers/uuid',
        },
      ],
    ])

    const result = generateParamParserOptions(param, importsMap, paramParsers)
    expect(result).toBe('_normalized_PARAM_PARSER__uuid')
    // imports are no longer added by generateParamParserOptions for custom parsers
    // they are handled by generateNormalizedParamParsersDeclarations
  })

  it('generates correct import for native int parser', () => {
    const param: TreePathParam = {
      paramName: 'id',
      modifier: '',
      optional: false,
      repeatable: false,
      isSplat: false,
      parser: 'int',
    }
    const importsMap = new ImportsMap()
    const paramParsers: ParamParsersMap = new Map()

    const result = generateParamParserOptions(param, importsMap, paramParsers)
    expect(result).toBe('PARAM_PARSER_INT')
    expect(importsMap.toString()).toContain(
      `import { PARAM_PARSER_INT } from 'vue-router/experimental'`
    )
  })

  it('generates correct import for native bool parser', () => {
    const param: TreePathParam = {
      paramName: 'active',
      modifier: '',
      optional: false,
      repeatable: false,
      isSplat: false,
      parser: 'bool',
    }
    const importsMap = new ImportsMap()
    const paramParsers: ParamParsersMap = new Map()

    const result = generateParamParserOptions(param, importsMap, paramParsers)
    expect(result).toBe('PARAM_PARSER_BOOL')
    expect(importsMap.toString()).toContain(
      `import { PARAM_PARSER_BOOL } from 'vue-router/experimental'`
    )
  })

  it('returns empty string for missing parser', () => {
    const param: TreePathParam = {
      paramName: 'id',
      modifier: '',
      optional: false,
      repeatable: false,
      isSplat: false,
      parser: 'missing',
    }
    const importsMap = new ImportsMap()
    const paramParsers: ParamParsersMap = new Map()

    const result = generateParamParserOptions(param, importsMap, paramParsers)
    expect(result).toBe('')
  })
})

describe('generatePathParamsOptions', () => {
  it('returns empty object for empty params array', () => {
    const params: TreePathParam[] = []
    const importsMap = new ImportsMap()
    const paramParsers: ParamParsersMap = new Map()

    const result = generatePathParamsOptions(params, importsMap, paramParsers)
    expect(result).toBe(`{}`)
  })

  it('generates options for single param with parser', () => {
    const params: TreePathParam[] = [
      {
        paramName: 'id',
        modifier: '',
        optional: false,
        repeatable: false,
        isSplat: false,
        parser: 'int',
      },
    ]
    const importsMap = new ImportsMap()
    const paramParsers: ParamParsersMap = new Map()

    const result = generatePathParamsOptions(params, importsMap, paramParsers)
    expect(result).toContain('id: [PARAM_PARSER_INT]')
  })

  it('generates options for param without parser', () => {
    const params: TreePathParam[] = [
      {
        paramName: 'slug',
        modifier: '',
        optional: false,
        repeatable: false,
        isSplat: false,
        parser: null,
      },
    ]
    const importsMap = new ImportsMap()
    const paramParsers: ParamParsersMap = new Map()

    const result = generatePathParamsOptions(params, importsMap, paramParsers)
    expect(result).toContain('slug: [/* no parser */]')
  })

  it('includes repeatable and optional flags when present', () => {
    const params: TreePathParam[] = [
      {
        paramName: 'tags',
        modifier: '+',
        optional: false,
        repeatable: true,
        isSplat: false,
        parser: null,
      },
      {
        paramName: 'category',
        modifier: '?',
        optional: true,
        repeatable: false,
        isSplat: false,
        parser: null,
      },
    ]
    const importsMap = new ImportsMap()
    const paramParsers: ParamParsersMap = new Map()

    const result = generatePathParamsOptions(params, importsMap, paramParsers)
    expect(result).toContain('tags: [/* no parser */, /* repeatable: */ true]')
    expect(result).toContain(
      'category: [/* no parser */, /* repeatable: false */, /* optional: */ true]'
    )
  })

  it('handles multiple params with different configurations', () => {
    const params: TreePathParam[] = [
      {
        paramName: 'id',
        modifier: '',
        optional: false,
        repeatable: false,
        isSplat: false,
        parser: 'uuid',
      },
      {
        paramName: 'page',
        modifier: '?',
        optional: true,
        repeatable: false,
        isSplat: false,
        parser: 'int',
      },
      {
        paramName: 'tags',
        modifier: '+',
        optional: false,
        repeatable: true,
        isSplat: false,
        parser: null,
      },
    ]
    const importsMap = new ImportsMap()
    const paramParsers: ParamParsersMap = new Map([
      [
        'uuid',
        {
          name: 'uuid',
          typeName: 'Param_uuid',
          relativePath: 'parsers/uuid',
          absolutePath: '/path/to/parsers/uuid',
        },
      ],
    ])

    const result = generatePathParamsOptions(params, importsMap, paramParsers)
    expect(result).toContain('id: [_normalized_PARAM_PARSER__uuid]')
    expect(result).toContain(
      'page: [PARAM_PARSER_INT, /* repeatable: false */, /* optional: */ true]'
    )
    expect(result).toContain('tags: [/* no parser */, /* repeatable: */ true]')
  })
})

describe('generateParamParserCustomType', () => {
  it('returns never for empty param parsers map', () => {
    const paramParsers: ParamParsersMap = new Map()
    const result = generateCustomParamParsersList(paramParsers)
    expect(result).toEqual(['never'])
  })

  it('returns single quoted parser name for one parser', () => {
    const paramParsers: ParamParsersMap = new Map([
      [
        'date',
        {
          name: 'date',
          typeName: 'Param_date',
          relativePath: 'parsers/date',
          absolutePath: '/path/to/parsers/date',
        },
      ],
    ])

    const result = generateCustomParamParsersList(paramParsers)
    expect(result).toEqual(["'date'"])
  })

  it('returns a list of quoted parser names for multiple parsers in alphabetical order', () => {
    const paramParsers: ParamParsersMap = new Map([
      [
        'uuid',
        {
          name: 'uuid',
          typeName: 'Param_uuid',
          relativePath: 'parsers/uuid',
          absolutePath: '/path/to/parsers/uuid',
        },
      ],
      [
        'date',
        {
          name: 'date',
          typeName: 'Param_date',
          relativePath: 'parsers/date',
          absolutePath: '/path/to/parsers/date',
        },
      ],
    ])

    const result = generateCustomParamParsersList(paramParsers)
    expect(result).toEqual(["'date'", "'uuid'"])
  })

  it('handles parser names with special characters correctly', () => {
    const paramParsers: ParamParsersMap = new Map([
      [
        'custom-parser',
        {
          name: 'custom-parser',
          typeName: 'Param_custom-parser',
          relativePath: 'parsers/custom-parser',
          absolutePath: '/path/to/parsers/custom-parser',
        },
      ],
    ])

    const result = generateCustomParamParsersList(paramParsers)
    expect(result).toEqual(["'custom-parser'"])
  })

  it('converts kebab-case filenames to valid camelCase identifiers', () => {
    // Setup: Param parsers with kebab-case filenames should have camelCase names
    const importsMap = new ImportsMap()
    const paramParsers: ParamParsersMap = new Map([
      [
        'user-id', // Map key is original kebab-case (used in routes like [id=user-id])
        {
          name: 'userId', // Converted to camelCase for identifiers
          typeName: 'Param_userId', // Valid TypeScript type name
          relativePath: 'parsers/user-id',
          absolutePath: '/path/to/parsers/user-id',
        },
      ],
      [
        'date-with-dashes',
        {
          name: 'dateWithDashes',
          typeName: 'Param_dateWithDashes',
          relativePath: 'parsers/date-with-dashes',
          absolutePath: '/path/to/parsers/date-with-dashes',
        },
      ],
    ])

    expect(generateParamParsersTypesDeclarations(paramParsers))
      .toMatchInlineSnapshot(`
        "type Param_userId = _ExtractParamParserType<typeof import('./parsers/user-id').parser>
        type Param_dateWithDashes = _ExtractParamParserType<typeof import('./parsers/date-with-dashes').parser>"
      `)

    const param: TreePathParam = {
      paramName: 'id',
      modifier: '',
      optional: false,
      repeatable: false,
      isSplat: false,
      parser: 'user-id', // Route uses original kebab-case name
    }
    expect(generateParamParserOptions(param, importsMap, paramParsers)).toBe(
      '_normalized_PARAM_PARSER__userId'
    ) // Generated variable is camelCase
    // imports are no longer added by generateParamParserOptions for custom parsers

    expect(generateCustomParamParsersList(paramParsers)).toEqual([
      "'date-with-dashes'",
      "'user-id'",
    ])
  })
})

describe('generateNormalizedParamParsersDeclarations', () => {
  it('returns empty string for empty param parsers map', () => {
    const paramParsers: ParamParsersMap = new Map()
    const importsMap = new ImportsMap()
    const result = generateNormalizedParamParsersDeclarations(
      paramParsers,
      importsMap
    )
    expect(result).toBe('')
  })

  it('generates a const declaration for a single parser', () => {
    const paramParsers: ParamParsersMap = new Map([
      [
        'uuid',
        {
          name: 'uuid',
          typeName: 'Param_uuid',
          relativePath: 'parsers/uuid',
          absolutePath: '/path/to/parsers/uuid',
        },
      ],
    ])
    const importsMap = new ImportsMap()
    const result = generateNormalizedParamParsersDeclarations(
      paramParsers,
      importsMap
    )
    expect(result).toBe(
      'const _normalized_PARAM_PARSER__uuid = _normalizeParamParser(PARAM_PARSER__uuid)'
    )
    expect(importsMap.toString()).toContain(
      `import { _normalizeParamParser } from 'vue-router/experimental'`
    )
    expect(importsMap.toString()).toContain(
      `import { parser as PARAM_PARSER__uuid } from '/path/to/parsers/uuid'`
    )
  })

  it('generates declarations for multiple parsers', () => {
    const paramParsers: ParamParsersMap = new Map([
      [
        'uuid',
        {
          name: 'uuid',
          typeName: 'Param_uuid',
          relativePath: 'parsers/uuid',
          absolutePath: '/path/to/parsers/uuid',
        },
      ],
      [
        'slug',
        {
          name: 'slug',
          typeName: 'Param_slug',
          relativePath: 'parsers/slug',
          absolutePath: '/path/to/parsers/slug',
        },
      ],
    ])
    const importsMap = new ImportsMap()
    const result = generateNormalizedParamParsersDeclarations(
      paramParsers,
      importsMap
    )
    expect(result).toContain(
      'const _normalized_PARAM_PARSER__uuid = _normalizeParamParser(PARAM_PARSER__uuid)'
    )
    expect(result).toContain(
      'const _normalized_PARAM_PARSER__slug = _normalizeParamParser(PARAM_PARSER__slug)'
    )
  })

  it('handles camelCase names from kebab-case filenames', () => {
    const paramParsers: ParamParsersMap = new Map([
      [
        'user-id',
        {
          name: 'userId',
          typeName: 'Param_userId',
          relativePath: 'parsers/user-id',
          absolutePath: '/path/to/parsers/user-id',
        },
      ],
    ])
    const importsMap = new ImportsMap()
    const result = generateNormalizedParamParsersDeclarations(
      paramParsers,
      importsMap
    )
    expect(result).toBe(
      'const _normalized_PARAM_PARSER__userId = _normalizeParamParser(PARAM_PARSER__userId)'
    )
    expect(importsMap.toString()).toContain(
      `import { parser as PARAM_PARSER__userId } from '/path/to/parsers/user-id'`
    )
  })
})
