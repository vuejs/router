# Function

## createWebHistory

## isNavigationFailure

## isNavigationFailure

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
