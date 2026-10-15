# Performance report

Measured on 2026-10-15. Apple M5 Pro, Node 26.9.0, vue-tsc 3.3.12, TypeScript 6.0.3, Vue 3.5.43, Vite 8.3.3, local vue-router 5.4.0 build. Medians of 5 runs, warm file cache, no incremental type-check.

## Results

| Project             | App vue-tsc | Check phase | Vite build | Type instantiations |    Memory |
| ------------------- | ----------: | ----------: | ---------: | ------------------: | --------: |
| classic             |      843 ms |      350 ms |     213 ms |              36,468 | 222.9 MiB |
| auto-routes         |      893 ms |      390 ms |     325 ms |              40,052 | 220.7 MiB |
| auto-resolver       |      890 ms |      390 ms |     285 ms |              40,047 | 220.9 MiB |
| auto-resolver-props |      899 ms |      400 ms |     410 ms |              44,651 | 213.5 MiB |

All type-checks, builds, and browser checks pass. In `auto-resolver-props`, the pages get the params only from `defineProps()`, and all 50 pages show them.

## Summary

- **Type-check:** the three generated projects are within 10 ms. `classic` is about 50 ms faster (40 ms in the check phase).
- **Instantiations:** `classic` has about 9% fewer than `auto-resolver`. In the generated projects, the `sfc-typed-router` plugin types `useRoute()` in each page with the routes of that file. `auto-resolver-props` has about 11% more than `auto-resolver` (about 92 per page). Its pages do not call `useRoute()`, but the plugin checks `props: true` against the route params and the page props, and adds the params to `defineProps()`.
- **Build:** the generated projects add about 70 to 110 ms for the `vue-router/vite` plugin. The props variant adds about 125 ms more. The plugin transforms the 50 `definePage()` macros and adds the params to `defineProps()`.
- **Slowest files (traces):** `src/App.vue` (56 to 77 ms, 50 links and router component slots) in all projects. Each page takes 5 to 23 ms. The first page that TypeScript checks is the slowest. `src/router.ts` in `classic` takes 5 ms. No large route union cost is visible.

Five runs give a local baseline. Differences of a few milliseconds are noise. Between two full runs on the same machine, the `auto-routes` build changed by 40 ms.
