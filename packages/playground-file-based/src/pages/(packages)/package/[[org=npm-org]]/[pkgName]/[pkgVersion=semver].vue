<script lang="ts" setup>
import { useRoute } from 'vue-router'
import SemVerInfo from '@/components/SemVerInfo.vue'

const route = useRoute()
</script>

<template>
  <h2>
    {{ route.params.org ? `@${route.params.org}/` : ''
    }}{{ route.params.pkgName }}
  </h2>
  <h3>Strict SemVer (param parser)</h3>
  <SemVerInfo :version="route.params.pkgVersion" />
</template>
