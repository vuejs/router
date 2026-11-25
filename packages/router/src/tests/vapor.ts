import * as Vue from 'vue'
import * as VueServerRenderer from '@vue/server-renderer'
import { compileScript, compileTemplate, parse } from '@vue/compiler-sfc'

/**
 * Compiles a template to a Vapor render function, like the runtime compiler
 * of the full build does for VDOM components.
 */
export function compileVapor(source: string): (...args: any[]) => any {
  const { code, errors } = compileTemplate({
    source,
    filename: 'test.vue',
    id: 'test',
    vapor: true,
  })
  if (errors.length) throw errors[0]
  return new Function(
    'Vue',
    code
      .replace(
        /^import \{(.*)\} from ['"]vue['"];?$/m,
        (_, names: string) => `const {${names.replace(/ as /g, ': ')}} = Vue`
      )
      .replace(/export function render/, 'return function render')
  )(Vue)
}

const toDestructuring = (names: string) => names.replace(/ as /g, ': ')

/**
 * Compiles a Vapor SFC like a bundler does: for the client, or with `ssr` for
 * the server, where its `ssrRender` writes the markers that hydration reads.
 * The SFC can only import from `vue`.
 */
export function compileVaporSFC(source: string, ssr = false): any {
  const { descriptor, errors } = parse(source)
  if (errors.length) throw errors[0]
  const { content } = compileScript(descriptor, {
    id: 'test',
    inlineTemplate: true,
    genDefaultAs: '__sfc__',
    vapor: true,
    templateOptions: { ssr },
  })
  return new Function(
    'Vue',
    'VueServerRenderer',
    content
      .replace(
        /^import \{(.*)\} from ['"]vue\/server-renderer['"];?$/gm,
        (_, names: string) =>
          `const {${toDestructuring(names)}} = VueServerRenderer`
      )
      .replace(
        /^import \{(.*)\} from ['"]vue['"];?$/gm,
        (_, names: string) => `const {${toDestructuring(names)}} = Vue`
      ) + '\nreturn __sfc__'
  )(Vue, VueServerRenderer)
}
