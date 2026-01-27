import { describe, expect, it } from 'vitest'
import { DEFAULT_OPTIONS, Options, resolveOptions } from '../options'
import { PrefixTree, TreeNodeValueMatcherPart } from './tree'
import { TreeNodeType, type TreePathParam } from './treeNodeValue'
import { resolve } from 'pathe'
import { mockWarn } from '../../tests/vitest-mock-warn'

describe('Tree', () => {
  const RESOLVED_OPTIONS = resolveOptions(DEFAULT_OPTIONS)
  mockWarn()

  it('creates an empty tree', () => {
    const tree = new PrefixTree(RESOLVED_OPTIONS)
    expect(tree.children.size).toBe(0)
  })

  it('creates a tree with a single static path', () => {
    const tree = new PrefixTree(RESOLVED_OPTIONS)
    tree.insert('foo', 'foo.vue')
    expect(tree.children.size).toBe(1)
    const child = tree.children.get('foo')!
    expect(child).toBeDefined()
    expect(child.value).toMatchObject({
      rawSegment: 'foo',
      fullPath: '/foo',
      _type: TreeNodeType.static,
    })
    expect(child.children.size).toBe(0)
  })

  it('creates a tree with a single param', () => {
    const tree = new PrefixTree(RESOLVED_OPTIONS)
    tree.insert('[id]', '[id].vue')
    expect(tree.children.size).toBe(1)
    const child = tree.children.get('[id]')!
    expect(child).toBeDefined()
    expect(child.value).toMatchObject({
      rawSegment: '[id]',
      params: [{ paramName: 'id' }],
      fullPath: '/:id',
      _type: TreeNodeType.param,
    })
    expect(child.children.size).toBe(0)
  })

  it('parses a custom param type', () => {
    const tree = new PrefixTree(RESOLVED_OPTIONS)
    tree.insert('[id=int]', '[id=int].vue')
    const child = tree.children.get('[id=int]')!
    expect(child).toBeDefined()
    expect(child.value).toMatchObject({
      rawSegment: '[id=int]',
      params: [
        {
          paramName: 'id',
          parser: 'int',
        },
      ],
      fullPath: '/:id',
      _type: TreeNodeType.param,
    })
  })

  it('parses a repeatable custom param type', () => {
    const tree = new PrefixTree(RESOLVED_OPTIONS)
    tree.insert('[id=int]+', '[id=int]+.vue')
    const child = tree.children.get('[id=int]+')!
    expect(child).toBeDefined()
    expect(child.value).toMatchObject({
      rawSegment: '[id=int]+',
      params: [
        {
          paramName: 'id',
          parser: 'int',
          repeatable: true,
          modifier: '+',
        },
      ],
      fullPath: '/:id+',
      _type: TreeNodeType.param,
    })
  })

  it('parses an optional custom param type', () => {
    const tree = new PrefixTree(RESOLVED_OPTIONS)
    tree.insert('[[id=int]]', '[[id=int]].vue')
    const child = tree.children.get('[[id=int]]')!
    expect(child).toBeDefined()
    expect(child.value).toMatchObject({
      rawSegment: '[[id=int]]',
      params: [
        {
          paramName: 'id',
          parser: 'int',
          optional: true,
          modifier: '?',
        },
      ],
      fullPath: '/:id?',
      _type: TreeNodeType.param,
    })
  })

  it('parses a repeatable optional custom param type', () => {
    const tree = new PrefixTree(RESOLVED_OPTIONS)
    tree.insert('[[id=int]]+', '[[id=int]]+.vue')
    const child = tree.children.get('[[id=int]]+')!
    expect(child).toBeDefined()
    expect(child.value).toMatchObject({
      rawSegment: '[[id=int]]+',
      params: [
        {
          paramName: 'id',
          parser: 'int',
          repeatable: true,
          optional: true,
          modifier: '*',
        },
      ],
      fullPath: '/:id*',
      _type: TreeNodeType.param,
    })
  })

  it('parses a custom param type with sub segments', () => {
    const tree = new PrefixTree(RESOLVED_OPTIONS)
    tree.insert('a-[id=int]-b', 'file.vue')
    const child = tree.children.get('a-[id=int]-b')!
    expect(child).toBeDefined()
    expect(child.value).toMatchObject({
      rawSegment: 'a-[id=int]-b',
      params: [
        {
          paramName: 'id',
          parser: 'int',
        },
      ],
      fullPath: '/a-:id-b',
      _type: TreeNodeType.param,
    })
  })

  describe('special character encoding [x+hh]', () => {
    it('parses single hex character code', () => {
      const tree = new PrefixTree(RESOLVED_OPTIONS)
      const child = tree.insert('[x+2E]well-known', '[x+2E]well-known.vue')
      expect(child).toBeDefined()

      expect(child.value).toMatchObject({
        rawSegment: '[x+2E]well-known',
        pathSegment: '.well-known',
      })
      expect(child.fullPath).toBe('/.well-known')
      expect(child.value.params).toEqual([])
      expect(child.value.isStatic()).toBe(true)
    })

    it('parses multiple hex character codes in separate brackets', () => {
      const tree = new PrefixTree(RESOLVED_OPTIONS)
      const child = tree.insert('[x+2E][x+2F]test', '[x+2E][x+2F]test.vue')

      expect(child.value).toMatchObject({
        rawSegment: '[x+2E][x+2F]test',
        pathSegment: './test',
      })
      expect(child.fullPath).toBe('/./test')
      expect(child.value.isStatic()).toBe(true)
    })

    it('parses hex codes mixed with static prefix', () => {
      const tree = new PrefixTree(RESOLVED_OPTIONS)
      const child = tree.insert('prefix-[x+2E]-suffix', 'file.vue')

      expect(child.value).toMatchObject({
        rawSegment: 'prefix-[x+2E]-suffix',
        pathSegment: 'prefix-.-suffix',
      })
      expect(child.fullPath).toBe('/prefix-.-suffix')
      expect(child.value.isStatic()).toBe(true)
    })

    it('creates smiley route path', () => {
      const tree = new PrefixTree(RESOLVED_OPTIONS)
      const smileyNode = tree.insert(
        'smileys/[x+3A]-[x+29]',
        'smileys/[x+3A]-[x+29].vue'
      )

      expect(smileyNode.value).toMatchObject({
        pathSegment: ':-)',
      })
      expect(smileyNode.fullPath).toBe('/smileys/:-)')
      expect(smileyNode.value.isStatic()).toBe(true)
    })

    it('allows lowercase hex codes', () => {
      const tree = new PrefixTree(RESOLVED_OPTIONS)
      tree.insert('[x+2e]test', '[x+2e]test.vue')
      const child = tree.children.get('[x+2e]test')!

      expect(child.value.pathSegment).toBe('.test')
    })

    it('allows mixed case hex codes', () => {
      const tree = new PrefixTree(RESOLVED_OPTIONS)
      const child = tree.insert('[x+2F][x+2e]', 'file.vue')
      expect(child.value.pathSegment).toBe('/.')
    })

    it('throws on invalid hex code (non-hex characters)', () => {
      const tree = new PrefixTree(RESOLVED_OPTIONS)

      expect(() => tree.insert('[x+ZZ]', '[x+ZZ].vue')).toThrow(
        /Invalid hex code "ZZ"/
      )
    })

    it('throws on incomplete hex code (single digit)', () => {
      const tree = new PrefixTree(RESOLVED_OPTIONS)

      expect(() => tree.insert('[x+2]', '[x+2].vue')).toThrow(
        /must be exactly 2 digits/
      )
    })

    it('throws on too many digits in hex code', () => {
      const tree = new PrefixTree(RESOLVED_OPTIONS)

      expect(() => tree.insert('[x+2EE]', '[x+2EE].vue')).toThrow(
        /code must be exactly 2 digits/
      )
    })

    it('throws on empty hex code', () => {
      const tree = new PrefixTree(RESOLVED_OPTIONS)

      expect(() => tree.insert('[x+]', '[x+].vue')).toThrow(
        /must be exactly 2 digits/
      )
    })

    it('throws on unclosed hex code bracket', () => {
      const tree = new PrefixTree(RESOLVED_OPTIONS)

      expect(() => tree.insert('[x+2E', '[x+2E.vue')).toThrow(/Invalid segment/)
    })

    it('does not interfere with regular params', () => {
      const tree = new PrefixTree(RESOLVED_OPTIONS)
      tree.insert('[id]-[x+2E]-[name]', '[id]-[x+2E]-[name].vue')
      const child = tree.children.get('[id]-[x+2E]-[name]')!

      expect(child.value.isParam()).toBe(true)
      expect(child.value.params).toHaveLength(2)
      expect(child.value.params[0]).toMatchObject({ paramName: 'id' })
      expect(child.value.params[1]).toMatchObject({ paramName: 'name' })
      expect(child.value.pathSegment).toContain('-.-')
      expect(child.value.pathSegment).toContain(':id')
      expect(child.value.pathSegment).toContain(':name')
    })

    it('does not treat param starting with x as hex code', () => {
      const tree = new PrefixTree(RESOLVED_OPTIONS)
      tree.insert('[xid]', '[xid].vue')
      const child = tree.children.get('[xid]')!

      expect(child.value.isParam()).toBe(true)
      expect(child.value.params[0]).toMatchObject({ paramName: 'xid' })
      expect(child.value.pathSegment).toBe(':xid')
    })

    it('treats param named exactly x as normal param', () => {
      const tree = new PrefixTree(RESOLVED_OPTIONS)
      tree.insert('[x]', '[x].vue')
      const child = tree.children.get('[x]')!

      expect(child.value.isParam()).toBe(true)
      expect(child.value.params[0]).toMatchObject({ paramName: 'x' })
      expect(child.value.pathSegment).toBe(':x')
    })
  })

  it('separate param names from static segments', () => {
    const tree = new PrefixTree(RESOLVED_OPTIONS)
    tree.insert('[id]_a', '[id]_a.vue')
    tree.insert('[a]e[b]f', '[a]e[b]f.vue')
    expect(tree.children.get('[id]_a')!.value).toMatchObject({
      rawSegment: '[id]_a',
      params: [{ paramName: 'id' }],
      fullPath: '/:id()_a',
      _type: TreeNodeType.param,
    })

    expect(tree.children.get('[a]e[b]f')!.value).toMatchObject({
      rawSegment: '[a]e[b]f',
      params: [{ paramName: 'a' }, { paramName: 'b' }],
      fullPath: '/:a()e:b()f',
      _type: TreeNodeType.param,
    })
  })

  it('creates params in nested files', () => {
    const tree = new PrefixTree(RESOLVED_OPTIONS)
    const nestedId = tree.insert('nested/[id]', 'nested/[id].vue')

    expect(nestedId.value.isParam()).toBe(true)
    expect(nestedId.params).toEqual([
      expect.objectContaining({
        isSplat: false,
        modifier: '',
        optional: false,
        paramName: 'id',
        repeatable: false,
      }),
    ])

    const nestedAId = tree.insert('nested/a/[id]', 'nested/a/[id].vue')
    expect(nestedAId.value.isParam()).toBe(true)
    expect(nestedAId.params).toEqual([
      expect.objectContaining({
        isSplat: false,
        modifier: '',
        optional: false,
        paramName: 'id',
        repeatable: false,
      }),
    ])
  })

  it('creates params in nested folders', () => {
    const tree = new PrefixTree(RESOLVED_OPTIONS)

    let node = tree.insert('nested/[id]/index', 'nested/[id]/index.vue')
    const id = tree.children.get('nested')!.children.get('[id]')!
    expect(id.value.isParam()).toBe(true)
    expect(id.params).toEqual([
      expect.objectContaining({
        isSplat: false,
        modifier: '',
        optional: false,
        paramName: 'id',
        repeatable: false,
      }),
    ])

    expect(node.value.isParam()).toBe(false)
    expect(node.params).toEqual([
      expect.objectContaining({
        isSplat: false,
        modifier: '',
        optional: false,
        paramName: 'id',
        repeatable: false,
      }),
    ])

    node = tree.insert('nested/[a]/other', 'nested/[a]/other.vue')
    expect(node.value.isParam()).toBe(false)
    expect(node.params).toEqual([
      expect.objectContaining({
        isSplat: false,
        modifier: '',
        optional: false,
        paramName: 'a',
        repeatable: false,
      }),
    ])

    node = tree.insert('nested/a/[id]/index', 'nested/a/[id]/index.vue')
    expect(node.value.isParam()).toBe(false)
    expect(node.params).toEqual([
      expect.objectContaining({
        isSplat: false,
        modifier: '',
        optional: false,
        paramName: 'id',
        repeatable: false,
      }),
    ])
  })

  it('handles repeatable params one or more', () => {
    const tree = new PrefixTree(RESOLVED_OPTIONS)
    tree.insert('[id]+', '[id]+.vue')
    expect(tree.children.get('[id]+')!.value).toMatchObject({
      rawSegment: '[id]+',
      params: [
        {
          paramName: 'id',
          repeatable: true,
          optional: false,
          modifier: '+',
        },
      ],
      fullPath: '/:id+',
      _type: TreeNodeType.param,
    })
  })

  it('handles repeatable params zero or more', () => {
    const tree = new PrefixTree(RESOLVED_OPTIONS)
    tree.insert('[[id]]+', '[[id]]+.vue')
    expect(tree.children.get('[[id]]+')!.value).toMatchObject({
      rawSegment: '[[id]]+',
      params: [
        {
          paramName: 'id',
          repeatable: true,
          optional: true,
          modifier: '*',
        },
      ],
      fullPath: '/:id*',
      _type: TreeNodeType.param,
    })
  })

  it('handles optional params', () => {
    const tree = new PrefixTree(RESOLVED_OPTIONS)
    tree.insert('[[id]]', '[[id]].vue')
    expect(tree.children.get('[[id]]')!.value).toMatchObject({
      rawSegment: '[[id]]',
      params: [
        {
          paramName: 'id',
          repeatable: false,
          optional: true,
          modifier: '?',
        },
      ],
      fullPath: '/:id?',
      _type: TreeNodeType.param,
    })
  })

  it('handles named views', () => {
    const tree = new PrefixTree(RESOLVED_OPTIONS)
    tree.insert('index', 'index.vue')
    tree.insert('index@a', 'index@a.vue')
    tree.insert('index@b', 'index@b.vue')
    tree.insert('nested/foo@a', 'nested/foo@a.vue')
    tree.insert('nested/foo@b', 'nested/foo@b.vue')
    tree.insert('nested/[id]@a', 'nested/[id]@a.vue')
    tree.insert('nested/[id]@b', 'nested/[id]@b.vue')
    tree.insert('not.nested.path@a', 'not.nested.path@a.vue')
    tree.insert('not.nested.path@b', 'not.nested.path@b.vue')
    tree.insert('deep/not.nested.path@a', 'deep/not.nested.path@a.vue')
    tree.insert('deep/not.nested.path@b', 'deep/not.nested.path@b.vue')
    expect([...tree.children.get('index')!.value.components.keys()]).toEqual([
      'default',
      'a',
      'b',
    ])
    expect([
      ...tree.children
        .get('nested')!
        .children.get('foo')!
        .value.components.keys(),
    ]).toEqual(['a', 'b'])
    expect([
      ...tree.children
        .get('nested')!
        .children.get('[id]')!
        .value.components.keys(),
    ]).toEqual(['a', 'b'])
    expect([
      ...tree.children.get('not.nested.path')!.value.components.keys(),
    ]).toEqual(['a', 'b'])
    expect([
      ...tree.children
        .get('deep')!
        .children.get('not.nested.path')!
        .value.components.keys(),
    ]).toEqual(['a', 'b'])
  })

  it('handles single named views that are not default', () => {
    const tree = new PrefixTree(RESOLVED_OPTIONS)
    tree.insert('index@a', 'index@a.vue')
    expect([...tree.children.get('index')!.value.components.keys()]).toEqual([
      'a',
    ])
  })

  it('removes the node after all named views', () => {
    const tree = new PrefixTree(RESOLVED_OPTIONS)
    tree.insert('index', 'index.vue')
    tree.insert('index@a', 'index@a.vue')
    expect(tree.children.get('index')).toBeDefined()
    tree.remove('index@a')
    expect(tree.children.get('index')).toBeDefined()
    tree.remove('index')
    expect(tree.children.get('index')).toBeUndefined()
  })

  it('can remove itself from the tree', () => {
    const tree = new PrefixTree(RESOLVED_OPTIONS)
    tree
      .insert('index', 'index.vue')
      .insert('nested', resolve('index/nested.vue'))
    tree.insert('a', 'a.vue').insert('nested', resolve('a/nested.vue'))
    tree.insert('b', 'b.vue')
    expect(tree.children.size).toBe(3)
    tree.children.get('a')!.delete()
    expect(tree.children.size).toBe(2)
    tree.children.get('index')!.delete()
    expect(tree.children.size).toBe(1)
  })

  it('handles multiple params', () => {
    const tree = new PrefixTree(RESOLVED_OPTIONS)
    tree.insert('[a]-[b]', '[a]-[b].vue')
    tree.insert('o[a]-[b]c', 'o[a]-[b]c.vue')
    tree.insert('o[a][b]c', 'o[a][b]c.vue')
    tree.insert('nested/o[a][b]c', 'nested/o[a][b]c.vue')
    expect(tree.children.size).toBe(4)
    expect(tree.children.get('[a]-[b]')!.value).toMatchObject({
      pathSegment: ':a-:b',
    })
  })

  it('creates a tree of nested routes', () => {
    const tree = new PrefixTree(RESOLVED_OPTIONS)
    tree.insert('index', 'index.vue')
    tree.insert('a/index', 'a/index.vue')
    tree.insert('a/b/index', 'a/b/index.vue')
    expect(Array.from(tree.children.keys())).toEqual(['index', 'a'])
    const index = tree.children.get('index')!
    expect(index.value).toMatchObject({
      rawSegment: 'index',
      // the root should have a '/' instead of '' for the autocompletion
      fullPath: '/',
    })
    expect(index).toBeDefined()
    const a = tree.children.get('a')!
    expect(a).toBeDefined()
    expect(a.value.components.get('default')).toBeUndefined()
    expect(a.value).toMatchObject({
      rawSegment: 'a',
      fullPath: '/a',
    })
    expect(Array.from(a.children.keys())).toEqual(['index', 'b'])
    const aIndex = a.children.get('index')!
    expect(aIndex).toBeDefined()
    expect(Array.from(aIndex.children.keys())).toEqual([])
    expect(aIndex.value).toMatchObject({
      rawSegment: 'index',
      fullPath: '/a',
    })

    tree.insert('a', 'a.vue')
    expect(a.value.components.get('default')).toBe('a.vue')
    expect(a.value).toMatchObject({
      rawSegment: 'a',
      fullPath: '/a',
    })
  })

  it('handles a modifier for single params', () => {
    const tree = new PrefixTree(RESOLVED_OPTIONS)
    tree.insert('[id]+', '[id]+.vue')
    expect(tree.children.size).toBe(1)
    const child = tree.children.get('[id]+')!
    expect(child).toBeDefined()
    expect(child.value).toMatchObject({
      rawSegment: '[id]+',
      params: [{ paramName: 'id', modifier: '+' }],
      fullPath: '/:id+',
      pathSegment: ':id+',
      _type: TreeNodeType.param,
    })
    expect(child.children.size).toBe(0)
  })

  it('removes nodes', () => {
    const tree = new PrefixTree(RESOLVED_OPTIONS)
    tree.insert('foo', 'foo.vue')
    tree.insert('[id]', '[id].vue')
    tree.remove('foo')
    expect(tree.children.size).toBe(1)
    const child = tree.children.get('[id]')!
    expect(child).toBeDefined()
    expect(child.value).toMatchObject({
      rawSegment: '[id]',
      params: [{ paramName: 'id' }],
      fullPath: '/:id',
      pathSegment: ':id',
    })
    expect(child.children.size).toBe(0)
  })

  it('removes empty folders', () => {
    const tree = new PrefixTree(RESOLVED_OPTIONS)
    tree.insert('a/b/c/d', 'a/b/c/d.vue')
    expect(tree.children.size).toBe(1)
    tree.remove('a/b/c/d')
    expect(tree.children.size).toBe(0)
  })

  it('insert returns the node', () => {
    const tree = new PrefixTree(RESOLVED_OPTIONS)
    const a = tree.insert('a', 'a.vue')
    expect(tree.children.get('a')).toBe(a)
    const bC = tree.insert('b/c', 'b/c.vue')
    expect(tree.children.get('b')!.children.get('c')).toBe(bC)
    const bCD = tree.insert('b/c/d', 'b/c/d.vue')
    expect(tree.children.get('b')!.children.get('c')!.children.get('d')).toBe(
      bCD
    )
  })

  it('keeps parent with file but no children', () => {
    const tree = new PrefixTree(RESOLVED_OPTIONS)
    tree.insert('a/b/c/d', 'a/b/c/d.vue')
    tree.insert('a/b', 'a/b.vue')
    expect(tree.children.size).toBe(1)
    const child = tree.children.get('a')!.children.get('b')!
    expect(child).toBeDefined()
    expect(child.children.size).toBe(1)

    tree.remove('a/b/c/d')
    expect(tree.children.size).toBe(1)
    expect(tree.children.get('a')!.children.size).toBe(1)
    expect(child.children.size).toBe(0)
  })

  it('allows a custom name', () => {
    const tree = new PrefixTree(RESOLVED_OPTIONS)
    let node = tree.insert('[a]-[b]', '[a]-[b].vue')
    node.value.setOverride('', {
      name: 'custom',
    })
    expect(node.name).toBe('custom')
    expect(node.isNamed()).toBe(true)

    node = tree.insert('auth/login', 'auth/login.vue')
    node.value.setOverride('', {
      name: 'custom-child',
    })
    expect(node.name).toBe('custom-child')
    expect(node.isNamed()).toBe(true)
  })

  it('allows empty name to remove route from route map', () => {
    const tree = new PrefixTree(RESOLVED_OPTIONS)
    let node = tree.insert('some-route', 'some-route.vue')

    // Before setting empty name, it should use the default name
    expect(node.name).toBe('/some-route')
    expect(node.isNamed()).toBe(true)

    // Set empty name
    node.value.setOverride('', {
      name: '',
    })
    expect(node.name).toBe('')
    expect(node.isNamed()).toBe(false)

    // Set false name
    node.value.setOverride('', {
      name: false,
    })
    expect(node.name).toBe(false)
    expect(node.isNamed()).toBe(false)

    // Test with nested route
    node = tree.insert('nested/child', 'nested/child.vue')
    expect(node.name).toBe('/nested/child')
    expect(node.isNamed()).toBe(true)

    node.value.setOverride('', {
      name: '',
    })
    expect(node.name).toBe('')
    expect(node.isNamed()).toBe(false)

    node.value.setOverride('', {
      name: false,
    })
    expect(node.name).toBe(false)
    expect(node.isNamed()).toBe(false)
  })

  it('allows a custom path', () => {
    const tree = new PrefixTree(RESOLVED_OPTIONS)
    let node = tree.insert('[a]-[b]', '[a]-[b].vue')
    node.value.setOverride('', {
      path: '/custom',
    })
    expect(node.path).toBe('/custom')
    expect(node.fullPath).toBe('/custom')

    node = tree.insert('auth/login', 'auth/login.vue')
    node.value.setOverride('', {
      path: '/custom-child',
    })
    expect(node.path).toBe('/custom-child')
    expect(node.fullPath).toBe('/custom-child')
  })

  // https://github.com/posva/unplugin-vue-router/pull/597
  // added because in Nuxt the result was different
  it('does not contain duplicated params when a child route overrides the path', () => {
    const tree = new PrefixTree(RESOLVED_OPTIONS)
    tree.insert('[a]', '[a].vue')
    const node = tree.insert('[a]/b', '[a]/b.vue')
    node.value.setOverride('', {
      path: '/:a()/new-b',
    })
    expect(node.params).toHaveLength(1)
    expect(node.params[0]).toMatchObject({
      paramName: 'a',
      isSplat: false,
      modifier: '',
      optional: false,
      repeatable: false,
    } satisfies Partial<TreePathParam>)
  })

  it('removes trailing slash from path but not from name', () => {
    const tree = new PrefixTree(RESOLVED_OPTIONS)
    tree.insert('a/index', 'a/index.vue')
    tree.insert('a/a', 'a/a.vue')
    let child = tree.children.get('a')!
    expect(child).toBeDefined()
    expect(child.fullPath).toBe('/a')

    child = tree.children.get('a')!.children.get('index')!
    expect(child).toBeDefined()
    expect(child.name).toBe('/a/')
    expect(child.fullPath).toBe('/a')

    // it stays the same with a parent component in the parent route record
    tree.insert('a', 'a.vue')
    child = tree.children.get('a')!.children.get('index')!
    expect(child).toBeDefined()
    expect(child.name).toBe('/a/')
    expect(child.fullPath).toBe('/a')
  })

  it('strips groups from file paths', () => {
    const tree = new PrefixTree(RESOLVED_OPTIONS)
    tree.insert('(home)', '(home).vue')
    let child = tree.children.get('(home)')!
    expect(child).toBeDefined()
    expect(child.path).toBe('/')
    expect(child.fullPath).toBe('/')
  })

  it('strips groups from nested file paths', () => {
    const tree = new PrefixTree(RESOLVED_OPTIONS)
    tree.insert('nested/(home)', 'nested/(home).vue')
    let child = tree.children.get('nested')!
    expect(child).toBeDefined()

    child = child.children.get('(home)')!
    expect(child).toBeDefined()
    expect(child.path).toBe('')
    expect(child.fullPath).toBe('/nested')
  })

  it('strips groups in folders', () => {
    const tree = new PrefixTree(RESOLVED_OPTIONS)
    tree.insert('(group)/a', '(group)/a.vue')
    tree.insert('(group)/index', '(group)/index.vue')

    const group = tree.children.get('(group)')!
    expect(group).toBeDefined()
    expect(group.path).toBe('/')

    const a = group.children.get('a')!
    expect(a).toBeDefined()
    expect(a.fullPath).toBe('/a')

    const index = group.children.get('index')!
    expect(index).toBeDefined()
    expect(index.fullPath).toBe('/')
  })

  it('strips groups in nested folders', () => {
    const tree = new PrefixTree(RESOLVED_OPTIONS)
    tree.insert('nested/(nested-group)/a', 'nested/(nested-group)/a.vue')
    tree.insert(
      'nested/(nested-group)/index',
      'nested/(nested-group)/index.vue'
    )

    const rootNode = tree.children.get('nested')!
    expect(rootNode).toBeDefined()
    expect(rootNode.path).toBe('/nested')

    const nestedGroupNode = rootNode.children.get('(nested-group)')!
    expect(nestedGroupNode).toBeDefined()
    // nested groups have an empty path
    expect(nestedGroupNode.path).toBe('')
    expect(nestedGroupNode.fullPath).toBe('/nested')

    const aNode = nestedGroupNode.children.get('a')!
    expect(aNode).toBeDefined()
    expect(aNode.fullPath).toBe('/nested/a')

    const indexNode = nestedGroupNode.children.get('index')!
    expect(indexNode).toBeDefined()
    expect(indexNode.fullPath).toBe('/nested')
  })

  it('warns if the closing group is missing', () => {
    const tree = new PrefixTree(RESOLVED_OPTIONS)
    tree.insert('(home', '(home).vue')
    expect(`"(home" is missing the closing ")"`).toHaveBeenWarned()
  })

  describe('path regexp', () => {
    function checkRegexp(
      path: string,
      expectedRe: string,
      {
        options,
        matcherParts,
      }: {
        options?: Options
        matcherParts?: TreeNodeValueMatcherPart
      }
    ) {
      const node = new PrefixTree(
        options ? resolveOptions(options) : RESOLVED_OPTIONS
      ).insert(path, path + '.vue')
      expect(node.regexp).toBe(expectedRe)
      if (matcherParts) {
        expect(node.matcherPatternPathDynamicParts).toEqual(matcherParts)
      }
    }

    it('generates static paths', () => {
      checkRegexp('abc', '/^\\/abc$/i', {})
    })

    it('works with multiple segments', () => {
      checkRegexp('a/b/c', '/^\\/a\\/b\\/c$/i', {})
    })

    describe('basic params [id] in all positions', () => {
      it('only segment', () => {
        checkRegexp('[id]', '/^\\/([^/]+?)$/i', {
          matcherParts: [1],
        })
      })

      it('first position', () => {
        checkRegexp('[id]/static', '/^\\/([^/]+?)\\/static$/i', {
          matcherParts: [1, 'static'],
        })
      })

      it('sub segment first position', () => {
        checkRegexp('[id].static', '/^\\/([^/]+?)\\/static$/i', {})
      })

      it('middle position', () => {
        checkRegexp('static/[id]/more', '/^\\/static\\/([^/]+?)\\/more$/i', {
          matcherParts: ['static', 1, 'more'],
        })
      })

      it('sub segment middle position', () => {
        checkRegexp('static.[id].more', '/^\\/static\\/([^/]+?)\\/more$/i', {})
      })

      it('last position', () => {
        checkRegexp('static/[id]', '/^\\/static\\/([^/]+?)$/i', {
          matcherParts: ['static', 1],
        })
      })

      it('sub segment last position', () => {
        checkRegexp('static.[id]', '/^\\/static\\/([^/]+?)$/i', {})
      })
    })

    describe('optional params [[id]] in all positions', () => {
      it('only segment', () => {
        checkRegexp('[[id]]', '/^\\/([^/]+?)?$/i', {
          matcherParts: [1],
        })
      })

      it('first position', () => {
        checkRegexp('[[id]]/static', '/^(?:\\/([^/]+?))?\\/static$/i', {
          matcherParts: [1, 'static'],
        })
      })

      it('sub segment first position', () => {
        checkRegexp('[[id]].static', '/^(?:\\/([^/]+?))?\\/static$/i', {})
      })

      it('middle position', () => {
        checkRegexp(
          'static/[[id]]/more',
          '/^\\/static(?:\\/([^/]+?))?\\/more$/i',
          {
            matcherParts: ['static', 1, 'more'],
          }
        )
      })

      it('sub segment middle position', () => {
        checkRegexp(
          'static.[[id]].more',
          '/^\\/static(?:\\/([^/]+?))?\\/more$/i',
          {}
        )
      })

      it('last position', () => {
        checkRegexp('static/[[id]]', '/^\\/static(?:\\/([^/]+?))?$/i', {
          matcherParts: ['static', 1],
        })
      })

      it('sub segment last position', () => {
        checkRegexp('static.[[id]]', '/^\\/static(?:\\/([^/]+?))?$/i', {})
      })
    })

    describe('repeatable params [id]+ in all positions', () => {
      it('only segment', () => {
        checkRegexp('[id]+', '/^\\/(.+?)$/i', {
          matcherParts: [1],
        })
      })

      it('first position', () => {
        checkRegexp('[id]+/static', '/^\\/(.+?)\\/static$/i', {
          matcherParts: [1, 'static'],
        })
      })

      it('middle position', () => {
        checkRegexp('static/[id]+/more', '/^\\/static\\/(.+?)\\/more$/i', {
          matcherParts: ['static', 1, 'more'],
        })
      })

      it('last position', () => {
        checkRegexp('static/[id]+', '/^\\/static\\/(.+?)$/i', {
          matcherParts: ['static', 1],
        })
      })
    })

    describe('optional repeatable params [[id]]+ in all positions', () => {
      it('only segment', () => {
        checkRegexp('[[id]]+', '/^\\/(.+?)?$/i', {
          matcherParts: [1],
        })
      })

      it('first position', () => {
        checkRegexp('[[id]]+/static', '/^(?:\\/(.+?))?\\/static$/i', {
          matcherParts: [1, 'static'],
        })
      })

      it('middle position', () => {
        checkRegexp(
          'static/[[id]]+/more',
          '/^\\/static(?:\\/(.+?))?\\/more$/i',
          {
            matcherParts: ['static', 1, 'more'],
          }
        )
      })

      it('last position', () => {
        checkRegexp('static/[[id]]+', '/^\\/static(?:\\/(.+?))?$/i', {
          matcherParts: ['static', 1],
        })
      })
    })

    it('works with multiple params', () => {
      checkRegexp('a/[b]/[c]', '/^\\/a\\/([^/]+?)\\/([^/]+?)$/i', {
        matcherParts: ['a', 1, 1],
      })
    })

    it('works with segments', () => {
      checkRegexp('a/a-[b]-c-[d]', '/^\\/a\\/a-([^/]+?)-c-([^/]+?)$/i', {
        matcherParts: ['a', ['a-', 1, '-c-', 1]],
      })
    })

    it('works with a catch all route', () => {
      checkRegexp('[...all]', '/^\\/(.*)$/i', {
        matcherParts: [0],
      })
    })

    it('works with a splat param with a prefix', () => {
      checkRegexp('a/some-[id]/[...all]', '/^\\/a\\/some-([^/]+?)\\/(.*)$/i', {
        matcherParts: ['a', ['some-', 1], 0],
      })
    })
  })

  // TODO: check warns with different order
  it.todo(`warns when a group's path conflicts with an existing file`)

  describe('dot nesting', () => {
    it('transforms dots into nested routes by default', () => {
      const tree = new PrefixTree(RESOLVED_OPTIONS)
      tree.insert('users.new', 'users.new.vue')
      expect(tree.children.size).toBe(1)
      const users = tree.children.get('users.new')!
      expect(users.value).toMatchObject({
        rawSegment: 'users.new',
        pathSegment: 'users/new',
        fullPath: '/users/new',
        _type: TreeNodeType.static,
      })
    })

    it('can ignore dot nesting', () => {
      const tree = new PrefixTree({
        ...RESOLVED_OPTIONS,
        pathParser: {
          dotNesting: false,
        },
      })
      tree.insert('1.2.3-lesson', '1.2.3-lesson.vue')
      expect(tree.children.size).toBe(1)
      const lesson = tree.children.get('1.2.3-lesson')!

      expect(lesson.value).toMatchObject({
        rawSegment: '1.2.3-lesson',
        pathSegment: '1.2.3-lesson',
        fullPath: '/1.2.3-lesson',
        _type: TreeNodeType.static,
      })
    })
  })

  describe('Query params from definePage', () => {
    it('extracts query params from route overrides', () => {
      const tree = new PrefixTree(RESOLVED_OPTIONS)
      const node = tree.insert('users', 'users.vue')

      // Simulate definePage params extraction
      node.setCustomRouteBlock('users.vue', {
        params: {
          query: {
            search: {},
            limit: { parser: 'int', default: '10' },
            tags: { parser: 'bool' },
            other: { default: '"defaultValue"' },
          },
        },
      })

      expect(node.queryParams).toEqual([
        {
          paramName: 'search',
          parser: null,
          format: 'value',
          defaultValue: undefined,
        },
        {
          paramName: 'limit',
          parser: 'int',
          format: 'value',
          defaultValue: '10',
        },
        {
          paramName: 'tags',
          parser: 'bool',
          format: 'value',
          defaultValue: undefined,
        },
        {
          paramName: 'other',
          parser: null,
          format: 'value',
          defaultValue: '"defaultValue"',
        },
      ])
    })

    it('returns empty array when no query params defined', () => {
      const tree = new PrefixTree(RESOLVED_OPTIONS)
      const node = tree.insert('about', 'about.vue')

      expect(node.queryParams).toEqual([])
    })

    it('params includes both path and query params', () => {
      const tree = new PrefixTree(RESOLVED_OPTIONS)
      const node = tree.insert('posts/[id]', 'posts/[id].vue')

      node.setCustomRouteBlock('posts/[id].vue', {
        params: {
          query: {
            tab: {},
            expand: { parser: 'bool', default: 'false' },
          },
        },
      })

      // Should have 1 path param + 2 query params
      expect(node.params).toHaveLength(3)
      expect(node.params[0]).toMatchObject({ paramName: 'id' }) // path param
      expect(node.params[1]).toMatchObject({
        paramName: 'tab',
        parser: null,
        format: 'value',
        defaultValue: undefined,
      }) // query param
      expect(node.params[2]).toMatchObject({
        paramName: 'expand',
        parser: 'bool',
        format: 'value',
        defaultValue: 'false',
      }) // query param
    })
  })

  describe('Empty parameter names', () => {
    it('assigns default name "pathMatch" to empty parameter names', () => {
      const tree = new PrefixTree(RESOLVED_OPTIONS)
      let node = tree.insertParsedPath('/:()bar', 'test.vue')

      expect(
        'Invalid parameter in path "/:()bar": parameter name cannot be empty'
      ).toHaveBeenWarned()
      // The empty param gets assigned the default name "pathMatch"
      expect(node.value.isParam()).toBe(true)
      if (node.value.isParam()) {
        expect(node.value.pathParams).toHaveLength(1)
        expect(node.value.pathParams[0]).toMatchObject({
          paramName: 'pathMatch',
        })
      }

      // Empty param at the start - gets default name
      node = tree.insertParsedPath('/:()', 'test1.vue')
      expect(
        'Invalid parameter in path "/:()": parameter name cannot be empty'
      ).toHaveBeenWarned()
      expect(node.value.isParam()).toBe(true)
      if (node.value.isParam()) {
        expect(node.value.pathParams).toHaveLength(1)
        expect(node.value.pathParams[0]).toMatchObject({
          paramName: 'pathMatch',
        })
      }

      // Empty param with prefix - gets default name
      node = tree.insertParsedPath('/foo/:()', 'test2.vue')
      expect(
        'Invalid parameter in path "/foo/:()": parameter name cannot be empty'
      ).toHaveBeenWarned()
      expect(node.value.isParam()).toBe(true)
      if (node.value.isParam()) {
        expect(node.value.pathParams).toHaveLength(1)
        expect(node.value.pathParams[0]).toMatchObject({
          paramName: 'pathMatch',
        })
      }

      // Mixed: valid param, empty param, valid param - empty gets default name
      node = tree.insertParsedPath('/:a/:()/:b', 'test3.vue')
      expect(
        'Invalid parameter in path "/:a/:()/:b": parameter name cannot be empty'
      ).toHaveBeenWarned()
      expect(node.value.isParam()).toBe(true)
      if (node.value.isParam()) {
        expect(node.value.pathParams).toHaveLength(3)
        expect(node.value.pathParams[0]).toMatchObject({ paramName: 'a' })
        expect(node.value.pathParams[1]).toMatchObject({
          paramName: 'pathMatch',
        })
        expect(node.value.pathParams[2]).toMatchObject({ paramName: 'b' })
      }
    })
  })
})
