<script lang="ts">
import { useDataOne, useDataTwo } from './loaders'

// this only affects if this is a route
export { useDataOne, useDataTwo }
</script>

<script lang="ts" setup>
const { data } = useDataOne()
</script>

<template>
  <div>{{ data }}</div>
</template>
