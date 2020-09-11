# Interface

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
