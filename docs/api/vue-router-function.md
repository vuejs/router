# Function

## createMemoryHistory

Creates a in-memory based history. The main purpose of this history is to handle SSR. It starts in a special location that is nowhere. It's up to the user to replace that location with the starter location.

**Signature:**
```typescript
export declare function createMemoryHistory(base?: string): RouterHistory;
```

### Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| base | string | Base applied to all urls, defaults to '/' |

### Returns

 a history object that can be passed to the router constructor

## createRouter

Create a Router instance that can be used on a Vue app.

**Signature:**
```typescript
export declare function createRouter(options: RouterOptions): Router;
```

### Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| options | RouterOptions | [RouterOptions](./vue-router-interface#routeroptions) |

## createWebHashHistory

Creates a hash history.

**Signature:**
```typescript
export declare function createWebHashHistory(base?: string): RouterHistory;
```

### Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| base | string | optional base to provide. Defaults to `location.pathname` or `/` if at root. If there is a `base` tag in the `head`, its value will be **ignored**. |

### Examples


```js
// at https://example.com/folder
createWebHashHistory() // gives a url of `https://example.com/folder#`
createWebHashHistory('/folder/') // gives a url of `https://example.com/folder/#`
// if the `#` is provided in the base, it won't be added by `createWebHashHistory`
createWebHashHistory('/folder/#/app/') // gives a url of `https://example.com/folder/#/app/`
// you should avoid doing this because it changes the original url and breaks copying urls
createWebHashHistory('/other-folder/') // gives a url of `https://example.com/other-folder/#`

// at file:///usr/etc/folder/index.html
// for locations with no `host`, the base is ignored
createWebHashHistory('/iAmIgnored') // gives a url of `file:///usr/etc/folder/index.html#`
```


## createWebHistory

## isNavigationFailure

## isNavigationFailure

## onBeforeRouteLeave

Add a navigation guard that triggers whenever the component for the current location is about to be left. Similar to  but can be used in any component. The guard is removed when the component is unmounted.

**Signature:**
```typescript
export declare function onBeforeRouteLeave(leaveGuard: NavigationGuard): void;
```

### Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| leaveGuard | NavigationGuard | [NavigationGuard](./vue-router-interface#navigationguard) |

## onBeforeRouteUpdate

Add a navigation guard that triggers whenever the current location is about to be updated. Similar to  but can be used in any component. The guard is removed when the component is unmounted.

**Signature:**
```typescript
export declare function onBeforeRouteUpdate(updateGuard: NavigationGuard): void;
```

### Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| updateGuard | NavigationGuard | [NavigationGuard](./vue-router-interface#navigationguard) |

## parseQuery

Transforms a queryString into a [LocationQuery](./vue-router-typealias#locationquery) object. Accept both, a version with the leading `?` and without Should work as URLSearchParams

**Signature:**
```typescript
export declare function parseQuery(search: string): LocationQuery;
```

### Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| search | string | search string to parse |

### Returns

 a query object

## stringifyQuery

Stringifies a [LocationQueryRaw](./vue-router-typealias#locationqueryraw) object. Like `URLSearchParams`, it doesn't prepend a `?`

**Signature:**
```typescript
export declare function stringifyQuery(query: LocationQueryRaw): string;
```

### Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| query | LocationQueryRaw | query object to stringify |

### Returns

 string version of the query without the leading `?`

## useLink

## useRoute

## useRouter

