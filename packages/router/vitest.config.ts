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
  // Node's `node` export condition selects the CJS builds of vue, which lack
  // the Vapor exports. Alias every @vue/* package (and @vue/test-utils, which
  // would otherwise `require('vue')` a second copy) to its esm-bundler build so
  // the whole graph shares one Vue instance. The full `vue.esm-bundler.js` is
  // needed because tests mount components with string `template:`.
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
      '@vue/server-renderer': resolveDep(
        '@vue/server-renderer/dist/server-renderer.esm-bundler.js'
      ),
      // not in its `exports`, so `import.meta.resolve` can't reach it
      '@vue/test-utils': fileURLToPath(
        new URL(
          './node_modules/@vue/test-utils/dist/vue-test-utils.esm-bundler.mjs',
          import.meta.url
        )
      ),
    },
  },
  plugins: [Vue()],

  test: {
    // inline every dep so the aliases above apply transitively
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
        'src/experimental/vapor/index.ts',
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
      enabled: false,
      checker: 'vue-tsc',
      // only: true,
      // by default it includes all specs too
      include: ['src/**/*.test-d.ts', 'test-dts/**/*.test-d.ts'],
      // source type errors are already covered by test:types (tsc --build)
      // vitest uses --incremental with a shared tsBuildInfoFile that can go
      // stale and produce phantom errors in source files
      ignoreSourceErrors: true,
      // FIXME: but it ignores the errors so kinda useless, so disabled

      // tsconfig: './test-dts/tsconfig.json',
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
