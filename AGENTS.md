# AGENTS.md

Before you declare a bug fixed or behavior supported, check the relevant public contract: docs, types, and tests. Distinguish runtime behavior from behavior users can rely on. Report gaps or conflicts before you choose a fix.

In codegen specs (e.g. `generateRouteResolver.spec.ts`), assert generated code with inline snapshots or `toContain`. Do not evaluate generated code with `new Function`. Test runtime behavior in the runtime matcher specs.
