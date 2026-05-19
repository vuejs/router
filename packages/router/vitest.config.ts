import { defineConfig } from 'vitest/config'
import Vue from '@vitejs/plugin-vue'
import { fileURLToPath } from 'node:url'

const resolveDep = (specifier: string) =>
  fileURLToPath(import.meta.resolve(specifier))

export default defineConfig({
  define: {
    __DEV__: true,
    __TEST__: true,
    __BROWSER__: true,
    __FEATURE_PROD_DEVTOOLS__: false,
    __STRIP_DEVTOOLS__: true,
  },
  // Vue 3.6 beta packages expose vapor symbols only through their
  // esm-bundler entries; the CJS bundles selected by Node's `node`
  // export condition omit `defineVaporComponent` and the internal
  // symbols `@vue/runtime-vapor` re-imports from `@vue/runtime-dom`.
  // We force every @vue/* package — and @vue/test-utils, which is
  // also CJS-by-default and would otherwise pull in a second copy of
  // Vue via `require('vue')` — to its esm-bundler build so the whole
  // graph shares one Vue instance.
  // `vue.esm-bundler.js` (not the runtime-only variant) is needed
  // because some tests mount components with string `template:`.
  resolve: {
    alias: {
      vue: resolveDep('vue/dist/vue.esm-bundler.js'),
      '@vue/runtime-core': resolveDep(
        '@vue/runtime-core/dist/runtime-core.esm-bundler.js'
      ),
      '@vue/runtime-dom': resolveDep(
        '@vue/runtime-dom/dist/runtime-dom.esm-bundler.js'
      ),
      '@vue/runtime-vapor': resolveDep(
        '@vue/runtime-vapor/dist/runtime-vapor.esm-bundler.js'
      ),
      '@vue/reactivity': resolveDep(
        '@vue/reactivity/dist/reactivity.esm-bundler.js'
      ),
      '@vue/shared': resolveDep('@vue/shared/dist/shared.esm-bundler.js'),
      // `@vue/test-utils` doesn't expose its esm-bundler build in
      // `exports`, so `import.meta.resolve` can't reach it — use the
      // local node_modules path directly.
      '@vue/test-utils': fileURLToPath(
        new URL(
          './node_modules/@vue/test-utils/dist/vue-test-utils.esm-bundler.mjs',
          import.meta.url
        )
      ),
      '@vue/server-renderer': resolveDep(
        '@vue/server-renderer/dist/server-renderer.esm-bundler.js'
      ),
    },
  },
  plugins: [Vue()],

  test: {
    // Inline every dep so the aliases above apply transitively.
    // Without this, externalised modules are loaded by Node's resolver
    // (which picks the `node`/CJS condition), bypassing our aliases and
    // re-introducing a second Vue instance.
    server: {
      deps: {
        inline: [/.*/],
      },
    },
    // open: false,
    include: ['__tests__/**/*.spec.ts', 'src/**/*.spec.ts'],
    exclude: [
      'src/**/*.test-d.ts',
      // Playwright handles HMR E2E tests
      'e2e/unplugin/hmr/**',
    ],
    coverage: {
      include: ['src/**/*.ts'],
      exclude: [
        'src/**/*.d.ts',
        'src/**/*.test-d.ts',
        'src/**/*.spec.ts',
        // '/node_modules/',
        'src/index.ts',
        'src/devtools.ts',
        'src/experimental/index.ts',
        'src/**/test-utils.ts',
        // Unplugin entry points
        'src/unplugin/index.ts',
        'src/unplugin/vite.ts',
        'src/unplugin/webpack.ts',
        'src/unplugin/rollup.ts',
        'src/unplugin/rolldown.ts',
        'src/unplugin/esbuild.ts',
        'src/unplugin/types.ts',
        // Volar
        'src/volar/**',
      ],
    },
    typecheck: {
      enabled: true,
      checker: 'vue-tsc',
      // only: true,
      // by default it includes all specs too
      include: ['src/**/*.test-d.ts'],
      // source type errors are already covered by test:types (tsc --build)
      // vitest uses --incremental with a shared tsBuildInfoFile that can go
      // stale and produce phantom errors in source files
      ignoreSourceErrors: true,

      // tsconfig: './tsconfig.typecheck.json',
    },
    // projects: [
    //   {
    //     test: {
    //       name: 'router:browser',
    //       include: ['./__tests__/history/html5.spec.ts'],
    //       browser: {
    //         enabled: true,
    //         provider: 'playwright',
    //         // https://vitest.dev/guide/browser/playwright
    //         instances: [
    //           { browser: 'chromium' },
    //           // { browser: 'firefox' },
    //           // { browser: 'webkit' },
    //         ],
    //       },
    //     },
    //   },
    // ],
  },
})
