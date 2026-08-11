import { describe, expect, it } from 'vitest'
import ts from 'typescript'
import { toString, type Segment } from 'muggle-string'
import plugin from './sfc-typed-router'

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
  { lang = 'ts', fileName = FILE_NAME } = {}
): string {
  const result = plugin({
    compilerOptions: { rootDir: ROOT_DIR },
    modules: { typescript: ts },
    config: { options: { rootDir: ROOT_DIR } },
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
})
