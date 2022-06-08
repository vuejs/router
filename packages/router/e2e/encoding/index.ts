import '../global.css'
import { createRouter, createWebHistory, RouteComponent } from 'vue-router'
import { createApp, defineComponent, FunctionalComponent, h } from 'vue'

const component: RouteComponent = {
  template: `<div>A component</div>`,
}

const Home: RouteComponent = {
  template: `<div>Home</div>`,
}

const ParamId = defineComponent({
  template: `<div>id: <span id="p-id">"{{ $route.params.id }}"</span></div>`,
})

const FunctionalView: FunctionalComponent = () =>
  h('div', 'functional component')

// full URL / !"$&'()*+,:;<=>%3F@[]^`{|}?a= !"$&'()*+,/:;<=>?@[]^`{|}# !"#$&'()*+,:;<=>?@[]^`{|}

const router = createRouter({
  // TODO: allow hash based history
  history: createWebHistory('/encoding'),
  routes: [
    { path: '/', component: Home, name: 'home' },
    { path: '/functional', component: FunctionalView },
    { path: '/:id', component: ParamId, name: 'param' },
    { path: '/documents/:id', name: 'docs', component: ParamId },
    { path: encodeURI('/n/€'), name: 'euro', component },
  ],
})

const app = createApp({
  setup() {
    const url =
      '/encoding/ !"%23$&\'()*+,%2F:;<=>%3F@[]^`{|}?a%3D=+!"%23$%26\'()*%2B,/:;<=>?@[]^`{|}# !"#$&\'()*+,/:;<=>?@[]^`{|}'
    const urlObject = {
      name: 'param',
      params: { id: ' !"#$&\'()*+,/:;<=>?@[]^`{|}' },
      query: { 'a=': ' !"#$&\'()*+,/:;<=>?@[]^`{|}' },
      hash: '# !"#$&\'()*+,/:;<=>?@[]^`{|}',
    }
    return { url, urlObject }
  },

  template: `
    <section class="info">
      Name:
      <pre id="name">{{ $route.name }}</pre>
    </section>

    <section class="info">
      Params:
      <pre id="params">{{ $route.params }}</pre>
    </section>

    <section class="info">
      Query:
      <pre id="query">{{ $route.query }}</pre>
    </section>

    <section class="info">
      Hash:
      <pre id="hash">{{ $route.hash }}</pre>
    </section>

    <section class="info">
      FullPath:
      <pre id="fullPath">{{ $route.fullPath }}</pre>
    </section>

    <section class="info">
      path:
      <pre id="path">{{ $route.path }}</pre>
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
      <li>
        <a :href="url"
          >Unencoded URL (force reload)</a
        >
      </li>
      <li>
        <router-link :to="urlObject"
          >Encoded by router</router-link>
      </li>
    </ul>

    <router-view></router-view>
  `,
})
app.use(router)

window.vm = app.mount('#app')
window.r = router
