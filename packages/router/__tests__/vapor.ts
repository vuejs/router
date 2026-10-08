import * as Vue from 'vue'
import { compileTemplate } from '@vue/compiler-sfc'

/**
 * Compiles a template to a Vapor render function, like the runtime compiler
 * of the full build does for VDOM components.
 */
export function compileVapor(source: string): (...args: any[]) => Vue.Block {
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
        /^import \{(.*)\} from 'vue'/m,
        (_, names: string) => `const {${names.replace(/ as /g, ': ')}} = Vue`
      )
      .replace('export function render', 'return function render')
  )(Vue)
}
