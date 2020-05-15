import { createRouter, useRoute, createWebHashHistory } from '../../src'
import { RouteComponent } from '../../src/types'
import { createApp } from 'vue'

const Home: RouteComponent = {
  template: `<div>home</div>`,
}

const Foo: RouteComponent = { template: '<div>foo</div>' }
const Bar: RouteComponent = { template: '<div>bar</div>' }

const Unicode: RouteComponent = {
  setup() {
    const route = useRoute()
    return { route }
  },
  template: `<div>param: <span id="param">{{ route.params.id }}</span></div>`,
}

const router = createRouter({
  // keep a trailing slash in this specific case because we are using a hash
  // history
  history: createWebHashHistory('/' + __dirname + '/'),
  routes: [
    { path: '/', component: Home },
    { path: '/foo', component: Foo },
    { path: '/bar', component: Bar },
    { path: '/unicode/:id', name: 'unicode', component: Unicode },
    { path: encodeURI('/n/é'), name: 'encoded', component: Foo },
  ],
})

const app = createApp({
  setup() {
    const route = useRoute()
    return { route }
  },

  template: `
    <div id="app">
      <ul>
        <li><router-link to="/">/</router-link></li>
        <li><router-link to="/foo">/foo</router-link></li>
        <li><router-link to="/bar">/bar</router-link></li>
        <li><router-link :to="{ name: 'encoded' }">/n/é</router-link></li>
        <li><router-link to="/unicode/é">/unicode/é</router-link></li>
        <li>
          <router-link :to="{ name: 'unicode', params: { id: 'é' }}"
            >/unicode/é (correctly encoded)</router-link
          >
        </li>
        <li>
          <router-link :to="{ path: '/', query: { t: 'é', 'é': 'e' }}"
            >/?currency=€uro&é=e (object)</router-link
          >
        </li>
        <li>
          <a href="/hash/#/unicode/%E2%82%AC"
            >/unicode/%E2%82%AC (force reload)</a
          >
        </li>
        <li>
          <a href="/hash/#/unicode/€"
            >/unicode/€ (force reload. not valid but should not crash the
            router)</a
          >
        </li>
      </ul>

      <p>
        path: <code id="path">{{ route.path }}</code>
        <br />
        query.t: <code id="query-t">{{ route.query.t }}</code>
        <br />
        hash: <code id="hash">{{ route.hash }}</code>
      </p>

      <router-view></router-view>
    </div>
  `,
})
app.use(router)

window.r = router
window.vm = app.mount('#app')
