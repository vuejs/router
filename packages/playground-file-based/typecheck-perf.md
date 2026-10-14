# Type checking performance review

Run `node packages/playground-file-based/typecheck-perf.mjs` from the repository
root, or `pnpm --dir packages/playground-file-based types:perf`.
The runner uses the installed **vue-tsc**, including Vue templates and the two
router Volar plugins. It checks the app and node projects separately. It records
five runs without incremental reuse, then one trace per project. Logs, traces,
type tables, and `summary.json` go to `node_modules/.cache/typecheck-perf` in this
playground. Existing type errors stay in the logs; they do not stop measurement.
An invocation failure or missing timing data stops the runner.
The runner creates measurement configs with project references removed and
`composite: false`. Each project is checked separately without build artifacts.

## Results

Measured on 2026-10-14 with vue-tsc 3.3.12 and TypeScript 6.0.3. Each run starts a
new process; filesystem caches remain warm. Times below are medians of five runs
without tracing. The router imports resolve to the current local `dist`
declarations. Rebuild the router before measuring changes to its source types.

| Measurement                        |     App | Vite config |
| ---------------------------------- | ------: | ----------: |
| Process wall time                  |  735 ms |      383 ms |
| Compiler total                     |  560 ms |      260 ms |
| Program setup                      |  260 ms |      180 ms |
| Parse time (part of program setup) |  140 ms |      120 ms |
| Bind time                          |   70 ms |       60 ms |
| Check time                         |  250 ms |       20 ms |
| Files                              |     298 |         276 |
| Type instantiations                |  29,711 |         382 |
| Memory reported by compiler        | 193 MiB |     139 MiB |

Program setup is the largest compiler phase overall. It includes parsing and
module resolution. The Vite config loads 127,411 lines of declarations for 51
lines of application TypeScript. App checking takes almost as long as its
program setup. The gap between wall time and compiler total includes CLI startup
and work outside TypeScript's phase timers; these measurements do not isolate
that work.

## App checking costs

The separate trace gave these inclusive file check times:

| File                               | Check time |
| ---------------------------------- | ---------: |
| `src/App.vue`                      |    85.5 ms |
| `src/pages/test-params/(list).vue` |    32.9 ms |
| `src/pages/b.vue`                  |    18.8 ms |
| `src/router/resolver.ts`           |    10.6 ms |
| `src/main.ts`                      |    10.5 ms |
| `src/pages/[...path].vue`          |    10.1 ms |
| `src/pages/(packages)/_parent.vue` |     8.3 ms |
| `src/params/month-valibot.ts`      |     7.1 ms |

`App.vue` accounts for about one third of app checking in the trace. It checks
global router components, scoped link slots, `$route`, and navigation calls.
The largest recorded type relation takes 16.1 ms and compares Vue's
`ComponentOptionsBase` types. Its nested variance calculation takes 16.0 ms;
these are the same work and must not be added together. A second independent
trace also put `App.vue` first (81.0 ms) and the link list second (34.6 ms).

The link list has 47 `RouterLink` uses. This makes link destination and slot
typing a useful target for further profiling. Source review also found
`UnwrapRef<UseLinkReturn>` in RouterLink slot typing and mapped route unions in
`RouteLocationRaw`. These are candidates, not measured root causes. The current
trace does not establish recursive route unwrapping or parser schemas as the
main cost. Type results can be cached across files, so file costs depend on
check order. Tracing adds overhead, and short timings vary between runs.

## Check coverage and next steps

- The current `types` script runs `vue-tsc --noEmit` against `tsconfig.json`,
  which has `files: []` and project references. The measured invocation checks
  **zero files**. Use explicit `-p tsconfig.app.json` and `-p tsconfig.node.json`
  commands for actual checking. This review leaves the existing script intact.
- The app reports TS6133 for `router` in `[...path].vue` and `route` in
  `about.vue`, and TS6196 for `Route` and `RouteOther` in
  `users/sub-[first]-[second].vue`. Its exit code is 2. The node check passes.
