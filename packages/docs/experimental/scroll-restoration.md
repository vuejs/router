# Scroll Restoration

::: warning Experimental
This API is experimental and might have breaking changes. It replaces the deprecated `scrollBehavior` option.
:::

The `ScrollRestoration` + `useScrollRestoration()` plugin saves and restores scroll positions for pages.

With it, you can:

- Save multiple positions from any component
- Use custom capture and restore functions, for example with `scrollIntoView()`
- Control which pages share scroll restoration

[[toc]]

## Setup

Install `ScrollRestoration` before the router. Give it the router and the default `capture` and `restore` functions. These three options are required:

```ts [main.ts]
import { createApp } from 'vue'
import {
  ScrollRestoration,
  SCROLL_RESTORATION_CAPTURE_DEFAULT,
  SCROLL_RESTORATION_RESTORE_DEFAULT,
} from 'vue-router/experimental'
import App from './App.vue'
import { router } from './router'

const app = createApp(App)

app.use(ScrollRestoration, {
  router,
  capture: SCROLL_RESTORATION_CAPTURE_DEFAULT,
  restore: SCROLL_RESTORATION_RESTORE_DEFAULT,
  // optional, these are the default values
  // key: to => to.path + to.hash,
  // storageKeyPrefix: 'vue:scroll:',
})
app.use(router)

app.mount('#app')
```

The plugin saves positions in `sessionStorage`, with keys that start with `storageKeyPrefix`. Saved positions stay after a page reload in the same tab.

The default `capture` and `restore` functions do these steps:

- Save the window scroll position when you leave a page
- If a position is saved, restore it
- Else, scroll to the element with the id in the hash, if it exists
- Else, scroll to the top of the page

