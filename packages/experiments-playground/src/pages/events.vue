<script setup lang="ts">
import { useRoute } from 'vue-router'

const route = useRoute()
</script>

<template>
  <div>
    <h1>Events</h1>

    <ul>
      <li>
        <router-link to="/events" v-slot="{ href }">{{ href }}</router-link>
      </li>
      <li>
        <router-link to="/events/2025" v-slot="{ href }">{{
          href
        }}</router-link>
      </li>
      <li>
        <router-link to="/events/2025-03-24" v-slot="{ href }">{{
          href
        }}</router-link>
      </li>
      <li>
        <router-link
          :to="{
            name: 'events-date-nested',
            // @ts-expect-error: it works
            params: { when: new Date(), ...route.params },
          }"
          v-slot="{ href }"
          >{{ href }}</router-link
        >
      </li>
    </ul>

    <RouterView />
  </div>
</template>
