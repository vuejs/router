import type { InjectionKey } from 'vue'
import { inject } from 'vue'

export type TransitionMode = 'auto' | 'view-transition'

export const transitionModeKey: InjectionKey<TransitionMode> = Symbol(
  'vue-router-transition-mode'
)

export function injectTransitionMode(): TransitionMode {
  return inject(transitionModeKey, 'auto')
}

export interface RouterViewTransition {
  defaultViewTransition?: boolean | 'always'
  /** Hook called right after the view transition starts */
  onStart?: (transition: ViewTransition) => void
  /** Hook called when the view transition animation is finished */
  onFinished?: (transition: ViewTransition) => void
  /** Hook called if the transition is aborted */
  onAborted?: (transition: ViewTransition) => void
}
