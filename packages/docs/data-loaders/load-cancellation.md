# Cancelling a data loader

Data loaders receive an [`AbortSignal`](https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal) that can be passed to `fetch` and other Web APIs to cancel ongoing requests when the navigation is cancelled. If the navigation is cancelled because of errors or a new navigation, the signal aborts, causing any request using it to abort as well.

```ts twoslash
interface Book {
  title: string
  isbn: string
  description: string
}
function fetchBookCollection(options: {
  signal?: AbortSignal
}): Promise<Book[]> {
  return {} as any
}
// ---cut---
import { defineBasicLoader } from 'vue-router/experimental'
export const useBookCollection = defineBasicLoader(
  async (_route, { signal }) => {
    return fetchBookCollection({ signal })
  }
)
```

This aligns with the future [Navigation API](https://github.com/WICG/navigation-api#navigation-monitoring-and-interception) and other web APIs that use the `AbortSignal` to cancel an ongoing invocation.

## Best practices

Depending on the data loader implementation, it might be more interesting **not** to cancel an ongoing request, for example, when using [Pinia Colada](./colada/), it might be more interesting to keep the request ongoing and cache the result for future navigations. Make sure to read the documentation
