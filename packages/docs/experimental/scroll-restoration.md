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

Install `ScrollRestoration` before the router. Give it the router, and the capture and restore functions:

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
  // default value, not needed
  // key: to => to.path + to.hash,
  capture: SCROLL_RESTORATION_CAPTURE_DEFAULT,
  restore: SCROLL_RESTORATION_RESTORE_DEFAULT,
})
app.use(router)

app.mount('#app')
```

The default functions capture and restore enable:

- Save the window scroll position when leaving a page
- If a position is saved, restore it
- Else, scroll to an element specified by the hash, if it exists
- Else, scroll to the top of the page

Note that the `key` determines which pages share a saved position. By default, going from `/search?q=shoes` to `/search?q=shoes&p=2` will not scroll to the top, because both pages share the same key: `/search` and therefore reuse the saved position. You can customize this in the search page only, leaving the behavior default the same for other pages:

```ts [pages/Search.vue]
import { useScrollRestoration } from 'vue-router/experimental'

useScrollRestoration({
  key: to => to.path + `?p=${to.query.p?.[0]}` + to.hash,
})
```

Installing the plugin sets `history.scrollRestoration` to `manual`. Setting it to `auto` can conflict with scroll restoration, especially for anchor links. Set it back to `auto` if this is not an issue for you.

## `useScrollRestoration()`

The new `useScrollRestoration()` uses `onRouteRendered()` and triggers restoration after mounting or updating a page component. It can be called only once, in your root `App.vue`, if you have no animations between navigations. But you also have the freedom to call it in specific pages where scrolling requires waiting for animations to wait or if they are wrapped into a transition.

## Migrating from `scrollBehavior` {#migrating-from-scrollbehavior}

1. Remove `scrollBehavior` from the router options.
2. Install `ScrollRestoration` before the router, as shown in [Setup](#setup).
3. If you have no `<Transition>` between pages, call `useScrollRestoration()` in your root `App.vue` component. If you have a layout system, call it in your layout components. Otherwise, call it in each page component that needs to restore its scroll position.
4. Adapt the `capture` and `restore` functions to your needs, especially if you had a custom `scrollBehavior` function that doesn't match the default behavior.

## Restore scroll

Call `useScrollRestoration()` in any page component that needs to restore its scroll position:

```vue [pages/Articles.vue]
<script setup lang="ts">
import { useScrollRestoration } from 'vue-router/experimental'

useScrollRestoration()
</script>
```

The router _captures_ the position **when you leave the page** and _restores_ it after a navigation, when the component is mounted or updated using `onRouteRendered()` under the hood.

## Capture events

The plugin captures positions after each successful navigation, on `pagehide`, and when the document becomes hidden.

Use `setupListeners(capture, signal)` to replace the default event listeners. The supplied `capture()` saves all active scroll registrations for the current route. Navigation capture remains enabled.

For example, capture on scroll:

```ts
app.use(ScrollRestoration, {
  router,
  capture: SCROLL_RESTORATION_CAPTURE_DEFAULT,
  restore: SCROLL_RESTORATION_RESTORE_DEFAULT,
  setupListeners(capture, signal) {
    window.addEventListener('scroll', capture, { passive: true, signal })
  },
})
```

Pass `signal` to your listeners so they are removed when the app is unmounted. You can listen to your own event instead, or save the supplied `capture` function and call it manually. To disable additional capture events, use `setupListeners: () => {}`.

To keep the default events and add your own, call `SCROLL_RESTORATION_SETUP_LISTENERS_DEFAULT`:

```ts
import { SCROLL_RESTORATION_SETUP_LISTENERS_DEFAULT } from 'vue-router/experimental'

app.use(ScrollRestoration, {
  router,
  capture: SCROLL_RESTORATION_CAPTURE_DEFAULT,
  restore: SCROLL_RESTORATION_RESTORE_DEFAULT,
  setupListeners(capture, signal) {
    SCROLL_RESTORATION_SETUP_LISTENERS_DEFAULT(capture, signal)
    window.addEventListener('save-scroll', capture, { signal })
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

By default, the key is `to.path + to.hash`. The same path and hash always use the same saved entry, including a new visit from a link. For example, if the users navigates to `/articles/42#comments`, scrolls down, and then navigates to `/articles/43`, navigating back **or** navigating directly again to `/articles/42#comments` will restore the previous position.

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

Components that are active at the same time must use different keys.

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

The router still captures the position automatically.
