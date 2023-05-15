<script lang="ts">
const i18nLabels: {
  [lang: string]: string
} = {
  // An example of the English label:
  // 'root': 'The translation is synced to the docs on ${date} of which the commit hash is ${hash}.',
  zh: '该翻译已同步到了 ${date} 的版本，其对应的 commit hash 是 ${hash}。',
}
</script>

<script setup lang="ts">
import { computed } from 'vue'
import { useData } from 'vitepress'
import status from '../../translation-status.json'

const { site } = useData()
const label = computed<string>(() => {
  const localeIndex = site.value.localeIndex
  if (!localeIndex || !status[localeIndex] || !i18nLabels[localeIndex]) {
    return ''
  }
  const { date, hash } = status[localeIndex]
  return i18nLabels[localeIndex]
    .replace('${date}', `<time>${date}</time>`)
    .replace('${hash}', `<code>${hash}</code>`)
})
</script>

<template>
  <div v-if="label" class="text-status" v-html="label"></div>
</template>

<style scoped>
.text-status {
  padding: 1em 1.25em;
  font-size: small;
  text-align: right;
  color: var(--vp-c-text-2);
}
</style>
