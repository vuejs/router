<script lang="ts" setup>
import { useRoute } from 'vue-router'

const route = useRoute()
</script>

<template>
  <h1>Month (valibot): {{ route.params.month }}</h1>
  <pre>typeof: {{ typeof route.params.month }}</pre>
</template>
