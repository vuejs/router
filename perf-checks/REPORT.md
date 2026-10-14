# Performance report

Measured on 2026-10-14. Apple M5 Pro, Node 26.9.0, vue-tsc 3.3.12, TypeScript 6.0.3, Vue 3.5.43, Vite 8.3.3, local vue-router 5.4.0 build. Medians of 5 runs, warm file cache, no incremental type-check.

## Results

| Project             | App vue-tsc | Check phase | Vite build | Type instantiations |    Memory |
| ------------------- | ----------: | ----------: | ---------: | ------------------: | --------: |
| classic             |      957 ms |      450 ms |     224 ms |              80,206 | 221.0 MiB |
| auto-routes         |      960 ms |      430 ms |     288 ms |              53,102 | 220.9 MiB |
| auto-resolver       |      964 ms |      440 ms |     286 ms |              53,097 | 221.6 MiB |
| auto-resolver-props |    1,027 ms |      490 ms |     405 ms |              60,304 | 221.2 MiB |

All type-checks, builds, and browser checks pass. In `auto-resolver-props`, all 50 pages get the route params as props.

## Summary

- **Type-check:** `classic`, `auto-routes`, and `auto-resolver` are within 7 ms. `auto-resolver-props` adds about 60 ms (50 ms in the check phase).
- **Instantiations:** `classic` has about 51% more than `auto-resolver`. It checks 50 lazy page imports against `RouteRecordRaw`. The generated projects get their routes from declarations. `auto-resolver-props` has about 14% more than `auto-resolver` (about 144 per page). The `sfc-typed-router` plugin checks `props: true` against the route params and the page props, and adds the params to `defineProps()`.
- **Build:** the generated projects add about 60 ms for the `vue-router/vite` plugin. The props variant adds about 120 ms more. The plugin transforms the 50 `definePage()` macros and adds the params to `defineProps()`.
- **Slowest files (traces):** `src/App.vue` (about 70 ms, 50 links and router component slots) in all projects, and `src/router.ts` (62 ms) in `classic`. In `auto-resolver-props`, the extra cost is spread over the 50 pages. No single file stands out. No large route union cost is visible.

Five runs give a local baseline. Differences of a few milliseconds are noise. A first pass on the same machine had more noise (up to 180 ms between runs of one project), but showed the same props costs.
