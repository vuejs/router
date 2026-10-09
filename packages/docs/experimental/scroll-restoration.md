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

## `useScrollRestoration()` {#useScrollRestoration}

`useScrollRestoration()` uses `onRouteRendered()` to restore the scroll after each navigation. Call it in a component inside a `<RouterView>`, like a layout or a page component. The restore then runs when the closest `<RouterView>` shows the new route: after the page mounts or updates, after `<Suspense>` resolves, and after an out-in `<Transition>` enters.

Do not call it in your root `App.vue` or in other components outside of a `<RouterView>`. There, `onRouteRendered()` runs in `router.afterEach()`, before the new route renders, so the restore runs on the old page.

A layout component lets you call it once for all of its child pages. Call it in specific pages when they need different options, for example `manual: true` to wait for an animation.

## Migrating from `scrollBehavior` {#migrating-from-scrollbehavior}

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

The router _captures_ the position **when you leave the page**, and when the browser tab is hidden or closed. It _restores_ the position after a navigation, when the page is rendered. It uses `onRouteRendered()` under the hood.

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

Components that are active at the same time must use different keys, one for each scroll container. With the same key, they all capture and restore, and the last capture replaces the others.

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
