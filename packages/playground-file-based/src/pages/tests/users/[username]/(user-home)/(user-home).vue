<script setup lang="ts">
import { useRoute } from 'vue-router'

const route = useRoute()
</script>

<template>
  <h2>User Home for {{ route.params.username }}</h2>
</template>
