<script lang="ts" setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { z } from 'zod'
import { isValid, tryParse } from 'verkit'
import SemVerInfo from '@/components/SemVerInfo.vue'

const route = useRoute()

const semverSchema = z.string().refine(val => isValid(val, { loose: true }), {
  message: 'Invalid semver version',
})

const result = computed(() => {
  const validation = semverSchema.safeParse(route.params.pkgVersion)
  if (!validation.success) {
    return { ok: false as const, error: validation.error }
  }
  return {
    ok: true as const,
    version: tryParse(validation.data, { loose: true })!,
  }
})
</script>

<template>
  <h2>
    {{ route.params.org ? `@${route.params.org}/` : ''
    }}{{ route.params.pkgName }}
  </h2>
  <h3>Zod Validation</h3>

  <template v-if="result.ok">
    <SemVerInfo :version="result.version" />
  </template>
  <div v-else>
    <p style="color: red; font-weight: bold">Zod validation failed</p>
    <ul style="color: red">
      <li v-for="(issue, i) in result.error.issues" :key="i">
        {{ issue.message }}
        <template v-if="issue.path.length">
          (path: {{ issue.path.join('.') }})</template
        >
      </li>
    </ul>
  </div>
</template>
