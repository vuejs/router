<script lang="ts" setup>
import { computed } from 'vue'
import { inc, type SemVer } from 'semver'

const { version } = defineProps<{ version: SemVer }>()

const nextVersions = computed(() => ({
  major: inc(version, 'major'),
  minor: inc(version, 'minor'),
  patch: inc(version, 'patch'),
  prerelease: inc(version, 'prerelease'),
}))
</script>

<template>
  <dl>
    <dt>Raw</dt>
    <dd>
      <code>{{ version.raw }}</code>
    </dd>

    <dt>Formatted</dt>
    <dd>
      <code>{{ version.format() }}</code>
    </dd>

    <dt>Major</dt>
    <dd>{{ version.major }}</dd>

    <dt>Minor</dt>
    <dd>{{ version.minor }}</dd>

    <dt>Patch</dt>
    <dd>{{ version.patch }}</dd>

    <dt>Prerelease</dt>
    <dd>
      <code v-if="version.prerelease.length">{{
        version.prerelease.join('.')
      }}</code>
      <em v-else>none</em>
    </dd>

    <dt>Build</dt>
    <dd>
      <code v-if="version.build.length">{{ version.build.join('.') }}</code>
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
