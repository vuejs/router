# TypeAlias

## LocationQuery

Normalized query object that appears in [RouteLocationNormalized](./vue-router-interface#routelocationnormalized)

**Signature:**
```typescript
export declare type LocationQuery = Record<string, LocationQueryValue | LocationQueryValue[]>;
```

## LocationQueryRaw

Loose [LocationQuery](./vue-router-typealias#locationquery) object that can be passed to functions like [push](./vue-router-interface#router.push) and [replace](./vue-router-interface#router.replace) or anywhere when creating a [RouteLocationRaw](./vue-router-typealias#routelocationraw)

**Signature:**
```typescript
export declare type LocationQueryRaw = Record<string | number, LocationQueryValueRaw | LocationQueryValueRaw[]>;
```

## PathParserOptions

## RouteLocationRaw

User-level route location

**Signature:**
```typescript
export declare type RouteLocationRaw = string | (RouteQueryAndHash & LocationAsPath & RouteLocationOptions) | (RouteQueryAndHash & LocationAsNameRaw & RouteLocationOptions) | (RouteQueryAndHash & LocationAsRelativeRaw & RouteLocationOptions);
```

## RouteParams

## RouteRecord

Normalized version of a [Route Record](./vue-router-typealias#routerecord)

**Signature:**
```typescript
export declare type RouteRecord = RouteRecordNormalized;
```

## RouteRecordRaw

