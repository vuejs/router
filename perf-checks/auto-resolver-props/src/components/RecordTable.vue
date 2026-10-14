<script setup lang="ts" generic="T extends WorkRecord">
import { computed, ref } from 'vue'
import type { Column, WorkRecord } from '../domain'
const props = defineProps<{ rows: T[]; columns: Column<T>[]; query: string }>()
const emit = defineEmits<{ select: [row: T] }>()
defineSlots<{ actions(props: { row: T }): unknown }>()
const ascending = ref(true)
const visible = computed(() =>
  props.rows
    .filter(row => row.title.toLowerCase().includes(props.query.toLowerCase()))
    .sort((a, b) => (ascending.value ? 1 : -1) * a.title.localeCompare(b.title))
)
</script>
<template>
  <div class="table-wrap">
    <table>
      <thead>
        <tr>
          <th v-for="column in columns" :key="column.key">
            <button @click="ascending = !ascending">{{ column.label }}</button>
          </th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="row in visible" :key="row.id">
          <td v-for="column in columns" :key="column.key">
            {{ column.value(row) }}
          </td>
          <td>
            <button @click="emit('select', row)">Inspect</button>
            <slot name="actions" :row="row" />
          </td>
        </tr>
      </tbody>
    </table>
    <p class="muted">{{ visible.length }} records match your filter.</p>
  </div>
</template>
