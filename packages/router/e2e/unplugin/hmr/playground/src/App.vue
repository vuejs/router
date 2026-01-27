<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const to = ref('')
const router = useRouter()

function navigate() {
  if (to.value) {
    router.push(to.value)
  }
}
</script>

<template>
  <nav>
    <ul>
      <li><RouterLink to="/">Home</RouterLink></li>
    </ul>
  </nav>

  <pre data-testid="route">{{ $route.fullPath }}</pre>
  <form @submit.prevent="navigate" data-testid="navigator">
    <input type="text" v-model="to" data-testid="goto" placeholder="/about" />
    <button type="submit">Go</button>
  </form>

  <hr />

  <RouterView />
</template>
