---
# Updated automatically in Netlify builds: see the VitePress config.
packageVersions:
  vue: 3.5.28
  vue-router: 5.0.2
  '@vue/devtools-api': 8.0.6
---

# Installation

<VueMasteryLogoLink></VueMasteryLogoLink>

## Package managers

If you have an existing project that uses a JavaScript package manager, you can install Vue Router from the npm registry:

::: code-group

```bash [npm]
npm install vue-router
```

```bash [yarn]
yarn add vue-router
```

```bash [pnpm]
pnpm add vue-router
```

```bash [bun]
bun add vue-router
```

:::

If you're starting a new project, you might find it easier to use the [create-vue](https://github.com/vuejs/create-vue) scaffolding tool, which creates a Vite-based project with the option to include Vue Router:

::: code-group

```bash [npm]
npm create vue@latest
```

```bash [yarn]
yarn create vue
```

```bash [pnpm]
pnpm create vue
```

```bash [bun]
bun create vue
```

:::

You'll be prompted with some questions about the kind of project you want to create. If you choose to install Vue Router, the example application will also demonstrate some of Vue Router's core features.

Projects using package managers will typically use ES modules to access Vue Router, e.g. `import { createRouter } from 'vue-router'`.

## Direct Download / CDN

If you don't want to use a bundler, you can instead load Vue Router directly into the browser, either via a CDN or by downloading the relevant files and hosting them yourself.

Vue Router provides multiple pre-built files to cover a variety of use cases, similar to Vue. If you aren't already familiar with how Vue handles this, we recommend reading about that first:

- <https://vuejs.org/guide/quick-start.html#using-vue-from-cdn>

Vue Router supports both **_ES module_** and **_global_** builds. We recommend using ES modules where possible.

Whichever approach you choose, it's important to pin versions for the libraries you're using, especially in production. This means you should include the exact version you want to use in the CDN URLs, rather than allowing the CDN to choose the latest version for you.

Each build comes with a development and production version. The development versions are significantly larger but include extra code to aid with debugging. The production versions have `.prod` in their names.

### Using ES modules

```html-vue
<script type="importmap">
  {
    "imports": {
      "vue": "https://unpkg.com/vue@{{ $frontmatter.packageVersions.vue }}/dist/vue.esm-browser.js",
      "vue-router": "https://unpkg.com/vue-router@{{ $frontmatter.packageVersions['vue-router'] }}/dist/vue-router.esm-browser.js",
      "@vue/devtools-api": "https://unpkg.com/@vue/devtools-api@{{ $frontmatter.packageVersions['@vue/devtools-api'] }}/dist/vue-devtools-api.esm-browser.js"
    }
  }
</script>
<script type="module">
  import { createApp } from 'vue'
  import { createRouter } from 'vue-router'

  // ...
</script>
```

`@vue/devtools-api` is only needed when using the development build of Vue Router. It can be removed when using the production build, `vue-router.esm-browser.prod.js`.

### Using the global build

```html-vue
<script src="https://unpkg.com/vue@{{ $frontmatter.packageVersions.vue }}/dist/vue.global.js"></script>
<script src="https://unpkg.com/vue-router@{{ $frontmatter.packageVersions['vue-router'] }}/dist/vue-router.global.js"></script>
<script>
  const { createApp } = Vue
  const { createRouter } = VueRouter

  // ...
</script>
```

The corresponding production build of Vue Router is called `vue-router.global.prod.js`.

<RuleKitLink />
