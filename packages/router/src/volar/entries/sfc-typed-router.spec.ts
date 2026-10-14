import { describe, expect, it } from 'vitest'
import ts from 'typescript'
import { toString, type Segment } from 'muggle-string'
import plugin, { type SfcTypedRouterOptions } from './sfc-typed-router'

const ROOT_DIR = '/app'
const FILE_NAME = '/app/src/pages/users/sub-[first]-[second].vue'
// The type param the plugin injects, derived from the file path relative to rootDir.
const EXPECTED_TYPE_PARAM = `<import('vue-router/auto-routes')._RouteNamesForFilePath<'src/pages/users/sub-[first]-[second].vue'>>`

/**
 * Runs the plugin's `resolveEmbeddedCode` over a standalone `<script setup>`
 * body and returns the transformed virtual code. The AST and the muggle-string
 * segments are both built from `code` at offset 0 so their offsets align.
 */
function transform(
  code: string,
  {
    lang = 'ts',
    fileName = FILE_NAME,
    options = {},
  }: { lang?: string; fileName?: string; options?: SfcTypedRouterOptions } = {}
): string {
  const result = plugin({
    compilerOptions: { rootDir: ROOT_DIR },
    modules: { typescript: ts },
    config: { options: { rootDir: ROOT_DIR, ...options } },
  } as any)
  const instance = Array.isArray(result) ? result[0] : result

  const ast = ts.createSourceFile(
    fileName,
    code,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS
  )
  const content: Segment[] = [[code, fileName, 0]]
  const sfc = { scriptSetup: { ast, name: fileName, lang } }

  instance.resolveEmbeddedCode!(
    fileName,
    sfc as any,
    {
      id: 'script_ts',
      content,
    } as any
  )

  return toString(content)
}

describe('sfc-typed-router volar plugin', () => {
  it('narrows `typeof useRoute` in a type context', () => {
    const out = transform(`type R = ReturnType<typeof useRoute>`)
    expect(out).toBe(
      `type R = ReturnType<typeof useRoute${EXPECTED_TYPE_PARAM}>`
    )
  })

  it('leaves an explicit type argument untouched', () => {
    const code = `type R = ReturnType<typeof useRoute<'/about'>>`
    expect(transform(code)).toBe(code)
  })

  it('narrows the `useRoute()` call as well', () => {
    const out = transform(`const route = useRoute()`)
    expect(out).toBe(`const route = useRoute${EXPECTED_TYPE_PARAM}()`)
  })

  it('does not narrow `typeof useRoute` in a js script', () => {
    const code = `type R = ReturnType<typeof useRoute>`
    expect(transform(code, { lang: 'js' })).toBe(code)
  })

  it('injects the file path and the page component into `definePage()`', () => {
    const out = transform(`definePage({ props: true })`)
    expect(out).toBe(
      `definePage<'src/pages/users/sub-[first]-[second].vue', typeof import('./sub-[first]-[second].vue').default>({ props: true })`
    )
  })

  it('escapes quotes in the `definePage()` self import', () => {
    const out = transform(`definePage({})`, {
      fileName: `/app/src/pages/it's-fine.vue`,
    })
    expect(out).toBe(
      `definePage<'src/pages/it\\'s-fine.vue', typeof import('./it\\'s-fine.vue').default>({})`
    )
  })

  it('leaves `definePage()` with type arguments untouched', () => {
    const code = `definePage<'a.vue'>({})`
    expect(transform(code)).toBe(code)
  })

  describe('defineProps() with `props: true`', () => {
    const ROUTE_PROPS = `import('vue-router/experimental')._RoutePropsForFilePath<'src/pages/users/sub-[first]-[second].vue'>`

    /** Gets the `defineProps()` statement out of the transformed code. */
    function transformProps(
      code: string,
      opts?: Parameters<typeof transform>[1]
    ) {
      return transform(code, opts).split('\n')[0]
    }

    it('adds the route props as the type argument', () => {
      expect(
        transformProps(
          `const props = defineProps()\ndefinePage({ props: true })`
        )
      ).toBe(`const props = defineProps<${ROUTE_PROPS}>()`)
    })

    it('intersects the route props with an inline type argument', () => {
      expect(
        transformProps(
          `const props = defineProps<{ myProp: string; other: number }>()\ndefinePage({ props: true })`
        )
      ).toBe(
        `const props = defineProps<${ROUTE_PROPS} & ({ myProp: string; other: number })>()`
      )
    })

    it('intersects the route props with combined type references', () => {
      expect(
        transformProps(
          `const props = defineProps<A & Omit<B, 'c'> | C>()\ndefinePage({ props: true })`
        )
      ).toBe(
        `const props = defineProps<${ROUTE_PROPS} & (A & Omit<B, 'c'> | C)>()`
      )
    })

    it('works with withDefaults() and definePage() first', () => {
      expect(
        transform(
          `definePage({ props: true })\nconst props = withDefaults(defineProps<Props>(), { a: 1 })`
        ).split('\n')[1]
      ).toBe(
        `const props = withDefaults(defineProps<${ROUTE_PROPS} & (Props)>(), { a: 1 })`
      )
    })

    it('does nothing without `props: true`', () => {
      for (const code of [
        `const props = defineProps()\ndefinePage({ props: false })`,
        `const props = defineProps()\ndefinePage({ props: to => to.params })`,
        `const props = defineProps()\ndefinePage({})`,
        `const props = defineProps()`,
      ]) {
        expect(transformProps(code)).toBe(code.split('\n')[0])
      }
    })

    it('leaves runtime props declarations untouched', () => {
      expect(
        transformProps(
          `const props = defineProps(['a'])\ndefinePage({ props: true })`
        )
      ).toBe(`const props = defineProps(['a'])`)
    })

    it('does nothing with `typedDefineProps: false`', () => {
      const code = `const props = defineProps<{ a: string }>()\ndefinePage({ props: true })`
      expect(
        transformProps(code, { options: { typedDefineProps: false } })
      ).toBe(code.split('\n')[0])
    })

    it('does nothing in a js script', () => {
      const code = `const props = defineProps()\ndefinePage({ props: true })`
      expect(transform(code, { lang: 'js' })).toBe(code)
    })
  })
})
