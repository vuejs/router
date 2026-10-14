# Router performance checks

Four copies of a workspace operations console, with 50 lazy-loaded pages each:

| Folder                | Router                                                            |
| --------------------- | ----------------------------------------------------------------- |
| `classic`             | `createRouter()` with a hand-written `RouteRecordRaw[]`           |
| `auto-routes`         | `createRouter()` with `vue-router/auto-routes`                    |
| `auto-resolver`       | `experimental_createRouter()` with `vue-router/auto-resolver`     |
| `auto-resolver-props` | The same resolver plus `definePage({ props: true })` on each page |

The classic project was checked first, before the other projects were copied.
All have the same 10 sections and five views per section: overview, activity,
settings, members, and metrics. Every page uses two path params, typed filters,
a generic table with scoped slots, a typed edit form, computed summaries,
activity union types, named navigation, and scoped `RouterLink` slots.

## Run

Install the repository dependencies and build the router first. These fixtures
use the repository's built router package, not router source path aliases.

```sh
node perf-checks/setup.mjs
node perf-checks/measure.mjs --all --runs 5 --trace
node perf-checks/smoke.mjs
```

The setup script links each fixture's `node_modules` to the file-based
playground's installed dependencies. This keeps dependency versions identical
and avoids four separate installs. Fixtures are outside the pnpm workspace.
The measurement script resolves and runs the installed `vue-tsc` and Vite with
Node. It does not install packages.

For one fixture or a faster sample:

```sh
node perf-checks/measure.mjs classic --runs 3
```

To inspect a build, run Vite preview from that fixture directory:

```sh
cd perf-checks/classic
node node_modules/vite/bin/vite.js preview
```

## Measurements and controls

The script first checks that every selected project has 50 pages and the same
application source. `src/router.ts` and generated `src/routes.d.ts` are excluded
from byte comparison. The props variant can add exactly one
`definePage({ props: true })` line per page; every remaining byte must match.
The same entry file registers the global router components in all variants.

All projects use strict app checks, the same lint options and `skipLibCheck`,
the same Vite build settings, and the same dependency installation. Generated
variants enable both router Volar plugins. The classic router has generic route
types; generated variants have the generated route map and page-specific types.
That type-safety difference is part of the comparison.

Each measurement starts a fresh process. One unmeasured Vite build generates
route declarations before app checking. App and Vite config checks run with
explicit configs, `vue-tsc --noEmit --incremental false --extendedDiagnostics`.
Production builds run separately. Any type-check or build error stops the run.
Medians use warm filesystem caches; these are not cold install timings.

Output goes to the ignored `results` folder:

- `summary.json`: versions, machine, copy checks, samples, medians, compiler
  phases, memory, type instantiations, and production bundle sizes.
- `<fixture>/*.log`: full command output.
- `<fixture>/trace-app`: TypeScript trace and type table, when `--trace` is used.
  The summary lists the largest inclusive file checks and type relations.
- `smoke.json`: browser checks of all 50 routes per project, filtering, saved
  edits, parameter updates, and the observed parameter source.

Trace runs do not contribute to timing medians. Trace spans can overlap and
must not be added as if they were independent. Bundle sizes sum all emitted JS
chunks; they do not represent the initial page download. Gzip sizes compress
each file separately.

The browser script uses `agent-browser` and local preview servers. It needs the
browser tool installed, a browser available, and permission to bind local ports.
It runs against the production builds from the measurement script.

## Resolver props status

The requested `props: true` input is preserved in the props fixture. Pages
declare optional props and fall back to route params, so the app remains usable.
The visible parameter-source label and browser checks distinguish the two.

The current experimental resolver accepts this macro input but preserves the
boolean in record normalization. `RouterView` reads a named-view props map.
Consequently, the page does not receive the route props. The browser script
reports `props-contract-gap` and exits with code 1 for this behavior. Navigation
and form checks still run for all four projects. It will pass automatically when
the resolver supplies the page props. This benchmark does not change router
runtime behavior.

See [REPORT.md](./REPORT.md) for the measured status.
