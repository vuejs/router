<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()
const url = ref('')

const queryPage = computed({
  get: () =>
    typeof route.params.page === 'number'
      ? (route.params.page as number)
      : null,
  set: (value: number) => {
    // TODO: relative location
    router.push({
      ...route,
      // @ts-expect-error: FIXME: wtf
      params: { ...route.params, page: value },
    })
  },
})
</script>

<template>
  <header>
    <nav>
      <RouterLink to="/">Home</RouterLink>
      |
      <RouterLink to="/about">About</RouterLink>
      |
      <RouterLink to="/nested">Nested</RouterLink>
      |
      <RouterLink to="/nested/a">Nested A</RouterLink>
      |
      <RouterLink to="/profiles">Profiles list</RouterLink>
    </nav>
    <form @submit.prevent="router.push(url)">
      <label for="path">Path:</label>
      <input
        id="path"
        type="text"
        v-model="url"
        placeholder="/go/somewhere?nice"
      />
      <button type="submit">Go</button>
    </form>
  </header>

  <p>
    fullPath: <code>{{ route.fullPath }}</code>
    <br />
    path: <code>{{ route.path }}</code>
    <br />
    query: <code>{{ route.query }}</code>
    <br />
    hash: <code>{{ route.hash }}</code>
    <br />
    params: <code>{{ route.params }}</code>
    <br />
    <template v-if="queryPage != null">
      page:
      <input
        type="number"
        v-model.number="queryPage"
        autocomplete="off"
        data-1p-ignore
      />
      <br />
    </template>
    meta: <code>{{ route.meta }}</code>
  </p>

  <RouterView />
</template>
