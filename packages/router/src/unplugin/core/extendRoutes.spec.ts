import { expect, describe, it, beforeAll } from 'vitest'
import { PrefixTree } from './tree'
import { DEFAULT_OPTIONS, resolveOptions } from '../options'
import { EditableTreeNode } from './extendRoutes'
import { mockWarn } from '../../tests/vitest-mock-warn'

describe('EditableTreeNode', () => {
  beforeAll(() => {
    mockWarn()
  })

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
})
