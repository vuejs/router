# Performance check status

Measured on 2026-10-14, on an Apple M5 Pro (macOS arm64), with Node 26.9.0,
vue-tsc 3.3.12, TypeScript 6.0.3, Vue 3.5.43, Vite 8.3.3, and the local built
vue-router 5.4.0 package. Medians below use five fresh processes per check, warm
filesystem caches, and no TypeScript incremental reuse. Traces are separate.

## Setup and validation

The classic 50-page console was built and checked before the three copies were
created. Its browser checks verified filtering, saved edits, and lazy navigation.
The completed suite validates 50 pages in each project and 58 shared source
files. All application source matches after removal of the single props macro
line on each page in the props variant. Router adapters and generated route
declarations are the only other source exceptions. Generated projects use both
router Volar plugins. Every project uses the same built router declarations.

The final five-run suite passed all app and config checks and all production
builds. The browser script then checked every route, filtering, editing, and a
same-page parameter update in each project.

| Project                    | vue-tsc app | vue-tsc config | Production build | Browser behavior                                |
| -------------------------- | ----------- | -------------- | ---------------- | ----------------------------------------------- |
| Classic routes array       | Pass        | Pass           | Pass             | 50 routes and interactions pass                 |
| Auto-routes                | Pass        | Pass           | Pass             | 50 routes and interactions pass                 |
| Auto-resolver              | Pass        | Pass           | Pass             | 50 routes and interactions pass                 |
| Auto-resolver + props:true | Pass        | Pass           | Pass             | Navigation passes; route props are not supplied |

## Performance

All times are process wall times, except the compiler check phase column.
Bundle columns sum every emitted JavaScript chunk, including all lazy pages.

| Project                    | App vue-tsc | Compiler check phase | Config vue-tsc | Vite build |  JS total |   JS gzip |
| -------------------------- | ----------: | -------------------: | -------------: | ---------: | --------: | --------: |
| Classic                    |    1,029 ms |               480 ms |         369 ms |     242 ms | 277.1 KiB | 113.6 KiB |
| Auto-routes                |    1,038 ms |               470 ms |         423 ms |     311 ms | 275.6 KiB | 113.3 KiB |
| Auto-resolver              |    1,023 ms |               460 ms |         391 ms |     292 ms | 276.5 KiB | 111.8 KiB |
| Auto-resolver + props:true |    1,047 ms |               480 ms |         393 ms |     392 ms | 277.6 KiB | 112.1 KiB |

App type-check wall times are within 24 ms of each other. This sample does not
show a material type-check regression for generated routing. Relative to
classic, the build adds about 69 ms for auto-routes, 50 ms for auto-resolver,
and 150 ms for the props macro variant. Compared with the plain resolver,
the props macro variant adds about 99 ms to the build. It adds 50 macro inputs;
these measurements do not isolate the macro transformation phase.

| App compiler measurement |   Classic | Auto-routes | Auto-resolver | Resolver props |
| ------------------------ | --------: | ----------: | ------------: | -------------: |
| Program setup            |    340 ms |      350 ms |        350 ms |         360 ms |
| Binding                  |     50 ms |       60 ms |         60 ms |          60 ms |
| Type instantiations      |    80,206 |      53,102 |        53,097 |         53,364 |
| Reported memory          | 230.5 MiB |   220.2 MiB |     221.2 MiB |      233.3 MiB |

Checking is the largest compiler phase, followed by program setup. The classic
array checks 50 imported lazy page component types against `RouteRecordRaw`,
while the generated route arrays and resolvers enter through declarations.
The classic project creates about 51% more type instantiations. This distinction
is part of the requested router comparison, not a router-source alias confound.

## What takes the most type-check time

The separate traces show these largest inclusive file costs:

| Project        | Largest file    |    Time | Next largest file    |    Time |
| -------------- | --------------- | ------: | -------------------- | ------: |
| Classic        | `src/router.ts` | 74.3 ms | `src/App.vue`        | 64.5 ms |
| Auto-routes    | `src/App.vue`   | 67.4 ms | Assets activity page | 22.7 ms |
| Auto-resolver  | `src/App.vue`   | 69.6 ms | Assets activity page | 25.4 ms |
| Resolver props | `src/App.vue`   | 74.5 ms | Assets activity page | 24.0 ms |

`App.vue` checks the 50-link navigation and global router component slots.
Classic `router.ts` also checks the 50 lazy component imports. Vue
`ComponentOptionsBase` comparisons are the largest recorded type relations in
all four traces, at 18–21 ms. The evidence points to component type relations,
the explicit classic route array, and the aggregate page workload. It does not
show a large generated-route union bottleneck in this example.

File times depend on check order and type caches. Trace times include nested
work and tracing overhead. Five samples are enough for a local baseline, not
for a claim that a difference of a few milliseconds is stable.

## Props contract gap

All 50 props-variant pages contain the requested literal
`definePage({ props: true })`, declare the optional path props, and display the
source of their params. The browser checks found `route` on all 50 pages and
after changing the record ID. Thus these build and type timings measure the
requested configuration, while the runtime uses the shared route fallback.
They do not measure a working resolver route-props implementation.

Public macro types accept this input. Current experimental normalization keeps
the raw boolean, while `RouterView` reads `record.props.default`. Relevant code:
`packages/router/src/experimental/router.ts` (`normalizeRouteRecord`) and
`packages/router/src/RouterView.ts` (named-view props selection). No router
runtime code was changed. The smoke script marks `props-contract-gap` and exits
1, so this limitation cannot become a silent pass.

## Artifacts and repeat command

```sh
node perf-checks/setup.mjs
node perf-checks/measure.mjs --all --runs 5 --trace
node perf-checks/smoke.mjs
```

`results/summary.json` preserves every timing sample, compiler diagnostic,
version, source-copy validation, trace summary, and bundle size.
`results/smoke.json` preserves every tested route and the observed parameter
source. Full logs and traces are under the corresponding project results
folders. These machine-specific outputs are ignored; this report is retained.
