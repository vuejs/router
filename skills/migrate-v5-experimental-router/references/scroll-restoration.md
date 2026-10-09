# Phase 4: Scroll restoration

Goal: replace the deprecated `scrollBehavior` router option with the `ScrollRestoration` plugin and `useScrollRestoration()`. This works with the **stable** `createRouter()` and with `experimental_createRouter()`. You can do this phase alone.

Docs: `packages/docs/experimental/scroll-restoration.md`.

## How it works

- Components call `useScrollRestoration()`. Only registered components capture and restore. **The plugin alone does nothing**, but it still sets `history.scrollRestoration = 'manual'`.
- **Capture** runs in `router.afterEach` for the page you leave, and on `pagehide` / `visibilitychange`.
- **Restore** runs through `onRouteRendered()`: inside a `<RouterView>`, after the page mounts or updates, after `<Suspense>` resolves, and after an out-in `<Transition>` enters.
- Entries are saved in `sessionStorage` under `storageKeyPrefix + key` (default prefix `vue:scroll:`). They are saved per **key**, not per history entry. A new visit by link to the same key also restores.
- Default key: `to => to.path + to.hash`. The query is not in the key.
- `capture()` and `restore()` are synchronous. A returned promise is ignored.
- During SSR the plugin and the composable are no-ops.

## 1. Install the plugin

```ts
// main.ts
import {
  ScrollRestoration,
  SCROLL_RESTORATION_CAPTURE_DEFAULT,
  SCROLL_RESTORATION_RESTORE_DEFAULT,
} from 'vue-router/experimental'

app.use(ScrollRestoration, {
  router,
  capture: SCROLL_RESTORATION_CAPTURE_DEFAULT,
  restore: SCROLL_RESTORATION_RESTORE_DEFAULT,
  // key: to => to.path + to.hash, // default
  // storageKeyPrefix: 'vue:scroll:', // default
})
app.use(router) // after the plugin
```

> [!NOTE]
> The docs say `capture` and `restore` are optional, but the `ScrollRestorationPluginOptions` type makes them **required** and the runtime has no default for them. Always pass them. Report this conflict to the user if they ask.

What the defaults do:

- `SCROLL_RESTORATION_CAPTURE_DEFAULT`: saves `{ default: { left: scrollX, top: scrollY } }` (window only).
- `SCROLL_RESTORATION_RESTORE_DEFAULT(entry, to)`:
  1. A saved position: `window.scrollTo(position)`. With `el`, it scrolls to the element minus `top`/`left`.
  2. No saved entry and `to.hash`: scrolls to `getElementById(hash)`, with no offset.
  3. Otherwise: scrolls to the top.

## 2. Call `useScrollRestoration()`

Pick the place:

- No `<Transition>` between pages: call it once in each layout, or in each page.
- Pages in a `<Transition>` or with async content: call it in each page, so restore waits for the page.
- `App.vue` is outside every `<RouterView>`. There, `onRouteRendered()` runs in `afterEach`, **before** the new page renders. Prefer layouts or pages.

```vue
<script setup lang="ts">
import { useScrollRestoration } from 'vue-router/experimental'

useScrollRestoration()
</script>
```

`useScrollRestoration()` throws `R0044` in dev if the plugin is not installed. Two active calls with the same key and different functions warn `R0043`. Give them different keys.

It returns `{ scroll }`. With `manual: true`, call `scroll()` when the content is ready. The position is still captured automatically.

## 3. Remove `scrollBehavior`

Delete the option from the router. Nothing warns if both are set, and both run.

## 4. Translate `scrollBehavior` patterns

| Old `scrollBehavior`                                           | New setup                                                                      |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| `savedPosition \|\| { top: 0 }`                                | defaults                                                                       |
| `if (to.hash) return { el: to.hash }`                          | defaults                                                                       |
| `{ el: to.hash, behavior: 'smooth' }`                          | custom `restore`, see below                                                    |
| `{ el: to.hash, top: 80 }` (fixed header)                      | CSS `scroll-margin-top: 80px` + `scrollIntoView()`, or `{ el, top: 80 }` entry |
| `return new Promise(r => setTimeout(() => r(pos), 300))`       | `useScrollRestoration({ manual: true })` + `scroll()` after the delay          |
| wait for a `<Transition>`                                      | call `useScrollRestoration()` in the page, `onRouteRendered()` waits           |
| `if (to.path === from.path) return false` (only query changed) | defaults. The key ignores the query, so the position stays.                    |
| scroll a container, not the window                             | custom `capture`/`restore` with a named entry                                  |
| `return false` for some pages                                  | do not call `useScrollRestoration()` in those pages                            |

### Smooth scroll to the hash

```ts
app.use(ScrollRestoration, {
  router,
  capture: SCROLL_RESTORATION_CAPTURE_DEFAULT,
  restore: (entry, to) =>
    SCROLL_RESTORATION_RESTORE_DEFAULT(
      entry ??
        (to.hash ? { default: { el: to.hash, behavior: 'smooth' } } : null),
      to
    ),
})
```

An `el` that starts with `#` uses `getElementById()`. Other values use `querySelector()`. Build selectors with `` `#${CSS.escape(id)}` ``. The hash in the experimental router is encoded, so `decodeURIComponent()` it if ids have special characters.

### Different position per query

```ts
// pages/search.vue
useScrollRestoration({
  key: to => to.path + `?p=${to.query.p?.[0]}` + to.hash,
})
```

Other keys: `to => to.path` (one entry for all hashes), `to => to.fullPath` (one entry per URL), `'products'` (shared by several pages).

### Several scroll containers

```vue
<script setup lang="ts">
import { useTemplateRef } from 'vue'
import { useScrollRestoration } from 'vue-router/experimental'

const sidebar = useTemplateRef('sidebar')

useScrollRestoration({
  capture: () => ({
    default: { top: window.scrollY },
    sidebar: { top: sidebar.value?.scrollTop },
  }),
  restore: entry => {
    window.scrollTo({ top: entry?.default?.top ?? 0 })
    if (sidebar.value) sidebar.value.scrollTop = entry?.sidebar?.top ?? 0
  },
})
</script>
```

Return `null` from `capture()` to delete the entry.

### Async content

```ts
const { scroll } = useScrollRestoration({ manual: true })

onMounted(async () => {
  posts.value = await fetchPosts()
  await nextTick()
  scroll()
})
```

## 5. `onRouteRendered()`

`onRouteRendered((to, from) => {})` runs after the closest `<RouterView>` shows the new route. Use it for other "after render" work (focus management, analytics). Call it in `setup()`. It pauses inside a deactivated `<KeepAlive>` and is a no-op during SSR. It also works with the stable router.

## 6. Check phase 4

- Scroll down, go to another page, go back: the position is restored.
- Open a link with a hash: the page scrolls to the element.
- Open a new page: the page starts at the top.
- No `R0040`, `R0041`, `R0042`, `R0043`, or `R0044` in the console.
