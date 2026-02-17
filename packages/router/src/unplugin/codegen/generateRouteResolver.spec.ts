import { beforeEach, describe, expect, it } from 'vitest'
import { PrefixTree } from '../core/tree'
import { resolveOptions } from '../options'
import {
  generateRouteResolver,
  generateRouteRecord,
  generateRouteRecordQuery,
} from './generateRouteResolver'
import { ImportsMap } from '../core/utils'
import { ParamParsersMap } from './generateParamParsers'
import { generateAliasWarnings } from './generateAliasWarnings'

const DEFAULT_OPTIONS = resolveOptions({})
let DEFAULT_STATE: Parameters<typeof generateRouteRecord>[0]['state'] = {
  id: 0,
  matchableRecords: [],
}

beforeEach(() => {
  DEFAULT_STATE = {
    id: 0,
    matchableRecords: [],
  }
})

describe('generateRouteRecordQuery', () => {
  let importsMap!: ImportsMap
  beforeEach(() => {
    importsMap = new ImportsMap()
  })

  it('returns empty string for non-matchable nodes without query params', () => {
    const tree = new PrefixTree(DEFAULT_OPTIONS)
    const node = tree.insert('a/b', 'a/b.vue').parent! // non-matchable parent
    expect(
      generateRouteRecordQuery({ importsMap, node, paramParsersMap: new Map() })
    ).toBe('')
  })

  it('returns empty string when no query params in a matchable node', () => {
    const node = new PrefixTree(DEFAULT_OPTIONS).insert('a', 'a.vue')
    expect(
      generateRouteRecordQuery({ importsMap, node, paramParsersMap: new Map() })
    ).toBe('')
  })

  it('generates query params for non-matchable nodes when they have query params', () => {
    const tree = new PrefixTree(DEFAULT_OPTIONS)
    const node = tree.insert('a/b', 'a/b.vue').parent! // non-matchable parent
    // Add query params to the non-matchable parent
    node.value.setEditOverride('params', {
      query: { search: {} },
    })
    expect(
      generateRouteRecordQuery({ importsMap, node, paramParsersMap: new Map() })
    ).toMatchInlineSnapshot(`
      "query: [
          new MatcherPatternQueryParam('search', 'search', 'value')
        ],"
    `)
  })

  it('does not includes query params from parent nodes', () => {
    const tree = new PrefixTree(DEFAULT_OPTIONS)
    const parentNode = tree.insert('parent', 'parent.vue')
    const childNode = tree.insert('parent/child', 'parent/child.vue')

    // Add query params to parent
    parentNode.value.setEditOverride('params', {
      query: {
        parentParam: {},
      },
    })

    // Add query params to child
    childNode.value.setEditOverride('params', {
      query: {
        childParam: { parser: 'int' },
      },
    })

    expect(
      generateRouteRecordQuery({
        importsMap,
        node: childNode,
        paramParsersMap: new Map(),
      })
    ).toMatchInlineSnapshot(`
      "query: [
          new MatcherPatternQueryParam('childParam', 'childParam', 'value', PARAM_PARSER_INT)
        ],"
    `)
  })

  it('generates query property with single query param', () => {
    const node = new PrefixTree(DEFAULT_OPTIONS).insert('a', 'a.vue')
    // Mock the queryParams getter
    node.value.setEditOverride('params', {
      query: { search: {} },
    })
    expect(
      generateRouteRecordQuery({ importsMap, node, paramParsersMap: new Map() })
    ).toMatchInlineSnapshot(`
      "query: [
          new MatcherPatternQueryParam('search', 'search', 'value')
        ],"
    `)
  })

  it('generates query property with multiple query params', () => {
    const node = new PrefixTree(DEFAULT_OPTIONS).insert('a', 'a.vue')
    node.value.setEditOverride('params', {
      query: {
        search: {},
        page: { parser: 'int' },
        active: { parser: 'bool' },
      },
    })
    expect(
      generateRouteRecordQuery({ importsMap, node, paramParsersMap: new Map() })
    ).toMatchInlineSnapshot(`
      "query: [
          new MatcherPatternQueryParam('search', 'search', 'value'),
          new MatcherPatternQueryParam('page', 'page', 'value', PARAM_PARSER_INT),
          new MatcherPatternQueryParam('active', 'active', 'value', PARAM_PARSER_BOOL)
        ],"
    `)
  })

  it('adds MatcherPatternQueryParam import', () => {
    const node = new PrefixTree(DEFAULT_OPTIONS).insert('a', 'a.vue')
    node.value.setEditOverride('params', {
      query: { search: {} },
    })

    generateRouteRecordQuery({ importsMap, node, paramParsersMap: new Map() })

    expect(
      importsMap.has('vue-router/experimental', 'MatcherPatternQueryParam')
    ).toBe(true)
  })

  it('generates query param with format "value"', () => {
    const node = new PrefixTree(DEFAULT_OPTIONS).insert('a', 'a.vue')
    node.value.setEditOverride('params', {
      query: { search: { format: 'value' } },
    })
    expect(
      generateRouteRecordQuery({ importsMap, node, paramParsersMap: new Map() })
    ).toMatchInlineSnapshot(`
      "query: [
          new MatcherPatternQueryParam('search', 'search', 'value')
        ],"
    `)
  })

  it('generates query param with format "array"', () => {
    const node = new PrefixTree(DEFAULT_OPTIONS).insert('a', 'a.vue')
    node.value.setEditOverride('params', {
      query: { tags: { format: 'array' } },
    })
    expect(
      generateRouteRecordQuery({ importsMap, node, paramParsersMap: new Map() })
    ).toMatchInlineSnapshot(`
      "query: [
          new MatcherPatternQueryParam('tags', 'tags', 'array')
        ],"
    `)
  })

  it('generates query param with default value', () => {
    const node = new PrefixTree(DEFAULT_OPTIONS).insert('a', 'a.vue')
    node.value.setEditOverride('params', {
      query: { limit: { default: '10' } },
    })
    expect(
      generateRouteRecordQuery({ importsMap, node, paramParsersMap: new Map() })
    ).toMatchInlineSnapshot(`
      "query: [
          new MatcherPatternQueryParam('limit', 'limit', 'value', {}, 10)
        ],"
    `)
  })

  it('generates query param with format and default value', () => {
    const node = new PrefixTree(DEFAULT_OPTIONS).insert('a', 'a.vue')
    node.value.setEditOverride('params', {
      query: { page: { parser: 'int', format: 'array', default: '1' } },
    })
    expect(
      generateRouteRecordQuery({ importsMap, node, paramParsersMap: new Map() })
    ).toMatchInlineSnapshot(`
      "query: [
          new MatcherPatternQueryParam('page', 'page', 'array', PARAM_PARSER_INT, 1)
        ],"
    `)
  })

  it('generates query param with required and default', () => {
    const node = new PrefixTree(DEFAULT_OPTIONS).insert('a', 'a.vue')
    node.value.setEditOverride('params', {
      query: { page: { parser: 'int', default: '1', required: true } },
    })
    expect(
      generateRouteRecordQuery({ importsMap, node, paramParsersMap: new Map() })
    ).toMatchInlineSnapshot(`
      "query: [
          new MatcherPatternQueryParam('page', 'page', 'value', PARAM_PARSER_INT, 1, true)
        ],"
    `)
  })

  it('generates mixed query params with different configurations', () => {
    const node = new PrefixTree(DEFAULT_OPTIONS).insert('a', 'a.vue')
    node.value.setEditOverride('params', {
      query: {
        q: { format: 'value' },
        tags: { format: 'array' },
        limit: { parser: 'int', default: '20' },
        active: { default: 'true' },
      },
    })
    expect(
      generateRouteRecordQuery({ importsMap, node, paramParsersMap: new Map() })
    ).toMatchInlineSnapshot(`
      "query: [
          new MatcherPatternQueryParam('q', 'q', 'value'),
          new MatcherPatternQueryParam('tags', 'tags', 'array'),
          new MatcherPatternQueryParam('limit', 'limit', 'value', PARAM_PARSER_INT, 20),
          new MatcherPatternQueryParam('active', 'active', 'value', {}, true)
        ],"
    `)
  })
})

