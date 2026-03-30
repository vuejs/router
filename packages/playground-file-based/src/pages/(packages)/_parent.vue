<script setup lang="ts"></script>

<template>
  <nav>
    <h3>Strict SemVer (param parser)</h3>
    <ul>
      <li>
        <RouterLink to="/package/pinia/v3.0.4" v-slot="{ href }">{{
          href
        }}</RouterLink>
      </li>
      <li>
        <RouterLink to="/package/@pinia/colada/v1.0.0" v-slot="{ href }">{{
          href
        }}</RouterLink>
      </li>
      <li>
        <RouterLink to="/package/pinia/not-a-version" v-slot="{ href }"
          >{{ href }} (invalid)</RouterLink
        >
      </li>
    </ul>

    <h3>Version Range (param parser)</h3>
    <ul>
      <li>
        <RouterLink to="/package-range/pinia/v3.0.4" v-slot="{ href }">{{
          href
        }}</RouterLink>
      </li>
      <li>
        <RouterLink
          to="/package-range/@pinia/colada/v1.0.0"
          v-slot="{ href }"
          >{{ href }}</RouterLink
        >
      </li>
      <li>
        <RouterLink to="/package-range/pinia/not-a-version" v-slot="{ href }"
          >{{ href }} (invalid)</RouterLink
        >
      </li>
    </ul>

    <h3>Legacy (manual parse)</h3>
    <ul>
      <li>
        <RouterLink to="/package-old/pinia/v3.0.4" v-slot="{ href }">{{
          href
        }}</RouterLink>
      </li>
      <li>
        <RouterLink to="/package-old/@pinia/colada/v1.0.0" v-slot="{ href }">{{
          href
        }}</RouterLink>
      </li>
      <li>
        <RouterLink to="/package-old/pinia/not-a-version" v-slot="{ href }"
          >{{ href }} (invalid)</RouterLink
        >
      </li>
    </ul>

    <h3>Zod Validation</h3>
    <ul>
      <li>
        <RouterLink to="/package-zod/pinia/v3.0.4" v-slot="{ href }">{{
          href
        }}</RouterLink>
      </li>
      <li>
        <RouterLink to="/package-zod/@pinia/colada/v1.0.0" v-slot="{ href }">{{
          href
        }}</RouterLink>
      </li>
      <li>
        <RouterLink to="/package-zod/pinia/not-a-version" v-slot="{ href }"
          >{{ href }} (invalid)</RouterLink
        >
      </li>
    </ul>
  </nav>
  <RouterView />
</template>
