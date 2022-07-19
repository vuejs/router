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
        <router-link :to="{ path: '/', query: { currency: '€uro', é: 'e' } }"
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
        <router-link to="/home">Home (redirects)</router-link>
      </li>
      <li>
        <router-link to="/">Home</router-link>
      </li>
      <li>
        <AppLink to="/">AppLink Home</AppLink>
      </li>
      <li>
        <router-link to="/always-redirect">/always-redirect</router-link>
      </li>
      <li>
        <router-link to="/children">/children</router-link>
      </li>
      <li>
        <router-link to="/children/alias">/children/alias</router-link>
      </li>
      <li>
        <router-link :to="{ name: 'default-child' }"
          >/children (child named)</router-link
        >
      </li>
      <li>
        <router-link :to="{ name: 'WithChildren' }"
          >/children (parent named)</router-link
        >
      </li>
      <li>
        <router-link to="/children/a">/children/a</router-link>
      </li>
      <li>
        <router-link to="/children/b">/children/b</router-link>
      </li>
      <li>
        <router-link to="/children/b/a2">/children/b/a2</router-link>
      </li>
      <li>
        <router-link to="/children/b/b2">/children/b/b2</router-link>
      </li>
      <li>
        <router-link to="/nested">/nested</router-link>
      </li>
      <li>
        <router-link to="/anidado">/anidado</router-link>
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
      <li>
        <router-link to="/rep">/rep</router-link>
      </li>
      <li>
        <router-link to="/rep/a">/rep/a</router-link>
      </li>
      <li>
        <router-link to="/rep/a/b">/rep/a/b</router-link>
      </li>
      <li>
        <router-link to="/parent/1">/parent/1</router-link>
      </li>
      <li>
        <router-link to="/p/1">/p/1</router-link>
      </li>
      <li>
        <router-link to="/parent/1/as-absolute-a"
          >/parent/1/as-absolute-a</router-link
        >
      </li>
      <li>
        <router-link to="/p/1/as-absolute-a">/p/1/as-absolute-a</router-link>
      </li>
      <li>
        <router-link to="/p_1/absolute-a">/p_1/absolute-a</router-link>
      </li>
    </ul>
    <button @click="toggleViewName">Toggle view</button>
    <RouterView :name="viewName" v-slot="{ Component, route }">
      <Transition
        :name="route.meta.transition || 'fade'"
        mode="out-in"
        @before-enter="flushWaiter"
        @before-leave="setupWaiter"
      >
        <!-- <KeepAlive> -->
        <Suspense>
          <template #default>
            <component
              :is="Component"
              :key="route.name === 'repeat' ? route.path : route.meta.key"
            />
          </template>
          <template #fallback> Loading... </template>
        </Suspense>
        <!-- </KeepAlive> -->
      </Transition>
    </RouterView>
  </div>
</template>

<script lang="ts">
import { defineComponent, inject, computed, ref } from 'vue'
import { scrollWaiter } from './scrollWaiter'
import { useLink, useRoute } from 'vue-router'
import AppLink from './AppLink.vue'

export default defineComponent({
  name: 'App',
  components: { AppLink },
  setup() {
    const route = useRoute()
    const state = inject('state')
    const viewName = ref('default')

    useLink({ to: '/' })
    useLink({ to: '/documents/hello' })
    useLink({ to: '/children' })

    const currentLocation = computed(() => {
      const { matched, ...rest } = route
      return rest
    })

    function flushWaiter() {
      scrollWaiter.flush()
    }
    function setupWaiter() {
      scrollWaiter.add()
    }

    const nextUserLink = computed(
      () => '/users/' + String((Number(route.params.id) || 0) + 1)
    )

    return {
      currentLocation,
      nextUserLink,
      state,
      flushWaiter,
      setupWaiter,
      viewName,
      toggleViewName() {
        viewName.value = viewName.value === 'default' ? 'other' : 'default'
      },
    }
  },
})
</script>