describe('generateRouteRecord', () => {
  it('serializes a simple static path', () => {
    const tree = new PrefixTree(DEFAULT_OPTIONS)
    const importsMap = new ImportsMap()
    const paramParsersMap: ParamParsersMap = new Map()
    expect(
      generateRouteRecord({
        node: tree.insert('a', 'a.vue'),
        parentVar: null,
        parentNode: null,
        state: DEFAULT_STATE,
        options: DEFAULT_OPTIONS,
        importsMap,
        paramParsersMap,
      })
    ).toMatchInlineSnapshot(`
      "const __route_0 = normalizeRouteRecord({
        name: '/a',
        path: new MatcherPatternPathStatic('/a'),
        components: {
          'default': () => import('a.vue')
        },
      })"
    `)
    expect(
      generateRouteRecord({
        node: tree.insert('a/b/c', 'a/b/c.vue'),
        parentVar: null,
        parentNode: null,
        state: DEFAULT_STATE,
        options: DEFAULT_OPTIONS,
        importsMap,
        paramParsersMap,
      })
    ).toMatchInlineSnapshot(`
      "const __route_1 = normalizeRouteRecord({
        name: '/a/b/c',
        path: new MatcherPatternPathStatic('/a/b/c'),
        components: {
          'default': () => import('a/b/c.vue')
        },
      })"
    `)
  })
})

