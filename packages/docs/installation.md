# Installation

<VueMasteryLogoLink></VueMasteryLogoLink>

## Package managers

If you have an existing project that uses a JavaScript package manager, you can install Vue Router from the npm registry:

::: code-group

```bash [npm]
npm install vue-router@4
```

```bash [yarn]
yarn add vue-router@4
```

```bash [pnpm]
pnpm add vue-router@4
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

:::

You'll be prompted with some questions about the kind of project you want to create. If you choose to install Vue Router, the example application will also demonstrate some of Vue Router's core features.

Projects using package managers will typically use ES modules to access Vue Router, e.g. `import { createRouter } from 'vue-router'`.

## Direct Download / CDN

[https://unpkg.com/vue-router@4](https://unpkg.com/vue-router@4)

<!--email_off-->

[Unpkg.com](https://unpkg.com) provides npm-based CDN links. The above link will always point to the latest release on npm. You can also use a specific version/tag via URLs like `https://unpkg.com/vue-router@4.0.15/dist/vue-router.global.js`.

<!--/email_off-->

This will expose Vue Router via a global `VueRouter` object, e.g. `VueRouter.createRouter(...)`.
