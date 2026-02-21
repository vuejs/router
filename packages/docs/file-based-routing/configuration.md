# Configuration

Have a glimpse of all the existing configuration options with their corresponding **default values**:

```ts
import VueRouter from 'vue-router/vite'

VueRouter({
  // how and what folders to scan for files
  routesFolder: [
    {
      src: 'src/pages',
      path: '',
      // override globals
      exclude: excluded => excluded,
      filePatterns: filePatterns => filePatterns,
      extensions: extensions => extensions,
    },
  ],

  // what files should be considered as a pages
  extensions: ['.vue'],

  // what files to include
  filePatterns: ['**/*'],

  // files to exclude from the scan
  exclude: [],

  // where to generate the types
  dts: './typed-router.d.ts',

  // how to generate the route name
  getRouteName: routeNode => getFileBasedRouteName(routeNode),

  // default language for <route> custom blocks
  routeBlockLang: 'json5',

  // how to import routes, can also be a string
  importMode: 'async',

  // where are paths relative to
  root: process.cwd(),

  // options for the path parser
  pathParser: {
    // should `users.[id]` be parsed as `users/:id`?
    dotNesting: true,
  },

  // modify routes individually
  async extendRoute(route) {
    // ...
  },

  // modify routes before writing
  async beforeWriteFiles(rootRoute) {
    // ...
  },
})
```

## SSR

It might be necessary to mark `vue-router` as `noExternal` in your `vite.config.js` in development mode:

```ts{7}
import { defineConfig } from 'vite'
import Vue from '@vitejs/plugin-vue'
import VueRouter from 'vue-router/vite'

export default defineConfig(({ mode }) => ({
  ssr: {
    noExternal: mode === 'development' ? ['vue-router'] : [],
  },
  plugins: [VueRouter(), Vue()],
}))
```