The plugin alone does not capture or restore positions. At least one component must call [`useScrollRestoration()`](#useScrollRestoration).

Note that the `key` determines which pages share a saved position. By default, going from `/search?q=shoes` to `/search?q=shoes&p=2` will not scroll to the top, because both pages share the same key: `/search` and therefore reuse the saved position. You can change this in the search page only. The other pages keep the default behavior:

```ts [pages/Search.vue]
import { useScrollRestoration } from 'vue-router/experimental'

useScrollRestoration({
  key: to => to.path + `?p=${to.query.p ?? ''}` + to.hash,
})
```

Installing the plugin sets `history.scrollRestoration` to `manual`. Setting it to `auto` can conflict with scroll restoration, especially for anchor links. Set it back to `auto` if this is not an issue for you. When it is not `manual`, the default `capture` function saves nothing and lets the browser restore the scroll.

## `useScrollRestoration()` %{#useScrollRestoration}%

`useScrollRestoration()` uses `onRouteRendered()` to restore the scroll after each navigation. Call it in a component inside a `<RouterView>`, like a layout or a page component. The restore then runs when the closest `<RouterView>` shows the new route: after the page mounts or updates, after `<Suspense>` resolves, and after an out-in `<Transition>` enters.

Do not call it in your root `App.vue` or in other components outside of a `<RouterView>`. There, `onRouteRendered()` runs in `router.afterEach()`, before the new route renders, so the restore runs on the old page.

Outside of a `<RouterView>`, `onRouteRendered()` is also not called for the initial navigation if you mount the app after `router.isReady()`, so the scroll is not restored after a page reload. If such a component must restore its position, for example a sidebar with its own scroll container, call the returned `scroll()` once it is mounted:

```vue [components/AppSidebar.vue]
<script setup lang="ts">
import { onMounted, useTemplateRef } from 'vue'
import { useScrollRestoration } from 'vue-router/experimental'

const sidebar = useTemplateRef('sidebar')
const { scroll } = useScrollRestoration({
  key: 'sidebar',
  capture: () => ({ sidebar: { top: sidebar.value?.scrollTop } }),
  restore: entry => {
    sidebar.value?.scrollTo({ top: entry?.sidebar?.top ?? 0 })
  },
})

// the initial navigation finished before this component was created
onMounted(scroll)
</script>

<template>
  <nav ref="sidebar">...</nav>
</template>
```

A layout component lets you call it once for all of its child pages. A page can call it again to use different options, for example `manual: true` to wait for an animation. When a page call and a layout call use the same key, the page call replaces the layout call: only the page captures and restores the position.

## Migrating from `scrollBehavior` %{#migrating-from-scrollbehavior}%

1. Remove `scrollBehavior` from the router options.
2. Install `ScrollRestoration` before the router, as shown in [Setup](#Setup).
3. Call `useScrollRestoration()` in your layout components. If you have no layouts, call it in each page component that needs to restore its scroll position. Do not call it in your root `App.vue`, see [`useScrollRestoration()`](#useScrollRestoration).
4. Adapt the `capture` and `restore` functions to your needs, especially if you had a custom `scrollBehavior` function that doesn't match the default behavior.

## Restore scroll

Call `useScrollRestoration()` in any page component that needs to restore its scroll position:

```vue [pages/Articles.vue]
<script setup lang="ts">
import { useScrollRestoration } from 'vue-router/experimental'

useScrollRestoration()
</script>
```

By default, the router _captures_ the position **when you leave the page**, and when the browser tab becomes hidden. It _restores_ the position after a navigation, when the page is rendered. It uses `onRouteRendered()` under the hood.

## Capture events

By default, the plugin captures positions after each successful navigation, on `pagehide`, and when the document becomes hidden. Navigation captures use the route you leave. When the browser creates the history entry itself (for example with a native `<a href="#target">` link), it already scrolled, so the plugin captures the new route instead.

Use `setupListeners(capture, signal, router)` to replace all default capture triggers, including navigation. The supplied `capture(route?)` saves all active scroll registrations for the given route. If you omit the route, it uses `router.currentRoute.value`.

For example, capture on scroll:

```ts
app.use(ScrollRestoration, {
  router,
  capture: SCROLL_RESTORATION_CAPTURE_DEFAULT,
  restore: SCROLL_RESTORATION_RESTORE_DEFAULT,
  setupListeners(capture, signal) {
    window.addEventListener('scroll', () => capture(), { signal })
  },
})
```

Pass `signal` to your listeners so they are removed when the app is unmounted. Wrap DOM callbacks with `() => capture()` so the event is not passed as the route. You can listen to your own event instead, or save the supplied `capture` function and call it manually. To disable all automatic capture, use `setupListeners: () => {}`.

To keep the default events and add your own, call `SCROLL_RESTORATION_SETUP_LISTENERS_DEFAULT`:

```ts
import { SCROLL_RESTORATION_SETUP_LISTENERS_DEFAULT } from 'vue-router/experimental'

app.use(ScrollRestoration, {
  router,
  capture: SCROLL_RESTORATION_CAPTURE_DEFAULT,
  restore: SCROLL_RESTORATION_RESTORE_DEFAULT,
  setupListeners(capture, signal, router) {
    SCROLL_RESTORATION_SETUP_LISTENERS_DEFAULT(capture, signal, router)
    window.addEventListener('save-scroll', () => capture(), { signal })
  },
})
```

A [`scroll` event cannot be canceled](https://developer.chrome.com/blog/passive-event-listeners), so `passive: true` does not improve scroll performance. Each capture calls all active capture functions and writes to `sessionStorage` synchronously. For frequent events, throttle captures and use the signal to cancel pending work on unmount.

## Multiple positions

In `capture`, use `default` for the main position and add other keys for other scroll containers:

```vue [pages/Docs.vue]
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
    // scroll to top if no entry is found (new visit)
    window.scrollTo({ top: entry?.default?.top ?? 0 })
    sidebar.value!.scrollTop = entry?.sidebar?.top ?? 0
  },
})
</script>

<template>
  <aside ref="sidebar">...</aside>
  <main>...</main>
</template>
```

`capture()` and `restore()` must be synchronous.

## Custom restore

Inside of a custom restore you can use any method you want to scroll, like `scrollIntoView()` or `scrollTo()`. You can also use a saved offset to scroll a bit above the element.

You can save an element selector and scroll to it with a saved offset:

```vue [pages/Products.vue]
<script setup lang="ts">
import { ref } from 'vue'
import { useScrollRestoration } from 'vue-router/experimental'

const selectedId = ref<string>()

useScrollRestoration({
  capture: () =>
    selectedId.value
      ? {
          default: {
            el: `#${CSS.escape(selectedId.value)}`,
            // here you can add an offset to scroll a bit above the element
            top: 100,
          },
        }
      : null,
  restore: entry => {
    if (!entry?.default?.el) return

    const element = document.querySelector(entry.default.el)
    if (!element) return

    window.scrollTo({
      top:
        element.getBoundingClientRect().top +
        window.scrollY -
        (entry.default.top ?? 0),
    })
  },
})
</script>
```

:::tip

Rely on `scroll-margin` in CSS instead of `el` + `top` to scroll a bit above an element. It is simpler and works with `scrollIntoView()`.

:::

Return `null` from `capture()` to remove the saved entry.

## Keys

By default, the key is `to.path + to.hash`. The same path and hash always use the same saved entry, including a new visit from a link. For example, if the user navigates to `/articles/42#comments`, scrolls down, and then navigates to `/articles/43`, navigating back **or** navigating directly again to `/articles/42#comments` will restore the previous position.

