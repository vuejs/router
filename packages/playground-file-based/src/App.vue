<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'

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
      <p>Currently at "{{ $route.name }}" ({{ $route.fullPath }})</p>
      <pre>{{ $route.params }}</pre>
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
