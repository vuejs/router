# Function

## createWebHistory

## isNavigationFailure

## isNavigationFailure

## onBeforeRouteLeave

Add a navigation guard that triggers whenever the component for the current location is about to be left. Similar to but can be used in any component. The guard is removed when the component is unmounted.

**Signature:**

```typescript
export declare function onBeforeRouteLeave(leaveGuard: NavigationGuard): void
```

### Parameters

| Parameter  | Type            | Description                                               |
| ---------- | --------------- | --------------------------------------------------------- |
| leaveGuard | NavigationGuard | [NavigationGuard](./vue-router-interface#navigationguard) |

## onBeforeRouteUpdate

Add a navigation guard that triggers whenever the current location is about to be updated. Similar to but can be used in any component. The guard is removed when the component is unmounted.

**Signature:**

```typescript
export declare function onBeforeRouteUpdate(updateGuard: NavigationGuard): void
```

### Parameters

| Parameter   | Type            | Description                                               |
| ----------- | --------------- | --------------------------------------------------------- |
| updateGuard | NavigationGuard | [NavigationGuard](./vue-router-interface#navigationguard) |

## parseQuery

Transforms a queryString into a [LocationQuery](./vue-router-typealias#locationquery) object. Accept both, a version with the leading `?` and without Should work as URLSearchParams

**Signature:**

```typescript
export declare function parseQuery(search: string): LocationQuery
```

### Parameters

| Parameter | Type   | Description            |
| --------- | ------ | ---------------------- |
| search    | string | search string to parse |

### Returns

a query object

## stringifyQuery

Stringifies a [LocationQueryRaw](./vue-router-typealias#locationqueryraw) object. Like `URLSearchParams`, it doesn't prepend a `?`

**Signature:**

```typescript
export declare function stringifyQuery(query: LocationQueryRaw): string
```

### Parameters

| Parameter | Type             | Description               |
| --------- | ---------------- | ------------------------- |
| query     | LocationQueryRaw | query object to stringify |

### Returns

string version of the query without the leading `?`

## useLink

## useRoute

## useRouter