Use a different key when pages must share or split entries:

```ts
// same position for all hashes on a page
useScrollRestoration({
  key: to => to.path,
})

// different positions for different queries
useScrollRestoration({
  key: to => to.fullPath,
})

// same position for different pages
useScrollRestoration({
  key: 'products',
})
```

A nested call with the same key replaces the calls of its parent components, see [`useScrollRestoration()`](#useScrollRestoration). Other components that are active at the same time, like two sibling components, must use different keys, one for each scroll container. With the same key, they all capture and restore, and the last capture replaces the others.

## Navigation and history entries

The callbacks also receive a `ScrollRestorationContext`: `key(route, context)`, `capture(context)`, and `restore(entry, to, context)`. Existing callbacks can continue to omit the extra argument.

| Field             | Meaning                                                                        |
| ----------------- | ------------------------------------------------------------------------------ |
| `type`            | The committed operation: `initial`, `push`, `replace`, or `pop`.               |
| `direction`       | `back` or `forward` for a known traversal direction, otherwise `''`.           |
| `delta`           | The distance traveled for `pop`, otherwise `0`.                                |
| `historyPosition` | The router-maintained stack position for the entry being captured or restored. |
| `route`           | The route whose scroll position is being captured or restored.                 |
| `from`, `to`      | The routes left and entered by this navigation.                                |

The route fields are snapshots containing `path`, `fullPath`, `name`, `hash`, `params`, and `query`. They do not include history state, matched component instances, or navigation options. Failed, cancelled, and duplicated navigations do not replace the last successful context. Redirects describe the final committed operation and destination.

During navigation capture, `route` and `historyPosition` refer to the **departing** entry, even though `history.state` already belongs to the destination. During restoration, they refer to the **target** entry. Capture outside navigation (for example, on `pagehide` or through a custom listener) uses the current entry and its last successful navigation. The returned `scroll()` also uses the current route's context, so `manual: true` can wait for content to become ready.

For example, opt in to separate positions for history entries and start new links at the top:

```ts
import {
  useScrollRestoration,
  SCROLL_RESTORATION_CAPTURE_DEFAULT,
  SCROLL_RESTORATION_RESTORE_DEFAULT,
} from 'vue-router/experimental'

useScrollRestoration({
  key: (route, context) =>
    `${route.path}${route.hash}:${context.historyPosition ?? 'custom'}`,
  capture: SCROLL_RESTORATION_CAPTURE_DEFAULT,
  restore(entry, to, context) {
    SCROLL_RESTORATION_RESTORE_DEFAULT(
      context.type === 'push' || context.type === 'replace' ? null : entry,
      to
    )
  },
})
```

Built-in memory, web, and hash histories supply `historyPosition`. Web and hash histories preserve it on reload; memory positions only last for that history instance. Custom histories report `undefined`, so the example falls back to sharing positions by path and hash for them. A position is a stack slot, **not a unique entry ID**: replace preserves it and discarding the forward branch can reuse it. Browser-created entries (such as native fragment navigations) can have an unknown direction and reuse a router-maintained position. Use `type` when deciding whether a new visit should reuse a saved position.

`initial` covers starting the router, including a page reload; it does not distinguish reload from a fresh document load. The default path-based key and restore policy are unchanged. For delayed tables or virtual lists, continue using `manual: true` and call `scroll()` when the application is ready; this context does not add retries or content polling.

## Manual restore

Set `manual: true` when the content is not ready after navigation, like animations or virtualized lists. Then call `scroll()` when the content is displayed:

```vue [pages/Feed.vue]
<script setup lang="ts">
import { nextTick, onMounted, ref } from 'vue'
import { useScrollRestoration } from 'vue-router/experimental'

const posts = ref<Post[]>([])
const { scroll } = useScrollRestoration({ manual: true })

onMounted(async () => {
  posts.value = await fetchPosts()
  await nextTick()
  scroll()
})
</script>
```

With the default `setupListeners`, the router still captures the position automatically.
