# Reloading data

Very often, it is required to reload the data (e.g. fetch the latest data) without navigating. Since Vue Router considers that a duplicated navigation, we cannot just `router.push()` and expect navigation guards to run again to fetch the latest data. To overcome this, data loaders expose a convenient `reload` method that can be invoked to manually rerun the loader **without navigating**. This has some extra implications we will cover in this page.

## Navigation Unaware

When reloading data, the navigation is not involved, so not only the navigation guards will not run (`beforeRouteUpdate`, `beforeRouteLeave`, etc) but also any `NavigationResult` returned or thrown by the data loader will be ignored.

## Errors

Because we are not within a navigation, errors are actually kept in the `error` property of the loader. Similar to lazy loaders. This allows to display any errors that might have occurred during the reload.
