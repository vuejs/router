<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

definePage({
  params: {
    query: {
      // single int with default
      page: { parser: 'int', format: 'value', default: 1 },
      // array of strings
      tag: { parser: undefined, format: 'array' },
      // custom query-only bool parser
      active: { parser: 'test-bool-q', format: 'value', default: false },
      // raw csv list (defineParamParserRaw)
      ids: { parser: 'test-csv' },
    },
  },
})

const route = useRoute()
const router = useRouter()

const stripRest = ref(false)

function update(patch: Partial<typeof route.params>) {
  const base = stripRest.value ? {} : { ...route.params }
  router.push({ name: route.name, params: { ...base, ...patch } })
}

function nextPage() {
  update({ page: (route.params.page ?? 0) + 1 })
}
function resetPage() {
  update({ page: 1 })
}
function addTag() {
  const next = `t${(route.params.tag?.length ?? 0) + 1}`
  update({ tag: [...(route.params.tag ?? []), next] })
}
function clearTags() {
  update({ tag: [] })
}
function toggleActive() {
  update({ active: !route.params.active })
}
function addId() {
  const next = String((route.params.ids?.length ?? 0) + 1)
  update({ ids: [...(route.params.ids ?? []), next] })
}
function clearIds() {
  update({ ids: [] })
}
</script>

<template>
  <h1>Query param parsers</h1>

  <label>
    <input type="checkbox" v-model="stripRest" />
    Strip other query params on update
  </label>

  <div class="actions">
    <button @click="nextPage">page +1</button>
    <button @click="resetPage">page = 1</button>
    <button @click="addTag">add tag</button>
    <button @click="clearTags">clear tags</button>
    <button @click="toggleActive">toggle active</button>
    <button @click="addId">add id</button>
    <button @click="clearIds">clear ids</button>
  </div>

  <pre>
page (number): {{ route.params.page }} ({{ typeof route.params.page }})</pre
  >
  <pre>tag (string[]): {{ route.params.tag }}</pre>
  <pre>
active (boolean): {{ route.params.active }} ({{
      typeof route.params.active
    }})</pre
  >
  <pre>ids (csv → string[]): {{ route.params.ids }}</pre>

  <p>Try: <code>?page=3&tag=a&tag=b&active=1&ids=x,y,z</code></p>
</template>

<style scoped>
.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin: 0.75rem 0;
}
</style>
