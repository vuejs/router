---
editLink: false
---

[API Documentation](../index.md) / MatcherLocation

# Interface: MatcherLocation

Normalized/resolved Route location that returned by the matcher.

## Properties

### matched

• **matched**: [`RouteRecordNormalized`](RouteRecordNormalized.md)[]

Array of [RouteRecord](../index.md#RouteRecord) containing components as they were
passed when adding records. It can also contain redirect records. This
can't be used directly

___

### meta

• **meta**: [`RouteMeta`](RouteMeta.md)

Merged `meta` properties from all the matched route records.

___

### name

• **name**: ``null`` \| [`RouteRecordNameGeneric`](../index.md#RouteRecordNameGeneric)

Name of the matched record

___

### params

• **params**: [`RouteParamsGeneric`](../index.md#RouteParamsGeneric)

Object of decoded params extracted from the `path`.

___

### path

• **path**: `string`

Percentage encoded pathname section of the URL.
