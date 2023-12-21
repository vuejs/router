---
editLink: false
---

[API Documentation](../index.md) / NavigationFailureType

# Enumeration: NavigationFailureType

Enumeration with all possible types for navigation failures. Can be passed to
[isNavigationFailure](../index.md#isNavigationFailure) to check for specific failures.

## Enumeration Members

### aborted

• **aborted** = ``4``

An aborted navigation is a navigation that failed because a navigation
guard returned `false` or called `next(false)`

___

### cancelled

• **cancelled** = ``8``

A cancelled navigation is a navigation that failed because a more recent
navigation finished started (not necessarily finished).

___

### duplicated

• **duplicated** = ``16``

A duplicated navigation is a navigation that failed because it was
initiated while already being at the exact same location.
