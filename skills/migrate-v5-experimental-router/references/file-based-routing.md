# Phase 1: File-based routing

Goal: replace the `routes` array with files in `src/pages/`. Keep the **stable** `createRouter()` in this phase. The plugin generates `vue-router/auto-routes` (for the stable router) and `vue-router/auto-resolver` (for the experimental router) from the same files.

Docs: `packages/docs/file-based-routing/`.

## 1. Install the plugin

```ts
// vite.config.ts
import { defineConfig } from 'vite'
import Vue from '@vitejs/plugin-vue'
import VueRouter from 'vue-router/vite'

export default defineConfig({
  plugins: [
    VueRouter({
      // put the route map inside src/ so tsconfig includes it
      dts: 'src/route-map.d.ts',
    }),
    // VueRouter() must come before Vue()
    Vue(),
  ],
})
```

Other bundlers: `vue-router/unplugin/rollup`, `vue-router/unplugin/webpack`, `vue-router/unplugin/esbuild`, or `import VueRouter from 'vue-router/unplugin'` then `VueRouter.webpack({})`.

SSR in dev: add `ssr: { noExternal: mode === 'development' ? ['vue-router'] : [] }` if the dev server fails to resolve virtual modules.

## 2. TypeScript

- Start the dev server once. It writes the route map (`typed-router.d.ts` by default, or the `dts` path).
- Include that file in `tsconfig.json` (or `tsconfig.app.json`). Use `"moduleResolution": "Bundler"`.
- Add the Volar plugins:

```jsonc
{
  "vueCompilerOptions": {
    "plugins": [
      "vue-router/volar/sfc-route-blocks",
      "vue-router/volar/sfc-typed-router",
    ],
  },
}
```

`sfc-typed-router` types `useRoute()` from the current page file, so `useRoute()` without a name gives typed params inside a page.

ESLint: add `definePage` as a readonly global. If you do not use auto imports, add `vue-router/auto-routes` to `import/core-modules`.

## 3. Use the generated routes

```ts
// src/router.ts
import { createRouter, createWebHistory } from 'vue-router'
import { routes, handleHotUpdate } from 'vue-router/auto-routes'

export const router = createRouter({
  history: createWebHistory(),
  routes,
})

if (import.meta.hot) handleHotUpdate(router)
```

## 4. Move and rename the components

Use the route map from the audit. Move each component to `src/pages/` and name it with these rules.

| Route record                                             | File                                                     |
| -------------------------------------------------------- | -------------------------------------------------------- |
| `/`                                                      | `index.vue`                                              |
| `/about`                                                 | `about.vue`                                              |
| `/users` (no layout)                                     | `users/index.vue`                                        |
| `/users` layout with `children`                          | `users.vue` (or `users/_parent.vue`) + `users/index.vue` |
| `/users/:id`                                             | `users/[id].vue`                                         |
| `/users/:id?`                                            | `users/[[id]].vue`                                       |
| `/files/:path+`                                          | `files/[path]+.vue`                                      |
| `/files/:path*`                                          | `files/[[path]]+.vue`                                    |
| `/:pathMatch(.*)*` (404)                                 | `[...path].vue`                                          |
| `/users_:id` (param inside a segment)                    | `users_[id].vue`                                         |
| `/users/create` **not** nested in the `users.vue` layout | `users.create.vue`                                       |
| shared layout without a URL segment                      | `(admin)/_parent.vue` + `(admin)/dashboard.vue`          |
| named view `aux`                                         | `index@aux.vue`                                          |

Notes:

- `index.vue` must be lowercase.
- A file next to a folder with the same name is the parent layout. It must contain `<RouterView>`.
- `_parent.vue` inside a folder is the same as the sibling file. Do not define both.
- A folder with no parent component creates a pass-through node with no component.
- `(group)` folders do not add a URL segment.
- Every route with a component gets a name. The default name is the file path, for example `/users/[id]`. To keep old names, use `definePage({ name: 'user' })`. Or keep the generated names and update the `push({ name })` calls. TypeScript shows the call sites to change.
- The old `:pathMatch(.*)*` param is now named after the file: `[...path].vue` gives `route.params.path`.
- Custom regexps like `:id(\\d+)` have no file syntax. With the stable router, keep them out of the file name and validate in the page or a guard. In phase 3, replace them with a param parser (`[id=int].vue`) or a `re` option.

## 5. Move route options into the pages

Use `definePage()` in `<script setup>`:

```vue
<script setup lang="ts">
definePage({
  name: 'user',
  alias: ['/u/:id'],
  meta: { requiresAuth: true },
})
</script>
```

Rules:

- Use only literals and imported values. Do not reference `<script setup>` bindings (`B0002`).
- One call per file (`B0020`).
- Do not use `beforeEnter` in `definePage()`. Use `meta` + a global guard.
- `<route lang="json">` / `yaml` / `json5` custom blocks also work, for apps that come from vite-plugin-pages.

Options you cannot express per page:

- `meta` for a folder or group with no component: use `beforeWriteFiles(root)` in the plugin options and `route.addToMeta({...})` on the pass-through node.
- Extra routes: use `extendRoute(route)` (for example `route.addAlias()`) or `beforeWriteFiles(root)` with `root.insert(path, file)`. These changes appear in the types.

## 6. Runtime changes to `routes`

With the stable router you can still change the `routes` array before `createRouter()`, or call `router.addRoute()`. These changes are not typed. HMR removes them, so re-add them in the `handleHotUpdate(router, newRoutes => {...})` callback.

> [!IMPORTANT]
> The experimental router (phase 2) has **no** `addRoute()`. Move every runtime change to build time now. See [limitations.md](limitations.md#dynamic-routing).

## 7. Check phase 1

- Every old URL still opens the same component.
- Every `push({ name })` compiles.
- The 404 page shows for an unknown URL.
- Commit only when the user asks.
