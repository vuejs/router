// necessary for webpack
import { createApp } from 'vue'
import type { ComponentPublicInstance } from 'vue'
import { router, routerHistory } from './router'
import { globalState } from './store'
import App from './App.vue'
import { useRoute, type ParamValue, type RouteRecordInfo } from 'vue-router'

declare global {
  interface Window {
    // h: HTML5History
    h: typeof routerHistory
    r: typeof router
    vm: ComponentPublicInstance
  }
}

// for testing purposes
window.h = routerHistory
window.r = router

const app = createApp(App)
app.mixin({
  beforeRouteEnter() {
    console.log('mixin enter')
  },
})

app.provide('state', globalState)
app.use(router)

window.vm = app.mount('#app')

export interface RouteNamedMap {
  home: RouteRecordInfo<'home', '/', Record<never, never>, Record<never, never>>
  '/[name]': RouteRecordInfo<
    '/[name]',
    '/:name',
    { name: ParamValue<true> },
    { name: ParamValue<false> }
  >
  '/[...path]': RouteRecordInfo<
    '/[...path]',
    '/:path(.*)',
    { path: ParamValue<true> },
    { path: ParamValue<false> }
  >
  long: RouteRecordInfo<
    'long',
    '/long-:n(\\d+)',
    { n: ParamValue<true> },
    { n: ParamValue<false> }
  >
  Nested: RouteRecordInfo<
    'Nested',
    '/nested',
    Record<never, never>,
    Record<never, never>
  >
  'absolute-child': RouteRecordInfo<
    'absolute-child',
    '/nested/also-as-absolute',
    Record<never, never>,
    Record<never, never>
  >
  repeat: RouteRecordInfo<
    'repeat',
    '/rep/:a*',
    { a: ParamValue<true> },
    { a: ParamValue<false> }
  >
}

declare module 'vue-router' {
  interface TypesConfig {
    RouteNamedMap: RouteNamedMap
  }
}

function _ok() {
  const r = useRoute()

  if (r.name === '/[name]') {
    r.params.name.toUpperCase()
    // @ts-expect-error: Not existing route
  } else if (r.name === 'nope') {
    console.log('nope')
  }

  router.push({
    name: '/[name]',
    params: { name: 'hey' },
  })

  router
    .resolve({ name: '/[name]', params: { name: 2 } })
    .params.name.toUpperCase()
}
