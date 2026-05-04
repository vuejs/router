<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { RouterLink as ERouterLink } from 'vue-router/experimental'
import { default as VRouterLink } from './components/RouterLink.vue'
import { default as GRouterLink } from './test-comp-generic'

const router = useRouter()

console.log(`We have ${router.getRoutes().length} routes.`)

const targetRoute = ref('')
</script>

<template>
  <header>
    <div class="wrapper">
      <nav>
        <ul>
          <li>
            <VRouterLink
              name="/[a].[b]"
              :params="{
                d: '5',
                b: '5',
              }"
              >...</VRouterLink
            >
          </li>
          <li>
            <VRouterLink to="/:a/:b">Home</VRouterLink>
            <VRouterLink
              :to="{
                name: '/[a].[b]',
                params: {
                  a: '2',
                  b: '3',
                },
              }"
              >Home</VRouterLink
            >
          </li>

          <li>
            <GRouterLink
              route="/blog/info/[[section]]"
              :params="{ section: 'oeu' }"
              >Home</GRouterLink
            >
          </li>

          <li>
            <VRouterLink name="/about" :params="{ ok: 2 }">Home</VRouterLink>
          </li>
          <li>
            <VRouterLink name="/about">Home</VRouterLink>
          </li>

          <li>
            <ERouterLink route="/[a].[b]" :params="{}">Home</ERouterLink>
          </li>
          <li>
            <RouterLink to="/">Home</RouterLink>
          </li>
          <li>
            <RouterLink to="/users/24" #default="{ href }">{{
              href
            }}</RouterLink>
          </li>
          <li>
            <RouterLink to="/events/1992-03-24" #default="{ href }">{{
              href
            }}</RouterLink>
          </li>
          <li>
            <RouterLink to="/nested" #default="{ href }">{{ href }}</RouterLink>
          </li>
        </ul>
      </nav>
    </div>

    <div>
      <details>
        <summary>Route Info</summary>
        <p>Currently at "{{ $route.name }}" ({{ $route.fullPath }})</p>
        <pre>{{ $route.params }}</pre>
      </details>
      <form @submit.prevent="router.push(targetRoute)">
        <label>
          Navigate to:
          <input type="text" v-model="targetRoute" />
        </label>
        <button>Go</button>
      </form>
    </div>
  </header>

  <hr />

  <RouterView />
  <hr />
  <RouterView name="named" />
</template>

<style scoped>
ul {
  padding-left: 0;
}
ul > li {
  display: inline-block;
}

ul > li:not(:first-child) {
  margin-left: 0.5rem;
}

li > a {
  text-decoration: none;
}
.router-link-active {
  text-decoration: underline;
  font-weight: bold;
}
</style>
