# Interface

## NavigationGuard

### Properties

## RouteLocationMatched

### Methods

### Properties

#### components

## RouteLocationNormalized

Similar to [RouteLocation](./vue-router-interface#routelocation) but its [matched](./vue-router-interface#routelocationnormalized.matched) cannot contain redirect records

**Signature:**

```typescript
export interface RouteLocationNormalized extends _RouteLocationBase
```

### Methods

### Properties

#### matched

Array of [RouteRecordNormalized](./vue-router-interface#routerecordnormalized)

**Signature:**

```typescript
matched: RouteRecordNormalized[];
```

## RouteLocationNormalizedLoaded

[RouteLocationRaw](./vue-router-typealias#routelocationraw) with

**Signature:**

```typescript
export interface RouteLocationNormalizedLoaded extends _RouteLocationBase
```

### Methods

### Properties

#### matched

Array of [RouteLocationMatched](./vue-router-interface#routelocationmatched) containing only plain components (any lazy-loaded components have been loaded and were replaced inside of the `components` object) so it can be directly used to display routes. It cannot contain redirect records either

**Signature:**

```typescript
matched: RouteLocationMatched[];
```

## RouteLocationOptions

### Methods

### Properties

#### force

Triggers the navigation even if the location is the same as the current one

**Signature:**

```typescript
force?: boolean;
```

#### replace

Replace the entry in the history instead of pushing a new entry

**Signature:**

```typescript
replace?: boolean;
```

#### state

State to save using the History API. This cannot contain any reactive values and some primitives like Symbols are forbidden. More info [on MDN](https://developer.mozilla.org/en-US/docs/Web/API/History/pushState#Parameters).

**Signature:**

```typescript
state?: HistoryState;
```

## RouteRecordNormalized

Normalized version of a [Route Record](./vue-router-typealias#routerecord)

**Signature:**

```typescript
export interface RouteRecordNormalized
```

### Methods

### Properties

#### aliasOf

Defines if this record is the alias of another one. This property is `undefined` if the record is the original one.

**Signature:**

```typescript
aliasOf: RouteRecordNormalized | undefined
```

#### beforeEnter

**Signature:**

```typescript
beforeEnter: RouteRecordMultipleViews['beforeEnter']
```

#### children

**Signature:**

```typescript
children: Exclude<_RouteRecordBase['children'], void>;
```

#### components

**Signature:**

```typescript
components: RouteRecordMultipleViews['components']
```

#### instances

Mounted route component instances Having the instances on the record mean beforeRouteUpdate and beforeRouteLeave guards can only be invoked with the latest mounted app instance if there are multiple application instances rendering the same view, basically duplicating the content on the page, which shouldn't happen in practice. It will work if multiple apps are rendering different named views.

**Signature:**

```typescript
instances: Record<string, ComponentPublicInstance | undefined | null>;
```

#### meta

Arbitrary data attached to the record.

**Signature:**

```typescript
meta: Exclude<_RouteRecordBase['meta'], void>;
```

#### name

Name for the route record.

**Signature:**

```typescript
name: _RouteRecordBase['name']
```

#### path

Path of the record. Should start with `/` unless the record is the child of another record.

**Signature:**

```typescript
path: _RouteRecordBase['path']
```

#### props

**Signature:**

```typescript
props: Record<string, _RouteRecordProps>;
```

#### redirect

Where to redirect if the route is directly matched. The redirection happens before any navigation guard and triggers a new navigation with the new target location.

**Signature:**

```typescript
redirect: _RouteRecordBase['redirect'] | undefined
```

### Methods

### Properties

#### name

#### route

## ScrollBehavior_2

### Methods

### Properties
