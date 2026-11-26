global.__VUE_PROD_DEVTOOLS__ = false
// the esm build keeps the bare `__VUE_OPTIONS_API__` identifier so bundlers can
// replace and tree-shake it; without one, fall back to Vue's own default
global.__VUE_OPTIONS_API__ ??= true
export * from './dist/vue-router.js'
