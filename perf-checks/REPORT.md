# Performance report

Measured on 2026-10-14. Apple M5 Pro, Node 26.9.0, vue-tsc 3.3.12, TypeScript 6.0.3, Vue 3.5.43, Vite 8.3.3, local vue-router 5.4.0 build. Medians of 5 runs, warm file cache, no incremental type-check.

## Results

| Project             | App vue-tsc | Check phase | Vite build | Type instantiations |    Memory |
| ------------------- | ----------: | ----------: | ---------: | ------------------: | --------: |
| classic             |    1,029 ms |      480 ms |     242 ms |              80,206 | 230.5 MiB |
| auto-routes         |    1,038 ms |      470 ms |     311 ms |              53,102 | 220.2 MiB |
| auto-resolver       |    1,023 ms |      460 ms |     292 ms |              53,097 | 221.2 MiB |
| auto-resolver-props |    1,047 ms |      480 ms |     392 ms |              53,364 | 233.3 MiB |

All type-checks, builds, and browser checks pass, except the props gap below.

## Summary

- **Type-check:** no real difference. All app checks are within 24 ms.
- **Instantiations:** `classic` has about 51% more. It checks 50 lazy page imports against `RouteRecordRaw`. The generated projects get their routes from declarations.
- **Build:** the generated projects add 50 to 70 ms for the `vue-router/vite` plugin. The props variant adds about 100 ms more for the 50 `definePage()` macros.
- **Slowest files (traces):** `src/App.vue` (about 70 ms, 50 links and router component slots) in all projects, and `src/router.ts` (74 ms) in `classic`. No large route union cost is visible.

Five runs give a local baseline. Differences of a few milliseconds are noise.

## Known gap

`definePage({ props: true })` type-checks and builds, but the page does not receive route props at runtime. The experimental resolver keeps `props: true` as a boolean (`normalizeRouteRecord` in `packages/router/src/experimental/router.ts`). `RouterView` reads `record.props.default`. The pages fall back to `route.params`, so the app still works. `smoke.mjs` reports `props-contract-gap` and exits with code 1 until this is fixed.
