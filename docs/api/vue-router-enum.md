---
sidebar: auto
---

# Enum

## NavigationFailureType

Enumeration with all possible types for navigation failures. Can be passed to to check for specific failures.

**Signature:**

```typescript
export declare enum NavigationFailureType
```

### Members

| Member     | Value | Description                                                                                                                      |
| ---------- | ----- | -------------------------------------------------------------------------------------------------------------------------------- |
| aborted    | 4     | An aborted navigation is a navigation that failed because a navigation guard returned `false` or called `next(false)`            |
| cancelled  | 8     | A cancelled navigation is a navigation that failed because a more recent navigation finished started (not necessarily finished). |
| duplicated | 16    | A duplicated navigation is a navigation that failed because it was initiated while already being at the exact same location.     |
