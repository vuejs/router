import '../guards-instances/index'

const URL_START = `${location.protocol}//${location.host}`

function cleanUrl(url: string | null | undefined): string {
  return url ? url.slice(URL_START.length) : '<empty>'
}

const delay = (time: number) =>
  new Promise(resolve => setTimeout(resolve, time))

navigation.addEventListener('navigate', event => {
  console.table({
    id: event.destination.id,
    key: event.destination.key,
    type: event.navigationType,
    info: event.info,
    url: event.destination.url,
    state: event.destination.getState(),
    cancelable: event.cancelable,
  })

  console.log(
    `🧭 ${cleanUrl(navigation.currentEntry?.url)} -> ${cleanUrl(event.destination.url)}`
  )

  if (!event.canIntercept) {
    console.warn('Cannot intercept navigation event', event)
    return
  }

  if (event.downloadRequest) {
    console.warn('Navigation event has download request', event)
    return
  }

  if (navigation.transition) {
    console.log('🚗 pending navigation from', navigation.transition.from.url)
  }

  const url = new URL(event.destination.url)

  event.intercept({
    async handler() {
      const delayTime = Number(url.searchParams.get('delay')) || 1000
      console.log('🐢 navigating with delay of', delayTime, 'ms')
      await delay(delayTime)
      console.log('🐢 ✅')
      console.log('Is aborted?', event.signal.aborted)

      if (url.searchParams.has('cancel')) {
        event.preventDefault()
        return
      }

      if (url.searchParams.has('throw')) {
        throw new Error('Navigation aborted')
      }
    },

    focusReset: 'after-transition',
    scroll: 'after-transition',
  })
})
