# Scroll Behavior

<VueSchoolLink
  href="https://vueschool.io/lessons/scroll-behavior"
  title="Learn how to customize scroll behavior"
/>

When using client-side routing, we may want to scroll to top when navigating to a new route, or preserve the scrolling position of history entries just like real page reload does. Vue Router allows you to achieve these and even better, allows you to completely customize the scroll behavior on route navigation.

**Note: this feature only works if the browser supports `history.pushState`.**

When creating the router instance, you can provide the `scrollBehavior` function:

```js
const router = createRouter({
  history: createWebHashHistory(),
  routes: [...],
  scrollBehavior (to, from, savedPosition) {
    // return desired position
  }
})
```

The `scrollBehavior` function receives the `to` and `from` route objects, like [Navigation Guards](./navigation-guards.md). The third argument, `savedPosition`, is only available if this is a `popstate` navigation (triggered by the browser's back/forward buttons).

The function can return a [`ScrollToOptions`](https://developer.mozilla.org/en-US/docs/Web/API/ScrollToOptions) position object:

```js
const router = createRouter({
  scrollBehavior(to, from, savedPosition) {
    // always scroll to top
    return { top: 0 }
  },
})
```

You can also pass a CSS selector or a DOM element via `el`. In that scenario, `top` and `left` will be treated as relative offsets to that element.

```js
const router = createRouter({
  scrollBehavior(to, from, savedPosition) {
    // always scroll 10px above the element #main
    return {
      // could also be
      // el: document.getElementById('main'),
      el: '#main',
      // 10px above the element
      top: 10,
    }
  },
})
```

If a falsy value or an empty object is returned, no scrolling will happen.

Returning the `savedPosition` will result in a native-like behavior when navigating with back/forward buttons:

```js
const router = createRouter({
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    } else {
      return { top: 0 }
    }
  },
})
```

If you want to simulate the "scroll to anchor" behavior:

```js
const router = createRouter({
  scrollBehavior(to, from, savedPosition) {
    if (to.hash) {
      return {
        el: to.hash,
      }
    }
  },
})
```

If your browser supports [scroll behavior](https://developer.mozilla.org/en-US/docs/Web/API/ScrollToOptions/behavior), you can make it smooth:

```js
const router = createRouter({
  scrollBehavior(to, from, savedPosition) {
    if (to.hash) {
      return {
        el: to.hash,
        behavior: 'smooth',
      }
    }
  },
})
```

## Delaying the scroll

Sometimes we need to wait a bit before scrolling in the page. For example, when dealing with transitions, we want to wait for the transition to finish before scrolling. To do this you can return a Promise that returns the desired position descriptor. Here is an example where we wait 500ms before scrolling:

```js
const router = createRouter({
  scrollBehavior(to, from, savedPosition) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        resolve({ left: 0, top: 0 })
      }, 500)
    })
  },
})
```

It's possible to hook this up with events from a page-level transition component to make the scroll behavior play nicely with your page transitions, but due to the possible variance and complexity in use cases, we simply provide this primitive to enable specific userland implementations.

## Advanced offsets

Depending on the layout of the page, for example if there is a fixed-positioned navbar, an offset might be needed to make sure the target element is not obscured by other content.

When a static offset value doesn't quite do the trick, one might reach for CSS to create an offset when scrolling to an element, only to discover that this doesn't work. For reference, the following styles can result in such edge cases:

- `scroll-margin` or `scroll-padding` values
- `::before` and `::after` pseudo elements

In these scenarios, the offset needs to be manually computed. One simple solution is to leverage CSS with `getComputedStyle()`. This allows each element to define its own offset value with all the desired flexibility. Here is an example:

```js
const router = createRouter({
  scrollBehavior(to, from, savedPosition) {
    const mainElement = document.querySelector('#main')
    if (mainElement) {
      const marginTop = parseFloat(
        getComputedStyle(mainElement).scrollMarginTop
      )
      return {
        el: mainElement,
        top: marginTop,
      }
    } else {
      return { top: 0 }
    }
  },
})
```
