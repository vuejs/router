import { inject } from 'vue'
import { idKey, idValue } from './injectionSymbols'
import { warn } from './warning'

let warned = false

/**
 * @internal
 */
export function warnDuplicatePackage() {
  if (__DEV__) {
    const id = inject(idKey, null)
    if (id != null && id !== idValue && !warned) {
      warned = true
      warn('There are two versions/copies of vue-router.')
    }
  }
}
