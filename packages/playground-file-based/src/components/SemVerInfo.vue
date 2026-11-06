<script lang="ts" setup>
import { computed } from 'vue'
import { increment, normalizeFull, type SemVer } from 'verkit'

const { version } = defineProps<{ version: SemVer }>()

const nextVersions = computed(() => ({
  major: increment(version, 'major'),
  minor: increment(version, 'minor'),
  patch: increment(version, 'patch'),
  prerelease: increment(version, 'prerelease'),
}))
</script>

<template>
  <dl>
    <dt>Formatted</dt>
    <dd>
      <code>{{ normalizeFull(version) }}</code>
    </dd>

    <dt>Major</dt>
    <dd>{{ version.major }}</dd>

    <dt>Minor</dt>
    <dd>{{ version.minor }}</dd>

    <dt>Patch</dt>
    <dd>{{ version.patch }}</dd>

    <dt>Prerelease</dt>
    <dd>
      <code v-if="version.prerelease?.length">{{
        version.prerelease.join('.')
      }}</code>
      <em v-else>none</em>
    </dd>

    <dt>Build</dt>
    <dd>
      <code v-if="version.build?.length">{{ version.build.join('.') }}</code>
      <em v-else>none</em>
    </dd>

    <dt>Next versions</dt>
    <dd>
      <ul>
        <li>
          Major: <code>{{ nextVersions.major }}</code>
        </li>
        <li>
          Minor: <code>{{ nextVersions.minor }}</code>
        </li>
        <li>
          Patch: <code>{{ nextVersions.patch }}</code>
        </li>
        <li>
          Prerelease: <code>{{ nextVersions.prerelease ?? 'N/A' }}</code>
        </li>
      </ul>
    </dd>
  </dl>
</template>
