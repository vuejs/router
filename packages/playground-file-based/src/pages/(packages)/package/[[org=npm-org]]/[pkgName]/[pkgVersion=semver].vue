<script lang="ts" setup>
import SemVerInfo from '@/components/SemVerInfo.vue'

const props = defineProps<{
  other?: number
}>()

definePage({
  props: true,
})
</script>

<template>
  <h2>{{ org ? `@${org}/` : '' }}{{ pkgName }}</h2>
  <h3>Strict SemVer (param parser)</h3>
  <SemVerInfo :version="pkgVersion" />
</template>
