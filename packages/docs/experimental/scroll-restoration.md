# Scroll Restoration

::: warning Experimental
This API is experimental and might have breaking changes.
:::

The `scrollBehavior` option is deprecated. The `ScrollRestoration` plugin replaces it and lets components save and restore their own scroll positions.

With it, you can:

- Save multiple positions for one page
- Use custom capture and restore functions, for example with `scrollIntoView()`
- Control how pages share scroll restoration rather than relying on history entries

[[toc]]

## Setup

Install `ScrollRestoration` before the router. Give it the router, and the default capture and restore functions:

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
})
app.use(router)

app.mount('#app')
```

The default functions capture and restore the window scroll position. Components that call `useScrollRestoration()` inherit these functions and can override either one.

Installing the plugin sets `history.scrollRestoration` to `manual`. Setting it to `auto` can conflict with scroll restoration, especially for anchor links. Set it back to `auto` if this is not an issue for you.

## Default behavior

The default `capture` function saves only the window's `left` and `top` scroll coordinates. It saves them under a route key: `path + hash` by default. The hash is part of the key, so `capture` does not need to return it.

After a navigation, the default `restore` function uses this order for a registered page:

1. If the route key has a saved window position, scroll to it. This also applies when the route has a hash.
2. Otherwise, if the new route has a hash and an element with that ID exists, scroll to that element.
3. Otherwise, scroll to `{ left: 0, top: 0 }`.

Register each page that needs this behavior with `useScrollRestoration()`. Without a registration, the plugin does not capture or restore that page's position. See [Keys](#keys) to change which routes share a saved entry.

## Migrating from `scrollBehavior` {#migrating-from-scrollbehavior}

1. Remove `scrollBehavior` from the router options.
2. Install `ScrollRestoration` before the router, as shown in [Setup](#setup). Pass the router and the default `capture` and `restore` functions.
3. Call `useScrollRestoration()` in each page component whose position you want to save and restore. The plugin only handles components that call this function.

For example, this `scrollBehavior` option restores a position saved for a history entry, scrolls to a hash, or scrolls to the top:

```ts [router.ts]
scrollBehavior(to, _from, savedPosition) {
  if (savedPosition) return savedPosition
  if (to.hash) return { el: to.hash }
  return { left: 0, top: 0 }
}
```

After you remove it from the router, use the plugin setup above and register each page you want to restore:

```vue [pages/Articles.vue]
<script setup lang="ts">
import { useScrollRestoration } from 'vue-router/experimental'

useScrollRestoration()
</script>
```

This changes when a saved position is available. Legacy `savedPosition` belongs to a history entry and is supplied for back or forward navigation. The plugin stores positions in `sessionStorage` by route key (`path + hash` by default). A new link visit to the same key can restore a saved position, and separate history entries with that key share it. Query strings do not affect the default key. See [Keys](#keys) if a query or another route detail must give a page its own position.

The defaults handle the same saved position, hash, and top cases. If no element matches the hash when the page renders, the new default scrolls to the top.

Move any other scroll rules into custom `capture` and `restore` functions. `capture()` returns an entry with a `default` position and, if needed, other named positions; see [Multiple positions](#multiple-positions). The default capture saves window coordinates only. A custom capture can save other coordinates or a CSS selector in `el`; `el` cannot be an `Element` object. You do not need to save the hash in an entry, because the route key includes it by default.

`restore(entry, to)` receives the saved entry and the destination route. Use `to.hash` for custom anchor behavior, and call a scroll method to move the page: returning a position does not scroll. If you override `restore`, implement the saved position, hash, and top cases you still need. See [Custom restore](#custom-restore) for an example.

If the old function returned a Promise to wait for content, use `manual: true` and call the returned `scroll()` after the content is ready. `capture` and `restore` must run synchronously.

## Restore a page

Call `useScrollRestoration()` in any page component that needs to restore its scroll position:

```vue [pages/Articles.vue]
<script setup lang="ts">
import { useScrollRestoration } from 'vue-router/experimental'

useScrollRestoration()
</script>
```

The router _captures_ the position **when you leave the page** and _restores_ it after a navigation, when the component is mounted or updated using `onRouteRendered()`.

## Multiple positions

`capture()` returns an object. Each property is one saved position. Use `default` for the main position and add other names for other scroll containers:

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

Set `manual: true` when the content is not ready after navigation, like animations or virtualized list. Then call `scroll()` when the content is displayed:

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
