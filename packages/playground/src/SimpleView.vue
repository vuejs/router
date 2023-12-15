<script lang="ts" setup>
import { ref } from 'vue'
import { scrollWaiter } from './scrollWaiter'

defineProps<{ simple: boolean }>()
const viewName = ref('default')

function flushWaiter() {
  scrollWaiter.flush()
}
function setupWaiter() {
  scrollWaiter.add()
}
</script>

<template>
  <RouterView v-if="simple" v-slot="{ Component, route }">
    <component :is="Component" :key="route.meta.key" />
  </RouterView>

  <RouterView
    v-else
    :name="viewName"
    v-slot="{ Component, route }"
    key="not-simple"
  >
    <Transition
      :name="route.meta.transition || 'fade'"
      mode="out-in"
      @before-enter="flushWaiter"
      @before-leave="setupWaiter"
    >
      <!-- <KeepAlive> -->
      <!-- <Suspense>
        <template #default> -->
      <!-- <div v-if="route.path.endsWith('/a')">A</div>
      <div v-else>B</div> -->
      <component
        :is="Component"
        :key="route.name === 'repeat' ? route.path : route.meta.key"
      />
      <!-- </template>
        <template #fallback> Loading... </template>
      </Suspense> -->
      <!-- </KeepAlive> -->
    </Transition>
  </RouterView>
</template>
