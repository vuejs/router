import type { ComponentPublicInstance } from 'vue'
import { createApp, nextTick } from 'vue'

declare global {
  interface NavigationTransition {
    readonly to: NavigationDestination
  }
}

const URL_START = `${location.protocol}//${location.host}`

function cleanUrl(url: string | null | undefined): string {
  return url ? url.slice(URL_START.length) : '<empty>'
}

function currentPath(): string {
  return location.pathname + location.search
}

function isNavigationApiPath(url: string): boolean {
  const { pathname } = new URL(url)
  return (
    pathname.startsWith('/navigation-api') &&
    pathname !== '/navigation-api/guards-instances.html'
  )
}

const delay = (time: number) =>
  new Promise(resolve => setTimeout(resolve, time))

const app = createApp({
  data: () => ({ path: currentPath() }),
})

const vm = app.mount('#app') as ComponentPublicInstance & { path: string }

navigation.addEventListener('currententrychange', event => {
  console.log('📦 current entry changed', event)
  document.startViewTransition(async () => {
    vm.path = currentPath()
    await nextTick()
  })
})

navigation.addEventListener('navigatesuccess', event => {
  console.log('✅ navigation success', event)
})

navigation.addEventListener('navigateerror', event => {
  console.log('💥 navigation error', event)
})

navigation.addEventListener('navigate', event => {
  if (!isNavigationApiPath(event.destination.url)) {
    return
  }

  console.log('🧭 navigate event', event)
  console.table({
    id: event.destination.id,
    index: event.destination.index,
    key: event.destination.key,
    type: event.navigationType,
    info: event.info,
    url: event.destination.url,
    state: event.destination.getState(),
    cancelable: event.cancelable,
  })

  let delta = 0

  if (!event.canIntercept) {
    console.warn('Cannot intercept navigation event', event)
    return
  }

  if (event.downloadRequest) {
    console.warn('Navigation event has download request', event)
    return
  }

  console.log(
    `🧭 ${cleanUrl(navigation.currentEntry?.url)} -> ${cleanUrl(event.destination.url)}`
  )

  if (navigation.transition) {
    console.log('🚗 pending navigation from', navigation.transition.from.url)
  }

  const url = new URL(event.destination.url)

  if (url.searchParams.has('no-commit')) {
    event.preventDefault()
  }

  const focusResetParam = url.searchParams.get('focusReset')
  const focusReset =
    focusResetParam === 'after-transition' || focusResetParam === 'manual'
      ? focusResetParam
      : undefined

  const scrollParam = url.searchParams.get('scroll')
  const scroll =
    scrollParam === 'after-transition' || scrollParam === 'manual'
      ? scrollParam
      : undefined

  event.intercept({
    async handler() {
      return
      const transition = navigation.transition!
      console.log(
        '🚆 transition',
        navigation.transition,
        transition?.to === event.destination
      )

      if (transition) {
        delta = event.destination.index - transition.from.index
      }
      console.log('𝚫', delta)

      const delayTime = Number(url.searchParams.get('delay')) || 1000
      if (scrollParam === 'manual') {
        event.scroll()
      }
      console.log('🐢 navigating with delay of', delayTime, 'ms')
      await delay(delayTime)
      console.log('🐢 ✅')
      console.log('Is aborted?', event.signal.aborted)

      if (url.searchParams.has('cancel')) {
        console.log('❌ cancel')
        event.preventDefault()
        if (transition) {
          navigation.traverseTo(transition.from.key, {
            info: { internal: true },
          })
        } else {
          console.warn('No transition to traverse back to', event)
        }
        return
      }

      if (url.searchParams.has('throw')) {
        throw new Error('Navigation aborted')
      }
    },

    async precommitHandler(controller) {
      const transition = navigation.transition
      console.log(
        '🚆 transition',
        navigation.transition,
        transition?.to === event.destination
      )

      if (transition) {
        delta = event.destination.index - transition.from.index
      }
      console.log('𝚫', delta)

      const delayTime = Number(url.searchParams.get('delay')) || 1000
      if (scrollParam === 'manual') {
        event.scroll()
      }
      console.log('🐢 navigating with delay of', delayTime, 'ms')
      await delay(delayTime)
      console.log('🐢 ✅')
      console.log('Is aborted?', event.signal.aborted)

      if (url.searchParams.has('r_count')) {
        const redirectCount = Number(url.searchParams.get('r_count')) || 0
        const newUrl = new URL(url)
        newUrl.searchParams.set('r_count', String(redirectCount + 1))
        const options: NavigationNavigateOptions = {
          info: event.info,
          state: event.destination.getState(),
        }

        if (
          event.navigationType === 'traverse' ||
          event.navigationType === 'reload'
        ) {
          options.history = 'replace'
          event.preventDefault()
          await navigation.navigate(newUrl, options).committed
          return
        }

        controller.redirect(newUrl, options)
        return
      }

      if (url.searchParams.has('cancel')) {
        console.log('❌ cancel')
        if (transition?.from.url) {
          controller.redirect(transition.from.url, {
            info: event.info,
            state: event.destination.getState(),
          })
        } else {
          console.warn('No transition to traverse back to', event)
        }
        return
      }

      if (url.searchParams.has('throw')) {
        throw new Error('Navigation aborted')
      }
    },

    focusReset,
    scroll,
  })
})

navigation.addEventListener('navigate', event => {
  console.log(`🏊 ${event.destination.url}`)
  if (!event.canIntercept || !isNavigationApiPath(event.destination.url)) {
    return
  }

  event.intercept({
    async handler() {
      console.log('I also need to do stuff')
      await delay(500)
      event.signal.throwIfAborted()
    },
  })
})

document.addEventListener('click', event => {
  if (event.target instanceof HTMLAnchorElement) {
    console.log('🖱️ clicked on link', event.target.href)
    setTimeout(() => {
      console.log('🚆 transition', navigation.transition)
    }, 0)
  }
})
