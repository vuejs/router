<script setup lang="ts" generic="Name extends keyof RouteMap">
import type { RouteLocationRaw, RouteMap, RouteParams } from 'vue-router'

type RouteNameStatic = {
  [Name in keyof RouteMap]: keyof RouteParams<Name> extends never ? Name : never
}[keyof RouteMap]

defineProps<
  Name extends RouteNameStatic
    ? {
        name: Name
        params?: never
      }
    : {
        name: Name
        params: RouteParams<Name>
      }
  // | {
  //     to: RouteLocationRaw
  //   }
>()
</script>

<template>
  <div></div>
</template>
