import { isBrowser } from '../utils'
import { useRouter } from '../useApi'
import { computed } from 'vue'
import { HistoryState } from './common'

/**
 * Reactive history state. Only available in browser.
 *
 * @experimental - DO NOT use in production
 */
export function useHistoryState<T = HistoryState>() {
  const router = useRouter()
  return computed<Readonly<T>>(() => {
    if (!isBrowser) {
      return {}
    }

    // Enforce automatically update when navigation happens
    router.currentRoute.value
    return window.history.state
  })
}
