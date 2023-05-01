<template>
  <div>
    <div v-if="label" class="translation_status">
      {{ label }}
    </div>
  </div>
</template>

<script lang="ts">
import status from '../../translation-status.json'

const i18nLabels: {
  [lang: string]: string
} = {
  // An example of the English label:
  // 'root': 'The translation is synced to the docs on ${date} of which the commit hash is ${hash}.',
  'zh': '该翻译已同步到了 ${date} 的版本，其对应的 commit hash 是 ${hash}。',
}

</script>

<script setup lang="ts">
import { computed } from 'vue'
import { useData } from 'vitepress'
const { site } = useData()
const label = computed(() => {
  const localeIndex = site.value.localeIndex
  const { date, hash } = status[localeIndex] || { date: '', hash: '' }
  return (i18nLabels[localeIndex] || '')
    .replace('${date}', date)
    .replace('${hash}', hash)
  }
)
</script>

<style scoped>
.translation_status {
  padding: 1em 1.25em;
  font-size: small;
  text-align: right;
  color: var(--vp-c-text-2);
}
</style>
