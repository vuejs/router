global.__VUE_PROD_DEVTOOLS__ = false
// should ideally be set in the build step or by a framework like Nuxt
global.__VUE_OPTIONS_API__ ??= true
export * from './dist/vue-router.js'
