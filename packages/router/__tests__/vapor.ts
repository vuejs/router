import * as Vue from 'vue'
import * as ServerRenderer from '@vue/server-renderer'
import { compileTemplate } from '@vue/compiler-sfc'

/**
 * Compiles a template to a Vapor render function, like the runtime compiler
 * of the full build does for VDOM components. With `ssr`, compiles it to an
 * `ssrRender` function instead.
 */
export function compileVapor(
  source: string,
  ssr = false
): (...args: any[]) => any {
  const { code, errors } = compileTemplate({
    source,
    filename: 'test.vue',
    id: 'test',
    vapor: !ssr,
    ssr,
    ssrCssVars: [],
  })
  if (errors.length) throw errors[0]
  const toDestructuring = (names: string) => `{${names.replace(/ as /g, ': ')}}`
  return new Function(
    'Vue',
    'ServerRenderer',
    code
      .replace(
        /^import \{(.*)\} from ['"]vue\/server-renderer['"]/m,
        (_, names: string) => `const ${toDestructuring(names)} = ServerRenderer`
      )
      .replace(
        /^import \{(.*)\} from ['"]vue['"]/m,
        (_, names: string) => `const ${toDestructuring(names)} = Vue`
      )
      .replace(/export function (ssrRender|render)/, 'return function $1')
  )(Vue, ServerRenderer)
}