describe('generateRouteResolver', () => {
  it('generates a resolver for a simple tree', () => {
    const tree = new PrefixTree(DEFAULT_OPTIONS)
    const importsMap = new ImportsMap()
    tree.insert('a', 'a.vue')
    tree.insert('b/c', 'b/c.vue')
    tree.insert('b/c/d', 'b/c/d.vue')
    tree.insert('b/e/f', 'b/c/f.vue')
    const resolver = generateRouteResolver(
      tree,
      DEFAULT_OPTIONS,
      importsMap,
      new Map()
    )

    expect(resolver).toMatchInlineSnapshot(`
      "
      const __route_0 = normalizeRouteRecord({
        name: '/a',
        path: new MatcherPatternPathStatic('/a'),
        components: {
          'default': () => import('a.vue')
        },
      })

      const __route_1 = normalizeRouteRecord({
        name: '/b/c',
        path: new MatcherPatternPathStatic('/b/c'),
        components: {
          'default': () => import('b/c.vue')
        },
      })
      const __route_2 = normalizeRouteRecord({
        name: '/b/c/d',
        path: new MatcherPatternPathStatic('/b/c/d'),
        components: {
          'default': () => import('b/c/d.vue')
        },
        parent: __route_1,
      })
      const __route_3 = normalizeRouteRecord({
        name: '/b/e/f',
        path: new MatcherPatternPathStatic('/b/e/f'),
        components: {
          'default': () => import('b/c/f.vue')
        },
      })

      export const resolver = createFixedResolver([
        __route_2,  // /b/c/d
        __route_3,  // /b/e/f
        __route_1,  // /b/c
        __route_0,  // /a
      ])
      "
    `)
  })

  it('reuses parent path matcher when possible', () => {
    const tree = new PrefixTree(DEFAULT_OPTIONS)
    const importsMap = new ImportsMap()
    tree.insert('a', 'a.vue')
    tree.insert('a/index', 'a/index.vue')
    tree.insert('a/about', 'a/about.vue')

    // with a param
    tree.insert('p/[id]', 'p/[id].vue')
    tree.insert('p/[id]/index', 'p/[id]/index.vue')
    tree.insert('p/[id]/details', 'p/[id]/details.vue')

    const resolver = generateRouteResolver(
      tree,
      DEFAULT_OPTIONS,
      importsMap,
      new Map()
    )

    expect(resolver).toMatchInlineSnapshot(`
      "
      const __route_0 = normalizeRouteRecord({
        name: '/a',
        path: new MatcherPatternPathStatic('/a'),
        components: {
          'default': () => import('a.vue')
        },
      })
      const __route_1 = normalizeRouteRecord({
        name: '/a/',
        path: __route_0.path,
        components: {
          'default': () => import('a/index.vue')
        },
        parent: __route_0,
      })
      const __route_2 = normalizeRouteRecord({
        name: '/a/about',
        path: new MatcherPatternPathStatic('/a/about'),
        components: {
          'default': () => import('a/about.vue')
        },
        parent: __route_0,
      })

      const __route_3 = normalizeRouteRecord({
        name: '/p/[id]',
        path: new MatcherPatternPathDynamic(
          /^\\/p\\/([^/]+?)$/i,
          {
            id: [/* no parser */],
          },
          ["p",1],
          /* trailingSlash */
        ),
        components: {
          'default': () => import('p/[id].vue')
        },
      })
      const __route_4 = normalizeRouteRecord({
        name: '/p/[id]/',
        path: __route_3.path,
        components: {
          'default': () => import('p/[id]/index.vue')
        },
        parent: __route_3,
      })
      const __route_5 = normalizeRouteRecord({
        name: '/p/[id]/details',
        path: new MatcherPatternPathDynamic(
          /^\\/p\\/([^/]+?)\\/details$/i,
          {
            id: [/* no parser */],
          },
          ["p",1,"details"],
          /* trailingSlash */
        ),
        components: {
          'default': () => import('p/[id]/details.vue')
        },
        parent: __route_3,
      })

      export const resolver = createFixedResolver([
        __route_2,  // /a/about
        __route_1,  // /a
        __route_5,  // /p/:id/details
        __route_4,  // /p/:id
        __route_3,  // /p/:id
        __route_0,  // /a
      ])
      "
    `)
  })

  it('generates correct nested layouts', () => {
    const tree = new PrefixTree(DEFAULT_OPTIONS)
    const importsMap = new ImportsMap()
    tree.insert('a', 'a.vue')
    tree.insert('a/(a-home)', 'a/(a-home).vue')
    tree.insert('a/b', 'a/b.vue')
    tree.insert('a/b/c', 'a/b/c.vue')
    tree.insert('a/b/(b-home)', 'a/b/(b-home).vue')
    tree.insert('a/d', 'a/d.vue')
    tree.insert('a/b/e', 'a/b/e.vue')

    const resolver = generateRouteResolver(
      tree,
      DEFAULT_OPTIONS,
      importsMap,
      new Map()
    )

    // FIXME: there are conflicting paths here. The order is correct as nested routes appear higher but
    // it should appeand a trailing slash to the children route or the parent
    // Adding it to the parent makes the routing stable but also inconsistent trailing slash
    // I think it's better to not have a stable routing to preserve stable trailing slash

    expect(resolver).toMatchInlineSnapshot(`
      "
      const __route_0 = normalizeRouteRecord({
        name: '/a',
        path: new MatcherPatternPathStatic('/a'),
        components: {
          'default': () => import('a.vue')
        },
      })
      const __route_1 = normalizeRouteRecord({
        name: '/a/(a-home)',
        path: __route_0.path,
        components: {
          'default': () => import('a/(a-home).vue')
        },
        parent: __route_0,
      })
      const __route_2 = normalizeRouteRecord({
        name: '/a/b',
        path: new MatcherPatternPathStatic('/a/b'),
        components: {
          'default': () => import('a/b.vue')
        },
        parent: __route_0,
      })
      const __route_3 = normalizeRouteRecord({
        name: '/a/b/(b-home)',
        path: __route_2.path,
        components: {
          'default': () => import('a/b/(b-home).vue')
        },
        parent: __route_2,
      })
      const __route_4 = normalizeRouteRecord({
        name: '/a/b/c',
        path: new MatcherPatternPathStatic('/a/b/c'),
        components: {
          'default': () => import('a/b/c.vue')
        },
        parent: __route_2,
      })
      const __route_5 = normalizeRouteRecord({
        name: '/a/b/e',
        path: new MatcherPatternPathStatic('/a/b/e'),
        components: {
          'default': () => import('a/b/e.vue')
        },
        parent: __route_2,
      })
      const __route_6 = normalizeRouteRecord({
        name: '/a/d',
        path: new MatcherPatternPathStatic('/a/d'),
        components: {
          'default': () => import('a/d.vue')
        },
        parent: __route_0,
      })

      export const resolver = createFixedResolver([
        __route_4,  // /a/b/c
        __route_5,  // /a/b/e
        __route_3,  // /a/b
        __route_2,  // /a/b
        __route_6,  // /a/d
        __route_1,  // /a
        __route_0,  // /a
      ])
      "
    `)
  })

  it('handles nested routes under layouts with skipped intermediate nodes', () => {
    const tree = new PrefixTree(DEFAULT_OPTIONS)
    const importsMap = new ImportsMap()

    // Create the file structure from issue #775
    tree.insert('(layout)', '(layout).vue')
    tree.insert('(layout)/(home)', '(layout)/(home).vue')
    tree.insert('(layout)/about/(about)', '(layout)/about/(about).vue')

    const resolver = generateRouteResolver(
      tree,
      DEFAULT_OPTIONS,
      importsMap,
      new Map()
    )

    // The about route should have path='/about', not path='/'
    expect(resolver).toMatchInlineSnapshot(`
      "
      const __route_0 = normalizeRouteRecord({
        name: '/(layout)',
        path: new MatcherPatternPathStatic('/'),
        components: {
          'default': () => import('(layout).vue')
        },
      })
      const __route_1 = normalizeRouteRecord({
        name: '/(layout)/(home)',
        path: __route_0.path,
        components: {
          'default': () => import('(layout)/(home).vue')
        },
        parent: __route_0,
      })
      const __route_2 = normalizeRouteRecord({
        name: '/(layout)/about/(about)',
        path: new MatcherPatternPathStatic('/about'),
        components: {
          'default': () => import('(layout)/about/(about).vue')
        },
        parent: __route_0,
      })

      export const resolver = createFixedResolver([
        __route_2,  // /about
        __route_1,  // /
        __route_0,  // /
      ])
      "
    `)
  })

  it('handles nested group routes with same name at different levels', () => {
    const tree = new PrefixTree(DEFAULT_OPTIONS)
    const importsMap = new ImportsMap()

    // Test case: settings page with nested group layout
    tree.insert('(layout)', '(layout).vue')
    tree.insert('(layout)/(home)', '(layout)/(home).vue')
    tree.insert(
      '(layout)/(settings)/settings',
      '(layout)/(settings)/settings.vue'
    )
    tree.insert(
      '(layout)/(settings)/settings/(general-settings)',
      '(layout)/(settings)/settings/(general-settings).vue'
    )

    const resolver = generateRouteResolver(
      tree,
      DEFAULT_OPTIONS,
      importsMap,
      new Map()
    )

    // Both routes should be at /settings path
    expect(resolver).toMatchInlineSnapshot(`
      "
      const __route_0 = normalizeRouteRecord({
        name: '/(layout)',
        path: new MatcherPatternPathStatic('/'),
        components: {
          'default': () => import('(layout).vue')
        },
      })
      const __route_1 = normalizeRouteRecord({
        name: '/(layout)/(home)',
        path: __route_0.path,
        components: {
          'default': () => import('(layout)/(home).vue')
        },
        parent: __route_0,
      })
      const __route_2 = normalizeRouteRecord({
        name: '/(layout)/(settings)/settings',
        path: new MatcherPatternPathStatic('/settings'),
        components: {
          'default': () => import('(layout)/(settings)/settings.vue')
        },
        parent: __route_0,
      })
      const __route_3 = normalizeRouteRecord({
        name: '/(layout)/(settings)/settings/(general-settings)',
        path: __route_2.path,
        components: {
          'default': () => import('(layout)/(settings)/settings/(general-settings).vue')
        },
        parent: __route_2,
      })

      export const resolver = createFixedResolver([
        __route_3,  // /settings
        __route_2,  // /settings
        __route_1,  // /
        __route_0,  // /
      ])
      "
    `)
  })

  it('handles nested group route without intermediate layout file', () => {
    const tree = new PrefixTree(DEFAULT_OPTIONS)
    const importsMap = new ImportsMap()

    // Test case: only nested (general-settings) without settings.vue
    // The intermediate settings directory should be skipped
    tree.insert('(layout)', '(layout).vue')
    tree.insert('(layout)/(home)', '(layout)/(home).vue')
    tree.insert(
      '(layout)/(settings)/settings/(general-settings)',
      '(layout)/(settings)/settings/(general-settings).vue'
    )

    const resolver = generateRouteResolver(
      tree,
      DEFAULT_OPTIONS,
      importsMap,
      new Map()
    )

    // The route should have path '/settings', not '/'
    expect(resolver).toContain(
      "path: new MatcherPatternPathStatic('/settings')"
    )
    expect(resolver).toMatchInlineSnapshot(`
      "
      const __route_0 = normalizeRouteRecord({
        name: '/(layout)',
        path: new MatcherPatternPathStatic('/'),
        components: {
          'default': () => import('(layout).vue')
        },
      })
      const __route_1 = normalizeRouteRecord({
        name: '/(layout)/(home)',
        path: __route_0.path,
        components: {
          'default': () => import('(layout)/(home).vue')
        },
        parent: __route_0,
      })
      const __route_2 = normalizeRouteRecord({
        name: '/(layout)/(settings)/settings/(general-settings)',
        path: new MatcherPatternPathStatic('/settings'),
        components: {
          'default': () => import('(layout)/(settings)/settings/(general-settings).vue')
        },
        parent: __route_0,
      })

      export const resolver = createFixedResolver([
        __route_2,  // /settings
        __route_1,  // /
        __route_0,  // /
      ])
      "
    `)
  })

  it('handles route groups nested under a named route', () => {
    const tree = new PrefixTree(DEFAULT_OPTIONS)
    const importsMap = new ImportsMap()

    // Test case: route group nested under a named route
    // Structure:
    // nested-routes.vue
    // nested-routes/(route-groups)/a.vue
    // nested-routes/(route-groups)/b.vue
    tree.insert('nested-routes', 'nested-routes.vue')
    tree.insert(
      'nested-routes/(route-groups)/a',
      'nested-routes/(route-groups)/a.vue'
    )
    tree.insert(
      'nested-routes/(route-groups)/b',
      'nested-routes/(route-groups)/b.vue'
    )

    const resolver = generateRouteResolver(
      tree,
      DEFAULT_OPTIONS,
      importsMap,
      new Map()
    )

    expect(resolver).toMatchInlineSnapshot(`
      "
      const __route_0 = normalizeRouteRecord({
        name: '/nested-routes',
        path: new MatcherPatternPathStatic('/nested-routes'),
        components: {
          'default': () => import('nested-routes.vue')
        },
      })
      const __route_1 = normalizeRouteRecord({
        name: '/nested-routes/(route-groups)/a',
        path: new MatcherPatternPathStatic('/nested-routes/a'),
        components: {
          'default': () => import('nested-routes/(route-groups)/a.vue')
        },
        parent: __route_0,
      })
      const __route_2 = normalizeRouteRecord({
        name: '/nested-routes/(route-groups)/b',
        path: new MatcherPatternPathStatic('/nested-routes/b'),
        components: {
          'default': () => import('nested-routes/(route-groups)/b.vue')
        },
        parent: __route_0,
      })

      export const resolver = createFixedResolver([
        __route_1,  // /nested-routes/a
        __route_2,  // /nested-routes/b
        __route_0,  // /nested-routes
      ])
      "
    `)
  })

  describe('route prioritization in resolver', () => {
    function getRouteOrderFromResolver(tree: PrefixTree): string[] {
      const resolver = generateRouteResolver(
        tree,
        DEFAULT_OPTIONS,
        new ImportsMap(),
        new Map()
      )

      // Extract the order from the resolver output
      const lines = resolver.split('\n').filter(line => line.includes('// /'))
      return lines.map(line => line.split('// ')[1] || '')
    }

    it('orders records based on specificity of paths', () => {
      const tree = new PrefixTree(DEFAULT_OPTIONS)
      // static at root
      tree.insert('prefix', 'prefix.vue')

      // params in the end
      tree.insert('prefix/sub-end', 'prefix/sub-end.vue')
      tree.insert('prefix/sub-[id]', 'prefix/sub-[id].vue')
      // repeat can only be the whole segment
      // tree.insert('prefix/sub-[repeat]+', 'prefix/sub-[repeat]+.vue')
      tree.insert('prefix/sub-[[opt]]', 'prefix/sub-[[opt]].vue')
      // repeat can only be the whole segment
      // tree.insert('prefix/sub-[[optRepeat]]+', 'prefix/c/d.vue')
      tree.insert('prefix/[id]', 'prefix/[id].vue')
      tree.insert('prefix/[repeat]+', 'prefix/[repeat]+.vue')
      tree.insert('prefix/[[opt]]', 'prefix/[[opt]].vue')
      tree.insert('prefix/[[optRepeat]]+', 'prefix/[[optRepeat]]+.vue')
      tree.insert('[...splat]', '[...splat].vue')

      // params at root level
      tree.insert('[id]', '[id].vue')
      tree.insert('[[optional]]', '[[optional]].vue')
      tree.insert('prefix-[id]-suffix', 'prefix-[id]-suffix.vue')

      // params in the middle path parts
      tree.insert('prefix/[id]/suffix', 'prefix/[id]/suffix.vue')
      tree.insert('prefix/[[opt]]/suffix', 'prefix/[[opt]]/suffix.vue')
      tree.insert('prefix/[repeat]+/suffix', 'prefix/[repeat]+/suffix.vue')
      tree.insert(
        'prefix/[[optRepeat]]+/suffix',
        'prefix/[[optRepeat]]+/suffix.vue'
      )
      tree.insert('prefix/static/suffix', 'prefix/static/suffix.vue')
      // sub-segments
      tree.insert('prefix/[id]-end/suffix', 'prefix/[id]-end/suffix.vue')
      tree.insert('prefix/[[opt]]-end/suffix', 'prefix/[[opt]]-end/suffix.vue')
      tree.insert(
        'prefix/sub-[id]-end/suffix',
        'prefix/sub-[id]-end/suffix.vue'
      )
      tree.insert(
        'prefix/sub-[[opt]]-end/suffix',
        'prefix/sub-[[opt]]-end/suffix.vue'
      )
      tree.insert('prefix/sub-[id]/suffix', 'prefix/sub-[id]/suffix.vue')
      tree.insert('prefix/sub-[[opt]]/suffix', 'prefix/sub-[[opt]]/suffix.vue')

      expect(getRouteOrderFromResolver(tree)).toEqual([
        '/prefix/static/suffix',
        '/prefix/sub-end',
        '/prefix/sub-:id-end/suffix',
        '/prefix/sub-:id/suffix',
        '/prefix/sub-:id',
        '/prefix/sub-:opt?-end/suffix',
        '/prefix/sub-:opt?/suffix',
        '/prefix/sub-:opt?',
        '/prefix/:id-end/suffix',
        '/prefix/:id/suffix',
        '/prefix/:id',
        '/prefix/:opt?-end/suffix',
        '/prefix/:opt?/suffix',
        '/prefix/:opt?',
        '/prefix/:repeat+/suffix',
        '/prefix/:repeat+',
        '/prefix/:optRepeat*/suffix',
        '/prefix/:optRepeat*',
        '/prefix',
        '/prefix-:id-suffix',
        '/:id',
        // one should never have both a regular id and an optional id in the same position
        // because the optional one will never match
        '/:optional?',
        '/:splat(.*)',
      ])
    })

    it.todo('warns on invalid repeatable params')
  })

  it('strips off empty parent records', () => {
    const tree = new PrefixTree(DEFAULT_OPTIONS)
    const importsMap = new ImportsMap()
    // we want /a and /b/c but not /b
    tree.insert('a', 'a.vue')
    tree.insert('b/c', 'b/c.vue')
    tree.insert('b/c/d', 'b/c/d.vue')
    tree.insert('b/e/f', 'b/c/f.vue')
    const resolver = generateRouteResolver(
      tree,
      DEFAULT_OPTIONS,
      importsMap,
      new Map()
    )

    expect(resolver).toMatchInlineSnapshot(`
      "
      const __route_0 = normalizeRouteRecord({
        name: '/a',
        path: new MatcherPatternPathStatic('/a'),
        components: {
          'default': () => import('a.vue')
        },
      })

      const __route_1 = normalizeRouteRecord({
        name: '/b/c',
        path: new MatcherPatternPathStatic('/b/c'),
        components: {
          'default': () => import('b/c.vue')
        },
      })
      const __route_2 = normalizeRouteRecord({
        name: '/b/c/d',
        path: new MatcherPatternPathStatic('/b/c/d'),
        components: {
          'default': () => import('b/c/d.vue')
        },
        parent: __route_1,
      })
      const __route_3 = normalizeRouteRecord({
        name: '/b/e/f',
        path: new MatcherPatternPathStatic('/b/e/f'),
        components: {
          'default': () => import('b/c/f.vue')
        },
      })

      export const resolver = createFixedResolver([
        __route_2,  // /b/c/d
        __route_3,  // /b/e/f
        __route_1,  // /b/c
        __route_0,  // /a
      ])
      "
    `)
  })

  it('keeps non matchable parent records with name: false', () => {
    const tree = new PrefixTree(DEFAULT_OPTIONS)
    tree.insert('a', 'a.vue').value.setEditOverride('name', false)
    tree.insert('a/index', 'a/index.vue')
    tree.insert('a/b', 'a/b.vue')

    const resolver = generateRouteResolver(
      tree,
      DEFAULT_OPTIONS,
      new ImportsMap(),
      new Map()
    )
    expect(resolver).toMatchInlineSnapshot(`
      "
      const __route_0 = normalizeRouteRecord({
        /* (removed) name: false */
        path: new MatcherPatternPathStatic('/a'),
        components: {
          'default': () => import('a.vue')
        },
      })
      const __route_1 = normalizeRouteRecord({
        name: '/a/',
        path: __route_0.path,
        components: {
          'default': () => import('a/index.vue')
        },
        parent: __route_0,
      })
      const __route_2 = normalizeRouteRecord({
        name: '/a/b',
        path: new MatcherPatternPathStatic('/a/b'),
        components: {
          'default': () => import('a/b.vue')
        },
        parent: __route_0,
      })

      export const resolver = createFixedResolver([
        __route_2,  // /a/b
        __route_1,  // /a
      ])
      "
    `)
  })

  it('retains parent chain when skipping empty intermediate nodes', () => {
    const tree = new PrefixTree(DEFAULT_OPTIONS)
    // Create a meaningful parent
    tree.insert('a', 'a.vue')
    // Create a deeply nested child with empty intermediate nodes b and c
    tree.insert('a/b/c/e', 'a/b/c/e.vue')
    const resolver = generateRouteResolver(
      tree,
      DEFAULT_OPTIONS,
      new ImportsMap(),
      new Map()
    )

    expect(resolver).toMatchInlineSnapshot(`
      "
      const __route_0 = normalizeRouteRecord({
        name: '/a',
        path: new MatcherPatternPathStatic('/a'),
        components: {
          'default': () => import('a.vue')
        },
      })
      const __route_1 = normalizeRouteRecord({
        name: '/a/b/c/e',
        path: new MatcherPatternPathStatic('/a/b/c/e'),
        components: {
          'default': () => import('a/b/c/e.vue')
        },
        parent: __route_0,
      })

      export const resolver = createFixedResolver([
        __route_1,  // /a/b/c/e
        __route_0,  // /a
      ])
      "
    `)
  })

  it('preserves parent nodes with meta data', () => {
    const tree = new PrefixTree(DEFAULT_OPTIONS)
    // Create a nested route
    tree.insert('a/b/c', 'a/b/c.vue')
    // Add meta to the intermediate b node (no components, but has meta)
    const aNode = tree.children.get('a')!
    const bNode = aNode.children.get('b')!
    bNode.value.setEditOverride('meta', { requiresAuth: true })

    const resolver = generateRouteResolver(
      tree,
      DEFAULT_OPTIONS,
      new ImportsMap(),
      new Map()
    )

    expect(resolver).toMatchInlineSnapshot(`
      "
      const __route_0 = normalizeRouteRecord({
        /* (internal) name: '/a/b' */
        meta: {
          "requiresAuth": true
        },
      })
      const __route_1 = normalizeRouteRecord({
        name: '/a/b/c',
        path: new MatcherPatternPathStatic('/a/b/c'),
        components: {
          'default': () => import('a/b/c.vue')
        },
        parent: __route_0,
      })

      export const resolver = createFixedResolver([
        __route_1,  // /a/b/c
      ])
      "
    `)
  })

  it('includes meta in route records with components', () => {
    const tree = new PrefixTree(DEFAULT_OPTIONS)
    // Create a route with both component and meta
    tree.insert('users', 'users.vue')
    const usersNode = tree.children.get('users')!
    usersNode.value.setEditOverride('meta', {
      requiresAuth: true,
      title: 'Users',
    })

    const resolver = generateRouteResolver(
      tree,
      DEFAULT_OPTIONS,
      new ImportsMap(),
      new Map()
    )

    expect(resolver).toMatchInlineSnapshot(`
      "
      const __route_0 = normalizeRouteRecord({
        name: '/users',
        path: new MatcherPatternPathStatic('/users'),
        meta: {
          "requiresAuth": true,
          "title": "Users"
        },
        components: {
          'default': () => import('users.vue')
        },
      })

      export const resolver = createFixedResolver([
        __route_0,  // /users
      ])
      "
    `)
  })

  it('handles definePage imports correctly', () => {
    const tree = new PrefixTree(DEFAULT_OPTIONS)
    // Create a route with a component
    tree.insert('profile', 'profile.vue')
    const profileNode = tree.children.get('profile')!

    // Mark it as having definePage (this would normally be set by the plugin when parsing the file)
    profileNode.hasDefinePage = true

    const resolver = generateRouteResolver(
      tree,
      DEFAULT_OPTIONS,
      new ImportsMap(),
      new Map()
    )

    expect(resolver).toMatchInlineSnapshot(`
      "

      const __route_0 = normalizeRouteRecord(
        _mergeRouteRecord(
          {
            name: '/profile',
            path: new MatcherPatternPathStatic('/profile'),
            components: {
              'default': () => import('profile.vue')
            },
          },
          _definePage_default_0
        )
      )


      export const resolver = createFixedResolver([
        __route_0,  // /profile
      ])
      "
    `)
  })

  it('includes query property in route records with query params', () => {
    const tree = new PrefixTree(DEFAULT_OPTIONS)
    tree.insert('search', 'search.vue')
    const searchNode = tree.children.get('search')!

    // Add query params
    searchNode.value.setEditOverride('params', {
      query: {
        q: {},
        limit: { parser: 'int' },
      },
    })

    const resolver = generateRouteResolver(
      tree,
      DEFAULT_OPTIONS,
      new ImportsMap(),
      new Map()
    )

    expect(resolver).toMatchInlineSnapshot(`
      "
      const __route_0 = normalizeRouteRecord({
        name: '/search',
        path: new MatcherPatternPathStatic('/search'),
        query: [
          new MatcherPatternQueryParam('q', 'q', 'value'),
          new MatcherPatternQueryParam('limit', 'limit', 'value', PARAM_PARSER_INT)
        ],
        components: {
          'default': () => import('search.vue')
        },
      })

      export const resolver = createFixedResolver([
        __route_0,  // /search
      ])
      "
    `)
  })

  it('encodes special characters in route resolver paths', () => {
    const tree = new PrefixTree(DEFAULT_OPTIONS)
    tree.insert('my page', 'my page.vue')
    tree.insert('users/hello world', 'users/hello world.vue')
    tree.insert('café', 'café.vue')

    const resolver = generateRouteResolver(
      tree,
      DEFAULT_OPTIONS,
      new ImportsMap(),
      new Map()
    )

    expect(resolver).toMatchSnapshot()
  })

  it('does not encode RFC 3986 valid path characters', () => {
    const tree = new PrefixTree(DEFAULT_OPTIONS)

    // @ character (common in profile/user routes)
    tree.insert('@profile', '@profile.vue')
    tree.insert('user@domain', 'user@domain.vue')

    // Other valid sub-delimiters
    tree.insert('hello!', 'hello!.vue')
    tree.insert("it's-fine", "it's-fine.vue")
    tree.insert('item(1)', 'item(1).vue')
    tree.insert('foo*bar', 'foo*bar.vue')

    const resolver = generateRouteResolver(
      tree,
      DEFAULT_OPTIONS,
      new ImportsMap(),
      new Map()
    )

    expect(resolver).toMatchSnapshot()
  })

  it('handles multiple nested groups', () => {
    const tree = new PrefixTree(DEFAULT_OPTIONS)
    const importsMap = new ImportsMap()

    // Layout for [username]
    tree.insert('[username]/_parent', '[username]/_parent.vue')
    // Nested groups under [username] - user home page
    tree.insert(
      '[username]/(user-home)/(user-home)',
      '[username]/(user-home)/(user-home).vue'
    )
    // layout for the home only
    tree.insert(
      '[username]/(user-home)/_parent',
      '[username]/(user-home)/_parent.vue'
    )
    // Different group structure - user settings
    tree.insert(
      '[username]/(user-settings)/settings',
      '[username]/(user-settings)/settings.vue'
    )
    // layout for settings
    tree.insert(
      '[username]/(user-settings)/_parent',
      '[username]/(user-settings)/_parent.vue'
    )
    // Another nested group - user posts
    tree.insert(
      '[username]/(user-posts)/posts/(posts-list)',
      '[username]/(user-posts)/posts/(posts-list).vue'
    )

    const resolver = generateRouteResolver(
      tree,
      DEFAULT_OPTIONS,
      importsMap,
      new Map()
    )

    expect(resolver).toMatchSnapshot()
  })

  describe('aliases', () => {
    it('generates alias records for static alias paths', () => {
      const tree = new PrefixTree(DEFAULT_OPTIONS)
      const importsMap = new ImportsMap()
      const node = tree.insert('users', 'users.vue')
      node.setCustomRouteBlock('users.vue', { alias: ['/people'] })

      const resolver = generateRouteResolver(
        tree,
        DEFAULT_OPTIONS,
        importsMap,
        new Map()
      )

      expect(resolver).toMatchInlineSnapshot(`
        "
        const __route_0 = normalizeRouteRecord({
          name: '/users',
          path: new MatcherPatternPathStatic('/users'),
          components: {
            'default': () => import('users.vue')
          },
        })
        const __route_1 = normalizeRouteRecord({
          ...__route_0,
          path: new MatcherPatternPathStatic('/people'),
          aliasOf: __route_0,
        })

        export const resolver = createFixedResolver([
          __route_0,  // /users
          __route_1,  // /people
        ])
        "
      `)
    })

    it('generates alias records for dynamic alias paths', () => {
      const tree = new PrefixTree(DEFAULT_OPTIONS)
      const importsMap = new ImportsMap()
      const node = tree.insert('users/[id]', 'users/[id].vue')
      node.setCustomRouteBlock('users/[id].vue', {
        alias: ['/people/:id'],
      })

      const resolver = generateRouteResolver(
        tree,
        DEFAULT_OPTIONS,
        importsMap,
        new Map()
      )

      expect(resolver).toContain('aliasOf: __route_0')
      expect(resolver).toContain('MatcherPatternPathDynamic')
      expect(resolver).toContain('/people/')
    })

    it('generates multiple alias records', () => {
      const tree = new PrefixTree(DEFAULT_OPTIONS)
      const importsMap = new ImportsMap()
      const node = tree.insert('users', 'users.vue')
      node.setCustomRouteBlock('users.vue', {
        alias: ['/people', '/members'],
      })

      const resolver = generateRouteResolver(
        tree,
        DEFAULT_OPTIONS,
        importsMap,
        new Map()
      )

      expect(resolver).toContain('aliasOf: __route_0')
      expect(resolver).toContain(
        "path: new MatcherPatternPathStatic('/people')"
      )
      expect(resolver).toContain(
        "path: new MatcherPatternPathStatic('/members')"
      )
      // original + 2 aliases = 3 route entries in the resolver
      const routeEntries = resolver
        .split('\n')
        .filter(l => l.trim().startsWith('__route_'))
      expect(routeEntries).toHaveLength(3)
    })

    it('alias records are included in the resolver array', () => {
      const tree = new PrefixTree(DEFAULT_OPTIONS)
      const importsMap = new ImportsMap()
      const node = tree.insert('users', 'users.vue')
      node.setCustomRouteBlock('users.vue', { alias: ['/people'] })

      const resolver = generateRouteResolver(
        tree,
        DEFAULT_OPTIONS,
        importsMap,
        new Map()
      )

      // Both records should be in the createFixedResolver array
      expect(resolver).toMatch(/createFixedResolver\(\[[\s\S]*__route_0/)
      expect(resolver).toMatch(/createFixedResolver\(\[[\s\S]*__route_1/)
    })

    it('warns on relative aliases', () => {
      const tree = new PrefixTree(DEFAULT_OPTIONS)
      const node = tree.insert('admin/users', 'admin/users.vue')
      node.setCustomRouteBlock('admin/users.vue', { alias: ['users'] })

      const warnings = generateAliasWarnings(tree)

      expect(warnings).toContain('console.warn')
      expect(warnings).toContain('Alias "users"')
      expect(warnings).toContain('must be absolute')
    })

    it('does not warn on absolute aliases', () => {
      const tree = new PrefixTree(DEFAULT_OPTIONS)
      const node = tree.insert('users', 'users.vue')
      node.setCustomRouteBlock('users.vue', { alias: ['/people'] })

      const warnings = generateAliasWarnings(tree)

      expect(warnings).toBe('')
    })

    it('warns on each relative alias individually', () => {
      const tree = new PrefixTree(DEFAULT_OPTIONS)
      const node = tree.insert('users', 'users.vue')
      node.setCustomRouteBlock('users.vue', {
        alias: ['people', '/members', 'folks'],
      })

      const warnings = generateAliasWarnings(tree)

      expect(warnings).toContain('"people"')
      expect(warnings).toContain('"folks"')
      expect(warnings).not.toContain('"members"')
      expect(warnings).not.toContain('"/members"')
    })
  })
})
