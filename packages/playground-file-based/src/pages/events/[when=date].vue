<script lang="ts" setup>
import { useRoute } from 'vue-router'

const route = useRoute()
</script>

<template>
  <h1>Date</h1>
  <pre>{{ typeof route.params.when }} - {{ route.params.when }}</pre>
</template>