- Both configs use `skipLibCheck`. Imported declaration types still cost time
  when the app uses them. Generated route types also remain relevant despite
  `@ts-nocheck` in the generated declaration file.
- There is no large check-time bottleneck in this baseline. First ensure that
  the normal type command covers the app. For optimization, measure changes to
  Vue component relations and RouterLink typing against this baseline. Keep
  page-specific route types and slot behavior: these are public features.

Open `app-trace/trace.json` or `node-trace/trace.json` in a Chrome trace viewer or
Perfetto. The summary resolves the largest recorded type relation IDs to their
entries in `types.json`. Trace durations are inclusive and can overlap.

## Comparison with the standard playground

Run `pnpm --dir packages/playground types:perf` to measure the standard app with
router source, the same app with router package declarations, and its Vite
config. `tsconfig.perf-package.json` removes only the router source path mapping.
The runner accepts a project directory and a JSON map of labels to config files.
Each playground stores its own results in `node_modules/.cache/typecheck-perf`.

The standard config initially stops before checking with:

```text
error TS6310: Referenced project '…/packages/playground/tsconfig.config.json' may not disable emit.
```

The measurement configs remove references to permit independent app and config
checks. No application files or normal type-check configs were changed.
Both app variants report existing type errors, including invalid route names and
parameter access. The standard playground has a hand-written `RouteNamedMap`;
it does not use file-based routing, but it does use typed routes. Both Vite
config checks pass.

These are five-run medians from a fresh comparison on the same machine, with
the same vue-tsc and TypeScript versions as the baseline:

| App measurement           | Standard, router source | Standard, router package | File based, router package |
| ------------------------- | ----------------------: | -----------------------: | -------------------------: |
| Process wall time         |                  900 ms |                   555 ms |                     748 ms |
| Compiler total            |                  760 ms |                   420 ms |                     580 ms |
| Program setup             |                  210 ms |                   170 ms |                     260 ms |
| Bind time                 |                   60 ms |                    50 ms |                      70 ms |
| Check time                |                  480 ms |                   190 ms |                     260 ms |
| Files in compiler program |                     171 |                       99 |                        298 |
| Type instantiations       |                  74,087 |                   24,597 |                     29,711 |
| Compiler memory           |                 205 MiB |                  152 MiB |                    193 MiB |

With package declarations in both apps, the file-based playground takes
**70 ms more checking time (+37%)** and **193 ms more wall time (+35%)**.
It creates 21% more type instantiations. Its largest compiler phase is program
setup at 260 ms, tied with checking. It loads about three times as many files.

The normal standard app checks router implementation code. In its trace, the
largest file costs are router `navigationGuards.ts` (85.3 ms), `router.ts`
(45.8 ms), experimental `scroll-restoration.ts` (30.1 ms), and `RouterLink.ts`
(29.8 ms). Switching that app to package declarations reduces checking from
480 ms to 190 ms. With declarations, its largest costs are `views/Home.vue`
(59.4 ms), `App.vue` (34.0 ms), app `router.ts` (30.0 ms), and `views/Nested.vue`
(22.9 ms). Vue component type relations occur in both playgrounds.

The file-based app trace again puts `App.vue` first (82.7 ms), then the
`test-params/(list).vue` page (37.5 ms). Vite config checks are small in both:
20 ms checking, with wall times of 456 ms standard and 424 ms file based.

This compares two different applications. The standard app has 13 Vue files;
the file-based app has 56, more application code, generated route declarations,
custom parameter parsers, Zod/Valibot/Semver dependencies, two router Volar
plugins, and extra lint checks. Both inherit strict mode and `skipLibCheck`.
The measured difference therefore does **not** isolate the cost of file-based
routing. A controlled comparison would need the same pages and route operations
with manual and generated routing. The evidence here points to modest added
app checking and declaration-loading cost, rather than a large routing-specific
type bottleneck.
