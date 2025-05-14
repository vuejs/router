<template>
  <div>
    <p>Nested level {{ level }}</p>
    <pre>{{ props }}</pre>
    <ul v-if="level === 1">
      <li>
        <router-link to="/nested/nested">/nested/nested</router-link>
      </li>
      <li>
        <router-link to="/anidado/nested">/anidado/nested</router-link>
      </li>
      <li>
        <router-link to="/anidado/a">/anidado/a</router-link>
      </li>
    </ul>
    <router-view v-if="level < 6"></router-view>
  </div>
</template>

<script setup lang="ts">
import { defineComponent, inject, provide } from 'vue'

const props = defineProps<{id: string}>()

const level = inject('level', 1)
provide('level', level + 1)
</script>
