<script setup lang="ts">
import type { Activity } from '../domain'
defineProps<{ events: Activity[] }>()
</script>
<template>
  <ol class="activity">
    <li v-for="event in events" :key="event.id">
      <strong>{{ event.actor }}</strong>
      <span v-if="event.kind === 'comment'">{{ event.body }}</span>
      <span v-else-if="event.kind === 'status'"
        >Changed status from {{ event.previous }} to {{ event.next }}.</span
      >
      <span v-else
        >Allocated {{ event.amount.toLocaleString() }} to this workspace.</span
      >
    </li>
  </ol>
</template>
