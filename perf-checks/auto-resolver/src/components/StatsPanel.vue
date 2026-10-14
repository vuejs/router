<script setup lang="ts">
import { computed } from 'vue'
import type { Status, WorkRecord } from '../domain'
const props = defineProps<{ records: WorkRecord[] }>()
const totals = computed(() =>
  props.records.reduce(
    (result, row) => {
      result[row.status] += 1
      result.budget += row.budget
      return result
    },
    { active: 0, paused: 0, review: 0, budget: 0 } satisfies Record<
      Status | 'budget',
      number
    >
  )
)
const cards = computed(() => [
  { label: 'Active initiatives', value: totals.value.active },
  { label: 'Awaiting review', value: totals.value.review },
  {
    label: 'Allocated budget',
    value: '$' + totals.value.budget.toLocaleString(),
  },
])
</script>
<template>
  <section class="stats">
    <article v-for="card in cards" :key="card.label">
      <span>{{ card.label }}</span
      ><strong>{{ card.value }}</strong>
    </article>
  </section>
</template>
