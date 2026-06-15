---
title: Error Reference
editLink: true
---

# Error Reference

Vue Router reports problems through coded diagnostics. Each message printed to
the console starts with a stable code such as `[VR_R0008]` or `[VR_B0012]` and
links to its own page here, where you'll find what it means and how to fix it.

- **`VR_R####` — runtime warnings.** Logged with `console.warn` while
  developing. They are guarded by `__DEV__`/`process.env.NODE_ENV` and are
  stripped from production builds, so they never run in your users' browsers.
- **`VR_R1###` — runtime warnings for the experimental
  [Data Loaders](/data-loaders/).**
- **`VR_B####` — build-time warnings.** Emitted by the file-based routing
  plugin (`unplugin-vue-router`) while your project builds.

Codes are permanent: a code always refers to the same problem and is never
reused. In the messages, values wrapped in `{curly braces}` are placeholders
filled in at runtime.

## Runtime warnings

Logged with `console.warn` during development and stripped from production builds.

- [VR_R0001 — Parent route not found](/errors/vr_r0001)
- [VR_R0002 — Removing a non-existent route](/errors/vr_r0002)
- [VR_R0003 — Resolved location starts with multiple slashes](/errors/vr_r0003)
- [VR_R0004 — No match for the location path](/errors/vr_r0004)
- [VR_R0005 — Invalid location passed to `router.resolve()`](/errors/vr_r0005)
- [VR_R0006 — Params ignored on a path location](/errors/vr_r0006)
- [VR_R0007 — Hash missing the leading `#`](/errors/vr_r0007)
- [VR_R0008 — Invalid redirect](/errors/vr_r0008)
- [VR_R0009 — Possible infinite redirection](/errors/vr_r0009)
- [VR_R0010 — Uncaught error during navigation](/errors/vr_r0010)
- [VR_R0011 — Unexpected error when starting the router](/errors/vr_r0011)
- [VR_R0020 — Guard composable called outside `<router-view>`](/errors/vr_r0020)
- [VR_R0021 — No active route record on reactivation](/errors/vr_r0021)
- [VR_R0022 — Guard composable called outside `setup()`](/errors/vr_r0022)
- [VR_R0023 — `next` was never called](/errors/vr_r0023)
- [VR_R0024 — `next` called more than once](/errors/vr_r0024)
- [VR_R0025 — `next()` callback is deprecated](/errors/vr_r0025)
- [VR_R0026 — Record missing `component(s)` or `children`](/errors/vr_r0026)
- [VR_R0027 — Invalid component in a record](/errors/vr_r0027)
- [VR_R0028 — Component is a Promise instead of a function](/errors/vr_r0028)
- [VR_R0029 — Component uses `defineAsyncComponent()`](/errors/vr_r0029)
- [VR_R0030 — Component function does not return a Promise](/errors/vr_r0030)
- [VR_R0040 — Selector should be passed as an element](/errors/vr_r0040)
- [VR_R0041 — Invalid selector](/errors/vr_r0041)
- [VR_R0042 — Element not found by `scrollBehavior` selector](/errors/vr_r0042)
- [VR_R0050 — Invalid `to` prop in `useLink()`](/errors/vr_r0050)
- [VR_R0060 — `<router-view>` used directly inside another component](/errors/vr_r0060)
- [VR_R0070 — Relative location without an absolute path](/errors/vr_r0070)
- [VR_R0080 — Error decoding a value](/errors/vr_r0080)
- [VR_R0090 — Duplicated param names](/errors/vr_r0090)
- [VR_R0100 — Discarded invalid params](/errors/vr_r0100)
- [VR_R0101 — Matcher received a relative path](/errors/vr_r0101)
- [VR_R0102 — Alias param mismatch](/errors/vr_r0102)
- [VR_R0103 — Named route with an unnamed empty-path child](/errors/vr_r0103)
- [VR_R0104 — Absolute child path param mismatch](/errors/vr_r0104)
- [VR_R0105 — Finding an ancestor route failed](/errors/vr_r0105)
- [VR_R0110 — Hash base must end with `#`](/errors/vr_r0110)
- [VR_R0120 — Error with `push`/`replace` State](/errors/vr_r0120)
- [VR_R0121 — `history.state` was manually replaced](/errors/vr_r0121)

## Data Loaders

Warnings from the experimental [Data Loaders](/data-loaders/).

- [VR_R1001 — Loader has a different parent](/errors/vr_r1001)
- [VR_R1002 — Returning a `NavigationResult` is deprecated](/errors/vr_r1002)
- [VR_R1003 — `commit()` called with no staged data](/errors/vr_r1003)
- [VR_R1004 — Unregistered loader returned a `NavigationResult`](/errors/vr_r1004)
- [VR_R1005 — Loader has itself as parent](/errors/vr_r1005)
- [VR_R1006 — `useQuery()` key collides with a loader](/errors/vr_r1006)
- [VR_R1007 — Data Loaders set up twice](/errors/vr_r1007)
- [VR_R1008 — Data Loaders are experimental](/errors/vr_r1008)
- [VR_R1009 — Returning a `NavigationResult` from a loader is deprecated](/errors/vr_r1009)

## Build-time warnings

Emitted by the file-based routing plugin while your project builds. See the [File-Based Routing guide](/file-based-routing/).

- [VR_B0001 — `definePage()` processing failed](/errors/vr_b0001)
- [VR_B0002 — `definePage()` references local bindings](/errors/vr_b0002)
- [VR_B0003 — `definePage()` extraction failed](/errors/vr_b0003)
- [VR_B0004 — Route `name` must be a string literal](/errors/vr_b0004)
- [VR_B0005 — Route `path` must be a string literal](/errors/vr_b0005)
- [VR_B0006 — Unrecognized query param default](/errors/vr_b0006)
- [VR_B0007 — Route `alias` must be a string literal or array](/errors/vr_b0007)
- [VR_B0008 — Alias array must contain only string literals](/errors/vr_b0008)
- [VR_B0009 — Invalid extension](/errors/vr_b0009)
- [VR_B0010 — Segment missing the closing `)`](/errors/vr_b0010)
- [VR_B0011 — Empty parameter name](/errors/vr_b0011)
- [VR_B0012 — Invalid JSON5 in a route block](/errors/vr_b0012)
- [VR_B0013 — Invalid JSON in a route block](/errors/vr_b0013)
- [VR_B0014 — Invalid YAML in a route block](/errors/vr_b0014)
- [VR_B0015 — Unsupported route block language](/errors/vr_b0015)
- [VR_B0016 — Error decoding a value](/errors/vr_b0016)
- [VR_B0017 — Unnamed parameter in a route](/errors/vr_b0017)
- [VR_B0018 — Cannot determine if a parser is raw](/errors/vr_b0018)
- [VR_B0019 — Param parser not found](/errors/vr_b0019)
