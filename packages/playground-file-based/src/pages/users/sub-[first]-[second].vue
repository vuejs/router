<script lang="ts" setup>
import { useRoute } from 'vue-router'

const route = useRoute()
type Route = typeof route
type RouteFromType = ReturnType<typeof useRoute>
type RouteOther = ReturnType<typeof useRoute<'/about'>>

route.params.first satisfies RouteFromType['params']['first']
route.params.second satisfies RouteFromType['params']['second']
</script>

<template>
  <h1>{{ String($route.name) }} - {{ $route.path }}</h1>
  <p>{{ $route.params.first satisfies RouteFromType['params']['first'] }}</p>
  <p>{{ $route.params.second satisfies RouteFromType['params']['second'] }}</p>
</template>
