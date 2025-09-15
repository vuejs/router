import type { Router } from './router'
import type { RouterApiOptions } from './navigation-api'
import type { RouterViewTransition, TransitionMode } from './transition'
import { createNavigationApiRouter } from './navigation-api'
import { isBrowser } from './utils'

export interface ClientRouterOptions {
  /**
   * Factory function that creates a legacy router instance.
   * Typically: () => createRouter({ history: createWebHistory(), routes })
   */
  legacy: {
    factory: (transitionMode: TransitionMode) => Router
  }
  /**
   * Options for the new Navigation API based router.
   * If provided and the browser supports it, this will be used.
   */
  navigationApi?: {
    options: RouterApiOptions
  }
  /**
   * Enable native View Transitions.
   */
  viewTransition?: true | RouterViewTransition
}

export function createClientRouter(options: ClientRouterOptions): Router {
  let transitionMode: TransitionMode = 'auto'

  if (
    options?.viewTransition &&
    typeof document !== 'undefined' &&
    document.startViewTransition
  ) {
    transitionMode = 'view-transition'
  }

  const useNavigationApi =
    options.navigationApi && isBrowser && window.navigation

  if (useNavigationApi) {
    return createNavigationApiRouter(
      options.navigationApi!.options,
      transitionMode
    )
  } else {
    return options.legacy.factory(transitionMode)
  }
}
