<script lang="ts">
import { useDataOne } from './loaders'

export { useDataOne }
</script>

<script lang="ts" setup>
import ComponentWithLoader from './ComponentWithLoader.vue'

const { data } = useDataOne()
</script>

<template>
  <p>{{ data }}</p>
  <ComponentWithLoader />
</template>
