# Nuxt

To use Data Loaders in Nuxt, create a new plugin file in the `plugins` directory of your Nuxt project and setup the Data Loaders plugin like usual:

```ts
// plugins/data-loaders.ts
import { DataLoaderPlugin } from 'vue-router/experimental'

export default defineNuxtPlugin({
  name: 'data-loaders',
  dependsOn: ['nuxt:router'],
  setup(nuxtApp) {
    const appConfig = useAppConfig()

    nuxtApp.vueApp.use(DataLoaderPlugin, {
      router: nuxtApp.vueApp.config.globalProperties.$router,
      isSSR: import.meta.server,
      // other options...
    })
  },
})
```

The two required options are:

- `router`: the Vue Router instance
- `isSSR`: a boolean indicating if the app is running on the server side

## No module?

> "Why do I need to write the plugin myself instead of using a Module?"

The Data Loader plugin has options that are not serializable (e.g. `selectNavigationResult()` and `errors`). In order to support those within a module, we would have to pass them through the `app.config.ts`, splitting up the configuration and making it harder to maintain. A short plugin is easier to understand and closer to the _vanilla_ version.
