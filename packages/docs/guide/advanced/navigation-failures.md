# Waiting for the result of a Navigation

<VueSchoolLink
  href="https://vueschool.io/lessons/vue-router-4-detecting-navigation-failures"
  title="Learn how to detect navigation failures"
/>

When using `router-link`, Vue Router calls `router.push` to trigger a navigation. While the expected behavior for most links is to navigate a user to a new page, there are a few situations where users will remain on the same page:

- Users are already on the page that they are trying to navigate to.
- A [navigation guard](./navigation-guards.md) aborts the navigation by doing `return false`.
- A new navigation guard takes place while the previous one not finished.
- A [navigation guard](./navigation-guards.md) redirects somewhere else by returning a new location (e.g. `return '/login'`).
- A [navigation guard](./navigation-guards.md) throws an `Error`.

If we want to do something after a navigation is finished, we need a way to wait after calling `router.push`. Imagine we have a mobile menu that allows us to go to different pages and we only want to hide the menu once we have navigated to the new page, we might want to do something like this:

```js
router.push('/my-profile')
this.isMenuOpen = false
```

But this will close the menu right away because **navigations are asynchronous**, we need to `await` the promise returned by `router.push`:

```js
await router.push('/my-profile')
this.isMenuOpen = false
```

Now the menu will close once the navigation is finished but it will also close if the navigation was prevented. We need a way to detect if we actually changed the page we are on or not.

## Detecting Navigation Failures

If a navigation is prevented, resulting in the user staying on the same page, the resolved value of the `Promise` returned by `router.push` will be a _Navigation Failure_. Otherwise, it will be a _falsy_ value (usually `undefined`). This allows us to differentiate the case where we navigated away from where we are or not:

```js
const navigationResult = await router.push('/my-profile')

if (navigationResult) {
  // navigation prevented
} else {
  // navigation succeeded (this includes the case of a redirection)
  this.isMenuOpen = false
}
```

_Navigation Failures_ are `Error` instances with a few extra properties that gives us enough information to know what navigation was prevented and why. To check the nature of a navigation result, use the `isNavigationFailure` function:

```js
import { NavigationFailureType, isNavigationFailure } from 'vue-router'

// trying to leave the editing page of an article without saving
const failure = await router.push('/articles/2')

if (isNavigationFailure(failure, NavigationFailureType.aborted)) {
  // show a small notification to the user
  showToast('You have unsaved changes, discard and leave anyway?')
}
```

::: tip
If you omit the second parameter: `isNavigationFailure(failure)`, it will only check if `failure` is a _Navigation Failure_.
:::

## Global navigation failures

You can detect global navigation failures globally by using the [`router.afterEach()` navigation guard](./navigation-guards.md#global-after-hooks):

```ts
router.afterEach((to, from, failure) => {
  if (failure) {
    sendToAnalytics(to, from failure)
  }
})
```

## Differentiating Navigation Failures

As we said at the beginning, there are different situations aborting a navigation, all of them resulting in different _Navigation Failures_. They can be differentiated using the `isNavigationFailure` and `NavigationFailureType`. There are three different types:

- `aborted`: `false` was returned inside of a navigation guard to the navigation.
- `cancelled`: A new navigation took place before the current navigation could finish. e.g. `router.push` was called while waiting inside of a navigation guard.
- `duplicated`: The navigation was prevented because we are already at the target location.

## _Navigation Failures_'s properties

All navigation failures expose `to` and `from` properties to reflect the current location as well as the target location for the navigation that failed:

```js
// trying to access the admin page
router.push('/admin').then(failure => {
  if (isNavigationFailure(failure, NavigationFailureType.aborted)) {
    failure.to.path // '/admin'
    failure.from.path // '/'
  }
})
```

In all cases, `to` and `from` are normalized route locations.

## Detecting Redirections

When returning a new location inside of a Navigation Guard, we are triggering a new navigation that overrides the ongoing one. Differently from other return values, a redirection doesn't prevent a navigation, **it creates a new one**. It is therefore checked differently, by reading the `redirectedFrom` property in a Route Location:

```js
await router.push('/my-profile')
if (router.currentRoute.value.redirectedFrom) {
  // redirectedFrom is resolved route location like to and from in navigation guards
}
```
