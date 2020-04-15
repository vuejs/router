import { createRouter, createWebHistory, useRoute } from '../../src'
import { RouteComponent } from '../../src/types'
import { createApp } from 'vue'

const component: RouteComponent = {
  template: `<div>A component</div>`,
}

const Home: RouteComponent = {
  template: `<div>Home</div>`,
}

const Document: RouteComponent = {
  template: `<div>Document: {{ route.params.id }}</div>`,
  setup() {
    return { route: useRoute() }
  },
}

const router = createRouter({
  history: createWebHistory('/' + __dirname),
  routes: [
    { path: '/', component: Home, name: 'home' },
    { path: '/documents/:id', name: 'docs', component: Document },
    { path: encodeURI('/n/€'), name: 'euro', component },
  ],
})

const app = createApp({
  setup() {
    const route = useRoute()
    return { route }
  },

  template: `
    <div id="app">
      <section class="info">
        Name:
        <pre id="name">{{ route.name }}</pre>
      </section>

      <section class="info">
        Params:
        <pre id="params">{{ route.params }}</pre>
      </section>

      <section class="info">
        Query:
        <pre id="query">{{ route.query }}</pre>
      </section>

      <section class="info">
        Hash:
        <pre id="hash">{{ route.hash }}</pre>
      </section>

      <section class="info">
        FullPath:
        <pre id="fullPath">{{ route.fullPath }}</pre>
      </section>

      <section class="info">
        path:
        <pre id="path">{{ route.path }}</pre>
      </section>

      <hr />

      <ul>
        <li><router-link to="/">/</router-link></li>
        <li>
          <router-link to="/documents/%E2%82%AC"
            >/documents/%E2%82%AC</router-link
          >
        </li>
        <li>
          <router-link :to="{ name: 'docs', params: { id: '€uro' }}"
            >/documents/€uro (object)</router-link
          >
        </li>
        <li>
          <router-link
            :to="{ name: 'home', query: { currency: '€uro', 'é': 'e' }}"
            >/?currency=€uro&é=e (object)</router-link
          >
        </li>
        <li>
          <a href="/encoding/documents/%E2%82%AC"
            >/documents/%E2%82%AC (force reload)</a
          >
        </li>
        <li>
          <a href="/encoding/documents/€"
            >/documents/€ (force reload. not valid but should not crash the
            router)</a
          >
        </li>
      </ul>

      <router-view></router-view>
    </div>
  `,
})
app.use(router)

window.vm = app.mount('#app')
window.r = router
