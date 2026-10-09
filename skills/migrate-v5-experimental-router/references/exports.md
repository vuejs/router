# `vue-router/experimental` exports

Source of truth: `packages/router/src/experimental/index.ts`. Keep this table in sync with that file. Names that start with `_` are internal: do not tell users to import them unless no public API exists.

Data loader exports are listed for completeness. This skill does not cover data loaders in depth. See `packages/docs/data-loaders/`.

## Router

| Export                                                                               | Kind     | Covered in                                           |
| ------------------------------------------------------------------------------------ | -------- | ---------------------------------------------------- |
| `experimental_createRouter`                                                          | function | [experimental-router.md](experimental-router.md)     |
| `normalizeRouteRecord`                                                               | function | [fixed-resolver.md](fixed-resolver.md)               |
| `EXPERIMENTAL_Router_Base`, `EXPERIMENTAL_Router`                                    | type     | [experimental-router.md](experimental-router.md)     |
| `EXPERIMENTAL_RouterOptions_Base`, `EXPERIMENTAL_RouterOptions`                      | type     | [experimental-router.md](experimental-router.md)     |
| `EXPERIMENTAL_RouteRecordRaw`, `EXPERIMENTAL_RouteRecord_Base`                       | type     | [fixed-resolver.md](fixed-resolver.md)               |
| `EXPERIMENTAL_RouteRecordNormalized`                                                 | type     | [fixed-resolver.md](fixed-resolver.md)               |
| `EXPERIMENTAL_RouteRecord_Group`, `EXPERIMENTAL_RouteRecordNormalized_Group`         | type     | [fixed-resolver.md](fixed-resolver.md#group-records) |
| `EXPERIMENTAL_RouteRecord_Matchable`, `EXPERIMENTAL_RouteRecordNormalized_Matchable` | type     | [fixed-resolver.md](fixed-resolver.md)               |

## Scroll restoration and rendering

| Export                                       | Kind           | Covered in                                                       |
| -------------------------------------------- | -------------- | ---------------------------------------------------------------- |
| `ScrollRestoration`                          | plugin         | [scroll-restoration.md](scroll-restoration.md)                   |
| `useScrollRestoration`                       | function       | [scroll-restoration.md](scroll-restoration.md)                   |
| `ScrollRestorationPluginOptions`             | type           | [scroll-restoration.md](scroll-restoration.md)                   |
| `ScrollRestorationPosition`                  | type           | [scroll-restoration.md](scroll-restoration.md)                   |
| `ScrollRestorationSessionEntry`              | type           | [scroll-restoration.md](scroll-restoration.md)                   |
| `UseScrollRestorationOptions`                | type           | [scroll-restoration.md](scroll-restoration.md)                   |
| `SCROLL_RESTORATION_CAPTURE_DEFAULT`         | function       | [scroll-restoration.md](scroll-restoration.md)                   |
| `SCROLL_RESTORATION_RESTORE_DEFAULT`         | function       | [scroll-restoration.md](scroll-restoration.md)                   |
| `onRouteRendered`, `OnRouteRenderedCallback` | function, type | [scroll-restoration.md](scroll-restoration.md#5-onrouterendered) |

## Resolver and matchers

| Export                                                                                   | Kind           | Covered in                                      |
| ---------------------------------------------------------------------------------------- | -------------- | ----------------------------------------------- |
| `createFixedResolver`                                                                    | function       | [fixed-resolver.md](fixed-resolver.md)          |
| `MatcherPatternPathStatic`                                                               | class          | [fixed-resolver.md](fixed-resolver.md#matchers) |
| `MatcherPatternPathDynamic`                                                              | class          | [fixed-resolver.md](fixed-resolver.md#matchers) |
| `MatcherPatternQueryParam`                                                               | class          | [fixed-resolver.md](fixed-resolver.md#matchers) |
| `MatcherPatternHashParam`                                                                | class          | [fixed-resolver.md](fixed-resolver.md#matchers) |
| `MatcherPattern`, `MatcherPatternPath`, `MatcherPatternQuery`, `MatcherPatternHash`      | type           | [fixed-resolver.md](fixed-resolver.md#matchers) |
| `MatcherPatternPathDynamic_ParamOptions`                                                 | type           | [fixed-resolver.md](fixed-resolver.md#matchers) |
| `EmptyParams`, `MatcherParamsFormatted`, `MatcherQueryParams`, `MatcherQueryParamsValue` | type           | [fixed-resolver.md](fixed-resolver.md#matchers) |
| `miss`                                                                                   | function       | [param-parsers.md](param-parsers.md#errors)     |
| `_MatchMiss`                                                                             | internal class | [param-parsers.md](param-parsers.md#errors)     |

## Param parsers

| Export                                             | Kind     | Covered in                                                       |
| -------------------------------------------------- | -------- | ---------------------------------------------------------------- |
| `PARAM_PARSER_INT`, `PARAM_PARSER_BOOL`            | parser   | [param-parsers.md](param-parsers.md#2-built-in-parsers)          |
| `ParamParser`                                      | type     | [param-parsers.md](param-parsers.md)                             |
| `defineParamParser`                                | function | [param-parsers.md](param-parsers.md#6-write-a-custom-parser)     |
| `defineParamParserRaw`                             | function | [param-parsers.md](param-parsers.md#6-write-a-custom-parser)     |
| `defineHashParamParser`                            | function | [param-parsers.md](param-parsers.md#6-write-a-custom-parser)     |
| `_normalizeParamParser`, `_ExtractParamParserType` | internal | [param-parsers.md](param-parsers.md#standard-schema-zod-valibot) |

## `definePage()` (file-based routing)

| Export                                                                                                                                                          | Kind        | Covered in                                                                         |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- | ---------------------------------------------------------------------------------- |
| `definePage`, `DefinePage`                                                                                                                                      | macro, type | [file-based-routing.md](file-based-routing.md#5-move-route-options-into-the-pages) |
| `DefinePagePathParamOptions`                                                                                                                                    | type        | [param-parsers.md](param-parsers.md#3-path-params)                                 |
| `DefinePageQueryParamOptions`                                                                                                                                   | type        | [param-parsers.md](param-parsers.md#4-query-params)                                |
| `DefinePageHashParamOptions`                                                                                                                                    | type        | [param-parsers.md](param-parsers.md#5-hash-param)                                  |
| `DefinePageParamRequiredOrDefault`                                                                                                                              | type        | [param-parsers.md](param-parsers.md#4-query-params)                                |
| `ParamParserType`, `ParamParserType_Native`, `ParamParserTypeOf`                                                                                                | type        | [param-parsers.md](param-parsers.md)                                               |
| `_mergeRouteRecord`, `_ParamParsers`, `_ParamParsers_Native`, `_DefinePageHashParamOptionsAny`, `_DefinePageQueryParamOptionsAny`, `_PathParamNamesForFilePath` | internal    | generated code only                                                                |

## Data loaders (not covered in depth)

| Export                                                                                                                                              | Notes                                                                                            |
| --------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `DataLoaderPlugin`, `DataLoaderPluginOptions`                                                                                                       | install before `app.use(router)`. See [experimental-router.md](experimental-router.md#2-maints). |
| `reroute`, `useIsDataLoading`, `SetupLoaderGuardOptions`                                                                                            | runtime helpers                                                                                  |
| `NavigationResult`                                                                                                                                  | deprecated, use `reroute()` (`R1009`)                                                            |
| `_NavigationResult`                                                                                                                                 | internal                                                                                         |
| `defineBasicLoader` and its types                                                                                                                   | basic loader                                                                                     |
| `UseDataLoader*`, `DataLoaderContext*`, `DataLoaderEntryBase`, `DefineDataLoaderOptions*`, `DefineLoaderFn`, `DataLoaderBasicEntry`, `ErrorDefault` | types                                                                                            |
| `getCurrentContext`, `setCurrentContext`, `withLoaderContext`, `trackRoute`, `toLazyValue`                                                          | utilities for custom loaders                                                                     |

`vue-router/experimental/pinia-colada` exports `defineColadaLoader`.

## Related entries

| Entry                      | Exports                                                                         |
| -------------------------- | ------------------------------------------------------------------------------- |
| `vue-router/auto-resolver` | `resolver`, `handleHotUpdate(router, cb?)`                                      |
| `vue-router/auto-routes`   | `routes`, `handleHotUpdate(router, cb?)` (stable router)                        |
| `vue-router/vite`          | Vite plugin, `experimental.paramParsers`, `experimental.autoExportsDataLoaders` |
| `vue-router/unplugin`      | other bundlers and tree utilities                                               |
