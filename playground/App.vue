<template>
  <div>
    <pre>{{ currentLocation }}</pre>
    <section class="info">
      Name:
      <pre id="name">{{ currentLocation.name }}</pre>
    </section>

    <section class="info">
      Params:
      <pre id="params">{{ currentLocation.params }}</pre>
    </section>

    <section class="info">
      Query:
      <pre id="query">{{ currentLocation.query }}</pre>
    </section>

    <section class="info">
      Hash:
      <pre id="hash">{{ currentLocation.hash }}</pre>
    </section>

    <section class="info">
      FullPath:
      <pre id="fullPath">{{ currentLocation.fullPath }}</pre>
    </section>

    <section class="info">
      path:
      <pre id="path">{{ currentLocation.path }}</pre>
    </section>

    <hr />

    <label>
      <input type="checkbox" v-model="state.cancelNextNavigation" /> Cancel Next
      Navigation
    </label>
    <ul>
      <li>
        <router-link to="/n/%E2%82%AC">/n/%E2%82%AC</router-link>
      </li>
      <li>
        <router-link :to="{ name: 'docs', params: { id: '€uro' } }"
          >/docs/€uro (object)</router-link
        >
      </li>
      <li>
        <router-link :to="{ name: 'home', query: { currency: '€uro', é: 'e' } }"
          >/currency=€uro&é=e (object)</router-link
        >
      </li>
      <li>
        <router-link to="/documents/€">/n/€</router-link>
      </li>
      <li>
        <a href="/documents/%E2%82%AC">/documents/%E2%82%AC (force reload)</a>
      </li>
      <li>
        <a href="/documents/€">/documents/€ (force reload): not valid tho</a>
      </li>
      <li>
        <router-link to="/">Home (redirects)</router-link>
      </li>
      <li>
        <router-link to="/home">Home</router-link>
      </li>
      <li>
        <router-link to="/nested">/nested</router-link>
      </li>
      <li>
        <router-link to="/nested/nested">/nested/nested</router-link>
      </li>
      <li>
        <router-link to="/nested/nested/nested"
          >/nested/nested/nested</router-link
        >
      </li>
      <li>
        <router-link to="/long-0">/long-0</router-link>
      </li>
      <li>
        <router-link to="/users/5">/users/5</router-link>
      </li>
      <li>
        <router-link
          :to="{
            name: 'user',
            params: { id: '' + (Number(currentLocation.params.id || 0) + 1) },
          }"
          >/users/{{ Number(currentLocation.params.id || 0) + 1 }}</router-link
        >
      </li>
      <!-- <li>
          <router-link :to="{ name: 'docs' }">Doc with same id</router-link>
        </li> -->
      <li>
        <router-link to="/with-data">/with-data</router-link>
      </li>
      <li>
        <router-link to="/cant-leave">/cant-leave</router-link>
      </li>
      <li>
        <router-link :to="{ name: 'docs', params: { id: 'é' } }"
          >/docs/é</router-link
        >
      </li>
    </ul>
    <!-- <transition
      name="fade"
      mode="out-in"
      @before-enter="flushWaiter"
      @before-leave="setupWaiter"
    > -->
    <router-view></router-view>
    <!-- </transition> -->
  </div>
</template>

<script>
import { defineComponent, inject, computed } from 'vue'
import { scrollWaiter } from './scrollWaiter'
import { useRoute } from '../src'

export default defineComponent({
  name: 'App',
  setup() {
    const route = useRoute()
    const state = inject('state')

    const currentLocation = computed(() => {
      const { matched, ...rest } = route.value
      return rest
    })

    function flushWaiter() {
      scrollWaiter.flush()
    }
    function setupWaiter() {
      scrollWaiter.add()
    }

    const nextUserLink = computed(
      () => '/users/' + String((Number(route.value.params.id) || 0) + 1)
    )

    return {
      currentLocation,
      nextUserLink,
      state,
      flushWaiter,
      setupWaiter,
    }
  },
})
</script>
