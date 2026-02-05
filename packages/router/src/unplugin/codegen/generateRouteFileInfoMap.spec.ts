import { describe, expect, it } from 'vitest'
import { generateRouteFileInfoMap } from './generateRouteFileInfoMap'
import { PrefixTree } from '../core/tree'
import { resolveOptions } from '../options'

const DEFAULT_OPTIONS = resolveOptions({})

function formatExports(exports: string) {
  return exports
    .split('\n')
    .filter(line => line.length > 0)
    .join('\n')
}

describe('generateRouteFileInfoMap', () => {
  it('works with some paths at root', () => {
    const tree = new PrefixTree(DEFAULT_OPTIONS)
    tree.insert('index', 'src/pages/index.vue')
    tree.insert('a', 'src/pages/a.vue')
    tree.insert('b', 'src/pages/b.vue')
    tree.insert('c', 'src/pages/c.vue')
    expect(formatExports(generateRouteFileInfoMap(tree, { root: '' })))
      .toMatchInlineSnapshot(`
        "export interface _RouteFileInfoMap {
          'src/pages/index.vue': {
            routes:
              | '/'
            views:
              | never
          }
          'src/pages/a.vue': {
            routes:
              | '/a'
            views:
              | never
          }
          'src/pages/b.vue': {
            routes:
              | '/b'
            views:
              | never
          }
          'src/pages/c.vue': {
            routes:
              | '/c'
            views:
              | never
          }
        }"
      `)
  })

  it('is consistely sorted', () => {
    /*
     * Based off
      * this tree:
      * src/pages
├── (auth)
│   ├── another
│   │   └── index.vue
│   ├── deposit
│   │   └── index.vue
│   ├── foo
│   │   ├── bar.vue
│   │   ├── foo.vue
│   │   └── index.vue
│   ├── home
│   │   └── index.vue
│   ├── login-another
│   │   └── index.vue
│   └── settings
│       ├── edit-account.vue
│       ├── edit-email.vue
│       ├── edit-password.vue
│       ├── edit-phone-number.vue
│       ├── index.vue
│       ├── two-factor.vue
│       └── verify-phone-number.vue
└── (auth).vue
    */
    const tree = new PrefixTree(DEFAULT_OPTIONS)
    tree.insert('(auth)', '(auth).vue')
    tree.insert('(auth)/another', '(auth)/another/index.vue')
    tree.insert('(auth)/deposit', '(auth)/deposit/index.vue')
    tree.insert('(auth)/foo/bar', '(auth)/foo/bar.vue')
    tree.insert('(auth)/foo/foo', '(auth)/foo/foo.vue')
    tree.insert('(auth)/foo', '(auth)/foo/index.vue')
    tree.insert('(auth)/home', '(auth)/home/index.vue')
    tree.insert('(auth)/login-another', '(auth)/login-another/index.vue')
    tree.insert(
      '(auth)/settings/edit-account',
      '(auth)/settings/edit-account.vue'
    )
    tree.insert('(auth)/settings/edit-email', '(auth)/settings/edit-email.vue')
    tree.insert(
      '(auth)/settings/edit-password',
      '(auth)/settings/edit-password.vue'
    )
    tree.insert(
      '(auth)/settings/edit-phone-number',
      '(auth)/settings/edit-phone-number.vue'
    )
    tree.insert('(auth)/settings', '(auth)/settings/index.vue')
    tree.insert('(auth)/settings/two-factor', '(auth)/settings/two-factor.vue')
    tree.insert(
      '(auth)/settings/verify-phone-number',
      '(auth)/settings/verify-phone-number.vue'
    )

    expect(formatExports(generateRouteFileInfoMap(tree, { root: '' })))
      .toMatchInlineSnapshot(`
      "export interface _RouteFileInfoMap {
        '(auth).vue': {
          routes:
            | '/(auth)'
            | '/(auth)/another'
            | '/(auth)/deposit'
            | '/(auth)/foo'
            | '/(auth)/foo/bar'
            | '/(auth)/foo/foo'
            | '/(auth)/home'
            | '/(auth)/login-another'
            | '/(auth)/settings'
            | '/(auth)/settings/edit-account'
            | '/(auth)/settings/edit-email'
            | '/(auth)/settings/edit-password'
            | '/(auth)/settings/edit-phone-number'
            | '/(auth)/settings/two-factor'
            | '/(auth)/settings/verify-phone-number'
          views:
            | 'default'
        }
        '(auth)/another/index.vue': {
          routes:
            | '/(auth)/another'
          views:
            | never
        }
        '(auth)/deposit/index.vue': {
          routes:
            | '/(auth)/deposit'
          views:
            | never
        }
        '(auth)/foo/index.vue': {
          routes:
            | '/(auth)/foo'
            | '/(auth)/foo/bar'
            | '/(auth)/foo/foo'
          views:
            | 'default'
        }
        '(auth)/foo/bar.vue': {
          routes:
            | '/(auth)/foo/bar'
          views:
            | never
        }
        '(auth)/foo/foo.vue': {
          routes:
            | '/(auth)/foo/foo'
          views:
            | never
        }
        '(auth)/home/index.vue': {
          routes:
            | '/(auth)/home'
          views:
            | never
        }
        '(auth)/login-another/index.vue': {
          routes:
            | '/(auth)/login-another'
          views:
            | never
        }
        '(auth)/settings/index.vue': {
          routes:
            | '/(auth)/settings'
            | '/(auth)/settings/edit-account'
            | '/(auth)/settings/edit-email'
            | '/(auth)/settings/edit-password'
            | '/(auth)/settings/edit-phone-number'
            | '/(auth)/settings/two-factor'
            | '/(auth)/settings/verify-phone-number'
          views:
            | 'default'
        }
        '(auth)/settings/edit-account.vue': {
          routes:
            | '/(auth)/settings/edit-account'
          views:
            | never
        }
        '(auth)/settings/edit-email.vue': {
          routes:
            | '/(auth)/settings/edit-email'
          views:
            | never
        }
        '(auth)/settings/edit-password.vue': {
          routes:
            | '/(auth)/settings/edit-password'
          views:
            | never
        }
        '(auth)/settings/edit-phone-number.vue': {
          routes:
            | '/(auth)/settings/edit-phone-number'
          views:
            | never
        }
        '(auth)/settings/two-factor.vue': {
          routes:
            | '/(auth)/settings/two-factor'
          views:
            | never
        }
        '(auth)/settings/verify-phone-number.vue': {
          routes:
            | '/(auth)/settings/verify-phone-number'
          views:
            | never
        }
      }"
    `)
  })

  it('works with children', () => {
    const tree = new PrefixTree(DEFAULT_OPTIONS)
    tree.insert('parent', 'src/pages/parent.vue')
    tree.insert('parent/child', 'src/pages/parent/child.vue')
    expect(formatExports(generateRouteFileInfoMap(tree, { root: '' })))
      .toMatchInlineSnapshot(`
        "export interface _RouteFileInfoMap {
          'src/pages/parent.vue': {
            routes:
              | '/parent'
              | '/parent/child'
            views:
              | 'default'
          }
          'src/pages/parent/child.vue': {
            routes:
              | '/parent/child'
            views:
              | never
          }
        }"
      `)
  })

  it('works with named views', () => {
    const tree = new PrefixTree(DEFAULT_OPTIONS)
    tree.insert('parent', 'src/pages/parent.vue')
    tree.insert('parent/child', 'src/pages/parent/child.vue')
    tree.insert('parent/child@test', 'src/pages/parent/child@test.vue')
    expect(formatExports(generateRouteFileInfoMap(tree, { root: '' })))
      .toMatchInlineSnapshot(`
        "export interface _RouteFileInfoMap {
          'src/pages/parent.vue': {
            routes:
              | '/parent'
              | '/parent/child'
            views:
              | 'default'
              | 'test'
          }
          'src/pages/parent/child.vue': {
            routes:
              | '/parent/child'
            views:
              | never
          }
          'src/pages/parent/child@test.vue': {
            routes:
              | '/parent/child'
            views:
              | never
          }
        }"
      `)
  })

  it('can reuse a component in different routes', () => {
    const tree = new PrefixTree(DEFAULT_OPTIONS)
    // same component, two different routes (different from an alias)
    tree.insert('', 'index.vue')
    tree.insert('home', 'index.vue')

    tree.insert('nested/path', 'nested/index.vue')
    tree.insert('unnested', 'nested/index.vue')

    expect(formatExports(generateRouteFileInfoMap(tree, { root: '' })))
      .toMatchInlineSnapshot(`
        "export interface _RouteFileInfoMap {
          'index.vue': {
            routes:
              | '/'
              | '/home'
            views:
              | never
          }
          'nested/index.vue': {
            routes:
              | '/nested/path'
              | '/unnested'
            views:
              | never
          }
        }"
      `)
  })

  it('does not contain routes without components', () => {
    const tree = new PrefixTree(DEFAULT_OPTIONS)
    tree.insert('optional/[[id]]', 'optional/[[id]].vue')
    tree.insert(
      'optional-repeatable/[[id]]+',
      'optional-repeatable/[[id]]+.vue'
    )
    tree.insert('repeatable/[id]+', 'repeatable/[id]+.vue')

    expect(formatExports(generateRouteFileInfoMap(tree, { root: '' })))
      .toMatchInlineSnapshot(`
        "export interface _RouteFileInfoMap {
          'optional/[[id]].vue': {
            routes:
              | '/optional/[[id]]'
            views:
              | never
          }
          'optional-repeatable/[[id]]+.vue': {
            routes:
              | '/optional-repeatable/[[id]]+'
            views:
              | never
          }
          'repeatable/[id]+.vue': {
            routes:
              | '/repeatable/[id]+'
            views:
              | never
          }
        }"
      `)
  })

  it('does not contain nested routes without components', () => {
    const tree = new PrefixTree(DEFAULT_OPTIONS)
    tree.insert('parent', 'parent.vue')
    tree.insert('parent/optional/[[id]]', 'parent/optional/[[id]].vue')
    tree.insert(
      'parent/optional-repeatable/[[id]]+',
      'parent/optional-repeatable/[[id]]+.vue'
    )
    tree.insert('parent/repeatable/[id]+', 'parent/repeatable/[id]+.vue')

    expect(formatExports(generateRouteFileInfoMap(tree, { root: '' })))
      .toMatchInlineSnapshot(`
        "export interface _RouteFileInfoMap {
          'parent.vue': {
            routes:
              | '/parent'
              | '/parent/optional-repeatable/[[id]]+'
              | '/parent/optional/[[id]]'
              | '/parent/repeatable/[id]+'
            views:
              | 'default'
          }
          'parent/optional/[[id]].vue': {
            routes:
              | '/parent/optional/[[id]]'
            views:
              | never
          }
          'parent/optional-repeatable/[[id]]+.vue': {
            routes:
              | '/parent/optional-repeatable/[[id]]+'
            views:
              | never
          }
          'parent/repeatable/[id]+.vue': {
            routes:
              | '/parent/repeatable/[id]+'
            views:
              | never
          }
        }"
      `)
  })

  it('escapes quoites in file paths', () => {
    const tree = new PrefixTree(DEFAULT_OPTIONS)
    tree.insert('path', "src/pages/it's fine.vue")

    expect(formatExports(generateRouteFileInfoMap(tree, { root: '' })))
      .toMatchInlineSnapshot(`
      "export interface _RouteFileInfoMap {
        'src/pages/it\\'s fine.vue': {
          routes:
            | '/path'
          views:
            | never
        }
      }"
    `)
  })
})
