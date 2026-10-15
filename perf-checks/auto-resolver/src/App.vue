<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { pages } from './navigation'
const route = useRoute()
const router = useRouter()
const search = ref('')
const workspace = ref('acme')
const navigation = computed(() =>
  pages.filter(page =>
    page.label.toLowerCase().includes(search.value.toLowerCase())
  )
)
router.isReady().then(() => {
  if (route.path === '/')
    router.replace({
      name: '/workspaces/[workspaceId]/projects/[recordId]/overview',
      params: { workspaceId: workspace.value, recordId: '1' },
    })
})
</script>
<template>
  <div class="console">
    <aside>
      <a class="brand" href="/">W / Workspace</a>
      <p class="muted">Operations console</p>
      <label
        >Workspace<input v-model="workspace" aria-label="Workspace"
      /></label>
      <label
        >Find a page<input v-model="search" placeholder="Search pages"
      /></label>
      <nav aria-label="Workspace pages">
        <RouterLink
          v-for="page in navigation"
          :key="page.name"
          :to="
            page.name
              .replace('[workspaceId]', workspace)
              .replace('[recordId]', '1')
          "
          #default="{ isActive }"
          ><span :class="{ active: isActive }">{{
            page.label
          }}</span></RouterLink
        >
      </nav>
    </aside>
    <main><RouterView /></main>
  </div>
</template>
