<script setup lang="ts">
import { useRoute } from 'vue-router'

const route = useRoute()
</script>

<template>
  <div class="about">
    <h2>When: {{ (route.params.when as unknown as Date).toDateString() }}</h2>

    <p>
      <code>instance of Date</code>:
      {{ route.params.when instanceof Date }}
      <br />
      Time:
      {{ (route.params.when as unknown as Date).getTime() }}
    </p>
  </div>
</template>
