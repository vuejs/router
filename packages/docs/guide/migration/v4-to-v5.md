# Migrating to Vue Router 5

<RuleKitLink />

> [!TIP]
> Vue Router 5 is a transition release that merges [unplugin-vue-router](https://uvr.esm.is) (file-based routing) into the core package. **If you're using Vue Router 4 without unplugin-vue-router, there are no breaking changes** - you can upgrade without any code modifications. The only exception is that the _iife_ build no longer includes `@vue/devtools-api` because it has been upgraded to v8 and does not expose an IIFE build itself. You can track that change in [this issue](https://github.com/vuejs/devtools/issues/989).
>
> Vue Router 6 will be ESM-only and remove deprecated APIs. v5 gives you time to prepare for that transition.

## For Vue Router 4 Users (without file-based routing)

No breaking changes. Update your dependency and you're done:

```bash
pnpm update vue-router@5
```

## From unplugin-vue-router

If you were using unplugin-vue-router for file-based routing, migration is mostly import path changes.

### Migration Checklist (TLDR)

<script setup>
import MigrationChecklist from '../../.vitepress/theme/components/MigrationChecklist.vue'
</script>

<MigrationChecklist />

### 1. Update Dependencies

```bash
pnpm remove unplugin-vue-router
pnpm update vue-router@5
```

### 2. Update Imports

**Vite plugin:**

<!-- prettier-ignore -->
```ts
import VueRouter from 'unplugin-vue-router/vite' // [!code --]
import VueRouter from 'vue-router/vite' // [!code ++]
```

Other build tools (Webpack, Rollup, esbuild) import from `vue-router/unplugin`:

```ts
import VueRouter from 'vue-router/unplugin'

VueRouter.webpack({
  /* ... */
})
VueRouter.rollup({
  /* ... */
})
// etc.
```

**Data loaders:**

<!-- prettier-ignore -->
```ts
import { defineBasicLoader } from 'unplugin-vue-router/data-loaders/basic' // [!code --]
import { defineColadaLoader } from 'unplugin-vue-router/data-loaders/pinia-colada' // [!code --]
import { DataLoaderPlugin } from 'unplugin-vue-router/data-loaders' // [!code --]
import { defineBasicLoader, DataLoaderPlugin } from 'vue-router/experimental' // [!code ++]
import { defineColadaLoader } from 'vue-router/experimental/pinia-colada' // [!code ++]
```

**Unplugin utilities (for custom integrations):**

<!-- prettier-ignore -->
```ts
import {
  VueRouterAutoImports,
  EditableTreeNode,
  createTreeNodeValue,
  createRoutesContext,
  getFileBasedRouteName,
  getPascalCaseRouteName,
} from 'unplugin-vue-router' // [!code --]
} from 'vue-router/unplugin' // [!code ++]
```

**Types:**

<!-- prettier-ignore -->
```ts
import type { Options, EditableTreeNode } from 'unplugin-vue-router' // [!code --]
import type { Options, EditableTreeNode } from 'vue-router/unplugin' // [!code ++]
```

**Volar plugins:**

<!-- prettier-ignore -->
```jsonc
// tsconfig.json
{
  "compilerOptions": {
    "rootDir": ".",
  },
  "vueCompilerOptions": {
    "plugins": [
      "unplugin-vue-router/volar/sfc-typed-router", // [!code --]
      "unplugin-vue-router/volar/sfc-route-blocks", // [!code --]
    ],
  },
}
```

<!-- prettier-ignore -->
```jsonc
// tsconfig.json
{
  "compilerOptions": {
    "rootDir": ".",
  },
  "vueCompilerOptions": {
    "plugins": [
      "vue-router/volar/sfc-typed-router", // [!code ++]
      "vue-router/volar/sfc-route-blocks", // [!code ++]
    ],
  },
}
```

### 3. Update vite.config.ts and tsconfig.json

It's recommended to move the generated types file inside `src/` and rename it to `route-map.d.ts`, as it's automatically included by most setups:

<!-- prettier-ignore -->
```ts
// vite.config.ts
export default defineConfig({
  plugins: [
    VueRouter({
      dts: 'src/route-map.d.ts', // [!code ++]
    }),
    Vue(),
  ],
})
```

Remove the old client types reference. These were either added to an `env.d.ts`:

<!-- prettier-ignore -->
```ts
/// <reference types="unplugin-vue-router/client" /> // [!code --]
```

or to your `tsconfig.json`:

<!-- prettier-ignore -->
```jsonc
{
  "include": [
    "./typed-router.d.ts", // [!code --]
    "unplugin-vue-router/client", // [!code --]
    // ...
  ],
}
```

## Troubleshooting

**Types not recognized:** Restart your TypeScript server and check that your generated types file (e.g., `src/route-map.d.ts`) is included in your tsconfig.

**Routes not generating:** Verify your `routesFolder` path and check file extensions.

**Route name errors:** Use the generated names or add `definePage({ name: 'custom-name' })` to your components.

## New Exports Reference

| Export                                 | Purpose                            |
| -------------------------------------- | ---------------------------------- |
| `vue-router`                           | Main API (unchanged)               |
| `vue-router/vite`                      | Vite plugin                        |
| `vue-router/auto-routes`               | Generated routes                   |
| `vue-router/unplugin`                  | Webpack/Rollup/esbuild + utilities |
| `vue-router/experimental`              | Data loaders                       |
| `vue-router/experimental/pinia-colada` | Pinia Colada loader                |
