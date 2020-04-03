function createScrollWaiter() {
  let resolve: (() => void) | undefined
  let promise: Promise<any> | undefined

  function add() {
    promise = new Promise(r => {
      resolve = resolve
    })
  }

  function flush() {
    resolve && resolve()
    resolve = undefined
    promise = undefined
  }

  const waiter = {
    promise,
    add,
    flush,
  }

  Object.defineProperty(waiter, 'promise', {
    get: () => promise,
  })

  return waiter
}

export const scrollWaiter = createScrollWaiter()
