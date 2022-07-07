<script lang="ts">
import { getUserById } from '../api'
import { defineLoader } from '@vue-router'

export const load = defineLoader('user', async route => {
  const user = await getUserById(route.params.id)
  //   // ...
  return user
})
// Also tried this but then it cannot infer the ReturnType, it must be manually typed
// export const load: Loader<'user'> = async ({ params }) => {
//   const user = await getUserById(params.id)
//   // ...
//   return user
// }
</script>

<script lang="ts" setup>
import { useLoader } from '@vue-router'

const { data: user, isLoading } =
  // the argument has autocompletion and provides typed values
  useLoader('user')

// it is the same as useLoader<'/users/:id'>() but that doesn't autocomplete
// user is always present, isLoading changes when going from '/users/2' to '/users/3'
// note this can be removed during the build
</script>

<template>
  <div>User: {{ user }}</div>
  <p v-if="isLoading">Fetching the new user</p>
</template>

<!-- <script lang="ts" loader>
const route = useRoute('user')

const user = await getUserById(route.params.id)
</script> -->
