import type { RouteLocationNormalized } from './typed-routes'
import type { Router, RouterOptions } from './router'
import { nextTick } from 'vue'

export function enableFocusManagement(router: Router) {
  // navigation-api router will handle this for us
  if (router.name !== 'legacy') {
    return
  }

  const { handleFocus, clearFocusTimeout } = createFocusManagementHandler()

  const unregisterBeforeEach = router.beforeEach(() => {
    clearFocusTimeout()
  })

  const unregister = router.afterEach(async to => {
    const focusManagement =
      to.meta.focusManagement ?? router.options.focusManagement

    // user wants manual focus
    if (focusManagement === false) return

    let selector = '[autofocus], body'

    if (focusManagement === true) {
      selector = '[autofocus],h1,main,body'
    } else if (
      typeof focusManagement === 'string' &&
      focusManagement.length > 0
    ) {
      selector = focusManagement
    }

    // ensure DOM is updated, enqueuing a microtask before handling focus
    await nextTick()

    handleFocus(selector)
  })

  return () => {
    clearFocusTimeout()
    unregisterBeforeEach()
    unregister()
  }
}

export function prepareFocusReset(
  to: RouteLocationNormalized,
  routerFocusManagement?: RouterOptions['focusManagement']
) {
  let focusReset: 'after-transition' | 'manual' = 'after-transition'
  let selector: string | undefined

  const focusManagement = to.meta.focusManagement ?? routerFocusManagement
  if (focusManagement === false) {
    focusReset = 'manual'
  }
  if (focusManagement === true) {
    focusReset = 'manual'
    selector = '[autofocus],h1,main,body'
  } else if (typeof focusManagement === 'string') {
    focusReset = 'manual'
    selector = focusManagement || '[autofocus],h1,main,body'
  }

  return [focusReset, selector] as const
}

export function createFocusManagementHandler() {
  let timeoutId: ReturnType<typeof setTimeout> | undefined

  return {
    handleFocus: (selector: string) => {
      clearTimeout(timeoutId)
      requestAnimationFrame(() => {
        timeoutId = handleFocusManagement(selector)
      })
    },
    clearFocusTimeout: () => {
      clearTimeout(timeoutId)
    },
  }
}

function handleFocusManagement(
  selector: string
): ReturnType<typeof setTimeout> {
  return setTimeout(() => {
    const target = document.querySelector<HTMLElement>(selector)
    if (!target) return
    target.focus({ preventScroll: true })
    if (document.activeElement === target) return
    // element has tabindex already, likely not focusable
    // because of some other reason, bail out
    if (target.hasAttribute('tabindex')) return
    const restoreTabindex = () => {
      target.removeAttribute('tabindex')
      target.removeEventListener('blur', restoreTabindex)
    }
    // temporarily make the target element focusable
    target.setAttribute('tabindex', '-1')
    target.addEventListener('blur', restoreTabindex)
    // try to focus again
    target.focus({ preventScroll: true })
    // remove tabindex and event listener if focus still not worked
    if (document.activeElement !== target) restoreTabindex()
  }, 150) // screen readers may need more time to react
}
