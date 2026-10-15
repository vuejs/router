<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import RecordTable from '../../../../../components/RecordTable.vue'
import StatsPanel from '../../../../../components/StatsPanel.vue'
import ActivityFeed from '../../../../../components/ActivityFeed.vue'
import {
  activities,
  makeRecords,
  type Column,
  type Status,
  type WorkRecord,
} from '../../../../../domain'

definePage({ props: true })

const { workspaceId, recordId } = defineProps()
const router = useRouter()
const section = 'teams'
const view = 'members'
const rows = ref(makeRecords(section))
const query = ref('')
const status = ref<Status | 'all'>('all')
const selected = ref<WorkRecord>()
const draft = reactive({ title: '', budget: 0, notify: true })
const feedback = ref('')
const filtered = computed(() =>
  rows.value.filter(
    row => status.value === 'all' || row.status === status.value
  )
)
const columns: Column<WorkRecord>[] = [
  { key: 'title', label: 'Initiative', value: row => row.title },
  { key: 'owner', label: 'Owner', value: row => row.owner.name },
  { key: 'status', label: 'Status', value: row => row.status },
  {
    key: 'budget',
    label: 'Budget',
    value: row => '$' + row.budget.toLocaleString(),
  },
]
function inspect(row: WorkRecord) {
  selected.value = row
  draft.title = row.title
  draft.budget = row.budget
}
function save() {
  if (selected.value) {
    selected.value.title = draft.title
    selected.value.budget = draft.budget
    feedback.value = 'Saved ' + draft.title
  }
}
function changeRecord(id: string) {
  return router.push({
    name: '/workspaces/[workspaceId]/teams/[recordId]/members',
    params: { workspaceId, recordId: id },
    query: { tab: view },
  })
}
</script>

<template>
  <article class="page">
    <p class="eyebrow">Workspace {{ workspaceId }} / {{ section }}</p>
    <div class="page-heading">
      <div>
        <h1>Teams · members</h1>
        <p>Record {{ recordId }}</p>
      </div>
      <span class="badge">Q4 planning</span>
    </div>
    <StatsPanel :records="rows" />
    <section class="panel">
      <div class="filters">
        <label
          >Filter initiatives<input
            v-model="query"
            placeholder="Search by title"
        /></label>
        <label
          >Status<select v-model="status">
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="paused">Paused</option>
            <option value="review">Review</option>
          </select></label
        >
      </div>
      <RecordTable
        :rows="filtered"
        :columns="columns"
        :query="query"
        @select="inspect"
      >
        <template #actions="{ row }"
          ><RouterLink
            :to="{
              name: '/workspaces/[workspaceId]/teams/[recordId]/members',
              params: { workspaceId, recordId: row.id },
            }"
            #default="{ href }"
            ><span :title="href">Open {{ row.id }}</span></RouterLink
          ></template
        >
      </RecordTable>
    </section>
    <section v-if="selected" class="panel">
      <h2>Edit {{ selected.title }}</h2>
      <form @submit.prevent="save">
        <label>Initiative title<input v-model="draft.title" required /></label
        ><label
          >Budget<input
            v-model.number="draft.budget"
            type="number"
            min="0" /></label
        ><label
          ><input v-model="draft.notify" type="checkbox" />Notify the
          owner</label
        ><button type="submit">Save changes</button
        ><button type="button" @click="changeRecord(selected.id)">
          View selected record
        </button>
      </form>
      <p role="status">{{ feedback }}</p>
    </section>
    <section class="panel">
      <h2>Recent activity</h2>
      <ActivityFeed :events="activities" />
    </section>
  </article>
</template>
