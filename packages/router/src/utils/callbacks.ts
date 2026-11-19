/**
 * Create a list of callbacks that can be reset. Used to create before and after navigation guards list
 */
export function useCallbacks<T>() {
  let handlers: { handler: T }[] = []

  function add(handler: T): () => void {
    const entry = { handler }
    handlers.push(entry)
    return () => {
      const i = handlers.indexOf(entry)
      if (i > -1) handlers.splice(i, 1)
    }
  }

  function reset() {
    handlers = []
  }

  return {
    add,
    list: () => handlers.map(entry => entry.handler),
    reset,
  }
}
