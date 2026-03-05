import { basename } from 'pathe'
import { describe, expect, it } from 'vitest'
import { PrefixTree, TreeNode } from '../core/tree'
import { resolveOptions } from '../options'
import { generateRouteRecords } from './generateRouteRecords'
import { ImportsMap } from '../core/utils'

const DEFAULT_OPTIONS = resolveOptions({})

describe('generateRouteRecord', () => {
  function generateRouteRecordSimple(tree: TreeNode) {
    return generateRouteRecords(
      tree,
      {
        ...DEFAULT_OPTIONS,
        ...tree.options,
      },
      new ImportsMap()
    )
  }

  it('works with an empty tree', () => {
    const tree = new PrefixTree(DEFAULT_OPTIONS)

    expect(generateRouteRecordSimple(tree)).toMatchInlineSnapshot(`
      "[

      ]"
    `)
  })

  it('skips routes for lone _parent files', () => {
    const tree = new PrefixTree(DEFAULT_OPTIONS)
    tree.insert('nested/_parent', 'nested/_parent.vue')

    expect(generateRouteRecordSimple(tree)).toMatchInlineSnapshot(`
      "[

      ]"
    `)
  })

  it('keeps routes with _parent when children exist', () => {
    const tree = new PrefixTree(DEFAULT_OPTIONS)
    tree.insert('nested/_parent', 'nested/_parent.vue')
    tree.insert('nested/index', 'nested/index.vue')

    expect(generateRouteRecordSimple(tree)).toContain("path: '/nested'")
  })

  it('skips nested lone _parent files', () => {
    const tree = new PrefixTree(DEFAULT_OPTIONS)
    tree.insert('users/index', 'users/index.vue')
    tree.insert('users/settings/_parent', 'users/settings/_parent.vue')

    const routes = generateRouteRecordSimple(tree)

    expect(routes).toContain("path: '/users'")
    expect(routes).not.toContain("path: '/users/settings'")
  })

  it('works with some paths at root', () => {
    const tree = new PrefixTree(DEFAULT_OPTIONS)
    tree.insert('a', 'a.vue')
    tree.insert('b', 'b.vue')
    tree.insert('c', 'c.vue')
    expect(generateRouteRecordSimple(tree)).toMatchSnapshot()
  })

  it('handles multiple named views', () => {
    const tree = new PrefixTree(DEFAULT_OPTIONS)
    tree.insert('foo', 'foo.vue')
    tree.insert('foo@a', 'foo@a.vue')
    tree.insert('foo@b', 'foo@b.vue')
    expect(generateRouteRecordSimple(tree)).toMatchSnapshot()
  })

  it('handles single named views', () => {
    const tree = new PrefixTree(DEFAULT_OPTIONS)
    tree.insert('foo@a', 'foo@a.vue')
    expect(generateRouteRecordSimple(tree)).toMatchSnapshot()
  })

  it('nested children', () => {
    const tree = new PrefixTree(DEFAULT_OPTIONS)
    tree.insert('a/a', 'a/a.vue')
    tree.insert('a/b', 'a/b.vue')
    tree.insert('a/c', 'a/c.vue')
    tree.insert('b/b', 'b/b.vue')
    tree.insert('b/c', 'b/c.vue')
    tree.insert('b/d', 'b/d.vue')
    expect(generateRouteRecordSimple(tree)).toMatchSnapshot()
    tree.insert('c', 'c.vue')
    tree.insert('d', 'd.vue')
    expect(generateRouteRecordSimple(tree)).toMatchSnapshot()
  })

  it('adds children and name when folder and component exist', () => {
    const tree = new PrefixTree(DEFAULT_OPTIONS)
    tree.insert('a/c', 'a/c.vue')
    tree.insert('b/c', 'b/c.vue')
    tree.insert('a', 'a.vue')
    tree.insert('d', 'd.vue')
    expect(generateRouteRecordSimple(tree)).toMatchSnapshot()
  })

  it('correctly names index files', () => {
    const tree = new PrefixTree(DEFAULT_OPTIONS)
    tree.insert('index', 'index.vue')
    tree.insert('b/index', 'b/index.vue')
    expect(generateRouteRecordSimple(tree)).toMatchSnapshot()
  })

  it('handles non nested routes', () => {
    const tree = new PrefixTree(DEFAULT_OPTIONS)
    tree.insert('users', 'users.vue')
    tree.insert('users/index', 'users/index.vue')
    tree.insert('users/other', 'users/other.vue')
    tree.insert('users.not-nested', 'users.not-nested.vue')
    tree.insert('users/[id]/index', 'users/[id]/index.vue')
    tree.insert('users/[id]/other', 'users/[id]/other.vue')
    tree.insert('users/[id]', 'users/[id].vue')
    tree.insert('users/[id].not-nested', 'users/[id].not-nested.vue')
    tree.insert('users.[id].also-not-nested', 'users.[id].also-not-nested.vue')
    expect(generateRouteRecordSimple(tree)).toMatchSnapshot()
  })

  it('removes trailing slashes', () => {
    const tree = new PrefixTree(DEFAULT_OPTIONS)
    tree.insert('users/index', 'users/index.vue')
    tree.insert('users/other', 'users/other.vue')
    tree.insert('nested', 'nested.vue')
    tree.insert('nested/index', 'nested/index.vue')
    tree.insert('nested/other', 'nested/other.vue')
    expect(generateRouteRecordSimple(tree)).toMatchSnapshot()
  })

  it('encodes special characters in path segments', () => {
    const tree = new PrefixTree(DEFAULT_OPTIONS)
    tree.insert('my page', 'my page.vue')
    tree.insert('users/hello world', 'users/hello world.vue')
    tree.insert('café', 'café.vue')
    expect(generateRouteRecordSimple(tree)).toMatchSnapshot()
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

    expect(generateRouteRecordSimple(tree)).toMatchSnapshot()
  })

  it('generate static imports', () => {
    const options = resolveOptions({
      ...DEFAULT_OPTIONS,
      importMode: 'sync',
    })
    const tree = new PrefixTree(options)
    tree.insert('a', 'a.vue')
    tree.insert('b', 'b.vue')
    tree.insert('nested/file/c', 'nested/file/c.vue')
    const importList = new ImportsMap()
    expect(generateRouteRecords(tree, options, importList)).toMatchSnapshot()

    expect(importList.toString()).toMatchSnapshot()
  })

  it('generate custom imports', () => {
    const options = resolveOptions({
      importMode: filepath =>
        basename(filepath) === 'a.vue' ? 'sync' : 'async',
    })

    const tree = new PrefixTree(options)
    tree.insert('a', 'a.vue')
    tree.insert('b', 'b.vue')
    tree.insert('nested/file/c', 'nested/file/c.vue')
    const importList = new ImportsMap()
    expect(generateRouteRecords(tree, options, importList)).toMatchSnapshot()

    expect(importList.toString()).toMatchSnapshot()
  })

  describe('names', () => {
    it('creates single word names', () => {
      const tree = new PrefixTree(DEFAULT_OPTIONS)
      tree.insert('index', 'index.vue')
      tree.insert('about', 'about.vue')
      tree.insert('users/index', 'users/index.vue')
      tree.insert('users/[id]', 'users/[id].vue')
      tree.insert('users/[id]/edit', 'users/[id]/edit.vue')
      tree.insert('users/new', 'users/new.vue')

      expect(generateRouteRecordSimple(tree)).toMatchSnapshot()
    })

    it('creates multi word names', () => {
      const tree = new PrefixTree(DEFAULT_OPTIONS)
      tree.insert('index', 'index.vue')
      tree.insert('my-users', 'my-users.vue')
      tree.insert('MyPascalCaseUsers', 'MyPascalCaseUsers.vue')
      tree.insert(
        'some-nested/file-with-[id]-in-the-middle',
        'some-nested/file-with-[id]-in-the-middle.vue'
      )

      expect(generateRouteRecordSimple(tree)).toMatchSnapshot()
    })

    it('works with nested views', () => {
      const tree = new PrefixTree(DEFAULT_OPTIONS)
      tree.insert('index', 'index.vue')
      tree.insert('users', 'users.vue')
      tree.insert('users/index', 'users/index.vue')
      tree.insert('users/[id]/edit', 'users/[id]/edit.vue')
      tree.insert('users/[id]', 'users/[id].vue')

      expect(generateRouteRecordSimple(tree)).toMatchSnapshot()
    })

    it('handles empty names', () => {
      const tree = new PrefixTree(DEFAULT_OPTIONS)
      const node = tree.insert('about', 'about.vue')
      node.setCustomRouteBlock('about', {
        name: '',
      })

      expect(generateRouteRecordSimple(tree)).toMatchSnapshot()
    })
  })

  describe('route block', () => {
    it('adds meta data', async () => {
      const tree = new PrefixTree(DEFAULT_OPTIONS)
      const node = tree.insert('index', 'index.vue')
      node.setCustomRouteBlock('index', {
        meta: {
          auth: true,
          title: 'Home',
        },
      })

      expect(generateRouteRecordSimple(tree)).toMatchSnapshot()
    })

    it('merges multiple meta properties', async () => {
      const tree = new PrefixTree(DEFAULT_OPTIONS)
      const node = tree.insert('index', 'index.vue')
      node.setCustomRouteBlock('index', {
        path: '/custom',
        meta: {
          one: true,
        },
      })
      node.setCustomRouteBlock('index@named', {
        name: 'hello',
        meta: {
          two: true,
        },
      })

      expect(generateRouteRecordSimple(tree)).toMatchSnapshot()
    })

    it('merges regardless of order', async () => {
      const tree = new PrefixTree(DEFAULT_OPTIONS)
      const node = tree.insert('index', 'index.vue')
      node.setCustomRouteBlock('index', {
        name: 'a',
      })
      node.setCustomRouteBlock('index@named', {
        name: 'b',
      })

      const one = generateRouteRecordSimple(tree)

      node.setCustomRouteBlock('index@named', {
        name: 'b',
      })
      node.setCustomRouteBlock('index', {
        name: 'a',
      })

      expect(generateRouteRecordSimple(tree)).toBe(one)

      expect(one).toMatchSnapshot()
    })

    it('handles named views with empty route blocks', () => {
      const tree = new PrefixTree(DEFAULT_OPTIONS)
      const node = tree.insert('index', 'index.vue')
      const n2 = tree.insert('index@named', 'index@named.vue')
      expect(node).toBe(n2)
      // coming from index
      node.setCustomRouteBlock('index', {
        meta: {
          auth: true,
          title: 'Home',
        },
      })
      // coming from index@named (no route block)
      node.setCustomRouteBlock('index@named', undefined)

      expect(generateRouteRecordSimple(tree)).toMatchSnapshot()
    })

    it('merges alias properties', async () => {
      const tree = new PrefixTree(DEFAULT_OPTIONS)
      const node = tree.insert('index', 'index.vue')
      node.setCustomRouteBlock('index', {
        alias: ['/one'],
      })
      node.setCustomRouteBlock('index@named', {
        alias: ['/two', '/three'],
      })

      expect(generateRouteRecordSimple(tree)).toMatchSnapshot()
    })

    it('handles a single static alias', () => {
      const tree = new PrefixTree(DEFAULT_OPTIONS)
      const node = tree.insert('users', 'users.vue')
      node.setCustomRouteBlock('users', {
        alias: ['/people'],
      })

      expect(generateRouteRecordSimple(tree)).toMatchSnapshot()
    })

    it('handles multiple aliases', () => {
      const tree = new PrefixTree(DEFAULT_OPTIONS)
      const node = tree.insert('users', 'users.vue')
      node.setCustomRouteBlock('users', {
        alias: ['/people', '/members'],
      })

      expect(generateRouteRecordSimple(tree)).toMatchSnapshot()
    })

    it('handles dynamic alias path', () => {
      const tree = new PrefixTree(DEFAULT_OPTIONS)
      const node = tree.insert('users/[id]', 'users/[id].vue')
      node.setCustomRouteBlock('users/[id]', {
        alias: ['/people/:id'],
      })

      expect(generateRouteRecordSimple(tree)).toMatchSnapshot()
    })

    it('merges deep meta properties', async () => {
      const tree = new PrefixTree(DEFAULT_OPTIONS)
      const node = tree.insert('index', 'index.vue')
      node.setCustomRouteBlock('index', {
        meta: {
          a: { one: 1 },
          b: { a: [2] },
        },
      })
      node.setCustomRouteBlock('index@named', {
        meta: {
          a: { two: 1 },
          b: { a: [3] },
        },
      })

      expect(generateRouteRecordSimple(tree)).toMatchSnapshot()
    })
  })

  it('preserves backslashes in path overrides', () => {
    const tree = new PrefixTree(DEFAULT_OPTIONS)
    tree.insert('test/[id]', 'test/[id].vue')
    const node = tree.insert('test/[id]/index', 'test/[id]/index.vue')
    node.setCustomRouteBlock('test/[id]/index', {
      path: '/:id(\\d+)',
    })

    const result = generateRouteRecordSimple(tree)
    expect(result).toContain("path: '/:id(\\\\d+)'")
  })

  describe('raw paths insertions', () => {
    it('works with raw paths', () => {
      const tree = new PrefixTree(DEFAULT_OPTIONS)
      tree.insertParsedPath('a', 'a.vue')
      tree.insertParsedPath('b', 'b.vue')
      tree.insertParsedPath('c', 'c.vue')
      expect(generateRouteRecordSimple(tree)).toMatchSnapshot()
    })

    it('works with mixed nodes', () => {
      const tree = new PrefixTree(DEFAULT_OPTIONS)
      tree.insertParsedPath('a', 'a.vue')
      tree.insert('b', 'b.vue')
      tree.insertParsedPath('c', 'c.vue')
      expect(generateRouteRecordSimple(tree)).toMatchSnapshot()
    })

    it('works with nested nodes', () => {
      const tree = new PrefixTree(DEFAULT_OPTIONS)
      tree.insertParsedPath('a/b/c', 'a.vue')
      tree.insertParsedPath('a/b/d', 'a.vue')
      tree.insertParsedPath('a/d/c', 'a.vue')
      expect(generateRouteRecordSimple(tree)).toMatchSnapshot()
    })

    it('do not nest raw segments with file based', () => {
      const tree = new PrefixTree(DEFAULT_OPTIONS)
      tree.insert('a/b', 'a/b.vue')
      // should be separated
      tree.insertParsedPath('a/b/c', 'a.vue')
      expect(generateRouteRecordSimple(tree)).toMatchSnapshot()
    })

    it('dedupes sync imports for the same component', () => {
      const tree = new PrefixTree(
        resolveOptions({
          importMode: 'sync',
        })
      )

      tree.insertParsedPath('a/b', 'a.vue')
      tree.insertParsedPath('a/c', 'a.vue')

      // what matters is that the import name is reused _page_0
      expect(generateRouteRecordSimple(tree)).toMatchSnapshot()
    })
  })
})
