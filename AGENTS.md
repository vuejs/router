# AGENTS.md

Before you declare a bug fixed or behavior supported, check the relevant public contract: docs, types, and tests. Distinguish runtime behavior from behavior users can rely on. Report gaps or conflicts before you choose a fix.

In codegen specs (e.g. `generateRouteResolver.spec.ts`), assert generated code with inline snapshots or `toContain`. Do not evaluate generated code with `new Function`. Test runtime behavior in the runtime matcher specs.

## Skill: `skills/migrate-v5-experimental-router`

This skill documents the migration to file-based routing, the experimental router, param parsers, and scroll restoration. Keep it in sync with the code:

- When you add, remove, or rename an export in `packages/router/src/experimental/index.ts`, update `skills/migrate-v5-experimental-router/references/exports.md` and the reference that covers the feature. Then run `node skills/migrate-v5-experimental-router/scripts/check-exports.mjs`. It must pass.
- When you change behavior of `experimental_createRouter`, the resolver, matchers, param parsers, `definePage()` codegen for the resolver, `ScrollRestoration`, or `onRouteRendered`, update the matching reference file.
- When you implement a missing feature (for example `addRoute()`, `props`, or `definePage()` path overrides), remove it from `references/limitations.md` and document the new API.
- When you add a diagnostic used by these features, add it to `references/diagnostics.md`.
