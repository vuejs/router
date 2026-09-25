# Scroll Restoration

::: warning Experimental
This API is experimental and might have breaking changes.
:::

Scroll restoration lets components save and restore their own scroll positions. It is the **upcoming replacement** for the `scrollBehavior` router option.

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

The default functions save and restore the window scroll position and imitate the current mechanism combined with `scrollBehavior()` and some smart defaults. They are automatically inherited by nested components and can be overridden anywhere. Call `useScrollRestoration()` in a component to use them.

Installing the plugin sets `history.scrollRestoration` to `manual`. Setting it to auto can with scroll restoration, especially in the context of _anchor links_. Set it back to `auto` if this is not an issue for you.

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
