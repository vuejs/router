import type { InjectionKey } from 'vue'
import { inject } from 'vue'

export type TransitionMode = 'auto' | 'view-transition'

export const transitionModeKey = Symbol(
  __DEV__ ? 'transition mode' : ''
) as InjectionKey<TransitionMode>

export function injectTransitionMode(): TransitionMode {
  return inject(transitionModeKey, 'auto')
}

export type RouteViewTransitionHook = (
  transition: ViewTransition
) => void | Promise<void>

export interface RouterViewTransition {
  defaultViewTransition?: boolean | 'always'
  /** Hook called right after the view transition starts */
  onStart?: RouteViewTransitionHook
  /** Hook called when the view transition animation is finished */
  onFinished?: RouteViewTransitionHook
  /** Hook called if the transition is aborted */
  onAborted?: RouteViewTransitionHook
}
