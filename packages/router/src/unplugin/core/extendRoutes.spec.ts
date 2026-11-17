import { expect, describe, it } from 'vitest'
import { PrefixTree } from './tree'
import { DEFAULT_OPTIONS, resolveOptions } from '../options'
import { EditableTreeNode } from './extendRoutes'
import { mockWarn } from '../../tests/vitest-mock-warn'

/**
 * Finds a route like users do in `beforeWriteFiles()`.
 */
function findRoute(root: EditableTreeNode, name: string): EditableTreeNode {
  const route = [...root].find(route => route.name === name)
  expect(route).toBeDefined()
  return route!
}

describe('EditableTreeNode', () => {
  mockWarn()

  const RESOLVED_OPTIONS = resolveOptions(DEFAULT_OPTIONS)
  it('creates an editable tree node', () => {
    const tree = new PrefixTree(RESOLVED_OPTIONS)
    const editable = new EditableTreeNode(tree)

    expect(editable.children).toEqual([])
  })

  it('reflects changes made on the tree', () => {
    const tree = new PrefixTree(RESOLVED_OPTIONS)
    const editable = new EditableTreeNode(tree)

    tree.insert('foo', 'file.vue')
    expect(editable.children).toHaveLength(1)
    expect(editable.children[0]?.path).toBe('/foo')
  })

  it('reflects changes made on the editable tree', () => {
    const tree = new PrefixTree(RESOLVED_OPTIONS)
    const editable = new EditableTreeNode(tree)

    editable.insert('foo', 'file.vue')
    expect(tree.children.size).toBe(1)
    expect(tree.children.get('foo')?.path).toBe('/foo')
  })

  it('can unset a route name with false', () => {
    const tree = new PrefixTree(RESOLVED_OPTIONS)
    const editable = new EditableTreeNode(tree)

    const node = editable.insert('foo', 'foo.vue')
    expect(node.name).toBeTruthy()

    // false unsets the name so the route is excluded from the route map
    node.name = false
    expect(node.name).toBe(false)

    // a string overrides it
    node.name = 'bar'
    expect(node.name).toBe('bar')

    // undefined is ignored: the previously set name is kept (not reset)
    node.name = undefined
    expect(node.name).toBe('bar')
  })

  it('removes parent when deleting last child of a non-matchable node', () => {
    const tree = new PrefixTree(RESOLVED_OPTIONS)

    const editable = new EditableTreeNode(tree)
    editable.insert('about', 'about.vue')
    const toDelete = editable.insert('a/b/c', 'a/b/c.vue')

    expect(tree.children.size).toBe(2)
    toDelete.delete()
    expect(tree.children.size).toBe(1)
    expect(tree.children.has('a')).toBe(false)
    expect(tree.children.has('about')).toBe(true)
    // repeatedly deleting a node should not throw
    expect(() => toDelete.delete()).not.toThrow()
  })

  it('keeps nested routes flat', () => {
    const tree = new PrefixTree(RESOLVED_OPTIONS)
    const editable = new EditableTreeNode(tree)

    editable.insert('foo/bar', 'file.vue')
    expect(tree.children.size).toBe(1)
    expect(tree.children.get('foo/bar')?.children.size).toBe(0)
    expect(tree.children.get('foo/bar')?.fullPath).toBe('/foo/bar')
    expect(tree.children.get('foo/bar')?.path).toBe('/foo/bar')
  })

  it('can nest routes', () => {
    const tree = new PrefixTree(RESOLVED_OPTIONS)
    const editable = new EditableTreeNode(tree)

    const node = editable.insert('foo', 'file.vue')
    node.insert('bar/nested', 'file.vue')
    expect(tree.children.size).toBe(1)
    expect(node.children.length).toBe(1)
    expect(node.fullPath).toBe('/foo')
    expect(node.path).toBe('/foo')
    expect(node.children.at(0)?.path).toBe('bar/nested')
    expect(node.children.at(0)?.fullPath).toBe('/foo/bar/nested')
  })

  it('adds params', () => {
    const tree = new PrefixTree(RESOLVED_OPTIONS)
    const editable = new EditableTreeNode(tree)

    editable.insert(':id', 'file.vue')
    expect(tree.children.size).toBe(1)
    const child = tree.children.get(':id')!
    expect(child.fullPath).toBe('/:id')
    expect(child.path).toBe('/:id')
    expect(child.params).toMatchObject([
      {
        paramName: 'id',
        modifier: '',
        optional: false,
        repeatable: false,
        parser: null,
        isSplat: false,
      },
    ])
  })

  it('adds params with modifiers', () => {
    const tree = new PrefixTree(RESOLVED_OPTIONS)
    const editable = new EditableTreeNode(tree)

    editable.insert(':id+', 'file.vue')
    expect(tree.children.size).toBe(1)
    const child = tree.children.get(':id+')!
    expect(child.fullPath).toBe('/:id+')
    expect(child.path).toBe('/:id+')
    expect(child.params).toMatchObject([
      {
        paramName: 'id',
        parser: null,
        modifier: '+',
        optional: false,
        repeatable: true,
        isSplat: false,
      },
    ])
  })

  it('can have multiple params', () => {
    const tree = new PrefixTree(RESOLVED_OPTIONS)
    const editable = new EditableTreeNode(tree)

    editable.insert(':foo/:bar', 'file.vue')
    expect(tree.children.size).toBe(1)
    const node = tree.children.get(':foo/:bar')!
    expect(node.fullPath).toBe('/:foo/:bar')
    expect(node.path).toBe('/:foo/:bar')
    expect(node.params).toMatchObject([
      {
        paramName: 'foo',
        modifier: '',
        optional: false,
        repeatable: false,
        isSplat: false,
      },
      {
        paramName: 'bar',
        modifier: '',
        optional: false,
        repeatable: false,
        isSplat: false,
      },
    ])
  })

  it('can have multiple params with modifiers', () => {
    const tree = new PrefixTree(RESOLVED_OPTIONS)
    const editable = new EditableTreeNode(tree)

    editable.insert(':foo/:bar+_:o(\\d+)', 'file.vue')
    expect(tree.children.size).toBe(1)
    const node = tree.children.get(':foo/:bar+_:o(\\d+)')!
    expect(node.fullPath).toBe('/:foo/:bar+_:o(\\d+)')
    expect(node.path).toBe('/:foo/:bar+_:o(\\d+)')
    expect(node.params).toMatchObject([
      {
        paramName: 'foo',
        modifier: '',
        optional: false,
        repeatable: false,
        isSplat: false,
      },
      {
        paramName: 'bar',
        modifier: '+',
        optional: false,
        repeatable: true,
        isSplat: false,
      },
      {
        paramName: 'o',
        modifier: '',
        optional: false,
        repeatable: false,
        isSplat: false,
      },
    ])
  })

  it('keeps renames of params with a declared parser or regexp', () => {
    const tree = new PrefixTree(RESOLVED_OPTIONS)
    const root = new EditableTreeNode(tree)
    tree
      .insert('[a]', 'a.vue')
      .setCustomRouteBlock('a.vue', { params: { path: { a: 'int' } } })
    const nodeB = tree.insert('[b]', 'b.vue')
    nodeB.setCustomRouteBlock('b.vue', {
      params: { path: { b: { re: '\\d+' } } },
    })
    const withParser = findRoute(root, '/[a]')
    const withRe = findRoute(root, '/[b]')

    withParser.params[0]!.paramName = 'renamedA'
    withRe.params[0]!.paramName = 'renamedB'
    expect(withParser.params).toMatchObject([
      { paramName: 'renamedA', parser: 'int' },
    ])
    // the declared regexp is still applied after the rename
    expect(withRe.params).toMatchObject([{ paramName: 'renamedB', re: '\\d+' }])
    expect(nodeB.regexp).toBe('/^\\/(\\d+)$/i')
  })

  it('keeps param renames after other edits', () => {
    const tree = new PrefixTree(RESOLVED_OPTIONS)
    const root = new EditableTreeNode(tree)
    const parent = tree.insert('[a]', '[a].vue')
    parent.setCustomRouteBlock('[a].vue', { params: { path: { a: 'int' } } })
    const node = tree.insert('[a]/[b]', '[a]/[b].vue')
    node.setCustomRouteBlock('[a]/[b].vue', { path: ':b(\\d+)' })
    const route = findRoute(root, '/[a]/[b]')

    route.params[0]!.paramName = 'renamedA'
    route.params[1]!.paramName = 'renamedB'
    route.addToMeta({ a: 1 })
    route.meta = { b: 2 }
    route.name = 'custom'
    route.addAlias(['/other'])
    new EditableTreeNode(parent).addToMeta({ a: 1 })
    parent.setCustomRouteBlock('[a].vue', { params: { path: { a: 'date' } } })
    route.path = 'users/:b(\\d+)'

    expect(route.params).toMatchObject([
      { paramName: 'renamedA', parser: 'date' },
      { paramName: 'renamedB', re: '\\d+' },
    ])
    expect(node.regexp).toBe('/^\\/([^/]+?)\\/users\\/(\\d+)$/i')
    // the file segments keep the original names
    expect(parent.value.subSegments).toMatchObject([{ paramName: 'a' }])

    // params added by a path edit keep their own names
    route.path = ':other'
    expect(route.params).toMatchObject([
      { paramName: 'renamedA' },
      { paramName: 'other' },
    ])
  })

  describe('param name validation', () => {
    it('strips invalid characters when a param is renamed', () => {
      const tree = new PrefixTree(RESOLVED_OPTIONS)
      const root = new EditableTreeNode(tree)
      root.insert(':id', 'a.vue')
      tree.insert('[id]', 'b.vue')
      const fromPath = findRoute(root, '/:id')
      const fromFile = findRoute(root, '/[id]')
      expect(fromPath.params[0]?.paramName).toBeDefined()
      expect(fromFile.params[0]?.paramName).toBeDefined()

      fromPath.params[0]!.paramName = `a'}-b`
      expect('VUE_ROUTER_B0027').toHaveBeenWarnedTimes(1)
      fromFile.params[0]!.paramName = 'my-id'
      expect('VUE_ROUTER_B0027').toHaveBeenWarnedTimes(2)
      expect(fromPath.params).toMatchObject([{ paramName: 'ab' }])
      expect(fromFile.params).toMatchObject([{ paramName: 'myid' }])
    })

    it('keeps valid names when a param is renamed', () => {
      const tree = new PrefixTree(RESOLVED_OPTIONS)
      const root = new EditableTreeNode(tree)
      root.insert(':id', 'a.vue')
      const node = findRoute(root, '/:id')

      node.params[0]!.paramName = 'user_Id2'
      expect(node.params).toMatchObject([{ paramName: 'user_Id2' }])
    })

    it('warns when a param is renamed to an empty name', () => {
      const tree = new PrefixTree(RESOLVED_OPTIONS)
      const root = new EditableTreeNode(tree)
      root.insert(':id', 'a.vue')
      const node = findRoute(root, '/:id')

      node.params[0]!.paramName = ''
      expect(node.params).toMatchObject([{ paramName: '' }])
      expect('VUE_ROUTER_B0028').toHaveBeenWarned()
    })
  })

  it('adds params with custom regex', () => {
    const tree = new PrefixTree(RESOLVED_OPTIONS)
    const editable = new EditableTreeNode(tree)

    editable.insert(':id(\\d+)', 'file.vue')
    const node = tree.children.get(':id(\\d+)')!
    expect(node.fullPath).toBe('/:id(\\d+)')
    expect(node.path).toBe('/:id(\\d+)')
    expect(node.params).toMatchObject([
      {
        paramName: 'id',
        modifier: '',
        optional: false,
        repeatable: false,
        isSplat: false,
      },
    ])
  })

  it('adds a param with empty regex', () => {
    const tree = new PrefixTree(RESOLVED_OPTIONS)
    const editable = new EditableTreeNode(tree)

    editable.insert(':id()', 'file.vue')
    const node = tree.children.get(':id()')!
    expect(node.fullPath).toBe('/:id()')
    expect(node.path).toBe('/:id()')
    expect(node.params).toMatchObject([
      {
        paramName: 'id',
        modifier: '',
        optional: false,
        repeatable: false,
        isSplat: false,
      },
    ])
  })

  it('adds a param with a modifier and custom regex', () => {
    const tree = new PrefixTree(RESOLVED_OPTIONS)
    const editable = new EditableTreeNode(tree)

    editable.insert(':id(\\d+)+', 'file.vue')
    const node = tree.children.get(':id(\\d+)+')!
    expect(node.fullPath).toBe('/:id(\\d+)+')
    expect(node.path).toBe('/:id(\\d+)+')
    expect(node.params).toMatchObject([
      {
        paramName: 'id',
        modifier: '+',
        optional: false,
        repeatable: true,
        isSplat: false,
      },
    ])
  })

  it('adds a param with a modifier and empty regex', () => {
    const tree = new PrefixTree(RESOLVED_OPTIONS)
    const editable = new EditableTreeNode(tree)

    editable.insert(':id()+', 'file.vue')
    const node = tree.children.get(':id()+')!
    expect(node.fullPath).toBe('/:id()+')
    expect(node.path).toBe('/:id()+')
    expect(node.params).toMatchObject([
      {
        paramName: 'id',
        modifier: '+',
        optional: false,
        repeatable: true,
        isSplat: false,
      },
    ])
  })

  it('detects a splat', () => {
    const tree = new PrefixTree(RESOLVED_OPTIONS)
    const editable = new EditableTreeNode(tree)

    editable.insert('/:path(.*)', 'file.vue')
    expect(tree.children.size).toBe(1)
    const child = tree.children.get(':path(.*)')!
    expect(child.fullPath).toBe('/:path(.*)')
    expect(child.path).toBe('/:path(.*)')
    expect(child.params).toMatchObject([
      {
        paramName: 'path',
        modifier: '',
        optional: false,
        repeatable: false,
        isSplat: true,
      },
    ])
  })

  it('can override children path with relative ones', () => {
    const tree = new PrefixTree(RESOLVED_OPTIONS)
    const editable = new EditableTreeNode(tree)
    const parent = editable.insert('parent', 'file.vue')
    const child = parent.insert('child', 'file.vue')
    const grandChild = child.insert('grandchild', 'file.vue')

    child.path = 'relative'
    expect(child.path).toBe('relative')
    expect(child.fullPath).toBe('/parent/relative')
    expect(grandChild.fullPath).toBe('/parent/relative/grandchild')

    child.path = '/absolute'
    expect(child.path).toBe('/absolute')
    expect(child.fullPath).toBe('/absolute')
    expect(grandChild.fullPath).toBe('/absolute/grandchild')
  })

  it('can override paths at tho root', () => {
    const tree = new PrefixTree(RESOLVED_OPTIONS)
    const editable = new EditableTreeNode(tree)
    const parent = editable.insert('parent', 'file.vue')
    const child = parent.insert('child', 'child.vue')

    parent.path = '/p'
    expect(parent.path).toBe('/p')
    expect(parent.fullPath).toBe('/p')
    expect(child.fullPath).toBe('/p/child')
  })

  it('still creates valid paths if the path misses a leading slash', () => {
    const tree = new PrefixTree(RESOLVED_OPTIONS)
    const editable = new EditableTreeNode(tree)
    const parent = editable.insert('parent', 'file.vue')
    const child = parent.insert('child', 'file.vue')

    parent.path = 'bar'
    expect(parent.path).toBe('/bar')
    expect(parent.fullPath).toBe('/bar')
    expect(child.fullPath).toBe('/bar/child')
  })

  describe('special characters (same as raw [x+hh])', () => {
    it('supports hex encoding in path format with single segment', () => {
      const tree = new PrefixTree(RESOLVED_OPTIONS)
      const editable = new EditableTreeNode(tree)

      const child = editable.insert('.well-known', 'file.vue')
      expect(child).toBeDefined()

      expect(child.fullPath).toBe('/.well-known')
      expect(child.path).toBe('/.well-known')
    })

    it('special character within a param', () => {
      const tree = new PrefixTree(RESOLVED_OPTIONS)
      const editable = new EditableTreeNode(tree)

      const child = editable.insert(':id.test', 'file.vue')

      expect(child.fullPath).toBe('/:id.test')
      expect(child.params).toMatchObject([
        {
          paramName: 'id',
          modifier: '',
        },
      ])
    })
  })

  describe('overrides stay up to date after reads', () => {
    it('name', () => {
      const tree = new PrefixTree(RESOLVED_OPTIONS)
      const node = new EditableTreeNode(tree).insert('foo', 'foo.vue')
      expect(node.name).toBe('/foo')
      node.name = 'custom'
      expect(node.name).toBe('custom')
    })

    it('path and params', () => {
      const tree = new PrefixTree(RESOLVED_OPTIONS)
      const node = new EditableTreeNode(tree).insert('foo', 'foo.vue')
      expect(node.path).toBe('/foo')
      expect(node.params).toEqual([])
      node.path = '/bar/:id'
      expect(node.path).toBe('/bar/:id')
      expect(node.params).toMatchObject([{ paramName: 'id' }])
    })

    it('meta with addToMeta and the setter', () => {
      const tree = new PrefixTree(RESOLVED_OPTIONS)
      const node = new EditableTreeNode(tree).insert('foo', 'foo.vue')
      expect(node.meta).toEqual({})
      node.addToMeta({ a: 1 })
      expect(node.meta).toEqual({ a: 1 })
      node.addToMeta({ b: 2 })
      expect(node.meta).toEqual({ a: 1, b: 2 })
      node.meta = { c: 3 }
      expect(node.meta).toEqual({ c: 3 })
      node.meta = { d: 4 }
      expect(node.meta).toEqual({ d: 4 })
    })

    it('alias', () => {
      const tree = new PrefixTree(RESOLVED_OPTIONS)
      const node = new EditableTreeNode(tree).insert('foo', 'foo.vue')
      expect(node.alias).toBeUndefined()
      node.addAlias(['/a'])
      expect(node.alias).toEqual(['/a'])
      node.alias!.push('/ignored')
      expect(node.alias).toEqual(['/a'])
      node.addAlias(['/b'])
      expect(node.alias).toEqual(['/a', '/b'])
    })

    it('custom route blocks', () => {
      const tree = new PrefixTree(RESOLVED_OPTIONS)
      const node = tree.insert('foo', 'foo.vue')
      expect(node.name).toBe('/foo')
      node.setCustomRouteBlock('foo.vue', { name: 'from-block' })
      expect(node.name).toBe('from-block')
      node.setCustomRouteBlock('foo.vue', undefined)
      expect(node.name).toBe('/foo')
    })

    it('parent overrides in the full path', () => {
      const tree = new PrefixTree(RESOLVED_OPTIONS)
      const child = tree.insert('foo/bar', 'foo/bar.vue')
      expect(child.fullPath).toBe('/foo/bar')
      new EditableTreeNode(child.parent!).path = '/baz'
      expect(child.fullPath).toBe('/baz/bar')
    })
  })
})
