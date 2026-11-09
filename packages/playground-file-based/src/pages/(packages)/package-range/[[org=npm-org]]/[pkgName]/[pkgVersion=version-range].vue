<script lang="ts" setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { normalizeRange, type SemVer, type SemVerRange } from 'verkit'
import SemVerInfo from '@/components/SemVerInfo.vue'

const route = useRoute()

const parsed = computed(() => route.params.pkgVersion as SemVer | SemVerRange)
const version = computed(() => ('sets' in parsed.value ? null : parsed.value))
const range = computed(() => ('sets' in parsed.value ? parsed.value : null))
</script>

<template>
  <h2>
    {{ route.params.org ? `@${route.params.org}/` : ''
    }}{{ route.params.pkgName }}
  </h2>
  <h3>Version Range (param parser)</h3>

  <template v-if="version">
    <SemVerInfo :version="version" />
  </template>
  <template v-else-if="range">
    <dl>
      <dt>Formatted</dt>
      <dd>
        <code>{{ normalizeRange(range) }}</code>
      </dd>
    </dl>
  </template>
</template>
