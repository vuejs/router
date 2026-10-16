# AGENTS.md

Before you declare a bug fixed or behavior supported, check the relevant public contract: docs, types, and tests. Distinguish runtime behavior from behavior users can rely on. Report gaps or conflicts before you choose a fix.

In codegen specs (e.g. `generateRouteResolver.spec.ts`), assert generated code with inline snapshots or `toContain`. Do not evaluate generated code with `new Function`. Test runtime behavior in the runtime matcher specs.

## Skills

### `skills/migrate-v5-experimental-router`

Keep this skill in sync with file-based routing, the experimental router, param parsers, and scroll restoration. Reference paths below are relative to this skill.

#### Behavior and features

- Update the matching reference when you change `experimental_createRouter`, the resolver, matchers, param parsers, `definePage()` resolver codegen, `ScrollRestoration`, or `onRouteRendered` behavior.
- When you implement a missing feature (for example `addRoute()`, `props`, or `definePage()` path overrides), remove it from `references/limitations.md` and document the new API.

#### Diagnostics

Add new diagnostics used by these features to `references/diagnostics.md`.
