<script lang="ts" setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { parse } from 'semver'
import SemVerInfo from '@/components/SemVerInfo.vue'

const route = useRoute()

const parsed = computed(() =>
  parse(route.params.pkgVersion as string, true, true)
)
</script>

<template>
  <h2>
    {{ route.params.org ? `@${route.params.org}/` : ''
    }}{{ route.params.pkgName }}
  </h2>
  <h3>Legacy (manual parse)</h3>

  <template v-if="parsed">
    <SemVerInfo :version="parsed" />
  </template>
  <p v-else style="color: red">
    Could not parse <code>{{ route.params.pkgVersion }}</code> as a semver
    version.
  </p>
</template>
